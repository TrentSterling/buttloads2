# Miner travel, 2.64.0

Remote miners ride higher during ordinary travel, turn their lower body partly toward sideways steps and recover their feet after reversing or stopping. The torso keeps carrying the aimed tool. This changes only `poseMinerTravel`; first-person input, controller, networking, geometry, materials and batching sources stay exact.

## Evidence

`node tools/test.mjs` ends with `COMPLETE 606 system checks passed`. The added movement check observes actual sole transforms through 24 start/reversal/stop traces: both starting directions, 0.5/1.5/3.8/6 m/s and 30/60/144 Hz. It rejects boot overlap, unsupported rotation, unreachable feet, unfinished stops and retained wide rest stances. Existing planting, terrain, shadow, reload, reduced-motion, ownership and all-seven-tool carry checks remain.

Thirty flat-rig comparisons retain 7,200 frames against the frozen released 2.63.0 source. At 3.8 m/s:

| Observation | 2.63.0 | 2.64.0 |
| --- | ---: | ---: |
| Forward mean hip height | 0.806 m | 0.843 m |
| Forward minimum hip height | 0.787 m | 0.787 m |
| Forward maximum knee bend | 85.79 degrees | 75.59 degrees |
| Right strafe mean hip height | 0.798 m | 0.838 m |
| Right strafe minimum hip height | 0.746 m | 0.756 m |
| Right strafe fore/aft boot separation | 0.50 m | 0.42 m |
| Right strafe maximum lateral separation | 0.855 m | 0.855 m |

Both versions retain planted support and floating-point-level reach error in these steady traces. These measurements establish a higher average pose, not a narrower lateral stride or a universal intersection verdict.

The [eight-slide review](../tools/out/miner-travel-review.html) contains 43 matched native pairs: front/side walking, strafing, forward stop, strafe reversal, strafe stop and all seven firing tools. All 86 final PNGs have exact inspection provenance: 68 fresh direct views and 18 exact-hash inherited views from the retained recorder rejection. Only matching pixel-file hashes inherit inspection. Three motion sequences retain eight samples at 50 ms intervals through a full step cycle. Playback pauses before resetting the samples; it is recorded evidence, not live timing. The fixture hides the local HUD and weapon to expose the remote rig. Cameras, authoritative supported capsules and root traces match. Native grips stay within 25 mm, soles remain level and reach within 5 mm, and final stop samples are settled. Raw per-frame draw and triangle observations remain in [conservation](../tools/out/miner-travel-conservation.json).

## Construction and cost

The lateral stance survives an immediate reversal so two supported boots do not exchange fore/aft lanes. A lifted foot replans when travel reverses. Sole yaw changes during lift and remains fixed during support. Stopping turns boots in their existing lanes, then recovers one foot at a time with reachable clearance from the support foot. The pelvis continues to yield to the actual leg reach.

No mesh, source triangle, material, texture or light is added. All non-travel crew functions remain exact. The existing articulated garment shaders and compatible body/equipment submissions remain. Added scalar state tracks lower-body yaw, lateral stance and lifted-foot landing direction/time. Additional trigonometry, replanning and recovery support queries have CPU costs. No new quiet-machine timing or FPS improvement is claimed. The earlier 2.63.0 inventory remains dated evidence of unchanged construction: 42 meshes, 30,502 model triangles, 1,565,988 geometry bytes, 27 main and 51 total owned materials, and one existing 256-square atlas per worker.

## Rejections and criticism

Initial foot lanes failed clearance. Later revisions exposed supported soles twisting, stale forward landing targets after reversal, endless rest recovery, an outward step beyond leg reach, and a late stop collision at 144 Hz. The tests remain stricter than the original suite. The retained [first trial](../tools/out/miner-travel-trial-1/report.json) and [second trial](../tools/out/miner-travel-trial-2/report.json) each have sixteen captures; only their side/strafe frame 84 images were directly viewed. Those stills do not establish the later reversal defects; the actual failed tests did. A third recorder rejection invoked travel again at zero time, resetting torso sway. Its 38 directly viewed frames and both complete capture sets are preserved in `miner-travel-observation-rejected.json`; the corrected recorder freezes the last moving travel pose for presentation renders. Only exact PNG hashes can inherit a prior inspection.

The improvement is modest during forward travel and clearer in lateral leg alignment. Long support steps still compress the pelvis; minimum forward height does not improve. Strafe-stop frame 132 remains deeply crouched. Recovery can take several small marching steps and lacks natural weight transfer. Lateral stride width remains broad. Smooth repeated anatomy, fixed glove curl, clean clothing/leather, deep-bend boot sculpt, sparse hills and larger environment composition remain open. Further isolated centimetre or tint iterations have diminishing returns.

Physical Firefox mouse feel, quiet-machine performance and separate-network co-op acceptance remain unverified. Local native fixtures are inert targets, not new live clients; the last actual global-lobby audit remains 2.51.1. Normal Firefox tab requests do not prove foreground visibility or human feel. The broader polish goal remains active.

## Reproduction and delivery

Run `node tools/test-miner-motion.mjs`, `node tools/test-miner-carry.mjs`, `node tools/miner-travel-metrics.mjs`, `node tools/test.mjs` and `node tools/build.mjs`. The guarded native capture uses the protected released baseline and current portable build: `node tools/miner-travel-capture.mjs before` and `node tools/miner-travel-capture.mjs after`. Conservation and static slideshow validation are `node tools/verify-miner-travel.mjs` and `node tools/verify-miner-travel-review.mjs`. No OS input, browser activation or pointer lock is used.

Shipment binds the successful current Pages head, root and all 72 public assets, actual portable ZIP entries and guarded public idle observation in [the release record](../tools/out/miner-travel-shipment.json). The current receipts hub retains all 66 dated sections.
