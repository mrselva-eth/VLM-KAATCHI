#!/usr/bin/env python3
"""
CLIP-based Fashion Search Script

This script provides an interface to the KAATCHI fashion search model.
It can be called from the Next.js application to perform text, image, or multimodal searches.
"""

import argparse
import json
import sys
import os
import numpy as np
from PIL import Image, ImageOps
import torch
import clip
import faiss
import pandas as pd
import colorsys
from collections import Counter

# Define paths - using the actual dataset location
DATASET_PATH = os.environ.get('DATASET_PATH', 'D:/project/kaatchi-fashion-vlm/data/fashion-dataset')
IMAGE_FOLDER = os.path.join(DATASET_PATH, 'images')
METADATA_FILE = os.path.join(DATASET_PATH, 'styles.csv')
EMBEDDINGS_PATH = os.path.join(DATASET_PATH, 'embeddings')
FAISS_INDEX_PATH = os.path.join(EMBEDDINGS_PATH, 'fashion_faiss.index')

# Define color ranges for better matching
COLOR_RANGES = {
    'Red': ((340, 360), (0, 10), (50, 100), (50, 100)),  # (hue_range, saturation_range, value_range)
    'Green': ((90, 150), (30, 100), (30, 100)),
    'Blue': ((180, 260), (40, 100), (40, 100)),
    'Yellow': ((40, 65), (50, 100), (80, 100)),
    'Purple': ((270, 330), (30, 100), (30, 100)),
    'Pink': ((300, 340), (20, 100), (80, 100)),
    'Orange': ((20, 40), (50, 100), (80, 100)),
    'Brown': ((10, 30), (30, 80), (20, 60)),
    'White': ((0, 360), (0, 10), (90, 100)),
    'Black': ((0, 360), (0, 30), (0, 20)),
    'Grey': ((0, 360), (0, 20), (20, 80)),
    'Navy Blue': ((220, 240), (50, 100), (20, 40)),
    'Beige': ((30, 50), (10, 30), (80, 95)),
    'Maroon': ((330, 360), (50, 100), (20, 40)),
    'Olive': ((60, 90), (30, 60), (30, 60)),
    'Teal': ((160, 180), (40, 100), (30, 60)),
}

# Map color names to their closest fashion color names
COLOR_MAPPING = {
    'Red': 'Red',
    'Green': 'Green',
    'Blue': 'Blue',
    'Yellow': 'Yellow',
    'Purple': 'Purple',
    'Pink': 'Pink',
    'Orange': 'Orange',
    'Brown': 'Brown',
    'White': 'White',
    'Black': 'Black',
    'Grey': 'Grey',
    'Navy': 'Navy Blue',
    'Navy Blue': 'Navy Blue',
    'Beige': 'Beige',
    'Maroon': 'Maroon',
    'Olive': 'Olive',
    'Teal': 'Teal',
    'Light Blue': 'Blue',
    'Sky Blue': 'Blue',
    'Dark Blue': 'Navy Blue',
    'Light Green': 'Green',
    'Dark Green': 'Green',
    'Light Red': 'Red',
    'Dark Red': 'Maroon',
    'Light Yellow': 'Yellow',
    'Dark Yellow': 'Yellow',
    'Light Purple': 'Purple',
    'Dark Purple': 'Purple',
    'Light Pink': 'Pink',
    'Dark Pink': 'Pink',
    'Light Orange': 'Orange',
    'Dark Orange': 'Orange',
    'Light Brown': 'Brown',
    'Dark Brown': 'Brown',
    'Light Grey': 'Grey',
    'Dark Grey': 'Grey',
    'Cream': 'Beige',
    'Tan': 'Brown',
    'Burgundy': 'Maroon',
    'Khaki': 'Beige',
    'Gold': 'Yellow',
    'Silver': 'Grey',
    'Turquoise': 'Teal',
    'Lavender': 'Purple',
    'Peach': 'Orange',
    'Coral': 'Orange',
    'Mint': 'Green',
    'Cyan': 'Teal',
    'Magenta': 'Pink',
    'Indigo': 'Navy Blue',
    'Violet': 'Purple',
    'Mustard': 'Yellow',
    'Rust': 'Orange',
    'Amber': 'Orange',
}

# Non-fashion keywords to filter out non-fashion queries
NON_FASHION_KEYWORDS = set([
    "car", "bike", "truck", "phone", "laptop", "computer", "tablet", "dog", "cat", "animal", "food",
    "pizza", "burger", "pasta", "fruit", "vegetable", "plant", "tree", "house", "apartment", "building",
    "city", "river", "ocean", "mountain", "road", "bridge", "train", "airplane", "boat", "ship",
    "microwave", "fridge", "washing machine", "television", "radio", "printer", "keyboard", "mouse",
    "book", "pen", "notebook", "paper", "chair", "table", "sofa", "bed", "lamp", "clock",
    "painting", "art", "sculpture", "music", "guitar", "piano", "violin", "camera", "drone",
    "candle", "mirror", "glass", "bottle", "cup", "plate", "basket", "toy", "game", "football",
    "basketball", "tennis", "rugby", "volleyball", "badminton", "hockey", "cricket", "wrestling"
])

