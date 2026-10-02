from pathlib import Path
from PIL import Image, ImageChops
import json

out = Path(__file__).resolve().parent / 'out'
report = json.loads((out / 'crew-equipment-after/report.json').read_text())
rows = []
for shot in report['shots']:
    name = shot['name']
    before = Image.open(out / 'crew-equipment-before' / f'{name}.png').convert('RGB')
    after = Image.open(out / 'crew-equipment-after' / f'{name}.png').convert('RGB')
    assert before.size == after.size
    difference = ImageChops.difference(before, after)
    data = difference.tobytes()
    rows.append({
        'name': name,
        'pixels': before.width * before.height,
        'changedPixels': sum(bool(data[i] or data[i+1] or data[i+2]) for i in range(0, len(data), 3)),
        'maximumChannelDifference': max(data),
        'bounds': difference.getbbox(),
    })
(out / 'crew-equipment-pixels.json').write_text(json.dumps(rows, indent=2))
print(json.dumps(rows))
