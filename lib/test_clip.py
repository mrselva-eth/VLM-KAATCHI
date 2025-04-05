#!/usr/bin/env python3
"""
Test script to verify CLIP installation and functionality
"""

import os
import sys
import torch
import clip
from PIL import Image
import numpy as np

def main():
    print("Python version:", sys.version)
    print("PyTorch version:", torch.__version__)
    
    try:
        # Check if CLIP is properly installed
        print("Testing CLIP installation...")
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Using device: {device}")
        
        # Load CLIP model
        model, preprocess = clip.load("ViT-B/32", device=device)
        print("CLIP model loaded successfully!")
        
        # Create a simple test
        text = clip.tokenize(["a photo of a cat", "a photo of a dog"]).to(device)
        
        # Create a dummy image (black square)
        dummy_image = Image.new('RGB', (224, 224), color='black')
        image = preprocess(dummy_image).unsqueeze(0).to(device)
        
        # Get features
        with torch.no_grad():
            image_features = model.encode_image(image)
            text_features = model.encode_text(text)
            
            # Normalize features
            image_features /= image_features.norm(dim=-1, keepdim=True)
            text_features /= text_features.norm(dim=-1, keepdim=True)
            
            # Calculate similarity
            similarity = (100.0 * image_features @ text_features.T).softmax(dim=-1)
            
        print("Test completed successfully!")
        print(f"Similarity scores: {similarity.cpu().numpy()}")
        
        return True
    except Exception as e:
        print(f"Error testing CLIP: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