def parse_args():
    parser = argparse.ArgumentParser(description="Fashion Search using CLIP")
    parser.add_argument("--search-type", type=str, required=True, 
                        choices=["text", "image", "multimodal", "validate", "coherence"],
                        help="Type of search to perform")
    parser.add_argument("--query", type=str, help="Text query for search")
    parser.add_argument("--image-path", type=str, help="Path to image for search")
    parser.add_argument("--top-k", type=int, default=5, help="Number of results to return")
    parser.add_argument("--quiet", action="store_true", help="Reduce debug output")
    parser.add_argument("--color-detection", action="store_true", help="Enable color detection")
    parser.add_argument("--dominant-colors", type=str, help="Comma-separated list of dominant colors")
    parser.add_argument("--rotation-check", action="store_true", help="Check different rotations of the image")

    return parser.parse_args()

def extract_dominant_colors(image_path, num_colors=3):
    """Extract dominant colors from an image"""
    try:
        img = Image.open(image_path).convert('RGB')
        
        # Resize image to speed up processing
        img = img.resize((100, 100))
        
        # Get a list of all pixels
        pixels = list(img.getdata())
        
        # Count color occurrences
        color_count = Counter(pixels)
        
        # Get the most common colors
        dominant_rgb = [color for color, _ in color_count.most_common(num_colors)]
        
        # Convert RGB to HSV for better color matching
        dominant_hsv = []
        for r, g, b in dominant_rgb:
            r, g, b = r/255.0, g/255.0, b/255.0
            h, s, v = colorsys.rgb_to_hsv(r, g, b)
            h = h * 360
            s = s * 100
            v = v * 100
            dominant_hsv.append((h, s, v))
        
        # Map to color names
        color_names = []
        for hsv in dominant_hsv:
            h, s, v = hsv
            color_name = identify_color(h, s, v)
            if color_name and color_name not in color_names:
                color_names.append(color_name)
        
        return color_names[:3]  # Return top 3 unique colors
        
    except Exception as e:
        print(f"Error extracting colors: {e}", file=sys.stderr)
        return []

def identify_color(h, s, v):
    """Identify color name from HSV values"""

    # Handle grayscale colors
    if s < 10:
        if v < 20:
            return 'Black'
        elif v > 90:
            return 'White'
        else:
            return 'Grey'

    # Check color ranges
    for color_name, (hue_range, sat_range, val_range) in COLOR_RANGES.items():
        hue_min, hue_max = hue_range
        sat_min, sat_max = sat_range
        val_min, val_max = val_range
        
        # Handle hue wraparound for red
        if hue_min > hue_max:  # For red which wraps around the hue circle
            if (h >= hue_min or h <= hue_max) and sat_min <= s <= sat_max and val_min <= v <= val_max:
                return color_name
        else:
            if hue_min <= h <= hue_max and sat_min <= s <= sat_max and val_min <= v <= val_max:
                return color_name

    return None

def load_model_and_data(quiet=False):
    """Load CLIP model, FAISS index, and metadata"""
    try:
        # Check if paths exist
        if not os.path.exists(DATASET_PATH):
            if not quiet:
                print(f"Dataset path does not exist: {DATASET_PATH}", file=sys.stderr)
            sys.exit(1)
        if not os.path.exists(IMAGE_FOLDER):
            if not quiet:
                print(f"Image folder does not exist: {IMAGE_FOLDER}", file=sys.stderr)
            sys.exit(1)
        if not os.path.exists(METADATA_FILE):
            if not quiet:
                print(f"Metadata file does not exist: {METADATA_FILE}", file=sys.stderr)
            sys.exit(1)
        if not os.path.exists(EMBEDDINGS_PATH):
            if not quiet:
                print(f"Embeddings path does not exist: {EMBEDDINGS_PATH}", file=sys.stderr)
            sys.exit(1)
        if not os.path.exists(FAISS_INDEX_PATH):
            if not quiet:
                print(f"FAISS index does not exist: {FAISS_INDEX_PATH}", file=sys.stderr)
            sys.exit(1)
            
        # Load CLIP model
        device = "cuda" if torch.cuda.is_available() else "cpu"
        model, preprocess = clip.load("ViT-B/32", device=device)
        
        # Load FAISS index
        index = faiss.read_index(FAISS_INDEX_PATH)
        
        # Load metadata with error handling for CSV parsing
        try:
            # First attempt: try with default settings
            df = pd.read_csv(METADATA_FILE)
        except pd.errors.ParserError:
            if not quiet:
                print("CSV parsing error with default settings, trying with on_bad_lines='skip'...", file=sys.stderr)
            try:
                # Second attempt: skip bad lines
                df = pd.read_csv(METADATA_FILE, on_bad_lines='skip')
            except:
                if not quiet:
                    print("Still having CSV parsing issues, trying with engine='python'...", file=sys.stderr)
                try:
                    # Third attempt: use Python engine which is more flexible
                    df = pd.read_csv(METADATA_FILE, engine='python')
                except:
                    if not quiet:
                        print("Final attempt with most flexible settings...", file=sys.stderr)
                    # Last resort: use Python engine with very flexible settings
                    df = pd.read_csv(METADATA_FILE, engine='python', sep=',', quotechar='"', 
                                    escapechar='\\', on_bad_lines='skip')
        
        # Load image embeddings
        image_embeddings_path = os.path.join(EMBEDDINGS_PATH, 'image_embeddings.npy')
        image_embeddings = np.load(image_embeddings_path, allow_pickle=True).item()
        
        return model, preprocess, index, df, image_embeddings, device
    except Exception as e:
        if not quiet:
            print(f"Error loading model and data: {str(e)}", file=sys.stderr)
        sys.exit(1)

