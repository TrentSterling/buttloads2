# Buttloads 2: remake direction

## Miner garments, 2.49.0

The latest [miner garment correction](MINER-GARMENTS.md) closes bent knee and elbow gaps, replaces exposed solid strap caps with hollow bands, and fits a curved bib to the chest. All 556 system checks pass. Twenty-nine matched pairs retain exact cameras and rig poses; all 58 final frames were inspected. The first candidate failed visual inspection and remains in the nine-slide review. The same 52 body meshes, 15 materials and one texture add 1,816 model triangles and 30,640 geometry bytes. Native game draws match; two knee profile stress views add one draw. Only miner-art.js changes executable behavior. The review leads the 50-section hub. Pristine cloth, repeated anatomy, restrained upper body, quiet-machine timing, physical Firefox feel and separate-network co-op remain open.

## Remote miner gait, 2.48.0

Boots plant in world space, knees reach support and the torso carries each equipped weapon through the step. Stopping settles both feet and terrain edits refresh support without restarting the gait. All 551 system checks pass. Thirty-nine matched native pairs preserve cameras, authoritative capsules, roots, source geometry, draws and triangles; all 78 final frames were inspected. [MINER-MOTION.md](MINER-MOTION.md) retains rejected opening/ledge/strafe revisions and added CPU work. Knee caps, repeated anatomy, wide crouched strafe and clean clothing still need art work. Timing and physical Firefox feel remain unverified.

## Remote weapon ownership, local 2.47.2

Only the equipped attachment and common casing are cloned; local gloves and unused heads are omitted. Static template materials are borrowed while charged sling cores retain owned clones. Eight cutters remove 136 hidden meshes and 224 owned material clones, with unchanged native draws, triangles and instance counts. All 540 checks pass and all thirty matched frames were inspected. See [CREW-ASSETS.md](CREW-ASSETS.md). Timing and physical Firefox feel remain unverified; the next substantive target is character motion and larger visible art weaknesses.

## Equipped weapon batching, local 2.47.1

Compatible posed weapon pieces now share submissions across miners. Eight mixed weapons drop from 300 to 265 cached draws, while eight cutters drop from 302 to 225; their refreshed-shadow frames save 70 and 154 draws. All fifteen paired reports retain exact cameras, poses, triangles, weapon allocation counts and prior body batches. All 534 system checks pass. Thirty final native frames were inspected, including all seven weapons and charge/culling boundaries. The decoded comparison changes at most nineteen pixels per 1,440,000-pixel frame. [CREW-EQUIPMENT.md](CREW-EQUIPMENT.md) records the eighteen-slide receipts, added instance costs, cleanup and criticism. Character stiffness and repeated anatomy, quiet-machine timing, physical Firefox input and separate-network co-op remain open.

## Mechanical attachment reconstruction, local 2.47.0

The scoop has a continuous curved floor, fitted underside ribs, closed cheeks and tapered teeth. The lance has a hollow stepped housing and continuous moving striker; the resonator has a copper winding and hollow front guard. All 526 system checks pass, including seven new physical-face, closure, fit, motion and budget checks. All 64 final frames across 32 matched views were inspected, including every first-person and crew weapon. The combined mechanical inventory removes three meshes and 896 triangles; all weapon roots use five fewer material objects. Only mining-view.js and tool-art.js change executable code; 1,204 other mesh records and native state remain exact. [ATTACHMENT-ART.md](ATTACHMENT-ART.md) records rejection, costs and the twenty-slide receipts. Pristine steel, repeated parts, sharp plates, abrupt coil terminations and stiff posture still fail the finished hard-art standard. Quiet-machine timing, physical Firefox input and separate-network co-op remain open.

## Cutter reconstruction, local 2.46.0

Fitted rounded motor covers, recessed dark louvres, shared painted wear and closed bevelled auger flights replace faceted sheets and slab surfaces. All 519 system checks pass; twenty-four matched views include all seven first-person and crew tools, aiming extremes and active cutting presentation. All 48 final frames were inspected. Two art candidates and two test/capture fixtures were rejected. The cutter removes one mesh while adding 3,612 model triangles and two shared 256-pixel paint maps. [CUTTER-ART.md](CUTTER-ART.md) records source conservation, costs, criticism and the twenty-slide receipts. Shaft facets, clean metal, scoop seams, stiff posture, quiet-machine timing and physical Firefox feel remain open.

## Remote miner body batching, local 2.45.1

Four remote miners now use 236 cached draws instead of 377, with the same submitted triangles and posed models. A refreshed-shadow frame uses 842 instead of 1,124. All seven equipped tools retain their geometry and independent pose. Native inspection also found shared name-tag geometry being disposed on departure; cleanup now preserves it and final respawn frames show names. All 514 system checks pass. [CREW-BATCHING.md](CREW-BATCHING.md) records twelve native pairs, added per-frame matrix/culling work, rejected fixtures and the sixteen-slide receipts. The repeated character anatomy, stiff poses, tool surfaces, physical Firefox feel and quiet-machine timing remain open.

## Chalk landmark reconstruction, local 2.45.0

Eleven chalk landmarks now use thick fluted drops and an irregular coat. Their mesh count stays equal while model triangles decrease by 4,070. All 506 system checks pass. The matched native mine views retain original lighting, terrain and support anchors. Rejected fins, tooth-like bodies, clipped study framing and stale bounds remain in [CHALK-ART.md](CHALK-ART.md) and the fifteen-slide receipts. All other 1,148 scene meshes and native state remain exact. Repeated five-drop anatomy, smooth coats, pale headlamp colour, physical Firefox feel and quiet-machine timing remain open.

## Adaptive ore submission, local 2.44.0

Adaptive ore submission now rejects distant cells while preserving the original single draw in dense views. The native depot drops from 666,172 to 599,752 submitted triangles at the same 238 cached draws. Eight matched native pairs retain exact cameras, ore buffers and non-ore submissions. Ten new batching checks and the complete fossil campaign pass. See [ORE-BATCHING.md](ORE-BATCHING.md) for rejected candidates, added CPU/memory costs and the count-based scope. All 505 system checks pass; quiet-machine FPS and physical Firefox feel remain unverified.


