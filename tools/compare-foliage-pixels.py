"""Compare native foliage captures without altering either image."""
import json
import sys
from pathlib import Path
from PIL import Image, ImageChops

root = Path(__file__).resolve().parent / "out"
candidate = sys.argv[1] if len(sys.argv) > 1 else "release"
rows = []
for source in sorted((root / "foliage-batching-before-clear").glob("*.png")):
    target = root / ("foliage-batching-" + candidate) / source.name
    with Image.open(source) as first_file, Image.open(target) as second_file:
        first, second = first_file.convert("RGB"), second_file.convert("RGB")
    if first.size != second.size:
        raise ValueError(f"Different dimensions: {source.name}")
    channels = ImageChops.difference(first, second).split()
    masks = [channel.point(lambda value: 255 if value else 0) for channel in channels]
    mask = ImageChops.lighter(ImageChops.lighter(masks[0], masks[1]), masks[2])
    count = mask.histogram()[255]
    rows.append({"name": source.stem, "differentPixels": count,
                 "differentPercent": count / (first.width * first.height) * 100,
                 "maxChannelDifference": max(channel.getextrema()[1] for channel in channels)})
if len(rows) != 8:
    raise ValueError(f"Expected eight matched views, got {len(rows)}")
destination = root / ("foliage-batching-pixels-" + candidate + ".json")
destination.write_text(json.dumps(rows, indent=2))
print(json.dumps(rows))