def enrich_product_results(product_results, dominant_colors=None, quiet=False):
    """Add additional metadata to product results and prioritize color matches"""
    try:
        # Brand mapping based on product names
        brand_mapping = {
            'adidas': 'ADIDAS',
            'nike': 'Nike',
            'puma': 'Puma',
            'reebok': 'Reebok',
            'levis': "Levi's",
            'h&m': 'H&M',
            'zara': 'Zara',
            'gap': 'GAP',
            'tommy': 'Tommy Hilfiger',
            'calvin': 'Calvin Klein',
            'gucci': 'Gucci',
            'armani': 'Armani',
            'tantra': 'Tantra',
            'locomotive': 'Locomotive',
            'mr.men': 'Mr.Men',
        }
        
        # Price ranges based on article types
        price_ranges = {
            'Tshirts': ('$19.99', '$39.99'),
            'Shirts': ('$29.99', '$59.99'),
            'Jeans': ('$39.99', '$79.99'),
            'Trousers': ('$34.99', '$69.99'),
            'Jackets': ('$49.99', '$129.99'),
            'Sweaters': ('$39.99', '$89.99'),
            'Dresses': ('$44.99', '$99.99'),
            'Skirts': ('$29.99', '$69.99'),
            'Shorts': ('$24.99', '$49.99'),
            'Shoes': ('$59.99', '$149.99'),
            'Watches': ('$99.99', '$299.99'),
            'Bags': ('$49.99', '$199.99'),
        }
        
        # Material mapping based on article types
        material_mapping = {
            'Tshirts': ['Cotton', 'Cotton Blend', 'Polyester', 'Jersey Knit'],
            'Shirts': ['Cotton', 'Linen', 'Polyester Blend', 'Oxford Cloth'],
            'Jeans': ['Denim', 'Stretch Denim', 'Cotton Denim'],
            'Trousers': ['Cotton', 'Polyester', 'Wool Blend', 'Khaki'],
            'Jackets': ['Leather', 'Denim', 'Polyester', 'Nylon', 'Cotton'],
            'Sweaters': ['Wool', 'Cotton', 'Cashmere', 'Acrylic'],
            'Dresses': ['Cotton', 'Polyester', 'Silk', 'Chiffon', 'Satin'],
            'Skirts': ['Cotton', 'Denim', 'Polyester', 'Pleated Fabric'],
            'Shorts': ['Cotton', 'Denim', 'Linen', 'Polyester'],
            'Shoes': ['Leather', 'Canvas', 'Synthetic', 'Mesh'],
            'Watches': ['Stainless Steel', 'Leather', 'Silicone', 'Titanium'],
            'Bags': ['Leather', 'Canvas', 'Nylon', 'Polyester'],
        }
        
        # Pattern mapping
        pattern_types = ['Solid', 'Striped', 'Checked', 'Graphic Print', 'Floral', 
                       'Polka Dot', 'Brand Logo', 'Character Print', 'Geometric', 
                       'Abstract', 'Tie-Dye', 'Camouflage']
        
        import random
        
        # If we have dominant colors from the uploaded image, enhance the results
        target_colors = []
        if dominant_colors:
            # Map any color name to our standardized color names
            for color in dominant_colors:
                if color.capitalize() in COLOR_MAPPING:
                    mapped_color = COLOR_MAPPING[color.capitalize()]
                    if mapped_color not in target_colors:
                        target_colors.append(mapped_color)
        
        for product in product_results:
            # Add brand information
            product_name_lower = product['name'].lower()
            for brand_key, brand_name in brand_mapping.items():
                if brand_key in product_name_lower:
                    product['brand'] = brand_name
                    break
            
            # If no brand was found but we have an article type, assign a random brand
            if 'brand' not in product and 'articleType' in product:
                random_brands = list(brand_mapping.values())
                product['brand'] = random.choice(random_brands)
            
            # Add price information based on article type
            if 'articleType' in product and product['articleType'] in price_ranges:
                min_price, max_price = price_ranges[product['articleType']]
                min_val = float(min_price.replace('$', ''))
                max_val = float(max_price.replace('$', ''))
                price = min_val + (max_val - min_val) * random.random()
                product['price'] = f"${price:.2f}"
            else:
                # Default price range
                price = 19.99 + (100 * random.random())
                product['price'] = f"${price:.2f}"
            
            # Add material information
            if 'articleType' in product and product['articleType'] in material_mapping:
                product['material'] = random.choice(material_mapping[product['articleType']])
            else:
                product['material'] = random.choice(['Cotton', 'Polyester', 'Blend'])
            
            # Add pattern information
            product['pattern'] = random.choice(pattern_types)
            
            # Check if this product matches the dominant color(s) from the uploaded image
            if target_colors and 'baseColor' in product:
                product_color = product['baseColor']
                
                # Standardize the product color
                if product_color in COLOR_MAPPING:
                    product_color = COLOR_MAPPING[product_color]
                
                # Mark as color match if the product color matches any target color
                color_match = product_color in target_colors
                product['colorMatch'] = color_match
                
                # Boost similarity score for color matches
                if color_match and 'similarity' in product:
                    # Increase similarity by 20% for color matches, capped at 1.0
                    product['similarity'] = min(1.0, product['similarity'] * 1.2)
        
        # If we have dominant colors, prioritize color matches
        if target_colors:
            # Sort by color match first, then by similarity
            product_results.sort(key=lambda x: (0 if x.get('colorMatch', False) else 1, -x.get('similarity', 0)))
            
        return product_results
    except Exception as e:
        if not quiet:
            print(f"Error enriching product results: {e}", file=sys.stderr)
        return product_results

