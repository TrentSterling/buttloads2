# Worker glove construction, 2.51.0

Tapered closed palm volumes, unequal curled fingers and opposing thumbs replace the box palms, oval fingertips and separate knuckle spheres. Shaped back and finger reinforcements retain the existing leather and edge materials. Both elbow groups still merge into the same four glove meshes.

The correction is strongest in the equipped-hand close views. Every tool remains visible in the complete native miner views, but the difference at ordinary game distance is modest. The free hand still holds an empty rigid curl; smooth leather, pointed inner tips, broad reinforcement pads and repeated anatomy remain criticism. This accepts a construction improvement, not finished character art.

The [six-slide review](../tools/out/miner-glove-review.html) retains all 31 matched pairs: six isolated hand views, fourteen primary grip views across all seven tools, four mechanical support views and seven complete native game views. All 62 final PNGs were opened directly for inspection. The first equipped-hand camera looked through the chest; two rejected framing comparisons retain the same 2.50.0 art on both sides. There was no rejected glove art candidate in this checkpoint. Final captures were regenerated after correcting a UTF-8 mistake in the version edit.

`node tools/test.mjs` must end with `COMPLETE 564 system checks passed`. Four glove checks cover closed outward solids and valid normals, physical digit/pad/cuff attachment, an open handle cavity and exact conservation of every other body mesh. Earlier garment checks retain their independent coverage of head, boots, cuffs, garment volumes and joint anchors. Existing carry checks cover both actual grips during walking, firing, steep aim, tool switching and reduced motion.

| Per miner | Released 2.50.0 | 2.51.0 | Change |
| --- | ---: | ---: | ---: |
| Body meshes | 52 | 52 | 0 |
| Model triangles | 29,176 | 27,168 | -2,008 |
| Geometry array bytes | 1,576,992 | 1,457,744 | -119,248 |
| Body materials | 15 | 15 | 0 |
| Textures | 1 | 1 | 0 |

All 31 cameras and rig poses match. All recorded draw counts match; each complete native game view submits 4,016 fewer triangles, including shadow work. The other 48 body meshes retain exact geometry buffers, transforms and material parameters. The portable has 71 executable scripts; only miner-art.js changes behavior. Markup and styles match after version and line-ending normalization. Controller, carry solver, local tool models, network, lighting and batching code remain exact.

The sculpted sections cost construction work at miner creation; existing rigid merging and crew instance submission remain in place. No frame-time or FPS gain is claimed. Quiet-machine performance, physical Firefox movement feel and separate-network co-op remain open. Captures use fixed native page evaluation without pointer lock, OS input, browser activation or live transport.