## Rounded obstacle contact, local 2.43.3

Rounded obstacle contact now clears the native depot post and workbench corner instead of snagging on square expansions. Twelve seam replays retain zero stopped frames, and actual host/guest role traces match local movement at both native corners. All 495 system checks pass; the complete fossil campaign passes at 532.9 simulated seconds. The [seven-slide receipts](../tools/out/corner-slide-review.html) retain rejected contacts, traces and eight native frames. See [ROUNDED-CONTACT.md](ROUNDED-CONTACT.md). Physical Firefox mouse feel and quiet-machine timing remain unverified.

## HUD model writes, local 2.43.2

The hidden HUD model now writes only changed text, attributes and styles. Nine native states reduce 109,080 redundant DOM mutations across 1,080 repeated model updates to zero, retaining exact DOM/guide output and an identical native depot frame. All 488 system checks pass. Immediate controls and advice remain on their existing schedule. The [four-slide receipts](../tools/out/hud-writes-review.html) show counts and explicit limits; see [HUD-WRITES.md](HUD-WRITES.md). Quiet-machine FPS and physical Firefox mouse feel remain unverified.

## Static sign merging, local 2.43.1

Depot/town signage consolidates nineteen source faces into four full-resolution atlas meshes, retaining all original geometry and office visibility boundaries. All 484 checks pass. Thirteen matched native views save zero to fourteen cached draws and fifteen to twenty-nine refreshed-shadow draws, with two to twenty extra submitted sign triangles and 1.09 MiB extra base texture capacity. Direct same-browser pixel copying is exact; failed cross-process hashes and rendered filtering differences remain in the sixteen-slide receipts. See [SIGN-MERGING.md](SIGN-MERGING.md). Every other native mesh, world/contact/ore/economy record and executable source remains exact. Quiet-machine timing, physical Firefox feel and the broader improvement goal remain open.

## Native lantern fungi, local 2.43.0

Closed asymmetric caps, shaped flared stems and twenty attached tapered gills replace ordinary open hemispheres and flat undersides. The straight-fin first candidate is rejected after actual inspection. All 480 system checks pass. Nine matched native pairs remain in [the fourteen-slide review](../tools/out/fungal-art-review.html), leading the 38-section hub. This adds 10,052 model triangles and zero meshes/materials/lights while preserving original supported cells, poses, masks, world records and all other geometry. Native mine draw counts remain equal. See [FUNGAL-ART.md](FUNGAL-ART.md). Repeated radial anatomy, broad cap faces, plain undersides, headlamp flattening and the wider art/movement/performance request remain open.

## Local controller obstacle scans, 2.42.1

Contact queries use a freshly bounded, order-preserving obstacle list each physics tick. Eight native replays retain exact capsule, velocity, support, aim and camera traces while reducing numeric obstacle reads by 68.2–95.4%. All 476 system checks pass, including high-speed travel, overlap recovery, moving/replaced boxes and external query cleanup. Three portable native pairs keep camera/tool poses and render submissions exact. The [six-slide review](../tools/out/contact-scan-review.html) leads the 37-section hub. All art, previous merge savings and global co-op sources remain unchanged. See [CONTACT-SCANS.md](CONTACT-SCANS.md). Quiet-machine timing, human mouse feel and the broader art/movement request remain open.

## Native creature construction, local 2.42.0

Closed two-lobe moth wings, integrated spots, antennae and bent legs replace the flat quad silhouettes. Crawlers gain layered stone armour, attached legs/claws, forked pincers, mandibles and a ribbed exposed abdomen. All 471 system checks pass. Sixteen native pairs and four rejected candidates remain in [the 23-slide review](../tools/out/creature-art-review.html), leading the 36-section hub. The art removes three meshes and adds 6,168 triangles, retaining original caster counts, seven lifecycle state contracts, all other geometry/world records and prior merges. See [CREATURE-ART.md](CREATURE-ART.md). Straight veins, regular plates, needle feet, simple gait, quiet-machine timing, human Firefox feel, separate-network co-op and the broader art request remain open.

## Native growth contact, local 2.41.1

Existing upper/deep formations rotate to the sampled surface normal, refining analytic placement against the field and seating the complete crystal root ring during construction. The already grounded garden remains unchanged. All 466 system checks pass; 13,998 fresh-seed base vertex records retain zero roots in air. Geometry counts, UVs, colours, indices, anchors, root poses, support masks and all 45 cells survive. Four matched native mine views retain draw and triangle submissions. The [sixteen-slide review](../tools/out/growth-contact-review.html) leads the thirty-five-section hub and retains a rejected fixed-offset burial pass. See [GROWTH-CONTACT.md](GROWTH-CONTACT.md). Broad faces, repeated clusters, sideways drops, quiet-machine timing, human Firefox feel and the wider art request remain open.

## Ordinary mineral growth, local 2.41.0

The ordinary upper cave, deep-mine and expedition cones now have closed native prism clusters and bent ceiling drops, with mineral colours on both the lit surface and glow. All 463 system checks pass. The art adds 24,870 model triangles and zero render meshes, retaining the 45 supported batches, original anchors and all prior merge savings. Twelve matched native cameras retain two rejected revisions and an obstructed camera in [the eighteen-slide review](../tools/out/growth-pass-review.html), leading the thirty-four-section hub. Broad clean faces, pencil-like shafts, repeated clusters and steep-rock contact remain criticism. Quiet-machine timing, human Firefox feel and the wider art request remain open. See [ORDINARY-GROWTH-ART.md](ORDINARY-GROWTH-ART.md).

## Rigid accessory and puzzle prop merging, local 2.40.2

