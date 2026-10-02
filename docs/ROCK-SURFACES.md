# Nearby rock surfaces and geometry compaction, 2.55.0

Five existing outcrop groups now have rounded shoulders and irregular geometry relief. Forty surrounding chips retain their placements. The clipped fracture masses keep their original material groups; sampled edges and an inner face ring support broader uneven surfaces. Area-weighted normals soften shallow shoulders while retaining sharp breaks. Ground, large cliffs, planting, collision tuples, lighting, shaders and textures are unchanged.

The first candidate failed inspection: its regular horizontal cuts resembled stacked concrete courses. It added 78,704 common model triangles. The second removed those bands but barely changed the walking-distance shape and retained four unpaired quantized edges on each of two pieces. All ten frames from each rejected candidate were directly inspected. Five third-round frames were inspected before final geometry compaction. Both rejected rounds and the third-round diagnostics remain in the [nine-slide receipts](../tools/out/rock-surface-review.html).

Eleven final native camera pairs match capsule, camera, rotation, field, placement, light, wind and time. All 22 comparison frames were directly inspected. Eight pairs provide useful rock views; one yard pair is a conservation control and two pairs are obstructed by a trunk or fir. The clear eastern camera has its own baseline and final captures. The rear camera remains at walking height, rather than above the model.

Thin dark creases remain an unresolved visible criticism. Temporary shadow-off and shader-height-off observations retain those lines. Constant white front-face material shows no visible openings at the diagnostic cameras. Those six diagnostic frames were inspected; they are explicitly nonshipping observations and establish no exact cause. No production shader, light or material adjustment is included.

## Construction and cost

The fifteen larger emitted masses have paired undirected triangle edges after position quantization to 0.00001 metres. No zero-area emitted triangle remains; normals are unit length within Float32 tolerance. This is an edge check, not a Boolean surface-union or watertightness certification.

The three existing merged rock meshes now compact bit-identical complete vertex records with the existing canopy indexer. Positions, normals, UVs and colours expand exactly back to the original merged stream: 1,042,140 attribute words checked. Vertices fall from 94,740 to 51,464 and indexing saves 1,714,664 bytes against the unindexed candidate. It adds startup work and no per-frame callback.

| Common scene | 2.54.0 | 2.55.0 |
| --- | ---: | ---: |
| Mesh objects | 43 | 43 |
| Foliage batches | 26 | 26 |
| Materials | 21 | 21 |
| Foliage model triangles | 288,244 | 288,244 |
| All model triangles | 434,800 | 446,736 |
| Geometry capacity, bytes | 37,509,526 | 37,370,414 |
| Added textures/lights | 0 | 0 |

The net cost is 11,936 additional model triangles and 139,112 fewer geometry bytes. All eleven native refreshed-shadow draw counts match. Submitted triangles increase. Only common-view.js changes executable behaviour; the other 70 scripts and version-normalized portable shell remain exact. All 1,098 outside-common meshes, five other geometry objects, 7,821 unmerged nonrock common objects and 40 merged nonrock common meshes retain exact geometry, transforms and materials. Field, obstacles, placements, foliage, root contacts and shared atlas pixels match.

## Verification and remaining criticism

```text
node tools/test.mjs
COMPLETE 570 system checks passed
node tools/build.mjs
PASS standalone: 71 scripts compile; no external scripts or stylesheets.
node tools/verify-rock-surface.mjs
COMPLETE rock conservation
node tools/verify-rock-surface-review.mjs
COMPLETE nine rock-surface slides, eighteen decoded pairs, visible navigation, no overflow, errors or pointer lock.
```

Four six-second native RTX profiles at 1920 by 1080 retain the 60 Hz cap. The baseline is byte-exact reused from the 2.54.0 profile dated 2026-10-02T12:32:07.819Z; the final profile is dated 2026-10-02T14:00:43.784Z. All eight retained/current profile frames were directly inspected. Mean simulation plus rendering changes from 2.50 to 2.55 ms in the yard, 3.46 to 3.59 with four moving render fixtures, 2.32 to 2.35 on the north slope and 2.24 to 2.28 at the outcrop. GPU query means change from 13.90 to 14.15, 14.40 to 14.52, 8.18 to 8.63 and 10.01 to 8.39 ms respectively. These separate windows under competing work do not establish a speedup or quiet-machine FPS.

The walking-distance improvement is modest. Thin dark creases, broad flat tops, stretched-looking vertical faces and repeated fracture grammar remain criticism. Empty hills, carpet-like grass, repeated crowns, near fir cards, pristine characters and fixed empty-hand curl remain open. Physical Firefox turning/strafing and separate-network co-op remain unverified. The last actual public-lobby audit remains dated 2.51.1, with unchanged networking source. Firefox URL delivery does not prove foreground rendering or physical input feel. The broader polish goal remains active.
