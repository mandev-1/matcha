#!/usr/bin/env python3
"""
Generate a 500x500 black JPEG with a simple bot silhouette.
Used when no profile images are available for test user generation.
"""
import argparse
import os
import sys

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("Pillow is required: pip install Pillow", file=sys.stderr)
    sys.exit(1)

W, H = 500, 500
BLACK = (0, 0, 0)
SILHOUETTE = (60, 60, 60)  # Dark gray so it's visible on black


def draw_bot_silhouette(draw: ImageDraw.ImageDraw) -> None:
    # Head (ellipse)
    head = (W * 0.25, H * 0.10, W * 0.75, H * 0.38)
    draw.ellipse(head, fill=SILHOUETTE, outline=None)
    # Body (rounded rect)
    body = (W * 0.22, H * 0.40, W * 0.78, H * 0.78)
    draw.rounded_rectangle(body, radius=30, fill=SILHOUETTE, outline=None)
    # Eyes (two circles)
    eye_y = H * 0.22
    left_eye = (W * 0.35, eye_y - 15, W * 0.42, eye_y + 15)
    right_eye = (W * 0.58, eye_y - 15, W * 0.65, eye_y + 15)
    draw.ellipse(left_eye, fill=SILHOUETTE, outline=None)
    draw.ellipse(right_eye, fill=SILHOUETTE, outline=None)
    # Antenna
    draw.line([(W * 0.50, H * 0.10), (W * 0.50, H * 0.02)], fill=SILHOUETTE, width=8)
    draw.ellipse((W * 0.46, 0, W * 0.54, H * 0.06), fill=SILHOUETTE, outline=None)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate 500x500 black JPEG with bot silhouette")
    parser.add_argument(
        "-o", "--output",
        default=os.path.join(os.path.dirname(__file__), "..", "data", "extracted_images", "placeholder_bot.jpg"),
        help="Output JPEG path (default: data/extracted_images/placeholder_bot.jpg)",
    )
    args = parser.parse_args()
    out_path = os.path.normpath(os.path.abspath(args.output))
    out_dir = os.path.dirname(out_path)
    os.makedirs(out_dir, exist_ok=True)

    img = Image.new("RGB", (W, H), BLACK)
    draw = ImageDraw.Draw(img)
    draw_bot_silhouette(draw)
    img.save(out_path, "JPEG", quality=85)
    print(out_path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
