# Mechanical attachment reconstruction, local 2.47.0

The scoop now has a curved solid floor, fitted underside plate ribs, closed side plates and tapered replaceable teeth. The lance has a hollow stepped housing, thicker collars and a continuous tapered striker. The resonator has a continuous copper winding, a visible centre and a hollow front guard. The production models also appear on crew weapons.

| Model inventory | Before meshes / triangles | After meshes / triangles |
| --- | ---: | ---: |
| Scoop | 6 / 3,244 | 4 / 1,816 |
| Lance, including moving striker | 6 / 420 | 5 / 1,608 |
| Moving striker alone | 2 / 108 | 2 / 624 |
| Resonator | 5 / 3,288 | 5 / 2,632 |
| Entire mechanical tool, including inactive heads | 31 / 22,922 | 28 / 22,026 |

The combined inventory removes three meshes and 896 triangles. The lance adds 1,188 triangles; the scoop and resonator savings exceed that cost. Material objects across all four weapon roots fall from 23 to 18 by using existing kit materials. Geometry arrays fall from 2,414,490 to 2,366,266 bytes. No textures or lights are added. These are counts, with no FPS claim under the competing GPU workload.

| Matched native equipment | Cached draws before / after | Shadow refresh draws before / after | Triangle change per frame |
| --- | ---: | ---: | ---: |
| Scoop | 234 / 232 | 728 / 726 | -1,428 |
| Lance | 234 / 233 | 728 / 727 | +1,188 |
| Resonator | 233 / 233 | 727 / 727 | -656 |
| Cutter | 231 / 231 | 725 / 725 | 0 |

Only `src/mining-view.js` and `src/tool-art.js` differ from frozen 2.46.0. All 71 portable scripts compile. Contact marks and the complete `renderMining` method remain exact. The conservation check preserves 1,204 other mesh records, including the cutter, auger, first-person hand, needle and other weapons. Attributes, indices, materials, render flags, transforms, terrain, contacts, ore, economy and lights match exactly. All 32 paired camera reports match; native tool, scoop, striker, rotor, needle and resonator poses also match.

`node tools/test.mjs` completes with **526 system checks passed**. Seven new regressions check solid closure, outward winding, finite normals/UVs/bounds, inside/outside physical faces, ribs below the interior, full scoop/striker cycles and the combined inventory budget. Existing tests retain all seven weapon grips at three pitches and current crew batching.

All 64 final baseline/current PNGs were inspected individually. Twelve enlarged equipment views use the actual production models and identical neutral lighting. Nine enlarged crew views cover all seven weapons and cutter aim extremes. Eleven native views include every first-person tool, active scoop/lance states, a rotating resonator and the original cave/cutter frame. Side/underside studies focus on attachments and crop parts of the rear assembly; quarter views retain the complete tool. No input events, pointer lock, gameplay traversal or public transport run occurs in this capture.

The first candidate is rejected and retained. Its shell offset went toward the interior, causing the ribs to show through. Flat strip normals made a visible ladder, and a narrow cheek bevel failed welded closure. The corrected offset puts thickness outside the bucket; continuous floor normals and plain closed cheek plates resolve those failures. A separate verification assertion incorrectly required the hidden cutter rotor to turn during resonance. Both builds intentionally animate the resonator head instead; that assertion was corrected without changing production motion.

The [twenty-slide review](../tools/out/attachment-art-review.html) retains native comparisons, all seven crew tools, the rejected scoop, cost tradeoffs and criticism. Its raw links include all 32 pairs, frozen builds/sources, reports, tests and the [inspection manifest](../tools/out/attachment-art-inspection.json). The [current hub](../tools/out/current-review.html) retains 46 dated receipt sections. All twenty rendered slides, the hub and the static portable-build frame were also individually inspected, bringing the final inspection manifest to 86 files. Guarded rendering reports zero errors and no pointer lock. The 2.47.0 build and receipts URLs were sent to the existing Firefox through a hidden new-tab launcher; no foreground observation or physical input test is claimed.

The finished hard-art standard still fails. Steel panels lack wear and dirt, the teeth and pins repeat regularly, side plates have sharp edges, the lance point looks fragile, and its rails remain plain. Coil terminations are abrupt and the emissive rims remain pale. The miner keeps the same stiff posture, broad shoulders and repeated face. The unchanged cave still shows thin shelves and floating-looking clutter. Physical Firefox input, quiet-machine timing, separate-network co-op and wider art/motion remain open. This is a local progress checkpoint; no commit, push or deployment is included.

Final portable SHA-256: `93bfb3ab00bdd194ec75f1a8c1cc099389246472a709668f62152df16cc6df5b`.
