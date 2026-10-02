# Mine asset construction, local 2.40.0

The survey flywheel and resonance engine now have open structural frames, shaft collars, bearings, fasteners, gauges, lifting mounts and connected hoses. The rootway uses separate wedge stones, iron lining, layered iris blades, short inlays and rooted cords. Three sealed vaults have closed chipped shells with visible mineral fissures; their egg, flattened radial growth and upright crown differ. The living heart has solid curved leaves, surface-attached veins and a formed stem around its luminous core.

The [matched review](../tools/out/mine-asset-review.html) retains eighteen native before/after views: fourteen isolated front/side studies and four exposed-room game fixtures. Those room fixtures carve space around the original objects and stop simulation; they establish native appearance under the existing headlamp, not traversal or physical input. Cameras, seed, viewport and lighting remain fixed. The original terrain, interaction coordinates, collision volumes, recovery rewards and opening/collection rules remain.

## Critic findings and rejected work

Round one improves construction but fails: the engine's lifting eyes float above missing crossmembers, heart veins drift off their leaves, vaults are too similar, and the seven models cost 37,508 triangles. The [eighteen-frame report and frozen build](../tools/out/mine-asset-round-1/report.json) remain. Planar chamfers and lower annulus sampling replace excessive curved bevel detail. Crossmembers join both engine rails, and the vault proportions and mineral growth differ.

Round two still costs 22,486 triangles, exceeding the 22,000 cap. Its tube sampling bridges leaf crease knots, with measured radial segment-centre separation reaching 11.8 mm. The [rejected report and build](../tools/out/mine-asset-round-2/report.json) remain. Final veins sample each crease knot; ray checks inspect the actual tube segment centres between every ring. Six-sided cross-sections trim small tubes without removing their closed caps.

All seventy-two stage frames are inspected. Four byte-identical baseline vault images reuse the inspected front and side images; their SHA-256 equality is recorded in the inspection receipt. All final eighteen views are separately inspected. The release still has faults:

- Machines are overly pristine and regular. The engine's rear console is a plain panel, and its metal becomes dark under the headlamp.
- Rootway wedges and spokes are evenly divided; the gate remains thin, and nearby ore partly obscures it.
- Vaults share broad triangular plate construction. Blue growth can read as studs, with a weak star silhouette. The mine fixture partially occludes the upright seed.
- The heart is too symmetric, with a bright simple core and cage-like gaps between its leaves.
- Ordinary cave spikes and other underground machinery, crane and creature construction still need a separate critic pass.

## Geometry and submission cost

All rigid components merge per material within their original seven independent roots. The [construction inventory](../tools/out/mine-asset-mesh-cost.json) measures 294 authored pieces consolidated into 28 meshes. The previous freight and supported-growth merge changes remain exact.

| Native root | Before meshes / triangles | Final meshes / triangles |
|---|---:|---:|
| Rootway | 2 / 864 | 6 / 2,724 |
| Flywheel | 5 / 564 | 6 / 4,688 |
| Resonance engine | 5 / 1,572 | 7 / 7,948 |
| Amber egg | 2 / 1,232 | 2 / 620 |
| Drowned star | 2 / 1,232 | 2 / 850 |
| Tomorrow seed | 2 / 1,232 | 2 / 758 |
| Living heart | 2 / 2,168 | 3 / 4,250 |
| Total | 20 / 8,864 | 28 / 21,838 |

The art adds eight meshes and 12,974 model triangles relative to 2.39.1. Its construction cost drops by 15,670 triangles from round one. No lights, textures, transparent layers or external models are added.

| Frozen exposed-room observation | Cached draw delta | Cached triangle delta | Refresh draw delta | Refresh triangle delta |
|---|---:|---:|---:|---:|
| Flywheel | +1 | +4,124 | +22 | +30,062 |
| Engine | +2 | +6,376 | +24 | +35,622 |
| Geode | +3 | +870 | +24 | +23,058 |
| Heart and rootway | +5 | +3,468 | +34 | +32,534 |

Refresh totals include the camera pass and shadow updates. Wider bounds and newly shadow-casting art also affect submitted triangles. These are native submission counts, not frame timings. Trent reports a competing Claude/Qwen GPU workload; quiet-machine FPS and attribution remain unverified.

## Verification and scope

Six [pure native contracts](../tools/out/mine-asset-contracts.log) pass: outward closed geometry; actual crease/tube attachment; salvage collider bounds and whole-body travel; complete finite mapped/coloured attributes and cost; independent vault/heart/rootway state; and disposal/rebuild with current state reapplied. The [full suite](../tools/out/system-mine-asset.log) ends with `COMPLETE 461 system checks passed`.

The [conservation receipt](../tools/out/mine-asset-conservation.json) compares frozen 2.39.1 sources with current sources. Every other mesh attribute, index, draw range, transform, material/shadow flag and light in the common, cavern, deep and discovery scenes remains exact. Terrain bytes, contacts, all support anchors, ore, economy and the seven root poses/state remain exact. The sixteen cave, nineteen deep and ten expedition support batches remain intact.

The portable [release report](../tools/out/mine-asset-release/report.json) hashes `dist/index.html` as `19e24d0c09d86e8f536ef6b2b9441abea838b4ddd6f4d734a13550f81cc0ac14`; seventy scripts compile with no external scripts or stylesheets. Final build, source copies, camera records and rejected builds remain in the receipts. Guarded captures have zero errors, keys, firing or pointer lock.

Physical Firefox movement feel, quiet-machine timing and co-op across separate networks remain open. Public Trystero evidence remains dated 2.35.0. No push or deployment is part of this checkpoint; the broader improvement goal remains active.
