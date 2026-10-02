# Mapped miner cloth, 2.57.0

The character's repeated woven grid is replaced with one mapped garment atlas. Torso, thighs, shins, upper sleeves, forearms and patches receive distinct seam, fold-shading and wear regions. The fold shading changes the material; all existing body geometry and articulation remain exact.

The native improvement is visible on sleeves and trousers. This does not finish the character hard art pass. Knee overlap still has scalloped cut edges and rigid transitions. Mirrored fold grammar, mottled chest grain, molded shoulders, flat leather, repeated anatomy, moustache primitives and the fixed empty-hand curl remain criticism.

The atlas stays 256 by 256. Four-pixel insets keep regions inside their texture bounds; cloth uses ordinary mapped MeshStandardMaterial with lower bump amplitudes. Canvas pixels are generated once per asset factory. Each miner retains its own independently disposable texture object, with no new shader callback or per-frame cloth work.

| Body resource | 2.56.0 | 2.57.0 |
| --- | ---: | ---: |
| Meshes | 52 | 52 |
| Model triangles | 27,168 | 27,168 |
| Geometry bytes | 1,457,744 | 1,457,744 |
| Materials | 15 | 15 |
| Owned textures | 1 | 1 |
| Texture base bytes before mipmaps | 262,144 | 262,144 |

All body positions, normals, indices, transforms and render flags remain exact against the frozen [2.56.0 source fixture](../tools/fixtures/miner-art-2.56.0.js). All non-fabric UVs match. Thirteen merged fabric meshes receive new UVs without adding attributes. All 1,316 same-material slot comparisons across eight crew colours retain exact geometry, UVs and atlas pixels, preserving existing body batch compatibility.

All **575 system checks pass**, including five [new asset conservation checks](../tools/test-miner-cloth-map.mjs). Older garment and glove checks retain strict shape, non-fabric UV and rig assertions while deferring the intentional fabric UV change to the stronger frozen-baseline comparison. The initially failing glove UV assertion is retained in the second candidate's failed suite log; the test contract was corrected after confirming actual body geometry conservation.

The [native source/capture audit](../tools/verify-miner-cloth-map.mjs) matches all 29 camera, rig, inventory, draw and submitted-triangle pairs. Seventy executable scripts remain exact; only miner-art.js changes. The normalized portable shell differs only in version, and all 71 standalone scripts compile.

All **58 final native PNGs were individually inspected**. The 29 pairs cover five studio angles, four bent-knee views, one bent-elbow view, two aiming extremes, seven equipped remote tool fixtures, three native game-camera poses and seven first-person weapons. Three first-person PNGs are byte-identical. The remaining four differ by 11 or 12 pixels, with maximum channel delta one. This is conservation evidence, not a new first-person art improvement.

Two atlas candidates failed visual inspection. Round one was too smooth and had broad uniform wear. Round two improved grain and placed wear but mapped the knee joint to a plain patch that read as bare skin at 95 degrees. The final version maps knee and elbow spheres into the appropriate garment tile. Rigid overlap and cut edges remain exposed in the review.

The [ten-slide review](../tools/out/miner-cloth-map-review.html) contains all 29 final pairs, three retained rejected pairs, actual before/after atlas pixels, resource counts and criticism. Its 33 comparisons decode; navigation stays visible without overflow, browser errors or pointer lock. The review leads the 59-section [current receipt hub](../tools/out/current-review.html). Every slide and the hub were directly viewed.

Reproduce local evidence with `node tools/miner-cloth-map-capture.mjs before`, `node tools/miner-cloth-map-capture.mjs after`, `node tools/verify-miner-cloth-map.mjs`, `node tools/make-miner-cloth-map-review.mjs` and `node tools/verify-miner-cloth-map-review.mjs`. The frozen baseline, final build/source, reports, PNGs and rejected candidates remain under tools/out. The full suite log and individual inspection hashes are required review inputs; a script cannot approve appearance by itself.

No fresh FPS claim is made. Exact resource and draw conservation cannot certify quiet-machine timing. Physical Firefox turning/strafing and separate-network co-op remain unverified. The last actual public global-lobby audit retains its 2.51.1 date; network source, room, protocol and save version remain unchanged. Fixed remote fixtures are not newly connected network clients. The broader polish goal remains active.
