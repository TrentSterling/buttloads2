# Equipped weapon batching, local 2.47.1

Equipped miners now share compatible weapon submissions through instances of the actual posed pieces. Each miner retains independent weapon, attachment, core and fork transforms. Only clone geometry from the same source and template material joins a group. Shadow, layer, culling and draw-order boundaries remain separate. The independently charged sling core and translucent fields keep their native material and sorting paths.

| Static native fixture | Cached draws before / after | Shadow-refresh frame draws before / after | Added equipment matrix capacity |
| --- | ---: | ---: | ---: |
| One remote miner | 183 / 183 | 740 / 740 | 0 bytes |
| Two different weapons | 195 / 195 | 763 / 763 | 0 bytes |
| Four mixed weapons | 234 / 226 | 839 / 823 | 1,024 bytes |
| Eight mixed weapons | 300 / 265 | 967 / 897 | 4,480 bytes |
| Eight cutters | 302 / 225 | 971 / 817 | 5,632 bytes |
| Four differently charged slings | 238 / 211 | 847 / 793 | 2,304 bytes |

All fifteen paired capture reports retain exact submitted triangles in both main and refreshed-shadow frames, exact cameras and poses, original weapon allocation counts and original body batch statistics. Same-tool pairs save four to thirteen cached draws. The finite displaced shadow fixture retains all original mesh submissions; off-camera casters remain native. These are submission counts under the competing GPU workload, with no FPS claim.

The path adds instance mesh objects, per-piece camera/shadow sphere checks and dynamic matrix uploads. Eight cutters use eleven equipment instance objects and 5,632 matrix bytes. The authored clone meshes and materials remain allocated. Equipment changes clear borrowed body/equipment batches before disposing owned materials, then rebuild membership. The existing body pose/world-matrix update and frusta are shared by both submission paths. The implementation still assumes the current single shadow-casting sun.

No model geometry, textures or lights are changed. All 71 portable scripts compile; only `src/crew-view.js` changes executable code. The complete `renderCrew` animation method remains exact. Source comparison preserves the tool/miner factories, first-person controller/input, HUD, Trystero and save code. `node tools/test.mjs` ends with **COMPLETE 534 system checks passed** in [the full log](../tools/out/crew-equipment-suite.log). Eight new pure-system regressions cover all seven tools at multiple pitches and motion samples, mixed attachments, native culling, independent charges, fallbacks, equip/departure, reduced motion and world installation. The new equipment regression fails on frozen 2.47.0.

All thirty final before/after native PNGs were individually inspected. Every equipped weapon and grip remains visible; names, field effects, charge cores, clothing colours and shadows survive. The decoded comparison reports zero to nineteen changed pixels out of 1,440,000 per view. Three views are pixel-identical. Other differences stay at sparse equipment edges or one-step native canvas pixels; broad visual loss was not observed.

The [eighteen-slide review](../tools/out/crew-equipment-review.html) links all raw comparisons, builds, source conservation, regression evidence, pixel counts and the [inspection manifest](../tools/out/crew-equipment-inspection.json). The [current receipt hub](../tools/out/current-review.html) retains prior dated art, input, networking and performance evidence.

Preservation does not accept the existing hard art. The miner posture remains stiff, face and shoulder/chest anatomy repeat, names are small, clean metal lacks wear, and the crowded eight-miner row occludes rear players. Ground texture and soft shadows remain weak. Physical Firefox input, quiet-machine CPU/GPU timing, separate-network co-op and wider art/motion remain open. This is a local progress checkpoint with no commit, push or deployment.

Final receipt review: all eighteen rendered slides, the 47-section hub and the current portable build frame were personally inspected. Together with the thirty native comparison frames, the inspection manifest covers fifty final files. Guarded static rendering reports no console errors, overflow or pointer lock.

The completed receipt and build URLs were sent to the existing Firefox using its hidden new-tab launcher at 2026-10-02T01:36:40.2312859Z. No window activation, pointer input or foreground observation was used.