def search_by_text(query, model, index, df, image_embeddings, device, top_k=5, quiet=False):
    """Search for fashion products using text query"""
    try:
        # Check if query contains non-fashion keywords
        query_words = set(query.lower().split())
        if query_words & NON_FASHION_KEYWORDS:
            if not quiet:
                print("Warning: Your query contains non-fashion-related terms. Please search for fashion-related products.", file=sys.stderr)
            return []
            
        # Tokenize text query
        text_token = clip.tokenize([query]).to(device)
        
        with torch.no_grad():
            # Encode the text query
            text_feature = model.encode_text(text_token).cpu().numpy()
            text_feature /= np.linalg.norm(text_feature)
        
        # Perform search
        distances, indices = index.search(text_feature, top_k * 2)  # Get more results for filtering
        
        # Get image IDs
        img_ids = list(image_embeddings.keys())
        results = [img_ids[i] for i in indices[0]]
        
        # Get product details
        product_results = []
        for i, img_id in enumerate(results):
            row = df[df['id'].astype(str) == img_id]
            if not row.empty:
                try:
                    product_results.append({
                        'id': img_id,
                        'name': row['productDisplayName'].values[0],
                        'category': row['masterCategory'].values[0] if 'masterCategory' in row else 'Unknown',
                        'subCategory': row['subCategory'].values[0] if 'subCategory' in row else 'Unknown',
                        'articleType': row['articleType'].values[0] if 'articleType' in row else 'Unknown',
                        'baseColor': row['baseColour'].values[0] if 'baseColour' in row else 'Unknown',
                        'gender': row['gender'].values[0] if 'gender' in row else 'Unknown',
                        'usage': row['usage'].values[0] if 'usage' in row else 'Unknown',
                        'similarity': float(1.0 - distances[0][i]),
                        'image': f"{img_id}.jpg"
                    })
                except Exception as e:
                    if not quiet:
                        print(f"Error processing product {img_id}: {str(e)}", file=sys.stderr)
                    # Add with minimal information
                    product_results.append({
                        'id': img_id,
                        'name': f"Product {img_id}",
                        'similarity': float(1.0 - distances[0][i]),
                        'image': f"{img_id}.jpg"
                    })
            else:
                if not quiet:
                    print(f"No metadata found for product ID: {img_id}", file=sys.stderr)
        
        # Enrich the results with additional metadata
        product_results = enrich_product_results(product_results, None, quiet)
        
        # Return the top K results after all processing
        return product_results[:top_k]
    except Exception as e:
        if not quiet:
            print(f"Error in text search: {str(e)}", file=sys.stderr)
        return []

