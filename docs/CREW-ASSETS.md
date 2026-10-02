# Remote weapon ownership, local 2.47.2

Remote equipment now clones the common casing and the equipped attachment. Local first-person gloves and unused mechanical heads are omitted before cloning. Static materials and all geometry are borrowed from the existing template. The independently charged sling core retains its own material; each miner still owns its weapon transforms, grip, forks and field materials.

| Fixture | Weapon meshes before / after | Owned weapon materials before / after | Weapon hierarchy nodes before / after |
| --- | ---: | ---: | ---: |
| One cutter | 28 / 11 | 28 / 0 | 36 / 14 |
| Eight cutters | 224 / 88 | 224 / 0 | 288 / 112 |
| Eight mixed weapons | 171 / 82 | 171 / 1 | 223 / 107 |
| Four differently charged slings | 52 / 40 | 52 / 4 | 72 / 56 |

Eight cutters retain 88 batching candidates instead of 224. The original first-person model, all source geometry and textures, and previous instance buffers remain allocated. This removes hidden objects from world-matrix traversal and batch eligibility checks and avoids redundant material construction/disposal. It does not remove submitted triangles or add further draw savings. Current native cached/refreshed counts remain 225/817 with eight cutters and 265/897 with eight mixed weapons. Quiet-machine CPU/GPU timing must establish the net performance gain.

All fifteen matched native reports retain exact cameras, visible model poses, draw and triangle counts, and body/equipment instance statistics. Hidden inactive-head poses are intentionally omitted from the remote hierarchy. All thirty final native frames were personally inspected, covering all seven weapon types, different charges, off-camera casters and the displaced finite shadow frustum. Ten decoded pairs are pixel-identical; five differ at only one or two edge pixels out of 1,440,000.

`node tools/test.mjs` ends with **COMPLETE 540 system checks passed** in [the full log](../tools/out/crew-assets-suite.log). Six new checks exercise selective construction, exact borrowed materials/geometry, independent charges, all tool switches, disposal ordering, stable equip ownership, grip endpoints and portable world replacement. The new hidden-branch regression fails on frozen 2.47.1. Only `equipMiner` and version metadata change executable behavior. All 71 scripts compile; the complete crew animation, first-person controller/input, networking, saves and art factories remain exact.

The [five-slide review](../tools/out/crew-assets-review.html) links all fifteen raw pairs, both builds, source conservation, failing regression evidence and the [inspection manifest](../tools/out/crew-assets-inspection.json). The [current hub](../tools/out/current-review.html) retains preceding dated evidence.

The art verdict remains open: stiff posture, repeated facial and shoulder/chest forms, clean equipment metal, weak ground texture and rear-miner occlusion survive this cleanup. After discussing diminishing returns, Trent chose continued polishing. The next substantive target is character motion and larger visible art weaknesses. Physical Firefox turning/strafing, quiet-machine timing and separate-network co-op remain unverified. This is a local progress checkpoint; the full improvement goal remains active.

Final static review: all five slides, the 48-section hub and the portable build frame were personally inspected. The inspection manifest covers 37 final files. Guarded rendering reports no console errors, overflow or pointer lock.

The receipt and build URLs were sent to the existing Firefox at 2026-10-02T02:08:06.8760120Z using the hidden new-tab launcher. No activation, pointer input or foreground observation was used.
