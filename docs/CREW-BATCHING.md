# Remote miner body batching, local 2.45.1

Four remote miners now use 236 cached draws instead of 377. A frame that refreshes the sun shadow uses 842 instead of 1,124. The complete submitted triangle counts, camera and posed model transforms match the frozen 2.45.0 baseline in all twelve fixtures. This is evidence of fewer draws; no FPS or frame-time gain has been measured under the competing GPU workload.

The [sixteen-slide review](../tools/out/crew-batching-review.html) retains twelve native before/after pairs, all seven equipped tools, counts, costs and criticism. These are static production-renderer fixtures with inert crew members. They do not constitute a new public networking or gameplay test.

## Native counts

Each row counts remote miners; the HUD includes the local player as well. The cached frame reuses the sun shadow. The refresh column includes both shadow and main passes.

| Remote miners | Cached draws, before to after | Refreshed-shadow frame draws, before to after | Instance matrix capacity |
| --- | --- | --- | --- |
| 1 | 185 to 185 | 743 to 743 | 0 bytes |
| 2 | 244 to 197 | 860 to 766 | 6,016 bytes |
| 4 | 377 to 236 | 1,124 to 842 | 12,032 bytes |
| 8 | 635 to 306 | 1,636 to 978 | 24,064 bytes |

Every two-miner equipped-tool pair saves 47 cached draws and 94 refresh-frame draws. The four-miner fixture with two miners behind the camera saves the same 47 / 94 while preserving off-camera shadow casters. [Raw reports](../tools/out/crew-batching-conservation.json) include the unchanged submitted triangle totals for every pair.

## Production scope and costs

The existing rig has 52 body meshes. Body slot, exact material colour, shadow flags, layers and draw order define a group. Forty-seven slots share colours across the tested eight profiles; the five clothing-colour slots retain individual native rendering. Posed world matrices update the instances. Weapons, attachments, fields, name tags and lamps retain their independent models and animation paths.

A body piece joins an instance group only when the current main camera and native sun-shadow frustum both accept it. Singleton, hidden, off-camera and shadow-clipped pieces keep their original paths. Rendering the crew after the current camera pose fixes stale-frame eligibility. The implementation covers the game's existing single shadow-casting sun; adding another shadow-casting light requires revisiting that eligibility.

This adds up to 47 instance mesh objects and keeps the original rig meshes as pose and ownership sources. It does not reduce authored model triangles or per-miner model allocations. There are per-piece main/shadow sphere checks, world-matrix updates and dynamic matrix uploads each frame. Four eligible miners upload 12,032 matrix bytes per frame; eight upload 24,064. Capacity grows by powers of two. A single remote miner allocates no instance buffers. Quiet-machine CPU/GPU measurements remain necessary to judge the net timing benefit.

Membership changes restore source visibility before disposing instance buffers. The groups borrow model geometry and materials; owner departure releases the group before disposing that owner's assets. Portable mine installation refreshes floor caches while retaining live rigs.

## Name-tag defect found during inspection

The first native pair showed a name tag, but subsequent pairs lost every tag after clearing and recreating miners. The baseline still reported `badge.visible=true`, submitted sprite calls and identical triangle counts. Those counters alone missed the visible defect.

Removing one miner disposed Three.js Sprite geometry shared by all name tags. The [regression before the fix](../tools/out/crew-batching-badge-regression-before.log) records one shared-geometry disposal where zero was expected. Cleanup now disposes owned Mesh geometry and leaves the shared Sprite geometry intact, while still releasing each miner's name texture and material. Final native frames show tags after repeated removals and respawns. The ownership regression passes.

The final pairs are therefore deliberately not pixel-identical: tags return, and small body edge differences remain. The [decoded pixel report](../tools/out/crew-batching-pixels.json) records zero changed pixels for one miner and 4,324 to 9,747 for the other pairs, out of 1,440,000 each. It makes no timing claim.

## Verification and rejected fixtures

`node tools/test.mjs` ends with **COMPLETE 514 system checks passed** in [the full log](../tools/out/crew-batching-suite.log). Eight new regressions cover all eight profiles, actual posed instance matrices, all seven weapons, both native culling passes, same-frame camera turns, off-camera casters, finite shadow clipping, singleton fallback, departure/recolour/offline cleanup, portable world installation and shared sprite ownership. All 71 portable scripts compile.

The [source comparison](../tools/out/crew-batching-conservation.json) verifies only `src/render.js`, `src/crew-view.js` and version metadata differ from the frozen baseline. The miner factory, tool art, controller/input, HUD, Trystero and save scripts remain exact. All twelve captures use identical cameras and poses. Every fixture miner is settled by the actual Player controller and verified clear and supported.

Rejected captures remain reviewable. An incomplete inert network fixture ran unwanted background simulation, an uncontrolled resonator boot pose spoiled comparison, and an earlier placement left miners above the starter pit with a stale HUD crew count. These were fixture defects, not accepted proof. Reports remain in [the rejected fixture record](../tools/out/crew-batching-rejected-fixture.json), [animation record](../tools/out/crew-batching-rejected-animation.json) and [placement record](../tools/out/crew-batching-rejected-placement/rejection.json). A test initially used a degenerate shadow projection; its corrected version uses a finite displaced frustum.

## Critic judgment and remaining work

The repaired names and lower submission counts pass this checkpoint. The character art still repeats one face, body proportions and uniform protective equipment. Chest plates read as flat blocks, tool paint remains broad and clean, and the first-person auger exposes faceted construction. The poses remain stiff, the name text is small at this distance, and several rear miners overlap in the eight-miner fixture. Unchanged landscape surfaces and soft blotchy ground shadows remain visible weaknesses. Batching preserves those weaknesses; this is not a new art acceptance.

The preceding complete fossil campaign remains dated 2.44.0 at 532.9 simulated seconds. Public Trystero evidence remains dated 2.35.0. Physical Firefox mouse feel, separate-network traversal and quiet-machine timing remain unverified. No commit, push or deployment is included. The broader multiplayer, art, movement and performance goal remains active.

The [visual manifest](../tools/out/crew-batching-inspection.json) records 42 individually inspected files: 24 final native frames, sixteen slides, the hub and the portable capture. The [final audit](../tools/out/crew-batching-final-audit.json) retains the exact build hash and progress scope. Build and receipt URLs were [sent to the existing Firefox session](../tools/out/crew-batching-firefox-delivery.json) at 23:23:17 UTC on 2026-10-01; foreground visibility was not observed.
