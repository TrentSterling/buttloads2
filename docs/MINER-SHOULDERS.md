# Miner shoulder construction, 2.59.0

The former sleeve cap rotated independently above the chest. The replacement buries the upper sleeve seam in the chest and blends it towards the arm through a short radial shoulder region. Raised mechanical tools also stop moving back towards the face; both solved gloves retain contact throughout the complete camera pitch range.

This accepts a specific attachment and carry correction. Smooth molded shoulders, broad folds, the primitive face, fixed glove curl, exposed flat boot tops and broad crouched strafe remain visible criticism. The scoop can still obscure the face in a quarter-camera projection even when its geometry clears the head.

## Construction and costs

The sleeve uses seventeen axial rings and eighteen circumferential segments. Its medial proximal seam follows the torso, while the distal sleeve follows the arm and existing elbow deformation. Shoulder support ends at radius 0.110 m; elbow influence starts below y = -0.115 m, preventing the overlapping transformations that failed an earlier trial. Reflector geometry keeps its original construction.

Surface, depth and distance shaders use the same shoulder transformation. Normals use the analytic inverse Jacobian. Native materials read live torso and arm rotations; the two sleeve batches upload an additional body-relative quaternion per instance. Mesh vertices are not rewritten each frame.

| Resource per worker | 2.58.0 | 2.59.0 |
| --- | ---: | ---: |
| Body meshes | 48 | 48 |
| Model triangles | 26,224 | 26,512 |
| Geometry bytes | 1,431,792 | 1,438,384 |
| Main material objects | 25 | 25 |
| All owned rig materials, including shadow variants | 45 | 45 |
| Owned 256 x 256 fabric textures | 1 | 1 |

The change adds 288 model triangles and 6,592 geometry bytes per worker. In the frozen four-miner batch fixture, owned cloned joint geometry grows from 242,096 to 248,688 bytes. Total quaternion attributes grow from 640 to 768 bytes; 128 are new shoulder data. Body instance matrices and quaternion allocation total 13,056 bytes. Additional quaternion computations and shader work remain real costs.

46 other body meshes retain exact geometry attributes, indices, transforms and material boundaries against the released 2.58.0 factory. All fifteen base material properties and actual native fabric atlas PNG bytes remain exact. All 1,260 compatible cross-colour material-slot pairs pass. Of 71 standalone executable scripts, 69 remain exact; only miner-art.js and crew-view.js change behaviour. Input, controller, networking, tool geometry, world geometry, lighting and shell styling stay exact.

## Validation and inspected evidence

`node tools/test.mjs` completed **588 system checks**. The shoulder checks sample the actual production deformation reference at vertices, edge midpoints and triangle centroids over all seven carries, nine pitches across the complete +/-1.54 radian range and three torso leans. Across 378 shoulder cases and 506,898 samples, the minimum sampled Jacobian is 0.7142246940582103 with zero nonpositive samples. This checks sampled local fold safety, not global self-intersection freedom.

The expanded carry checks include the complete pitch limits and 180 moving/firing frames for each raised mechanical tool, pitch and travel direction. Both palms remain within the existing 25 mm grip tolerance. Working-end and complete head bounds have at least 6.20 mm positive forward-plane separation in the sampled animated cases. This proves separation in those cases; overlapping bounds in rejected studies alone did not prove triangle collisions.

35 final native comparison pairs retain exact cameras and draw counts. 29 retain exact captured rig poses; the six positive-aim views intentionally change weapon placement and shoulder/elbow solves. The final views include front, quarter, profile, back, face, knee/elbow stress, complete aim limits, four raised action poses, native travel, all seven remote tools and all seven first-person tools.

All 35 final candidate frames and 22 baseline frames were individually viewed during this pass. Thirteen other baseline frames exactly hash-match individually inspected 2.58.0 frames. The [inspection report](../tools/out/miner-shoulder-inspection.json) binds provenance for all 70 frames. The [eleven-slide review](../tools/out/miner-shoulder-review.html) contains 40 decoded pairs and leads the 61-section historical hub.

The actual four-miner native/instanced GPU comparison includes refreshed directional shadows and independently posed shoulders and knees. Native source rendering uses 1,055 calls; instancing uses 701. Both submit 1,805,519 triangles. The PNGs differ at 30 pixels, maximum channel difference 24. Two shoulder attributes retain independent body-relative rotations. These are local render fixtures, not newly connected network players.

All seven first-person tool sources and draw/triangle counts remain exact. Six PNG pairs differ at 3 to 8 pixels by one colour level; the resonator differs at 118 pixels with maximum channel difference 50. First-person pixel identity is not claimed.

## Failed constructions retained

1. Height-only torso anchoring flattened the cap into a flap and left a dark slit near the reflector. Eleven rendered frames and the actual source/build are retained.
2. A medial/height blend removed most of the flap but retained an angular notch and a near-collapsed sampled Jacobian. Eleven rendered frames and source/build are retained.
3. A wider seventeen-ring transition passed moderate pitches but inverted 364 sampled points when expanded to the full player pitch range. Eleven moderate-pitch rendered frames remain; they do not visually demonstrate every full-range failure.
4. A wider radial support overlapped the elbow deformation between source vertices, inverting 36 intermediate samples. It was rejected before rendering and has zero screenshots. Its build, source and numerical report remain.

The final smaller radial support leaves the original reflector unchanged and ends before the elbow influence. The provisional fifth construction and subsequent forward-carry refinements also remain archived. Previous cap-only failures remain in the separate [rejected trial review](../tools/out/miner-shoulder-trial-review.html).

## Dated performance limits

Three 1920 x 1080 surface-only captures use baseline, candidate, then repeated baseline, with four-second windows after 100 completed warmup frames. The pure-system suite was running concurrently; external GPU load was unknown. All six profile PNGs were directly viewed. Neither isolated shoulder shader cost nor quiet-machine FPS is accepted.

| Four moving fixture miners | Baseline | Candidate | Repeated baseline |
| --- | ---: | ---: | ---: |
| CPU mean, ms | 3.95 | 3.35 | 3.65 |
| GPU mean, ms | 14.68 | 14.41 | 10.47 |
| Frame p95, ms | 16.8 | 16.7 | 16.8 |
| Cached calls | 204 | 204 | 204 |
| Refreshed-shadow p95 calls | 776 | 776 | 776 |
| Cached submitted triangles | 728,952 | 730,104 | 728,952 |
| Refreshed submitted triangles | 1,766,585 | 1,768,889 | 1,766,585 |

The unchanged yard GPU means are 12.69 / 13.32 / 13.19 ms, at 107 calls and 589,264 triangles. These windows support retained submission counts and explicit geometry costs, not a speedup claim.

Physical Firefox turning/strafing, quiet-workload performance and separate-network co-op remain open. The last actual public-lobby audit is dated 2.51.1, with unchanged networking executable sources. The broader polish goal remains active.

```powershell
node tools/test.mjs
node tools/build.mjs
node tools/miner-shoulder-capture.mjs before
node tools/miner-shoulder-capture.mjs after
node tools/miner-shoulder-gpu.mjs
node tools/verify-miner-shoulder.mjs
node tools/make-miner-shoulder-review.mjs
node tools/verify-miner-shoulder-review.mjs
```

The before capture requires the retained released standalone baseline. All browser tools retain the pre-navigation pointer-lock and focus guard and use direct fixed evaluation without input dispatch.
