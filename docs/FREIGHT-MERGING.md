# Freight and creature rigid merging, local 2.39.1

Trent reports that another workload still hammers his GPU. This checkpoint reduces render submissions and keeps model geometry exact. Quiet-machine CPU/GPU timing and net frame-rate gains remain unmeasured.

| Root | Before meshes | Final meshes | Model triangles |
| --- | ---: | ---: | ---: |
| Freight rail (including trolley) | 71 | 9 | 868 |
| Cargo cage (including cargo instance) | 18 | 3 | 240 |
| Loading dock | 5 | 4 | 86 |
| Rescue bell (including resident) | 61 | 56 | 10,454 |
| Crawlers and tells | 75 | 63 | 2,364 |
| Moths and tells | 24 | 18 | 1,404 |

The six measured roots remove **101 meshes**, retaining all 15,416 model triangles and 34,965 vertex records. The [conservation verifier](../tools/verify-freight-merge.mjs) compares every oriented triangle, position, normal, UV and material/shadow/layer state against frozen construction. Maximum attribute difference is 2.3841858e-7; terrain, contact boxes and economy remain exact. The [raw result](../tools/out/freight-merge-conservation.json) records source hashes and the complete inventory.

The trolley, moving cage/dock, cargo instances, indicator lens, resident, transparent glazing, cables, crawler limbs/body/rear and moth wings retain independent identities. Both crane spans, travel and load changes, mutable cables, hoist/glass/resident behavior, broken armour, corpse compression and independent wings pass four new behavior regressions. Full validation ends with `COMPLETE 455 system checks passed` in [the log](../tools/out/system-freight-merge.log). Final targeted checks and conservation run after the seam correction.

Two matched whole-game crane cameras measure cached draws **129 to 103** and **156 to 113**. Shadow-refresh draws decrease **720 to 611** and **747 to 621**. Broader bounds add 432 and 228 submitted triangles respectively, with the same model geometry. The isolated rail scene admits 144 more shadow triangles; its draw reduction alone does not establish a GPU time saving. Native inventory includes currently hidden objects and unused cargo geometry, whereas rendered counts follow actual visibility and instance counts.

Eight before/after cameras retain fixed seed 260923, time, geometry and lighting. Their final pixel comparisons range from 3 to 131 changed pixels in each 1,440,000-pixel image. All sixteen final frames were visually inspected, including byte-identical recaptures of previously inspected frames. [Before](../tools/out/freight-merge-before/report.json), [after](../tools/out/freight-merge-after/report.json) and [numeric pixel comparison](../tools/out/freight-merge-pixels.json) preserve the measurements. These are guarded static render fixtures with direct state assignment, without dispatched events, OS input or pointer lock.

The review rejects two problems rather than hiding them:

- Oversized studio shadow bounds cause diagonal self-shadow hatching on compact cage pieces. Tighter bounds correct the fixture. The [original baseline](../tools/out/freight-merge-before-shadow-reject/report.json) and [original candidate](../tools/out/freight-merge-after-shadow-reject/report.json) remain available; this changes the capture fixture rather than production lighting.
- The initial 106-mesh saving introduces visible speckling at an existing coplanar rescue joint. Keeping six intersecting pieces with their original GPU transforms reduces the saving to 101; the rescue comparison improves from 477 to 41 changed pixels. The [rejected candidate](../tools/out/freight-merge-after-joint-reject/report.json) remains in the deck.

The [eleven-slide review](../tools/out/freight-merge-review.html) leads the [thirty-section receipt hub](../tools/out/current-review.html). The current portable release compiles 69 scripts and retains crew protocol/default room/save v3. Camera and deck validation use guarded headless observation. The build and hub are sent to the existing Firefox instance without requesting window activation; physical Firefox rendering, foreground visibility and mouse feel remain unverified.

The native critic still finds simple crane/cage boxes, a blocky crawler, paper-thin moth wings and broad bare yard terrain. Existing spatial foliage/perimeter/ground-cover batches retain their bounds. Terrain chunks, independently excavated supports, transparency and moving model branches remain separate. This checkpoint does not finish the hard art work, quiet-machine profiling, physical input review or separate-network co-op test. Earlier public Trystero evidence retains its date. No commit, push or deployment is part of this checkpoint.
