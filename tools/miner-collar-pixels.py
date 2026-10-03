"""Read captured PNGs and record pixel differences; never modify images."""
from pathlib import Path
from PIL import Image
import hashlib
import json

root = Path(__file__).resolve().parent / 'out'
after = json.loads((root / 'miner-collar-after/report.json').read_text())
pairs = [(s['name'], root / 'miner-collar-before' / (s['name'] + '.png'),
          root / 'miner-collar-after' / (s['name'] + '.png')) for s in after['shots']]
pairs.append(('gpu', root / 'miner-collar-four-native.png', root / 'miner-collar-four-instanced.png'))
rows = []
for name, before, candidate in pairs:
    a, b = Image.open(before).convert('RGBA'), Image.open(candidate).convert('RGBA')
    assert a.size == b.size
    changed, maximum = 0, 0
    flat = lambda im: im.get_flattened_data() if hasattr(im, 'get_flattened_data') else im.getdata()
    for x, y in zip(flat(a), flat(b)):
        differences = [abs(i - j) for i, j in zip(x, y)]
        changed += any(differences)
        maximum = max(maximum, *differences)
    rows.append(dict(name=name, width=a.width, height=a.height, differentPixels=changed,
                     maximumChannelDifference=maximum,
                     beforeSha256=hashlib.sha256(before.read_bytes()).hexdigest(),
                     afterSha256=hashlib.sha256(candidate.read_bytes()).hexdigest()))
(root / 'miner-collar-pixels.json').write_text(json.dumps(rows, indent=2))
print(json.dumps([r for r in rows if r['name'].startswith('local-') or r['name'] == 'gpu'], indent=2))