The town, ruins and rescue scenes remove 30 meshes with all 83,140 triangles and 213,711 vertex records preserved. Four poses retain actual hand, blink, halo and mirror transforms. Matched native survey-office draws fall 116 to 106 cached and 689 to 664 on shadow refresh with identical submitted triangles. All 461 system checks pass. Eleven native pairs, two rejected capture conditions and the critic record remain in [the fourteen-slide review](../tools/out/prop-merge-review.html), leading a thirty-three-section hub. Quiet-machine timing, human Firefox feel and the broader hard art request remain open. See [PROP-MERGING.md](PROP-MERGING.md).

## Furnace mesh merging, local 2.40.1

The complete furnace encounter loses 33 render meshes while preserving all 18,004 triangles and 50,458 vertex records. Fixed ribs and panel details share root material meshes; ram bands and damage fragments merge inside their independently moving or hidden groups. Four encounter poses conserve every oriented triangle and attribute with zero measured difference. Matched native room fixtures save 24 cached and 48 refreshed-shadow draws with identical submitted triangles. All 461 system checks pass. Twenty native frames and ten pixel comparisons remain in [the twelve-slide review](../tools/out/foreman-merge-review.html), which leads a thirty-two-section hub. Pristine machinery, repeated locks, floating slash fragments and broad cave/mineral repetition remain criticism. Quiet-machine FPS, physical Firefox mouse feel and separate-network co-op remain unverified. See [FOREMAN-MERGING.md](FOREMAN-MERGING.md).

### Native mine asset construction (local 2.40.0)

Open framed salvage machines, a layered rootway iris, fractured mineral shells and a solid leaf/vein heart replace slab walls and ringed primitive placeholders. Eighteen matched native views retain two rejected stages: floating mounts/veins and excessive first-round geometry, then skipped crease knots and the over-budget second round. Final art consolidates 294 pieces into 28 meshes and costs 21,838 triangles, adding eight meshes and 12,974 triangles over 2.39.1. All 461 system checks pass; other scene geometry/lights, terrain, contacts, support, ore/economy and root poses remain exact. See [MINE-ASSET-ART.md](MINE-ASSET-ART.md). Pristine machines, regular wedges, shared vault plates and heart symmetry remain criticism; ordinary growth and other machinery/creature construction, quiet-machine timing and physical Firefox feel remain open.

### Freight and creature mesh merging (local 2.39.1)

Explicit rigid rail/cage/dock parts, selected rescue panels and fixed creature details consolidate through the existing indexed merge helper. Dynamic cargo, movement, transparency and limb/state boundaries remain independent. The final pass removes 101 meshes, preserves 15,416 triangles and 34,965 vertex records, and passes 455 system checks. A coplanar rescue seam regression is rejected; six joint pieces retain original transforms. Matched crane cameras save 26 and 43 cached draws while admitting 432 and 228 more triangles. FREIGHT-MERGING.md retains native comparisons, rejected captures, conservation and test results. Quiet-machine FPS, physical Firefox feel and the broader art work remain open.

### Native cave landmark reconstruction (local 2.39.0)

Closed cupped shelves, folded chalk with an integrated pointed hem and unequal faceted crystals replace the open plates, pale ovals and smooth rods. Twelve matched views retain three rejected revisions. All 451 system checks pass. Cavern inventory changes from 136 meshes / 83,519 triangles to 114 / 92,693; previous supported batches and all other scene geometry remain exact. Terrain, contacts, anchors, root poses, accent sites, ore and economy remain exact. See [CAVE-FORM-ART.md](CAVE-FORM-ART.md). Broad shelves, cloth-like pale chalk, repeated fans, ordinary cave spikes and primitive underground assemblies remain criticism. Quiet-machine timing and physical Firefox mouse feel remain unverified.

### Buried supported growth and rigid assemblies (local 2.38.1)

Stationary cavern, deep and expedition growth shares 45 bounded batches while retaining each terrain-support visibility decision. Deep machine wheels, rootway, salvage, vault and heart rigid parts also merge. The scenes remove 446 render meshes without changing their 121,200 model triangles; attributes match within measured float differences and terrain/contact/anchor/economy records stay exact. Fourteen matched views show cached draw savings of zero to 408, with up to 3,138 more submitted triangles from wider bounds. Shadow refresh saves 19 further draws with unchanged shadow triangles. All 447 system checks pass. All 28 before/after frames and 17 slide layouts were inspected. See [BURIED-BATCHING.md](BURIED-BATCHING.md). Primitive underground assets, physical Firefox input feel and quiet-machine performance remain open.

### Native ground and low cover (local 2.38.0)

Selected slopes gain smaller folded, notched broadleaves and angular downhill fragments. Ground colour changes reduce the beige slope blend; the protected claim, paths, buildings, contacts and terrain remain exact. Ten matched views retain two rejected art rounds and the modest impact in wide shots. All 442 system checks pass. New cover adds 20,556 triangles in six bounded batches sharing the existing material, with zero to four extra cached draws. The close views also expose hundreds of pre-existing cavern/discovery/deep submissions for the next merge audit. See [GROUND-COVER-ART.md](GROUND-COVER-ART.md). Repeated clusters, simple chips, empty slopes, physical Firefox feel and quiet-machine timing remain open.

### Grounded perimeter masonry (local 2.37.0)

Shaped, staggered stone courses with per-vertex ground foundations and recessed rubble backing replace the three box rows. The northeast floating undersides and sampled through-joints are corrected. Eight matched native views preserve a rejected reconstruction; all 439 system checks pass. Every other common triangle, ridge/verge geometry, contact tuple, placement and terrain byte remains exact. The wall adds 24,256 triangles and six bounded batches; shadow refresh adds six further draws. Broad faces, regular courses and triangular shading remain criticism. See [PERIMETER-ART.md](PERIMETER-ART.md). Quiet-machine timing and physical Firefox input feel remain open.

### Spatial canopy batches (local 2.36.1)

The four landscape-wide canopy bounds now split into 44 bounded static batches. Eight clear native views reduce mean main-camera foliage submission from 220,332 to 76,129.5 triangles (65.4%) with every model triangle, vertex attribute, contact tuple and terrain byte preserved. All 436 system checks pass. Cached draws increase by 3–16 per view and shadow refresh adds 40 further draws; shadow triangles remain unchanged. Frozen native comparisons, the 96 m alternative and pure grid predictions are retained in [FOLIAGE-BATCHING.md](FOLIAGE-BATCHING.md). The 64 m choice is provisional until quiet-machine timing. Physical Firefox input feel and the wider art critique remain open.

