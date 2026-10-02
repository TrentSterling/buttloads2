# Tree branching and crown contact, 2.54.0

Eight long repeated forks made the broadleaf trees look like brooms beneath thin crowns. Four primary boughs now emerge at unequal heights from the actual curved trunk. They divide into shorter limbs; ten smaller crown clusters fill the centre and upper crown. Each tree retains 720 leaves: 560 on 80 shoots and 160 on outer sprays. No leaf atlas, palette or lighting change is added.

The first candidate failed for heavy upright limbs and separated rear clumps. The second improved the shape but added 14,288 common model triangles. Four native frames from each candidate were directly inspected. The final branch sweep uses four longitudinal segments while retaining the original six radial sides; trunks and firs retain the original default sweep. The final cost is 7,520 added triangles across 47 broadleaf trees. Both candidates remain in the [nine-slide review](../tools/out/branching-review.html).

## Attachment defect found during inspection

The previous crown origin used a fixed vertical offset while its shoot root was scaled. Actual transformed crown anchors sat as much as 82.95 mm from the intended branch endpoint; 280 of 376 exceeded the original 18 mm tip radius. The new origin applies the local root offset multiplied by the actual vertical scale. All 470 anchors meet their native parent endpoints within floating-point tolerance (maximum 8.882e-16 metres).

This is measured in instrumented production construction, using actual local-to-world transforms and parent points. The instrumentation does not enter the shipped runtime. Endpoint agreement does not certify a Boolean surface union or award whole-tree art approval.

## Native review and conservation

Fourteen exact native camera pairs retain terrain, placement, roots, obstacles, light, wind and time. All fourteen final frames were directly inspected. Baselines are byte-exact retained 2.53.0 captures with their original date and previous direct inspection. The porch-obstructed quarter view remains failed inspection evidence; the clear quarter uses its own exact pair. The upslope fir camera stands inside the crown, not at a clean model profile.

All fourteen refreshed-shadow draw counts match. Submitted triangles increase with the added wood and changed canopy bounds. All 109,032 oriented fir foliage triangles retain exact complete attributes; shared atlas pixels and settings remain exact. Changed broadleaf shadows can alter fir frames, so pixel identity is not claimed.

All 1,098 outside-common meshes and five other geometry objects retain exact buffers, world transforms and material parameters. Non-foliage/non-tree-wood common triangle sets, field, placements, root contacts, obstacles and meadow remain exact. Every expanded canopy attribute word remains exact through indexing. Only common-view.js changes executable behaviour; 70 scripts and the portable shell stay exact.

| Common scene | 2.53.0 | 2.54.0 |
| --- | ---: | ---: |
| Mesh objects | 43 | 43 |
| Foliage batches | 26 | 26 |
| Materials | 21 | 21 |
| Foliage model triangles | 288,244 | 288,244 |
| All model triangles | 427,280 | 434,800 |
| Geometry capacity, bytes | 36,787,202 | 37,509,526 |
| Added textures/lights | 0 | 0 |

No foliage callback or attachment audit is added per frame. Startup reconstructs the additional branch curves and clusters. Existing 64-metre foliage partitioning and exact vertex indexing remain active. Counts do not establish a frame-time win.

## Verification and remaining criticism

```text
node tools/test.mjs
COMPLETE 570 system checks passed
node tools/build.mjs
PASS standalone: 71 scripts compile; no external scripts or stylesheets.
node tools/verify-branching-conservation.mjs
COMPLETE branching conservation
```

The [release record](../tools/out/branching-release.json), [construction proof](../tools/out/branching-conservation.json) and [current hardware profile](../tools/out/perf-branching-after/report.json) bind to the final portable SHA. The selector retains 56 dated reviews. Four six-second native windows at 1920 by 1080 retain the 60 Hz cap; final mean simulation plus rendering is 2.50 ms in the yard and 3.46 ms with four moving miner fixtures. All eight baseline/final profile frames were directly inspected. Sequential GPU queries under competing work do not prove quiet-machine FPS or a general speedup.

The crown still separates into tiers and clumps from the rear. Short angular joints, repeated shoot patterns, bare lower trunks and uniform species shape remain criticism. Fir tops, near needle cards, broad rock facets, carpet-like grass, empty hills and pristine repeated characters remain weak. Physical Firefox turning/strafing and separate-network co-op remain unverified. The last actual public-lobby audit is dated 2.51.1, with unchanged multiplayer source. Firefox delivery requests existing-session tabs without activation and does not certify foreground rendering or physical feel. The wider polish goal remains active.