def search_by_image(image_path, model, preprocess, index, df, image_embeddings, device, top_k=5, dominant_colors=None, quiet=False):
    """Search for fashion products using image query"""
    try:
        # Load and preprocess image
        image = preprocess(Image.open(image_path).convert("RGB")).unsqueeze(0).to(device)
        
        # First, validate if the image is fashion-related
        validation_result = validate_fashion_image(image_path, model, preprocess, device, quiet)
        
        # If the image is not fashion-related, return an empty result
        if not validation_result.get("is_fashion_related", True):
            if not quiet:
                print("Warning: The uploaded image does not appear to be fashion-related.", file=sys.stderr)
            return []
        
        # If no dominant colors provided, try to extract them
        if not dominant_colors and validation_result.get("dominantColors"):
            dominant_colors = validation_result.get("dominantColors")
        
        with torch.no_grad():
            # Encode the image
            image_feature = model.encode_image(image).cpu().numpy()
            image_feature /= np.linalg.norm(image_feature)
        
        # Perform search - get more results than needed for color filtering
        distances, indices = index.search(image_feature, top_k * 3)
        
        # Get image IDs
        img_ids = list(image_embeddings.keys())
        results = [img_ids[i] for i in indices[0]]
        
        # Get product details
        product_results = []
        for i, img_id in enumerate(results):
            row = df[df['id'].astype(str) == img_id]
            if not row.empty:
                try:
                    product_results.append({
                        'id': img_id,
                        'name': row['productDisplayName'].values[0],
                        'category': row['masterCategory'].values[0] if 'masterCategory' in row else 'Unknown',
                        'subCategory': row['subCategory'].values[0] if 'subCategory' in row else 'Unknown',
                        'articleType': row['articleType'].values[0] if 'articleType' in row else 'Unknown',
                        'baseColor': row['baseColour'].values[0] if 'baseColour' in row else 'Unknown',
                        'gender': row['gender'].values[0] if 'gender' in row else 'Unknown',
                        'usage': row['usage'].values[0] if 'usage' in row else 'Unknown',
                        'similarity': float(1.0 - distances[0][i]),
                        'image': f"{img_id}.jpg"
                    })
                except Exception as e:
                    if not quiet:
                        print(f"Error processing product {img_id}: {str(e)}", file=sys.stderr)
                    # Add with minimal information
                    product_results.append({
                        'id': img_id,
                        'name': f"Product {img_id}",
                        'similarity': float(1.0 - distances[0][i]),
                        'image': f"{img_id}.jpg"
                    })
            else:
                if not quiet:
                    print(f"No metadata found for product ID: {img_id}", file=sys.stderr)
        
        # Enrich the results with additional metadata
        product_results = enrich_product_results(product_results, dominant_colors, quiet)
        
        # Clean the results to ensure they are JSON serializable
        product_results = clean_product_results(product_results, quiet)
        
        # Return the top K results after all processing
        return product_results[:top_k]
    except Exception as e:
        if not quiet:
            print(f"Error in image search: {str(e)}", file=sys.stderr)
        return []

def multimodal_search(query, image_path, model, preprocess, index, df, image_embeddings, device, top_k=5, dominant_colors=None, quiet=False):
    """Search for fashion products using both text and image"""
    try:
        # First check text-image coherence
        coherence_result = check_text_image_coherence(query, image_path, model, preprocess, device, quiet)
        
        # If text and image are not coherent, log a warning but continue with search
        if not coherence_result.get("is_coherent", True) and not quiet:
            print(f"Warning: Text query and image may not be coherent. Similarity: {coherence_result.get('similarity', 0)}", file=sys.stderr)
        
        # If no dominant colors provided, try to extract them
        if not dominant_colors:
            # Extract colors from the image
            extracted_colors = extract_dominant_colors(image_path)
            if extracted_colors:
                dominant_colors = extracted_colors
        
        # Encode text
        text_token = clip.tokenize([query]).to(device)
        with torch.no_grad():
            text_feature = model.encode_text(text_token).cpu().numpy()
            text_feature /= np.linalg.norm(text_feature)
        
        # Encode image
        image = preprocess(Image.open(image_path).convert("RGB")).unsqueeze(0).to(device)
        with torch.no_grad():
            image_feature = model.encode_image(image).cpu().numpy()
            image_feature /= np.linalg.norm(image_feature)
        
        # Combine features
        query_embedding = (text_feature + image_feature) / 2
        query_embedding /= np.linalg.norm(query_embedding)
        
        # Perform search - get more results than needed for color filtering
        distances, indices = index.search(query_embedding, top_k * 3)
        
        # Get image IDs
        img_ids = list(image_embeddings.keys())
        results = [img_ids[i] for i in indices[0]]
        
        # Get product details
        product_results = []
        for i, img_id in enumerate(results):
            row = df[df['id'].astype(str) == img_id]
            if not row.empty:
                try:
                    product_results.append({
                        'id': img_id,
                        'name': row['productDisplayName'].values[0],
                        'category': row['masterCategory'].values[0] if 'masterCategory' in row else 'Unknown',
                        'subCategory': row['subCategory'].values[0] if 'subCategory' in row else 'Unknown',
                        'articleType': row['articleType'].values[0] if 'articleType' in row else 'Unknown',
                        'baseColor': row['baseColour'].values[0] if 'baseColour' in row else 'Unknown',
                        'gender': row['gender'].values[0] if 'gender' in row else 'Unknown',
                        'usage': row['usage'].values[0] if 'usage' in row else 'Unknown',
                        'similarity': float(1.0 - distances[0][i]),
                        'image': f"{img_id}.jpg"
                    })
                except Exception as e:
                    if not quiet:
                        print(f"Error processing product {img_id}: {str(e)}", file=sys.stderr)
                    # Add with minimal information
                    product_results.append({
                        'id': img_id,
                        'name': f"Product {img_id}",
                        'similarity': float(1.0 - distances[0][i]),
                        'image': f"{img_id}.jpg"
                    })
            else:
                if not quiet:
                    print(f"No metadata found for product ID: {img_id}", file=sys.stderr)
        
        # Enrich the results with additional metadata
        product_results = enrich_product_results(product_results, dominant_colors, quiet)
        
        # Clean the results to ensure they are JSON serializable
        product_results = clean_product_results(product_results, quiet)
        
        # Return the top K results after all processing
        return product_results[:top_k]
    except Exception as e:
        if not quiet:
            print(f"Error in multimodal search: {str(e)}", file=sys.stderr)
        return []