### Reservoir construction (local 2.36.0)

Native rectangular timber, joined bracing, separate deck planks and joists, shaped thick staves, hollow hoops, catwalk rails and a closed roof shell replace the reservoir's poles, slab, seam strips and plain cone. Six matched cameras and a rejected roof revision retain native evidence in RESERVOIR-ART.md. All 432 system checks pass. Planar timber chamfers remove 6,816 triangles from round one; release adds 7,170 relative to baseline with the same 21 common-scene batches. Contact and terrain remain exact. Uniform timber wear, sparse surroundings, physical Firefox input feel and quiet-machine timing remain unresolved.

### Camera step easing (local 2.35.2)

Elevation easing now advances in simulation rather than on camera reads. Eight controlled presentation schedules agree at matched read times, capsule traces stay exact and all 429 system checks pass. Four native fixture frames, baseline contract failures and scope are recorded in [STEP-CAMERA.md](STEP-CAMERA.md). Physical Firefox input feel and quiet-machine timing remain open.

### Rigid mesh merging (local 2.35.1)

Explicit rigid assemblies remove 388 mesh objects with unchanged model triangles and indexed attribute preservation. The final 426-check suite, matched native captures, corrected camera/shadow rounds and provisional performance scope are recorded in [MESH-MERGING.md](MESH-MERGING.md). The other GPU workload and physical Firefox movement review remain open.

Requested by Trent, September 2026. This replaces the first playable's implementation. HANDOFF.md remains historical context; the current user request overrides its old prohibition on rewriting systems.

Preceding grass checkpoint: **2.35.0 / native grass construction**. See [MEADOW-ART.md](MEADOW-ART.md) for six matched views, two rejected revisions, bent blades and anchored wind roots. All 423 checks pass in [the meadow log](../tools/out/system-meadow.log). Grass adds 37,045 triangles with the same seven material batches; bare slopes, repeated clumps, dark rear faces, detail disappearing at distance, quiet-machine timing and physical mouse feel remain open. Preceding checkpoint: **2.34.0 / distant cliff construction**. See [ESCARPMENT-ART.md](ESCARPMENT-ART.md) for six matched views, two rejected revisions, real crest/ledge/foot boundaries and native cost. All 423 checks pass in [the escarpment log](../tools/out/system-escarpment.log). Ridge geometry removes 720 triangles with the same material batch and lights; continuous shelves, smooth rubble slopes, bright-face contrast, quiet-machine timing and physical mouse feel remain open. Preceding checkpoint: **2.33.0 / fractured outcrops**. See [FRACTURED-ROCKS.md](FRACTURED-ROCKS.md) for six matched views, two rejected revisions, separate stone masses and native cost. All 423 checks pass in [the fracture log](../tools/out/system-fracture.log). Common geometry adds 3,914 triangles with the same material batches and lights; broad faces, the rest of the environment, quiet-machine timing and physical mouse feel remain open. Preceding checkpoint: **2.32.0 / rock and masonry construction**. See [STONE-ART.md](STONE-ART.md) for eight matched native views, two rejected rounds, connected rock ledges, separate garden stones, resculpted distant ridges and exact contact records. All 423 checks pass in [the stone log](../tools/out/system-stone.log). Combined geometry adds 13,070 triangles and removes two material batches; no new timing sweep runs under the reported Qwen workload. Preceding checkpoint: **2.31.0 / leaf and evergreen construction**. See [FOLIAGE-ART.md](FOLIAGE-ART.md) for actual leaf clusters, secondary pine twigs, six matched views, two rejected modeling rounds, unchanged contact and geometry cost. All 423 checks pass in [the foliage log](../tools/out/system-foliage.log). No new CPU/GPU timing claim is made while Qwen is reported loading the machine. Preceding checkpoint: **2.30.0 / depot construction and equipment**. See [DEPOT-ART.md](DEPOT-ART.md) for roof glazing, actual tool silhouettes, stocked cabinetry, softer grain, six matched views, two rejected rounds and measured rendering cost. The final suite passes 423 checks in [the depot log](../tools/out/system-depot-art.log). See [MOUSE-ENTRY.md](MOUSE-ENTRY.md) for the missing automatic-guest capture, blocked HUD-start drag, seven new checks, 423-check suite and matched native cue frames. The following network, art and performance studies retain their dates. See [CREW-ARRIVALS.md](CREW-ARRIVALS.md) for the real late-join overlap, supported arrival allocation, 416-check suite, current default global WebRTC audit and longer frame samples. See [WORLD-ART.md](WORLD-ART.md) for expanded northern planting, baked ground/grass variation, outcrop profiles, the rejected colour-stream failure and direct view profiling. See [LANDSCAPE-ART.md](LANDSCAPE-ART.md) for rebuilt pines, flowers, outcrops, the jade beacon, facade finish, rejected rounds and matched cost. See [LATENCY-MOVEMENT.md](LATENCY-MOVEMENT.md) for acknowledged historical prediction, the rejected startup prototype and measured guest cost. See [AUTHORITY-MOVEMENT.md](AUTHORITY-MOVEMENT.md) for the no-render replay, shared simulation clock and input expiry. See [GUEST-MOVEMENT.md](GUEST-MOVEMENT.md) for the reproduced stale-target teleport, pose ordering and its dated latency findings. [CREW-COMPATIBILITY.md](CREW-COMPATIBILITY.md) records the preceding 2.63 m mixed-build teleport, automatic compatibility grouping and saved-claim migration. [COMMON-GROUNDS-ART.md](COMMON-GROUNDS-ART.md) records furniture, root contact, planting, rejected rounds and direct well/grove frame measurements. [SURFACE-ART.md](SURFACE-ART.md) records the preceding roof and landscape geometry pass. [MOVEMENT.md](MOVEMENT.md) records controller measurements, [PERFORMANCE.md](PERFORMANCE.md) the preceding performance fix, and [HARD-ART.md](HARD-ART.md) the retained miner, tool and depot pass. [MULTIPLAYER-POLISH.md](MULTIPLAYER-POLISH.md) records multiplayer architecture and verification.

