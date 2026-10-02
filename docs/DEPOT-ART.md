# Depot art, local 2.30.0

The working shed remained a dark weatherboard rectangle beneath a broad solid awning. Its hanging tools repeated one circle-headed shape, stock repeated the same boxes, and stretched timber relief looked coarse near the counter. This pass changes the actual construction and props. Sun direction, tone mapping, exposure, HUD and controller retain their 2.29.3 behavior.

Two framed glazed openings replace parts of the corrugated roof. The glazing follows its slope and stays out of the shadow pass; framing and exposed rafters cast real shadows into the work area. The work recess loses its low solid lid. Sage paint, restrained warm timber, grain projected along each piece's long axis and reduced bump relief make shaded construction readable.

The pegboard holds an open spanner, claw hammer, pliers, hand brace and hacksaw. Upper stock includes an oil can, paper roll and coiled cable. A deep cabinet breaks the facade beside the hopper: shelves, side returns, ceiling, eight named hardware bins and formed calibration weights. Its labels share an original canvas atlas. The claim plaque moves above it. Existing counters, hopper, ore pile, crane and gameplay services remain.

The [nine-slide review](../tools/out/depot-art-review.html) contains six matched native game comparisons and two rejected rounds. All twelve baseline/release frames were visually inspected: seed 260923, 1440 × 1000, fixed walking-height poses and motion, isolated headless RTX 5070 Ti. No OS/browser input events, foreground activation or pointer lock are used. The pre-navigation guard stays enabled. [Baseline](../tools/out/depot-before-final/report.json) and [release](../tools/out/depot-release/report.json) retain identical camera transforms, collision tuples and terrain-byte fingerprints.

The [first round](../tools/out/depot-round-1/report.json) was rejected after inspecting all five views: glazing tilted against the roof, cladding covered part of the hatch, grain was excessive and the spanner resembled a hook. The next revision corrects those issues, but its close cabinet frame exposes a sky strip above the backboard and plain cylinder weights. That [second rejected build](../tools/out/depot-final/report.json) and source remain. The accepted candidate is depot-release. Its cabinet ceiling/returns close the gap, its labels name real hardware, and its weights have formed bodies and lifting rings. Intermediate directory names and version numbers do not identify final geometry.

The depot group increases from 103,648 to 120,984 triangles and from 30 to 32 material batches. Its light count stays one. Both panes merge into one non-shadow-casting batch; maximum roof-plane deviation is 0.00000546 m. New detail stays within the existing depot volume, so host/guest contact, approaches and room/save/protocol v3 stay intact.

`COMPLETE 423 system checks passed` is retained in [the final full log](../tools/out/system-depot-art.log). The earlier suite completed during the cabinet revision; its [pre-final log](../tools/out/system-depot-art-pre-final.log) remains separate. A fresh complete run then uses final sources. The art harness also verifies 21 grip poses and 26 miner grounding checks. Structural checks do not approve the artwork.

Final paired profiles run sequentially after the suite: 100 warm frames, six seconds per scene, 1920 × 1080, pixel ratio one, RTX 5070 Ti. [Repeated baseline](../tools/out/perf-depot-baseline-repeat/report.json) and [repeated release](../tools/out/perf-depot-release-repeat/report.json) retain all four scenes, raw CPU/GPU values and build hashes.

| Scene | Frame p95 before / after | Render CPU p95 before / after | GPU median before / after | Maximum frame before / after |
| --- | --- | --- | --- | --- |
| Yard | 16.8 / 16.8 ms | 4.4 / 4.3 ms | 2.64 / 3.56 ms | 16.9 / 16.8 ms |
| Four animated miners | 16.8 / 16.8 ms | 6.1 / 6.2 ms | 13.44 / 13.28 ms | 16.8 / 17.1 ms |
| Mine | 16.8 / 16.8 ms | 3.9 / 4.4 ms | 13.62 / 13.11 ms | 16.9 / 16.9 ms |
| Cutting | 16.8 / 16.8 ms | 4.7 / 5.1 ms | 3.06 / 3.00 ms | 16.9 / 16.8 ms |

Yard draws increase from 108 to 110 and drawn triangles from 539,085 to 556,901. The four-miner median similarly adds two draws and 17,816 triangles; shadow-refresh frames vary. Mine draws/triangles stay identical; cutting keeps 303 draws and nearly identical triangles. CPU/GPU values vary even in scenes with unchanged visible geometry. The yard GPU median increases in this pair; timing causation remains uncertain.

Trent subsequently reported that Qwen audio generation was heavily loading this machine and that he had not tried the mouse changes. Exact overlap with the profile windows was not recorded. These timing observations do not establish quiet-machine rendering cost or physical mouse feel. Geometry and draw counts remain directly measured; preserve timing data with this workload limitation.

Earlier profiles remain as [baseline](../tools/out/perf-depot-before/report.json), [second modeling revision](../tools/out/perf-depot-after/report.json) and [release during system tests](../tools/out/perf-depot-release/report.json). The first baseline command included an unsupported `--cases` argument; it actually sampled all four default scenes. Later pairs intentionally use those same scenes. Higher and varying CPU values justified the sequential repeat. Six-second samples do not replace the preceding 30-second hitch investigation.

The standalone compiles 65 scripts. Release SHA256: `4a8001b83b588cfebd1789002a268acdf96d16796e0b7966cf46415853add1af`. Baseline: `2495b1b726ba979281f1c207e1346f4b575b7f50aadf85f7b7a2afbff38d27fe`. The receipt builder rejects changed builds, mismatched cameras, changed collision/terrain, invalid glass or missing final system proof. [Guarded camera verification](../tools/out/movement-build-2.30.0-report.json) checks translation and aim; [deck verification](../tools/out/depot-art-review-report.json) records decoded images, visible navigation and no pointer lock. The Qwen workload note was added after the deck rendering check; its timings and native images are unchanged.

Critic verdict: more depth, readable construction and distinct equipment, with rejected cabinet and grain defects corrected. The scene remains simple. Bins and shelf arrangements are regular, back panels are broad, the rear eave opening is visible, and the toolbox hides some tools at certain angles. Foliage, rock facets, garden borders, other shop interiors and distant cliffs still need work. Physical Firefox mouse feel, separate-network co-op and intermittent scheduling remain unverified. Public global-room proof retains its 2.29.2 date; this pass claims no new public gameplay run. No push or deployment. The broader goal remains active.
