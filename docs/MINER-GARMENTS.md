# Miner garments, 2.49.0

Bent knees previously exposed a solid black strap cap and a gap between thigh and shin. Bent elbows exposed the sleeve cut. The new cloth volumes overlap those joints, hollow annular straps replace the capped discs, and a curved closed bib follows the chest. Torso, sleeve and trouser contours include shallow folds.

The first candidate failed visual inspection. Cloth ray coverage passed while the black strap disc remained exposed; a close elbow view also showed bright intersection flecks. The retained candidate was rejected. Hollow straps and larger buried elbow overlap correct those specific defects. The wider art goal remains active.

## Evidence

- `node tools/test.mjs`: **COMPLETE 556 system checks passed**. Five new checks cover the bib's outward winding and closed edges, knee and elbow cloth coverage across bends, genuinely hollow strap bands, unchanged rig anchors, and preserved head/hand/boot geometry.
- `node tools/verify-miner-garment.mjs`: **29 matched cameras and rig poses**. Only `src/miner-art.js` changes executable behavior across 71 embedded scripts. Markup/styles match except version metadata; animation, existing batching, controller, networking, lighting and weapon sources remain exact.
- All **58 final before/after frames were personally inspected**, including four whole-body angles, face/aim, knee/elbow stress poses, all seven remote tools, three native movement views and all seven first-person tools. Six candidate frames were inspected before rejection.
- [Nine-slide review](../tools/out/miner-garment-review.html), [raw comparisons](../tools/out/miner-garment-conservation.json), [suite log](../tools/out/miner-garment-suite.log), and [inspection hashes](../tools/out/miner-garment-inspection.json).
- Final portable SHA-256: `8d951d769ef2302b4b3f6c6141a40de62aa25b6a27b224632d51d61becf82b50`.

## Cost

| Body inventory | 2.48.0 | 2.49.0 |
|---|---:|---:|
| Meshes | 52 | 52 |
| Model triangles | 27,360 | 29,176 |
| Used materials | 15 | 15 |
| Textures | 1 | 1 |
| Geometry array bytes | 1,546,352 | 1,576,992 |

Geometry adds 1,816 triangles (6.6%) and 30,640 array bytes. Twenty-seven captured draw counts match; two knee profile stress views add one draw through changed bounds. Native game and first-person counts match. Body frame submissions add 2,708 to 3,884 triangles with refreshed shadows in these fixtures. This is an art correction, with no FPS improvement claim.

## Remaining criticism

The standing silhouette change is modest. The cloth still looks too clean, the woven map and facial forms repeat, seam trim is oversized, and bent cloth reads as assembled rigid forms rather than natural deformation. The free arm and upper body remain restrained; wide strafing can look crouched. Quiet-machine timing, physical Firefox input feel and separate-network co-op remain unverified. Static studio stress poses are labelled separately from native game movement samples.