# Add this function to handle NaN values in the JSON output
def clean_product_results(product_results, quiet=False):
    """Clean product results to ensure they are JSON serializable"""
    try:
        for product in product_results:
            # Replace NaN values with None (null in JSON)
            for key, value in product.items():
                if isinstance(value, float) and (value != value):  # NaN check
                    product[key] = None
        return product_results
    except Exception as e:
        if not quiet:
            print(f"Error cleaning product results: {str(e)}", file=sys.stderr)
        return product_results

# Add this function after the existing functions
def validate_fashion_image(image_path, model, preprocess, device, quiet=False):
    """Validate if an image is fashion-related with stricter detection for external images"""
    try:
        # Extract dominant colors from the image
        dominant_colors = extract_dominant_colors(image_path)
        
        # Load and preprocess image
        image = preprocess(Image.open(image_path).convert("RGB")).unsqueeze(0).to(device)
        
        # Define fashion-related categories (focused list)
        fashion_categories = [
            "clothing", "fashion", "apparel", "wear", "dress", "shirt", "pants", 
            "jeans", "t-shirt", "jacket", "coat", "sweater", "skirt", "blouse", 
            "suit", "tie", "scarf", "hat", "cap", "shoes", "boots", "sneakers", 
            "heels", "sandals", "accessories", "jewelry", "watch", "bag", "purse", 
            "handbag", "backpack", "sunglasses", "glasses", "belt", "wallet"
        ]
        
        # Define accessory-specific categories with lower threshold
        accessory_categories = [
            "bag", "purse", "handbag", "backpack", "wallet", "accessories", 
            "watch", "jewelry", "belt", "sunglasses", "glasses"
        ]
        
        # Define non-fashion categories
        non_fashion_categories = [
            "car", "vehicle", "landscape", "building", "food", "animal", "pet", 
            "plant", "tree", "flower", "technology", "device", "furniture", 
            "scenery", "nature", "mountain", "beach", "ocean", "river", "lake", 
            "sky", "cloud", "road", "street", "city", "house", "apartment", 
            "office", "restaurant", "cafe", "park", "garden", "forest", "desert",
            "logo", "symbol", "icon", "sign", "text", "diagram", "chart", "graph",
            "abstract", "pattern", "texture", "background", "wallpaper"
        ]
        
        # Combine all categories for classification
        all_categories = fashion_categories + non_fashion_categories
        
        # Tokenize categories
        text_tokens = clip.tokenize(all_categories).to(device)
        
        with torch.no_grad():
            # Get image features
            image_features = model.encode_image(image)
            
            # Get text features for all categories
            text_features = model.encode_text(text_tokens)
            
            # Normalize features
            image_features /= image_features.norm(dim=-1, keepdim=True)
            text_features /= text_features.norm(dim=-1, keepdim=True)
            
            # Calculate similarity scores
            similarity = (100.0 * image_features @ text_features.T).softmax(dim=-1)
            
            # Get top categories and their confidence scores
            values, indices = similarity[0].topk(10)
            
            # Prepare results
            categories = []
            for i, (value, idx) in enumerate(zip(values, indices)):
                category_name = all_categories[idx]
                confidence = value.item()
                categories.append({
                    "name": category_name,
                    "confidence": confidence
                })
            
            # Check if any of the top 3 categories are fashion-related with sufficient confidence
            is_fashion_related = any(
                categories[i]["name"] in fashion_categories and categories[i]["confidence"] > 0.35
                for i in range(min(3, len(categories)))
            )
            
            # Special check for accessories with a lower threshold
            is_accessory = any(
                categories[i]["name"] in accessory_categories and categories[i]["confidence"] > 0.2
                for i in range(min(5, len(categories)))
            )
            
            # Check if the top category is non-fashion with high confidence
            is_definitely_non_fashion = (
                categories[0]["name"] in non_fashion_categories and 
                categories[0]["confidence"] > 0.5
            )
            
            # Stricter validation: must be fashion-related AND not definitely non-fashion
            # OR must be an accessory
            return {
                "is_fashion_related": (is_fashion_related and not is_definitely_non_fashion) or is_accessory,
                "categories": categories,
                "dominantColors": dominant_colors,
                "is_accessory": is_accessory
            }
    except Exception as e:
        if not quiet:
            print(f"Error validating image: {str(e)}", file=sys.stderr)
        return {"is_fashion_related": False, "categories": []}