[GOAL-AUDIT.md](GOAL-AUDIT.md) tracks the full request and remaining critic findings. The subsequent [2.35.0 runtime audit](RUNTIME-AUDIT.md) records seven current public-room observations and four repeated surface profiles, including intermittent stalls and competing GPU load. The preceding meadow aggregate suite passes 423 checks; its result is retained in [the meadow log](../tools/out/system-meadow.log). The preceding escarpment suite remains in [its dated log](../tools/out/system-escarpment.log). The preceding fracture suite remains in [its dated log](../tools/out/system-fracture.log). The preceding stone suite remains in [its dated log](../tools/out/system-stone.log). The preceding foliage suite remains in [its dated log](../tools/out/system-foliage.log). The preceding depot suite remains in [its dated log](../tools/out/system-depot-art.log). The preceding input suite remains in [its dated log](../tools/out/system-mouse-entry.log). Seven new acquisition and gesture checks preserve desktop, touch and capture-refusal controls. The preceding world-art suite passes 410 checks in [its dated log](../tools/out/system-world-art.log). Three new checks guard colour batching and the actual field join. Four new landscape checks guard exterior faces, the power gate, protected planting and mapped facade UVs. The preceding eleven latency checks remain in [the dated latency log](../tools/out/system-latency.log). The matched 250 ms turn improves from 3.06 m to 0.19 m accumulated correction over four seconds, while genuine authority errors still correct. Authority advances from accepted input when rendering stops, and pings cannot renew stale held movement. Stale pose targets expire, and timestamped world frames cannot rewind newer miner poses. Stale collision generations cannot supply host poses to current miners. The open well and all three benches use shared host/guest contact, and remote boots resolve onto their actual meshes. Surface paths follow original ground triangles, original tree placement and trunk obstacles remain exact, and pitched roofs support traversal. The preceding co-op controller fixes remain: ordinary replies preserve movement, machinery and lift rules agree, and recall/resync corrections do not cross epochs.

## Research and design decisions

### Bell Works finish (local 2.19.0)

A cosmetic pass improves the terrain finish, sky and town lighting, foliage, building detail, held cutter and upper-cave formations. World-space procedural relief replaces the coarse checker grain; the sun shadow volume covers the town; underground lighting also influences the held tool. New surface planting avoids both editable claims, roads and the service apron. Cave growth retains removable support. Gameplay values, density fields and save versions are unchanged. BEAUTY-PASS.md records the implementation and offline GPU studies. The expanded bundled Three.js terrain shader compiles and links; the aggregate suite passes 266 checks. These do not certify final browser appearance or human feel.

### Lantern Leviathan (local 2.18.0)

An enormous supported skeleton near 220 m creates a quiet excavation discovery between lower-mine encounters. Expose three bone regions, illuminate their markings with placed work lights and study them with aimed scans. Its recovered ember brings Nell Wick and her original lantern cart to Ridge Common. A paid, earned lens retrofit improves all existing and future lamps, including their real moth-deterrence radius. The skeleton follows its terrain support; study, recovery, the town arrival and the upgrade persist. Existing saves retain their fields and mineral IDs. LANTERN-LEVIATHAN.md records mechanics and architecture; VERIFICATION.md records the fresh campaign and release checks.

### Eastcut (local 2.17.0)

Mara sells a neighboring 384 square metre mining parcel after engine recovery. It has three connected natural chambers, 348 appended minerals, persistent terrain, ownership markers and a freight extension. Buying retains the original field and mineral IDs, including live cargo shipments. Both chart panes, lamps, explosives, return anchors and lost-cargo recovery use the wider claim. Surface throws now remain within reachable boundaries and have matching save limits. EASTCUT.md records the architecture and production journey. More resident roles, discoveries and visual/feel review remain in the expansion plan.

### Stonewright Sling (local 2.16.0)

A physical workshop around 134 m offers another discovery with a permanent equipment reward. Uncover and resonate its two coils, then recover the mineral sling. Holding the trigger lifts a real loose mineral; release throws it through the existing terrain and combat systems. Impacts can break armor, and the same mineral remains collectible afterward. The frame falls if undermined, old terrain remains exact, and saved projectiles retain their identity. STONEWRIGHT.md records controls, collision, persistence and verification. The broader surface, resident, discovery and visual-review work remains in BEAUTY-DEPTH-COMBAT-PLAN.md.

### Shale Crawlers (local 2.15.0)

The lower workings now contain three persistent armored ground creatures. They navigate supported routes, commit to a visible claw charge and fall when their terrain is removed. Lance and explosives break armor; the rear stays vulnerable. Teeth and blasting salts are recovered from physical shells. Otis fits an earned, paid impact axe head with stronger combat and excavation. CRAWLERS.md records the system and full fresh-start journey through the furnace and powered town. This expands the enemy roster without respawning threats in cleared routes or changing existing terrain.

### Bring Inez Home (local 2.14.0)

An underground rescue now adds a permanent third resident to Ridge Common. The survey bell uses a cell-powered, terrain-blocked winch; the player excavates its escape shaft. Inez opens the survey office and sells charts of real uncollected deposits, plus leads on optional structures. Rescue movement, office arrival, dialogue, charts and older-world migration persist. RESCUE.md records the implementation and fresh-start journey. Remaining expansion work stays in BEAUTY-DEPTH-COMBAT-PLAN.md.

### The Foreman Below (local 2.13.0)

The lower chamber now has a persistent boss with buried, damageable pressure locks, a segmented armor gate, telegraphed cutting jets and ground shocks. The machinery uses real support and falls when undermined. Tools, explosives, pulses, health and rescue share the existing systems. Its reward is a reusable foundry bore on Z and a powered well/road in town, with merchant reactions. FOREMAN.md records mechanics, persistence and the successful fresh-claim journey through the encounter. The larger plan remains active for more encounter variety, structures, residents, parcels and human visual review.

