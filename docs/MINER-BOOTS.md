# Articulated miner boots, 2.62.0

The exposed flat caps are replaced with a hollow boot upper. The rim follows the shin and the toe follows the planted foot. Laces and eyelets share the upper's deformation and material; four body meshes are removed per worker. The shortened trouser hem ends inside the shaft. Treads are clipped to the existing heel and toe widths.

The full improved head, shirt collar, sleeves, gloves, knee equipment and carry anchors remain exact. Only `src/miner-art.js` changes executable behaviour versus 2.61.0; the other 70 standalone scripts remain exact. Networking, controller, tools, lighting and the existing atlas are unchanged.

## Evidence

`node tools/test.mjs` ends with `COMPLETE 605 system checks passed`. Six new checks cover the actual closed hollow shell, production shell records, separate foot/rim anchors, 432 actual hem ray intersections, 2,400 native walking/sprinting gait frames, positive local deformation, all three shader passes and 36 conserved body meshes. The minimum sampled local deformation determinant is 0.212582868. Local positivity does not prove absence of global self-intersections.

[The ten-slide review](../tools/out/miner-boots-review.html) covers 29 final matched native pairs. All 58 final images were individually viewed in this pass. Cameras and complete rig traces match. It retains two rejected deep-bend constructions, all seven carried and first-person weapons, native travel, explicit costs and harsh criticism. It leads the 64-section dated [receipt hub](../tools/out/current-review.html).

[The hash-bound proof](../tools/out/miner-boots-conservation.json) binds the exact released 2.61.0 portable, current 2.62.0 portable, source conservation, math, captures, pixels and suite output. Reproduce with `node tools/verify-miner-boots.mjs`; static slide verification is `node tools/verify-miner-boots-review.mjs` with the existing pre-navigation input/focus guards intact.

## Costs

| Per worker | 2.61.0 | 2.62.0 | Change |
| --- | ---: | ---: | ---: |
| Body meshes | 48 | 44 | -4 |
| Model triangles | 28,934 | 30,518 | +1,584 |
| Geometry bytes | 1,495,764 | 1,565,348 | +69,584 |
| Main materials | 25 | 27 | +2 |
| Owned surface/shadow materials | 45 | 51 | +6 |
| Textures | 1 | 1 | 0 |

Four independently posed local miners, with refreshed shadows, use 1,162 native calls versus 832 instanced calls. Both submit 1,894,344 triangles. The equivalent prior fixture used 1,194 and 840 calls with 1,881,672 triangles. Current native/instanced PNGs differ at 177 pixels with maximum channel difference 36. These are actual GPU submissions from fixed local rigs, not newly connected clients.

Four-miner instance/quaternion storage falls by 896 bytes to 12,160. Quaternion storage rises from 768 to 896 bytes. Owned cloned joint geometry rises by 140,016 bytes to 388,704. The two additional ankle joint shaders add work. Reduced submissions cannot establish an FPS improvement; no timing profile was run for this release. Eyelets share the leather response through vertex colours, trading the separate metallic response for fewer meshes.

All first-person cameras and submissions match. Cutter, lance and sling PNGs are identical. Scoop, heart and axe differ at 12 or 13 pixels by at most one channel level. Resonance differs at 103 pixels, maximum channel 50, with 23 pixels above one level in the coil region. Tool geometry and source remain exact; the raster cause is unassigned. No blanket pixel-identity claim.

## Harsh verdict

Accept removal of detached caps and the corrected shin attachment. Deep bends still look too soft, with a broad curved hood, a large dark opening under the rolled rim and crowded or obscured laces. Neutral leather remains pristine, the bright toe outline is rigid, and the thick sole is simplified. This does not finish the boots or whole character.

Smooth anatomy, toy-like face surfaces, primitive ears, fixed glove curl, repeated clothing and wide crouched strafe remain. Physical Firefox turning/strafing, quiet-machine timing and separate-network co-op are unverified. Last actual public-lobby audit remains 2.51.1; networking source stays exact.

The [shipment record](../tools/out/miner-boots-shipment.json) must bind the successful current Pages head, all 72 matching public assets, exact portable and actual ZIP entries, public idle observation and normal Firefox tab requests. URL requests cannot certify foreground visibility or physical feel. The broader polish goal remains active.
