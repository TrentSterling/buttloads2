"""Compare native captures; writes numeric receipts without altering images."""
import json
from pathlib import Path
from PIL import Image, ImageChops

root = Path(__file__).resolve().parent / "out"
rows = []
for source in sorted((root / "mesh-merge-before").glob("*.png")):
    target = root / "mesh-merge-after" / source.name
    first, second = Image.open(source).convert("RGB"), Image.open(target).convert("RGB")
    if first.size != second.size:
        raise ValueError(f"Different dimensions: {source.name}")
    channels = ImageChops.difference(first, second).split()
    masks = [channel.point(lambda value: 255 if value else 0) for channel in channels]
    mask = ImageChops.lighter(ImageChops.lighter(masks[0], masks[1]), masks[2])
    count = mask.histogram()[255]
    rows.append({"name": source.stem, "differentPixels": count,
                 "differentPercent": count / (first.width * first.height) * 100,
                 "maxChannelDifference": max(channel.getextrema()[1] for channel in channels)})
(root / "mesh-merge-pixel-comparison.json").write_text(json.dumps(rows, indent=2))
print(json.dumps(rows))