### Lower workings update (local 2.12.0)

The heart opens the old floor into a 297 m continuation with four lower regions, five seeded cave networks and three restorable stations. Station rewards improve deep excavation, lift and scanning; repaired return routes appear in Otis's services. Depth-versioned field migration copies upper samples exactly, appends ore IDs, and extends charts and equipment/save bounds. DEEP-WORKINGS.md records the implementation and complete coordinate-aware descent. The furnace boss and final payoff remain unfinished; the broader expansion goal stays active.

### Cinder moth update (local 2.11.0)

Mining tools now share target resolution with creature damage, including a timed mining axe at 9 m. Three persistent cinder moths provide the first terrain-aware encounters: collision-checked flight, alternate routes, telegraphed lunges, light deterrence and physical supply rewards. Health, surface recovery and a recoverable cargo cache complete the defeat loop without removing equipment or earned progress. COMBAT.md records the implementation, conservation rules and simulation evidence. Deeper terrain and the boss remain outstanding under BEAUTY-DEPTH-COMBAT-PLAN.md.

### Natural workings update (local 2.10.0)

Fresh claims now have three seeded cave networks with loops, branches, chambers and vertical passages. Physical survey cabinets accept a work light, illuminate their surroundings and chart nearby air. Their support, saved motion and discovery states use the existing mine systems. Older claims retain their exact terrain and receive cabinets in their original rooms. Generation is versioned independently of the additive v2 save format. See CAVERNS.md for implementation and validation; greater depth and combat remain outstanding in BEAUTY-DEPTH-COMBAT-PLAN.md.

### Ridge Common update (local 2.9.0)

The surface expansion adds a walkable town with two friendly, functional merchants and persistent conversations. See TOWN.md for the scene, shared collision definitions, services, old-save compatibility and visual-review limits. The broader beauty/depth/combat goal is active; this is the first town checkpoint, with cave generation and further systems still planned in BEAUTY-DEPTH-COMBAT-PLAN.md.

### Field Kit update (2.8.0)

The source audit found that the expanded HUD repeated tool names, descriptions, five slots, three charge choices, counts and infrastructure notes while the player was digging. Future magical equipment was visible from the start. Touch also exposed an anchor action before its recovery. This pass makes those existing systems easier to discover and operate; it adds no new economy or progression gates.

The live equipment readout shows the selected tool, owned shortcuts, charges, lights and an armed-remote trigger. Mechanical tools no longer display an unused charge meter. I opens a paused field kit with original SVG tool silhouettes, owned tool descriptions, charge selection, infrastructure controls and the next stratum unlock. Magical tool entries appear after their recoveries. Selecting with buttons or 1?5/X/N stays paused; I or Escape returns to digging. The kit reuses production selection methods. Opening it clears movement, firing, charge aim and freight aim, so releasing a held key cannot place equipment after the menu opens.

Optional field tips teach scanning, explosives, lights, different excavation tools, the return anchor, freight and magical abilities when their state makes them useful. They retire after a successful action or Y/Got it dismissal. Tips are suppressed during interactions, aiming, scans, chapter announcements, recall, full cargo, tethering and nearby thunderstone ignition. Dismissal works while the pointer is captured. A Field tips setting disables them entirely. Additive per-claim history is validated in portable saves; older claims receive an empty history. No tutorial blocks progress or grants currency.

Responsive rules compact the equipment readout, move descriptions to the kit, adapt touch controls and retain scrollable menu access. Owned touch actions are revealed as they unlock. The primary use label reads Cut, Pulse or Draw. The source and inert-DOM checks do not establish rendered layout quality. Visual review remains outstanding under the session's browser restriction.

### Thunderstone Seams update (2.7.0)

The mine now offers an environmental choice that joins prospecting with demolition. Four seams begin near 16, 34, 48 and 62 m. Each has four reactive crystals and twelve nearby minerals. The minerals append stable IDs, so older claims retain their exact prior deposits and inventory. The crystals do not count as minerals and are never added to the sale ledger.

An exposed, dormant crystal can be recovered with the existing E interaction for one charge. It requires clear line of sight, three-meter reach, actual aim, full physical exposure and supply space. Alternatively, a nearby charge or resonator/rift pulse ignites it for 0.65 seconds. Its 2.9 m explosion opens rock and can expose and ignite the next crystal. Recovering a link can limit the chain. Drilling alone never starts a fuse. Crystal blasts share the actual gadget excavation, ore preservation and impulse code, so the chain affects the same mine and can also ring exposed echo instruments.

The crystals use swept ore-body physics and matching visible dodecahedron support points. Once detached, they fall and ignite/explode from their current positions. Rock shielding and blast reach are checked after excavation. The chain advances at 120 Hz. A shared bounded blast record feeds sound, debris, light and other reactive systems. Scan markers use separate IDs from minerals, follow moving crystals and hide consumed crystals. F and nearby visible exploration reveal seam notes; M retains discovered locations; the HUD warns when an ignited crystal is close.

Additive state stores discovered and consumed IDs, loose bodies and remaining fuses. Portable saves validate all fields before installation. Saving during ignition resumes the remaining delay; it neither resets the fuse nor resurrects consumed crystals. Older saves initialize dormant seams without rewriting terrain or prior mineral IDs.

The new fresh-claim journey exposed an existing rift contact failure: a clear center ray could miss a lip still holding the player's feet. When no direct terrain or discovery target is found, pulses now probe around the passage and widen a real rim contact. A regression reconstructs a narrow cleft, verifies that the player is blocked while the center ray is clear, then verifies that a pulse opens a usable route.

### Excavation Feedback update (2.6.0)

The three directions are complementary: demolition provides terrain tools; mysteries unlock new capabilities; infrastructure makes an excavated mine useful. This pass improves feedback for those existing systems without changing progression or mineral accounting.