# Add this new function after the validate_fashion_image function
def validate_rotated_fashion_image(image_path, model, preprocess, device, quiet=False):
  """Try different rotations of the image to see if any are fashion-related"""
  try:
      import copy
      from PIL import Image, ImageOps

      # Load the original image
      original_img = Image.open(image_path).convert("RGB")
      
      # Create rotations of the image
      rotations = [
          ("original", original_img),
          ("90_degrees", original_img.transpose(Image.ROTATE_90)),
          ("180_degrees", original_img.transpose(Image.ROTATE_180)),
          ("270_degrees", original_img.transpose(Image.ROTATE_270)),
          ("flipped", ImageOps.flip(original_img)),
          ("mirrored", ImageOps.mirror(original_img)),
          # Add more subtle rotations for better coverage
          ("45_degrees", original_img.rotate(45)),
          ("135_degrees", original_img.rotate(135)),
          ("225_degrees", original_img.rotate(225)),
          ("315_degrees", original_img.rotate(315))
      ]
      
      best_result = None
      best_confidence = 0.0
      
      # Define accessory-specific keywords to look for
      accessory_keywords = ["bag", "purse", "handbag", "backpack", "wallet", "accessories", 
                           "watch", "jewelry", "belt", "sunglasses", "glasses"]
      
      # Test each rotation
      for rotation_name, rotated_img in rotations:
          # Save rotated image to temp file
          temp_path = image_path + f"_rotated_{rotation_name}.jpg"
          rotated_img.save(temp_path)
          
          try:
              # Validate the rotated image
              result = validate_fashion_image(temp_path, model, preprocess, device, quiet=True)
              
              # Check if it's fashion-related and has higher confidence
              if result.get("is_fashion_related", False):
                  # Get the highest confidence for a fashion category in the top 3
                  fashion_confidence = 0.0
                  for cat in result.get("categories", [])[:3]:
                      if any(keyword in cat["name"].lower() for keyword in ["clothing", "fashion", "apparel", "wear", 
                                                                         "dress", "shirt", "pants", "jeans", "jacket", 
                                                                         "shoes", "accessories"]):
                          fashion_confidence = max(fashion_confidence, cat["confidence"])
                  
                  if fashion_confidence > best_confidence:
                      best_confidence = fashion_confidence
                      best_result = copy.deepcopy(result)
                      best_result["rotation"] = rotation_name
                      
                      # Extract dominant colors from the rotated image
                      if best_result.get("dominantColors") is None:
                          best_result["dominantColors"] = extract_dominant_colors(temp_path)
              
              # Special check for accessories even if not classified as fashion-related
              if not result.get("is_fashion_related", False):
                  for cat in result.get("categories", [])[:5]:  # Check top 5 categories
                      if any(keyword in cat["name"].lower() for keyword in accessory_keywords) and cat["confidence"] > 0.2:
                          # If we detect an accessory with reasonable confidence, consider it valid
                          if cat["confidence"] > best_confidence:
                              best_confidence = cat["confidence"]
                              result["is_fashion_related"] = True  # Override the original validation
                              best_result = copy.deepcopy(result)
                              best_result["rotation"] = rotation_name
                              best_result["accessory_override"] = True
                              
                              # Extract dominant colors from the rotated image
                              if best_result.get("dominantColors") is None:
                                  best_result["dominantColors"] = extract_dominant_colors(temp_path)
          except Exception as e:
              if not quiet:
                  print(f"Error validating rotated image ({rotation_name}): {e}", file=sys.stderr)
          finally:
              # Clean up the temp file
              if os.path.exists(temp_path):
                  os.remove(temp_path)
      
      return best_result
  except Exception as e:
      if not quiet:
          print(f"Error validating rotated images: {e}", file=sys.stderr)
      return None

