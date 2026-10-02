"""Numeric comparison of frozen native frames; never edits the captures."""
import json
from pathlib import Path
from PIL import Image, ImageChops

root = Path(__file__).resolve().parent / 'out'
rows = []
for source in sorted((root / 'sign-merge-before').glob('*.png')):
    target = root / 'sign-merge-after' / source.name
    before, after = Image.open(source).convert('RGB'), Image.open(target).convert('RGB')
    if before.size != after.size:
        raise ValueError(f'Different dimensions: {source.name}')
    channels = ImageChops.difference(before, after).split()
    masks = [channel.point(lambda v: 255 if v else 0) for channel in channels]
    mask = ImageChops.lighter(ImageChops.lighter(masks[0], masks[1]), masks[2])
    count = mask.histogram()[255]
    rows.append({'name': source.stem, 'differentPixels': count,
                 'differentPercent': count / (before.width * before.height) * 100,
                 'maxChannelDifference': max(channel.getextrema()[1] for channel in channels)})
(root / 'sign-merge-pixels.json').write_text(json.dumps(rows, indent=2))
print(json.dumps(rows))