Cosmetic fragments use the current stratum color and collide with the density field. Dust dissipates at rock. Pickups produce mineral-colored glints, blasts create brief local light and rings, and bore charges emit along their excavation path. Pools are capped at 512 particles, 12 flashes and two transient lights. Particle motion advances at 120 Hz with a separate random stream. Rendering does not spawn or advance effects, and saves do not store them. Underground fog and headlamp colors blend across five strata. The tool motion setting also controls the drill rotor, pressure needle and magical tool animation; feedback never changes player look.

Procedural sample generation is separate from WebAudio routing. Material-varied steps and impacts, pitched pickups, low blasts, harmonic magical pulses, cutter textures, air, drips and the freight motor use original synthesized samples. Spatial events attenuate with distance, pan relative to the listener, and become quieter and low-pass filtered through rock. The sound engine opens only from the existing human interaction path, caps event voices and cached buffers, and disconnects completed events. Muting fades the existing master gain; pausing fades continuous sources. Missing audio devices do not prevent play.

Focused tests cover collision and lifetime, bounded emissions, gameplay isolation, render-state stability, actual Three.js instance attributes, depth palette continuity, motion settings, sample metrics at 44.1/48 kHz, spatial calculations, audio routing/lifecycle and actual Game updates with an inert audio context. These are not an audible or WebGL review. The freight journey still completes its shipments and full campaign with the effects enabled.


### Freight Works update (2.5.0)

The infrastructure direction now has its first reusable machine. A $180 freight crane unlocks after flywheel recovery; a $420 cage upgrade unlocks after engine recovery. The first purchase competes with personal equipment and supplies. A loading dock is placed underground with a hold/release T preview; it does not excavate on placement. The player must make its freight route usable.

The gantry spans the claim on supports outside the diggable boundary. Cables suspend the dock, so excavating beneath it does not leave an unsupported machine. The 0.88 m cage travels up the dock's shaft at 5 m/s, crosses the rail to the depot, unloads and returns. Real terrain contact stops the entire cage, including corners and internal volume samples. The orange obstruction marker shows where to cut. Player and salvage overlap also stop the cage. This transports mineral cargo; bulky recoveries retain their tether challenge.

E at the dock opens send, recall, take-back and pack controls. The cage holds 24 minerals, or 64 after upgrading. If a pack exceeds capacity, more valuable minerals ship first and overflow stays in the pack. Recalls return loaded cargo to the dock. Packing requires an empty cage at home and preserves unsold yard stock. There are no fuel, power or durability costs.

The mineral ledger now distinguishes carried inventory, freight load, delivered stock and sold totals. Collected IDs must match their combined counts. Loading and unloading never increment mined totals or pay money; selling at the hopper clears both carried and delivered inventory once. Mid-route positions and cargo are validated and persist. Older claims receive an unowned crane without changes to their inventory or terrain.

The fresh-claim freight journey buys the crane using recovery earnings, excavates a bay, places it through T, loads through the E dock UI, sends 24 minerals, picks up 10 more during transit, sells at the real hopper and completes the campaign. Separate checks cover repeated loads, narrow-shaft stalls, recalls, overflow, moving obstacles, save/load and invalid cargo accounting. Human economy and visual review remain outstanding.

### Strange Machines update (2.4.0)

Trent also liked the underground-mystery direction. This pass connects it to the demolition kit with two optional sites. They remain independent of the main recovery sequence and can be revisited after the ending.

The echo vault at 21 m has three impact seals. An explosion must reach an exposed seal through clear terrain; all three must ring within one second. Planted remotes provide a reliable way to coordinate them. A single ordinary blast cannot cover the layout. Missed attempts reset without destroying the instruments. Solving it grants the Aftershock core: 3.6 m remote blast radius and 9 m bore length, with matching previews and unchanged charge costs.

At 38 m, the blackglass array is split across four buried optical assemblies. The player excavates beam paths and turns two prisms with E. Beams terminate at the actual terrain contact and downstream optics remain dark until connected. Three continuously connected paths awaken the receiver. Its lens lets the player focus scanning on one mineral in the survey, gaining 8 m of range while excluding the other mineral types. Signals remain visible.

Scanning, nearby visible exploration, or recovering the corresponding machinery adds a lead. The field notes offer optional tracking, concise clues and earned reward descriptions. Main notes now reveal the engine, choir and garden as the player advances instead of explaining everything at the start. The main lead remains available when optional tracking is disabled.

Mystery progress, prism turns, tracking and scanner focus are additive save fields. Older claims keep their exact density field and gain the buried apparatus; the new small chambers are generated only for fresh terrain. Short-lived ringing and beam-charge timers restart on load. Rewards cannot repeat. Existing ore IDs and economy are unchanged.

The `--mysteries` journey excavates both sites without fixture tunnels or direct teleports, buys charges with earned money, solves the ruins using production interactions, and completes the main campaign. It has exact coordinate knowledge; it proves one reachable route, not human pacing or visual quality. Mine infrastructure/automation and human review of the overall progression remain future work.

### Demolition update (2.3.0)

Trent chose more explosive toys and ways to shape terrain as the next priority. Permanent mine equipment and further mysteries remain appealing future directions, rather than substitutes for this pass.

The explosive kit now has three distinct jobs. The initial charge makes a broad pocket on a short fuse. Remote satchels unlock with Rustwater at 9 m: they stick on contact, wait indefinitely, and detonate in a short sequence on H. An aimed satchel can be disarmed with E to return its charge. At 25 m, bore charges hold the throw's aim direction and excavate a 6 m line with a 1.5 m nominal radius. They cost two charges and have a 3.2-second fuse. The resulting passage is tested with the actual player collider, including terrain interpolation.

N cycles the unlocked types. The existing hold-C preview now shows the appropriate blast sphere or directed tunnel rings. Charges retain their attachment point and orientation in saves; earlier bombs without these fields remain ordinary timed charges. Removing supporting rock releases an attached charge. Blasts still preserve valuables, and bore excavation detaches ore along its path. Armed remote locations appear on the survey.