# Add a new function to check text-image coherence
def check_text_image_coherence(query, image_path, model, preprocess, device, quiet=False):
    """Check if the text query and image are coherent"""
    try:
        # Load and preprocess image
        image = preprocess(Image.open(image_path).convert("RGB")).unsqueeze(0).to(device)
        
        # Tokenize text query
        text_token = clip.tokenize([query]).to(device)
        
        with torch.no_grad():
            # Encode the image and text
            image_features = model.encode_image(image)
            text_features = model.encode_text(text_token)
            
            # Normalize features
            image_features /= image_features.norm(dim=-1, keepdim=True)
            text_features /= text_features.norm(dim=-1, keepdim=True)
            
            # Calculate similarity between text and image
            similarity = (image_features @ text_features.T).item()
            
            # Define threshold for coherence
            coherence_threshold = 0.2  # This can be adjusted based on testing
            
            is_coherent = similarity >= coherence_threshold
            
            return {
                "is_coherent": is_coherent,
                "similarity": similarity
            }
    except Exception as e:
        if not quiet:
            print(f"Error checking text-image coherence: {str(e)}", file=sys.stderr)
        return {"is_coherent": True, "similarity": 1.0}

# Update the main function to handle rotation check
def main():
  args = parse_args()
  quiet = args.quiet

  try:
      # Initialize results with default empty list
      results = []
      
      # Special case for validation
      if args.search_type == "validate":
          if not args.image_path:
              if not quiet:
                  print("Error: Image validation requires an image path", file=sys.stderr)
              sys.exit(1)
              
          # Load model and data
          model, preprocess, _, _, _, device = load_model_and_data(quiet)
          
          # Validate the image
          validation_result = validate_fashion_image(args.image_path, model, preprocess, device, quiet)
          
          # Check if rotation check is enabled and the image is not already valid
          if args.rotation_check and not validation_result.get("is_fashion_related", False):
              rotated_validation = validate_rotated_fashion_image(args.image_path, model, preprocess, device, quiet)
              if rotated_validation:
                  validation_result["rotatedValidation"] = rotated_validation
          
          # Extract colors if requested
          if args.color_detection:
              validation_result["dominantColors"] = extract_dominant_colors(args.image_path)
          
          # Output validation results as JSON
          print(json.dumps({"validation": validation_result}))
          return
      
      # Special case for coherence check
      if args.search_type == "coherence":
          if not args.image_path or not args.query:
              if not quiet:
                  print("Error: Coherence check requires both image path and query", file=sys.stderr)
              sys.exit(1)
              
          # Load model and data
          model, preprocess, _, _, _, device = load_model_and_data(quiet)
          
          # Check text-image coherence
          coherence_result = check_text_image_coherence(args.query, args.image_path, model, preprocess, device, quiet)
          
          # Output coherence results as JSON
          print(json.dumps({"coherence": coherence_result}))
          return
        
      # Check if we have the required arguments for other search types
      if args.search_type == "text" and not args.query:
          if not quiet:
              print("Error: Text search requires a query", file=sys.stderr)
          sys.exit(1)
        
      if args.search_type == "image" and not args.image_path:
          if not quiet:
              print("Error: Image search requires an image path", file=sys.stderr)
          sys.exit(1)
        
      if args.search_type == "multimodal" and (not args.query or not args.image_path):
          if not quiet:
              print("Error: Multimodal search requires both query and image path", file=sys.stderr)
          sys.exit(1)
        
      # Load model and data
      model, preprocess, index, df, image_embeddings, device = load_model_and_data(quiet)
        
      # Parse dominant colors if provided
      dominant_colors = None
      if args.dominant_colors:
          dominant_colors = args.dominant_colors.split(',')
        
      # Perform search based on type
      if args.search_type == "text":
          results = search_by_text(args.query, model, index, df, image_embeddings, device, args.top_k, quiet)
        
      elif args.search_type == "image":
          results = search_by_image(args.image_path, model, preprocess, index, df, image_embeddings, device, args.top_k, dominant_colors, quiet)
        
      elif args.search_type == "multimodal":
          results = multimodal_search(args.query, args.image_path, model, preprocess, index, df, image_embeddings, device, args.top_k, dominant_colors, quiet)
        
      # Clean the results to ensure they are JSON serializable
      results = clean_product_results(results, quiet)
        
      # Output results as JSON
      print(json.dumps({"results": results}))

  except Exception as e:
      if not quiet:
          print(f"Error: {str(e)}", file=sys.stderr)
      sys.exit(1)

if __name__ == "__main__":
    main()

