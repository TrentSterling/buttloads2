# Native creature construction, local 2.42.0

Cinder moths now have closed two-lobe wings, native wing spots, raised veins, antennae, six bent legs and a tapered segmented body. Shale crawlers have four overlapping stone plates, six attached bent legs, forked pincers, dark mandibles and a ribbed abdomen that remains visible when armour breaks. The existing wing/limb pivots, attack tells, damage, drops, movement and save state remain unchanged. This checkpoint continues the hard art request; it does not complete the broader goal.

The [23-slide review](../tools/out/creature-art-review.html) retains sixteen fixed baseline/final cameras and four rejected candidates. Actual production geometry appears in ten isolated studies and six native mine lifecycle views. The unchanged chambers and floor are sampled directly; deep chunks are built without excavation. Simulation is frozen and poses are assigned directly. These frames establish presentation and renderer submission counts, not gameplay traversal, network performance, physical input feel or quiet-machine FPS.

## Construction and cost

| Inventory | Before 2.41.1 | Final 2.42.0 |
| --- | --- | --- |
| One moth | 5 meshes / 148 triangles | 4 / 1,188 |
| One crawler | 20 meshes / 468 triangles | 20 / 1,484 |
| Complete moth scene including tells | 18 meshes / 1,404 triangles | 15 / 4,524 |
| Complete crawler scene including tells | 63 meshes / 2,364 triangles | 63 / 5,412 |
| Moth scene shadow casters | 3 | 3 |
| Crawler scene shadow casters | 51 | 51 |

The art removes three meshes and adds 6,168 model triangles across six creatures. It adds zero material objects, textures or lights. Existing opaque body pieces share meshes; each animated wing, leg and claw remains independent. The shell is a separate visibility boundary. Earlier freight, furnace, prop, common and supported-growth merging survives unchanged, including all 45 support cells.

Matched native moth views save one cached and one shadow-refresh draw, adding 1,040 and 2,216 submitted triangles respectively. The defeated moth camera retains identical submissions. The armoured crawler camera retains both draw counts and adds 1,016 cached / 1,664 refreshed-shadow triangles. Broken/dead cameras retain both draw counts and add 936 / 1,584 triangles. The other reported Claude GPU workload prevents a useful quiet-machine timing claim.

[Conservation](../tools/out/creature-art-conservation.json) compares the frozen 2.41.1 render sources with final production. Every other scene and tool geometry attribute, index, material, pose, visibility, shadow flag and light remains exact. Terrain, collision contacts, ore, economy, supported ownership/masks and anchors remain exact. Seven creature lifecycle fixtures retain the exact root, wing, body, rear, shell, leg, claw and tell transforms/visibility, and the existing eye/core emissive-intensity changes. Diffuse and emissive colours deliberately change with the art.

[Build comparison](../tools/out/creature-art-build-diff.json) identifies only a new creature geometry helper and the two creature render scripts. All other executable scripts, styles and markup remain exact except the version. The standalone compiles 71 executable scripts and retains protocol 3, room `ridge-common-v3` and slot `crew-global-v3`.

## Harsh critic passes

The first candidate had better silhouettes but pale wings and a peach blob under pale armour. It was rejected. Final materials explicitly convert their colours to linear space and the exposed crawler body gains segmented folds and mandibles. The second candidate's coordinate-only wing spots had no interior vertices and barely rendered; final spots use integrated closed patches with dark centres and pale rings.

The third candidate failed inspection because its crawler legs visibly floated beside the abdomen. It also failed the existing moth conservative-bounds check. Final limbs extend into the actual body through walking, attack windup and corpse compression, while wing dimensions shrink six percent within the unchanged hitbox. The failed [system log](../tools/out/system-creature-art-rejected-round-3.log) remains retained. A new attachment check casts against the real abdomen surface through the three relevant poses.

The fourth candidate dropped crawler limb/rear shadow flags and produced a false 17-draw shadow saving. It was rejected. Final models retain every original creature caster count. Moth consolidation gives the rebuilt body the original leg caster boundary; the body now casts its complete new anatomy. The former unshadowed native frame remains in the deck so the regression can be judged directly.

The capture's original crawler camera sat outside native air at the curved floor edge. Its measured field was -0.204056. The corrected camera remains in generated air, without carving a fixture room. [The rejected camera report](../tools/out/creature-art-before-rejected-camera/crawler-camera-report.json) remains available.

All sixteen baseline and sixteen final frames have been inspected. Final criticism remains: straight spar-like veins, heavy moth antennae, dominant eye glow, repeated moth outlines, regular crawler roof plates and ribs, needle feet, and the original simple joint gait. Wide mine views hide much of the close geometry detail. Native look/recovery prompts overlap part of the model; the studio views must not be mistaken for normal gameplay scale. These are reasons to continue the broader art/motion work.

## Verification and delivery scope

`node tools/test.mjs` ends with **COMPLETE 471 system checks passed** in [the retained log](../tools/out/system-creature-art.log). Five new checks validate closed consistently wound anatomy, FrontSide wings from above/below, animated hitbox fit and caster counts, real body/limb attachment, and disposal/portable reload. Existing combat and crawler gameplay suites also pass. [The final capture](../tools/out/creature-art-after/report.json) records sixteen matched native views, zero browser errors, zero held inputs and no pointer lock.

All 23 receipt slides render with decoded images, visible navigation, zero browser errors and no pointer lock. The hub retains 36 historical review sections. The guarded portable camera check preserves exact interpolated X, yaw and pitch on the RTX 5070 Ti. Firefox delivery uses existing-process tabs without activation; foreground visibility and physical mouse feel are unverified. Separate-network co-op is still unverified; earlier public Trystero evidence retains its 2.35.0 date.

The [inspection manifest](../tools/out/creature-art-inspection.json) records hashes for all 32 baseline/final native frames, 23 slide layouts, the hub and the portable build screenshot. Nine final studio images are byte-identical to previously inspected round-four images; all other final frames were inspected directly. It records selected rejected images rather than claiming every candidate frame was inspected. The [Firefox delivery receipt](../tools/out/creature-art-firefox.json) records the tested build and review URLs sent to the existing session on October 1, 2026.
