# Continuous miner face, 2.60.0

The two separate nostril spheres in 2.59.0 read as floating boogers. The replacement builds the nose, lips, cheeks and jaw into one closed skin surface and fits a tapered moustache into that surface. It also replaces the separate scalp/side-hair pieces and solid beard underside with surface colour. This accepts the specific face correction. The unchanged detached triangular collar still reads as a bowtie and is the next art defect to correct.

The face remains smooth and toy-like, with a broad soft nose, dense moustache, uniform scalp tint and primitive ears. Smooth shoulders, broad stretched cloth folds, fixed glove curl, clean leather, exposed flat boot tops and broad crouched strafe remain criticism. The broader polish goal stays active.

## Construction and cost

The indexed skin has 28 height stations and 64 circumferential segments, concentrated around the front. An analytic elliptical head profile carries continuous nose, mouth and cheek relief. Shallow nostril recesses replace detached parts; surface-derived normals remove the banding rejected in intermediate trials. Vertex colours place hair, soft stubble and recessed detail on the skin. Existing merged ear vertices retain white colour multipliers and their original shape.

The closed moustache has nineteen sections with a varying cross-section and tapered tips. Every section intersects the actual rendered skin in the ray-based attachment check. Its former free tube ends are gone. The face and moustache checks cover actual indexed edges, winding, finite attributes, positive volume, outward normals and skin intersections. They do not certify global self-intersection freedom or finished anatomy.

| Resource per worker | 2.59.0 | 2.60.0 |
| --- | ---: | ---: |
| Body meshes | 48 | 48 |
| Model triangles | 26,512 | 28,572 |
| Geometry bytes | 1,438,384 | 1,504,088 |
| Main material objects | 25 | 25 |
| All owned rig materials, including shadow variants | 45 | 45 |
| Existing 256 x 256 fabric textures | 1 | 1 |

The cost is 2,060 added model triangles, 65,704 added geometry bytes and skin vertex-colour shader work per worker. No extra mesh, material, texture, light or draw is added. In the four-miner fixture, instance/quaternion storage stays 13,056 bytes, owned cloned joint geometry stays 248,688 bytes and quaternion attributes stay 768 bytes. The rebuilt face remains in the existing rigid body batches. No timing profile or FPS improvement is claimed for this release.

Forty-five other body meshes retain exact geometry, transforms and material boundaries, including helmet, goggles and prior shoulders. All original base material properties and 1,260 compatible cross-colour slot comparisons pass. Native fabric atlas PNG bytes stay exact. Only miner-art.js changes executable behaviour; 70 of 71 standalone scripts stay exact. Input, movement, networking, carry, weapon geometry, world geometry and lighting retain their released sources.

## Inspected evidence

`node tools/test.mjs` completed **594 system checks**. The six new face checks verify topology, continuous relief, real skin attachment, declared budgets, conservation and vertex colours. Existing campaign, movement, co-op, weapon, joint and shoulder checks remain in the full suite. All 71 standalone scripts compile.

All 58 final frames were individually inspected in this pass, with no inherited inspection claim. The 29 native pairs retain exact cameras, full rig traces and draw counts. They include four face views, four whole-body views, four pitched-head views, three native travel views, all seven remote weapons and all seven first-person weapons. Full upward pitch exposes the rounded jaw; full downward pitch mainly shows the helmet and is weak face evidence.

Four first-person PNG pairs are identical: cutter, scoop, heart and axe. Lance and sling differ at twelve pixels by one colour level. The lit resonator differs at 114 pixels, maximum channel difference 50. All their source geometry and submissions stay exact; universal pixel identity is not claimed.

The actual refreshed-shadow four-miner GPU fixture uses 1,055 native calls versus 701 instanced calls, both submitting 1,821,999 triangles. The PNGs differ at 34 pixels, maximum channel difference 23. Ten joint groups and two shoulder attributes retain independent rotations. This is a back-facing local fixture, useful for rendering and submission checks, not a close-up face comparison or a new connected multiplayer test.

The [ten-slide review](../tools/out/miner-face-review.html) contains 34 decoded pairs and leads the 62-section [receipt hub](../tools/out/current-review.html). [Inspection](../tools/out/miner-face-inspection.json) binds the 58 viewed frames; [conservation](../tools/out/miner-face-conservation.json) binds the tested standalone hash, actual resource costs and source audit.

## Rejected and diagnostic trials

1. The first continuous face had a swollen nose crowding the goggle bridge, weak mouth definition, a paper-thin moustache and an intersecting separate scalp. Five images were directly inspected and rejected.
2. Integrated scalp colour removed those intersections, but latitude and mouth bands remained. Five images were directly inspected and rejected.
3. Surface-normal refinement alone did not correct the shape bands. Three of its five images were directly inspected. The review includes the inspected close study only.
4. An attempted profile revision failed compilation. Its capture accidentally reused the last successful round-3 build. Its retained rejection explicitly marks the images stale; they are excluded as a new rendered revision.
5. The successful analytic profile removed the visible bands. Two provisional images were inspected before final cap/colour cleanup; the final 29-pair capture supersedes this provisional evidence.

A single directly viewed no-shadow diagnostic retained the mouth bands, attributing the flaw to construction rather than studio shadows. That temporary lighting change is not shipped. The final images use the normal released lighting.

Physical Firefox turning/strafing, quiet-machine timing and separate-network co-op remain open. The last real public-lobby audit is dated 2.51.1; networking executable sources stay exact. Normal Firefox tab requests do not certify foreground visibility or physical feel. Shipment must bind the current git head, successful Pages run, all 72 public assets, portable hash and actual ZIP entries.

```powershell
node tools/test.mjs
node tools/build.mjs
node tools/miner-face-capture.mjs before
node tools/miner-face-capture.mjs after
node tools/miner-face-gpu.mjs
python tools/miner-face-pixels.py
node tools/verify-miner-face.mjs
node tools/make-miner-face-review.mjs
node tools/verify-miner-face-review.mjs
```

The before capture requires the retained released standalone baseline. Evidence generation also requires the actual direct-view log and pixel comparison. All browser tools preserve the pre-navigation pointer-lock and focus guard and use fixed evaluation without input dispatch.
