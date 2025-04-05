#!/usr/bin/env python3
"""
Generate embeddings for fashion dataset using CLIP model.
"""

import argparse
import os
import sys
import importlib.util

# Add error handling for imports
try:
    import numpy as np
    import pandas as pd
    import torch
    import clip
    from PIL import Image
    from tqdm import tqdm
    import faiss
except ImportError as e:
    print(f"Error importing required module: {e}")
    print("Please make sure all dependencies are installed:")
    print("pip install numpy pandas torch torchvision Pillow tqdm faiss-cpu")
    print("pip install git+https://github.com/openai/CLIP.git")
    sys.exit(1)

def parse_args():
    parser = argparse.ArgumentParser(description="Generate embeddings for fashion dataset")
    parser.add_argument("--dataset-path", type=str, required=True, help="Path to dataset directory")
    parser.add_argument("--embeddings-path", type=str, required=True, help="Path to save embeddings")
    parser.add_argument("--batch-size", type=int, default=16, help="Batch size for processing")
    parser.add_argument("--env-file", type=str, help="Path to environment variables file")
    
    return parser.parse_args()

def main():
    args = parse_args()
    
    # Load environment variables if provided
    if args.env_file and os.path.exists(args.env_file):
        print(f"Loading environment variables from {args.env_file}")
        spec = importlib.util.spec_from_file_location("env_module", args.env_file)
        env_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(env_module)
        
        # Override args with environment variables if they exist
        if hasattr(env_module, 'DATASET_PATH'):
            args.dataset_path = env_module.DATASET_PATH
        if hasattr(env_module, 'EMBEDDINGS_PATH'):
            args.embeddings_path = env_module.EMBEDDINGS_PATH
    
    # Print Python environment info for debugging
    print(f"Python executable: {sys.executable}")
    print(f"Python version: {sys.version}")
    print(f"Python path: {sys.path}")
    
    # Define paths
    DATASET_PATH = args.dataset_path
    EMBEDDINGS_PATH = args.embeddings_path
    IMAGE_FOLDER = os.path.join(DATASET_PATH, 'images')
    METADATA_FILE = os.path.join(DATASET_PATH, 'styles.csv')
    
    # Check if paths exist
    print(f"Checking paths:")
    print(f"Dataset path: {DATASET_PATH}, exists: {os.path.exists(DATASET_PATH)}")
    print(f"Images folder: {IMAGE_FOLDER}, exists: {os.path.exists(IMAGE_FOLDER)}")
    print(f"Metadata file: {METADATA_FILE}, exists: {os.path.exists(METADATA_FILE)}")
    
    assert os.path.exists(IMAGE_FOLDER), f"Image folder not found: {IMAGE_FOLDER}"
    assert os.path.exists(METADATA_FILE), f"Metadata file not found: {METADATA_FILE}"
    
    # Create embeddings directory if it doesn't exist
    os.makedirs(EMBEDDINGS_PATH, exist_ok=True)
    
    # Load dataset
    print("Loading dataset...")
    df = pd.read_csv(METADATA_FILE, on_bad_lines="skip")
    
    # Remove missing values and ensure corresponding images exist
    df = df.dropna(subset=["id", "productDisplayName"])
    df["id"] = df["id"].astype(str)  # Convert ID to string
    
    # Keep only rows where the image exists
    print("Filtering dataset...")
    df = df[df["id"].apply(lambda x: os.path.exists(os.path.join(IMAGE_FOLDER, f"{x}.jpg")))].reset_index(drop=True)
    
    # Create a text description combining metadata
    df["text_description"] = df.apply(
        lambda row: f"{row['productDisplayName']} - {row['masterCategory']}, {row['subCategory']}, {row['articleType']}, {row['baseColour']}, {row['usage']}, {row['gender']}",
        axis=1
    )
    
    # Display dataset info
    print(f"Dataset size after filtering: {len(df)}")
    
    # Load CLIP model
    print("Loading CLIP model...")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model, preprocess = clip.load("ViT-B/32", device=device)
    
    # Dictionary to store image embeddings
    print("Generating image embeddings...")
    image_embeddings = {}
    
    # Process images in batches
    batch_size = args.batch_size
    for i in tqdm(range(0, len(df), batch_size)):
        batch_df = df.iloc[i:i+batch_size]
        batch_images = []
        batch_ids = []
        
        for _, row in batch_df.iterrows():
            img_id = row["id"]
            img_path = os.path.join(IMAGE_FOLDER, f"{img_id}.jpg")
            
            try:
                image = preprocess(Image.open(img_path).convert("RGB"))
                batch_images.append(image)
                batch_ids.append(img_id)
            except Exception as e:
                print(f"Error processing image {img_id}: {e}")
        
        if batch_images:
            images_tensor = torch.stack(batch_images).to(device)
            
            with torch.no_grad():
                image_features = model.encode_image(images_tensor)
                image_features /= image_features.norm(dim=-1, keepdim=True)
            
            for img_id, feature in zip(batch_ids, image_features):
                image_embeddings[img_id] = feature.cpu().numpy()
    
    # Save image embeddings
    print("Saving image embeddings...")
    np.save(os.path.join(EMBEDDINGS_PATH, "image_embeddings.npy"), image_embeddings)
    
    # Generate text embeddings
    print("Generating text embeddings...")
    text_embeddings = {}
    
    for i in tqdm(range(0, len(df), batch_size)):
        batch_df = df.iloc[i:i+batch_size]
        batch_texts = []
        batch_ids = []
        
        for _, row in batch_df.iterrows():
            img_id = row["id"]
            text = row["text_description"]
            
            batch_texts.append(text)
            batch_ids.append(img_id)
        
        if batch_texts:
            text_tokens = clip.tokenize(batch_texts).to(device)
            
            with torch.no_grad():
                text_features = model.encode_text(text_tokens)
                text_features /= text_features.norm(dim=-1, keepdim=True)
            
            for img_id, feature in zip(batch_ids, text_features):
                text_embeddings[img_id] = feature.cpu().numpy()
    
    # Save text embeddings
    print("Saving text embeddings...")
    np.save(os.path.join(EMBEDDINGS_PATH, "text_embeddings.npy"), text_embeddings)
    
    # Create FAISS index
    print("Creating FAISS index...")
    image_vectors = np.array(list(image_embeddings.values()))
    dimension = image_vectors.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(image_vectors)
    
    # Save FAISS index
    print("Saving FAISS index...")
    faiss.write_index(index, os.path.join(EMBEDDINGS_PATH, "fashion_faiss.index"))
    
    print("Embeddings and index generated successfully.")

if __name__ == "__main__":
    main()