The demolition journey earns the flywheel reward, buys supplies at the actual workshop and completes the full campaign using the new charges. It also exercises the consequences of boring through the chamber floor: the pilot has to lift back toward the seal stones. These are reachability checks, not a human balance verdict. No browser input or rendering validation was performed in this pass.

### Fieldwork update (2.2.0)

The mine now remembers exploration. M opens depth slices of excavated or visited terrain and a vertical profile of known passages. F records ore and buried signals. The profile combines passages across the claim and is labeled accordingly; it is not a connectivity guarantee. Lights and the return anchor appear on the chart. Old saves recover excavated air without exposing untouched chambers.

Charges use hold-to-aim and release-to-throw. The preview advances a temporary body through the same fixed-step contact solver as the actual charge, including its full fuse. It does not mutate terrain, inventory or the spatial index. Pausing, blurring or cancelling touch aim discards the throw. Work lights can be aimed at and retrieved with E for redeployment. Rock remaining after a blast blocks impulses on valuables.

Fresh-claim simulation exposed two cutter failures: the wider brush missed an existing narrow shaft's walls, and interpolated rim contacts could keep carving an already-saturated volume. Outer edge probes now ream open tunnels, and a saturated centered cut bites into its actual contact. Caught salvage marks the leading corner or cable obstruction, making the required clearance visible.

The complete excavation journey runs through first sale, earned equipment, both physical recoveries, the seal, the heart and the three geodes. Its pilot knows coordinates and aims precisely, so elapsed simulation time is not a human pacing estimate. Visual review and a human playthrough remain outstanding under the session's browser-input restriction.

### The Depths Update (September 24)

Trent's playthrough finished the previous campaign quickly and exposed its central design problem: deeper ore and cumulative sale counters did not change what the player did. His original BUTTLOADS had unlocks across different levels and an intended magical bottom layer. His follow-up explicitly requested bombs and light sources.

The new pass keeps the terrain and working ore simulation and replaces the active objectives with physical recoveries and a progression from machinery to magic:

1. Mine a first haul. Three starter charges and six lights introduce ways to shape and illuminate the mine.
2. At 9 m, use a scoop and salvage tether. Lift the survey flywheel through a route with enough clearance. Recovery unlocks a reusable return anchor.
3. At 25 m, use a precision lance in harder rock. Extract the larger resonance engine, using bombs or wider cuts where it catches. Recovery builds the resonator.
4. At 43 m, the scanner gains 10 m of range. Expose and strike three seal stones with charged resonance pulses.
5. At 59 m, scans reveal sealed geodes. Awaken the heart at the bottom to unlock gravity attraction and rift excavation.
6. Return to three geodes with the new power. Complete that recovery set, then keep the mine and equipment.

There is one small first-sale grant. Subsequent active goals are physical actions and power unlocks, rather than cumulative sale quotas. The finite world, economic values and trip pacing still need a human playthrough. This is an expanded playable pass, not a claim that it exceeds its commercial references in scope or polish.

New state is additive to the remake's v2 snapshot schema. Old terrain, equipment, money, collected IDs and loose ore survive; branching deposits append IDs and the expedition starts independently of old relic rewards. No prototype or user save is overwritten by the build command.

### Earlier remake research

- [XGen's Motherload](https://www.xgenstudios.com/play/motherload) describes a descent through Martian strata, valuable minerals, mining pod upgrades, buried hazards and a storyline. [XGen's Super Motherload trailer](https://www.youtube.com/watch?v=PkWh4m29J0M) makes the connection between increasingly valuable depths and more capable equipment explicit.
- [DoubleBee's A Game About Digging a Hole](https://store.steampowered.com/app/3244220/A_Game_About_Digging_A_Hole/) centers its official description on a backyard, digging, selling, equipment upgrades and an underground mystery. Its developer's description emphasizes a relaxed pace.

Our interpretation: value density, equipment throughput, return trips and curiosity make the loop. A larger map or more terrain controls would not establish that loop. Keep first-person excavation, make the first seam readable, let the player choose between throughput, capacity, navigation and faster returns, then reward deeper expeditions with different geology and discoveries. Cargo provides the reason to return. Do not add fuel, oxygen or durability chores to this remake.

New implementation:

- Deterministic 28 m wide, 73 m deep claim; five strata and five mineral classes. Connected random-walk deposits rather than unrelated pickups.
- New incremental Surface Nets kernel: stable cell vertices, packed face slots, sample halos, local remeshing. Worker pool handles initial construction. Edits update the authoritative density and visible mesh in the current frame.
- Fixed-step capsule movement with substeps, continuous cutter with rim probes, free lift and an explicit recall action. Air misses never release the trigger.
- Spatial resource queries, exposure and line-of-sight checks, capacity checked before a resource is consumed. No income from undug ore.
- Detached ore uses fixed-step gravity, swept terrain contacts and sleep/wake on edits. Its spatial index and scanner instances move with it. Loose positions and velocities are an additive field in v2 saves; earlier v2 saves detach unsupported ore when loaded.
- Four equipment tracks; delivery contracts use cumulative actual sales, with one-time payouts. Three discoveries lead to a recoverable final artifact and a surface delivery ending.
- Separate save version and IndexedDB database. Original prototype data remains intact. Portable snapshots validate all state and terrain before live mutation. Serialized local writes.
- Original procedural scene, tool, sound and interface. Local vendored Three.js; no game assets or code taken from either researched commercial game.

Source is split into classic browser scripts, with no runtime dependency on a build tool or CDN. A single-file release can be produced with `node tools/build.mjs`. The file also runs directly from disk. This makes the source maintainable while retaining Terrain Lab's portable delivery model.

## Acceptance checks

Run `node tools/test.mjs` for system validation and `node tools/simulate-journey.mjs` for excavation from a fresh claim through every new recovery. `tools/verify-remake.mjs` is historical, predates the expedition, and must not be run during this session; see AGENTS.md. Current evidence and its limits are in `docs/VERIFICATION.md`. Test artifacts are written to `tools/out/`.
