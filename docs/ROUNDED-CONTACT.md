# Rounded obstacle contact, local 2.43.3

The old obstacle test expanded each box as a square footprint. A capsule grazing a post or workbench corner stopped against that expansion instead of bending around the physical corner. Adjoining boxes with a 1 mm offset could stall most of a two-second wall-slide replay.

The obstacle test now uses the round horizontal footprint. Contact selects the earliest face or corner entry along the movement segment, including curved normals, instead of whichever expanded box appears first. Shallow corner overlaps can use a short radial recovery, checked against the whole obstacle set. Flat-face contacts take a direct path; corner contacts add quadratic work when a blocked movement needs its normal. This is a contact correction, with no measured CPU/FPS saving.

The twelve 120 Hz seam replays retain zero stopped presentation frames after the change. Four previously snagged:

| Joint width / offset | Stopped frames before | After | Lowest after tangent speed |
|---|---:|---:|---:|
| 1 m / +1 mm | 207 | 0 | 2.625 m/s |
| 1 m / -1 mm | 163 | 0 | 2.647 m/s |
| 2 m / +1 mm | 118 | 0 | 2.627 m/s |
| 2 m / -1 mm | 207 | 0 | 2.647 m/s |

Across all twelve cases the slowest tangent is 2.621 m/s, against a flat-wall tangent of 2.687 m/s. All four flush-joint traces stay exact. Eight presentation cadences from 30 to 240 Hz keep continuous travel and matching final camera positions. This is deterministic controller evidence, not actual Firefox event delivery or frame timing.

The actual native depot post and workshop corner also reproduce the snag. After 72 identical controller ticks, the post route reaches z = 17.439 m instead of remaining at 15.890 m; the workshop route reaches 17.382 m instead of 16.300 m. Their different cameras in the [seven-slide review](../tools/out/corner-slide-review.html) represent the corrected route. Two unaffected native routes retain exact capsule/camera/render submissions: straight post clearance is pixel-exact, while yard strafe differs by two pixels at a maximum colour-channel difference of one. All eight native frames are inspected.

Actual Crew host-remote and guest-prediction methods match local traces for both native corners, with inert transport and a fixed 120 Hz cadence. Use the current build on peers for matching contact prediction. Room v3, wire formats, saves and Trystero remain unchanged; this is not a new public connection or separate-network test.

`COMPLETE 495 system checks passed`. Seven new obstacle checks fail six contracts against frozen 2.43.2 and preserve the closed-corner safety contract. They cover footprint/corner/roof solidity, twelve seams, eight cadences, obstacle ordering, radial recovery, ceilings/thin walls/moving contacts and native routes. Existing wall tests also assert the side-face constraint throughout travel before allowing the capsule to turn around the wall's end. Contact-window conservation compares the current narrow phase against a current controller without its window, retaining exact travel and lower box reads. Historical 2.42.1 conservation receipts remain frozen.

The complete fresh fossil campaign passes at 532.9 simulated seconds, including upgrades, machinery, heart/geodes, fossil study/recovery, ember reload, Nell and purchased living lenses. The pilot knows objective coordinates, so this proves campaign reachability rather than human pacing or fun.

The first endpoint-normal candidate still dipped to 0.074 m/s at a flush join and was rejected. Its frozen source/replay and the second candidate's slow contact metrics remain in the receipts. The accepted normals use segment entry, preserving flat-wall traces.

Portable comparison changes only Player obstacle footprint/contact/recovery plus version metadata. Camera reads, look handling, travel integrator/speed tuning, terrain contacts, contact window and Cutter method sources remain exact; every other executable script and HTML/style outside version metadata remains exact. Prior art, mesh savings and HUD-write removal remain in the build.

Raw evidence: [traces](../tools/out/corner-slide-report.json), [native baseline](../tools/out/corner-slide-before/capture.json), [native release](../tools/out/corner-slide-after/capture.json), [source scope](../tools/out/corner-slide-build-diff.json), [co-op roles](../tools/out/corner-slide-coop.json), [full suite](../tools/out/corner-slide-suite.log), [targeted strengthened checks](../tools/out/corner-slide-targeted-final.log), [campaign](../tools/out/corner-slide-journey.json), [campaign log](../tools/out/corner-slide-journey.log), [rejected first candidate](../tools/out/corner-slide-rejected.json), [second candidate metrics](../tools/out/corner-slide-round-2.json), [baseline failures](../tools/out/corner-slide-before-contracts.log) and [preserved pixels](../tools/out/corner-slide-preserved-pixels.json).

Broad flat boards, uniform pavement, faceted cutter fins and the centre mouse-look hint remain visible. Quiet-machine frame time, physical Firefox turning/strafing, separate-network co-op and wider hard art/movement remain open. This fixes reproduced obstacle snags without establishing the cause of the physical mouse-input complaint. The broad improvement goal remains active.
