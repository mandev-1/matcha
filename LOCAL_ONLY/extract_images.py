#!/usr/bin/env python3
"""
Script to extract one image from each directory and move it to a new directory.
"""

import os
import shutil
from pathlib import Path

# Configuration
SOURCE_DIR = Path(__file__).parent / "RADIATE_JPEGS1"
OUTPUT_DIR = Path(__file__).parent / "extracted_images"

# Supported image extensions
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.JPG', '.JPEG', '.PNG'}


def get_image_files(directory):
    """Get all image files from a directory."""
    image_files = []
    for file in directory.iterdir():
        if file.is_file() and file.suffix in IMAGE_EXTENSIONS:
            image_files.append(file)
    return sorted(image_files)  # Sort for consistent selection


def extract_images_from_directories(source_dir, output_dir):
    """Extract one image from each directory and move it to output directory."""
    source_path = Path(source_dir)
    output_path = Path(output_dir)
    
    # Create output directory if it doesn't exist
    output_path.mkdir(parents=True, exist_ok=True)
    
    moved_count = 0
    skipped_count = 0
    
    # Walk through all directories
    for root, dirs, files in os.walk(source_path):
        root_path = Path(root)
        
        # Get image files in current directory
        image_files = get_image_files(root_path)
        
        if image_files:
            # Take the first image
            source_image = image_files[0]
            
            # Create a unique filename based on the directory path
            # Replace path separators with underscores
            relative_path = source_image.relative_to(source_path)
            # Create a safe filename from the relative path
            safe_name = str(relative_path).replace(os.sep, '_').replace('/', '_')
            
            destination = output_path / safe_name
            
            # If file already exists, add a counter
            counter = 1
            original_destination = destination
            while destination.exists():
                stem = original_destination.stem
                suffix = original_destination.suffix
                destination = output_path / f"{stem}_{counter}{suffix}"
                counter += 1
            
            try:
                # Move the file
                shutil.move(str(source_image), str(destination))
                print(f"Moved: {source_image.name} -> {destination.name}")
                moved_count += 1
            except Exception as e:
                print(f"Error moving {source_image}: {e}")
                skipped_count += 1
        else:
            # Directory has no images, skip it
            skipped_count += 1
    
    print(f"\nSummary:")
    print(f"  Images moved: {moved_count}")
    print(f"  Directories skipped (no images): {skipped_count}")
    print(f"  Output directory: {output_path}")


if __name__ == "__main__":
    print(f"Extracting one image from each directory...")
    print(f"Source: {SOURCE_DIR}")
    print(f"Output: {OUTPUT_DIR}\n")
    
    if not SOURCE_DIR.exists():
        print(f"Error: Source directory does not exist: {SOURCE_DIR}")
        exit(1)
    
    extract_images_from_directories(SOURCE_DIR, OUTPUT_DIR)
    print("\nDone!")
