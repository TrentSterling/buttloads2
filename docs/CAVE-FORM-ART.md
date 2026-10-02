# Native cave landmarks, local 2.39.0

The three chamber landmark families now have reconstructed native geometry: closed cupped shelves, folded chalk with a continuous pointed hem, and unequal faceted crystal prisms with clustered rock bases. The final cave inventory loses another 22 render meshes and adds 9,174 model triangles. **COMPLETE 451 system checks passed.** Quiet-machine FPS and physical Firefox mouse feel remain unverified under Trent's competing GPU workload.

## Construction and conservation

`src/cave-form-art.js` supplies indexed closed solids with normals, UVs and vertex colours. Shelves use a curved top, thick underside and scalloped rim; three small ribs follow the actual lower surface. Chalk folds and drips share one closed surface and one material, replacing separate pale ovals and rejected cone tips. Crystals use unequal facets, varied widths and terminations, smaller growths and four clustered stones in place of the single pedestal.

The original wall-ray conformance, family tags, random draw count, anchors, root positions and quaternions remain. Excavation still hides each entire supported formation. Original materials, lights and texture resources remain; colours are now complete on ribs and stones as well as the new mineral surfaces. Ordinary cave formations and 16 supported cavern batches are unchanged.

`verify-cave-form-conservation.mjs` establishes byte-exact attributes, indices, draw ranges, transforms, materials and shadow state for every other common/cavern/deep/discovery mesh against frozen 2.38.1 source. Terrain bytes, contacts, all support anchors, accent sites, ore and economy are exact. Other inventories remain 61 common meshes / 376,698 triangles, 37 cavern meshes / 17,695 triangles, 47 deep meshes / 15,140 triangles and 209 discovery meshes / 22,541 triangles. The excluded 33 landmarks contain the intended art changes.

## Measured geometry and submissions

| Native inventory | Before 2.38.1 | After 2.39.0 |
| --- | ---: | ---: |
| Cavern render meshes | 136 | 114 |
| Cavern model triangles | 83,519 | 92,693 |
| First shelf study, draws / triangles | 3 / 4,440 | 3 / 4,016 |
| First chalk study, draws / triangles | 3 / 1,172 | 1 / 2,152 |
| First crystal study, draws / triangles | 3 / 372 | 3 / 650 |

| Actual game fixture | Cached draws before / after | Cached triangles before / after |
| --- | ---: | ---: |
| Lantern room | 124 / 124 | 528,229 / 526,957 |
| Shelf close view | 77 / 77 | 423,117 / 422,693 |
| Chalk room | 89 / 83 | 515,550 / 519,970 |
| Chalk close view | 101 / 97 | 428,234 / 430,600 |
| Amethyst room | 82 / 81 | 393,163 / 394,131 |
| Crystal close view | 53 / 50 | 360,712 / 360,842 |

Cached draws save zero to six per game view; submitted triangles change by -1,272 to +4,420. Refreshed shadows save 20 to 26 further draws beyond cached savings, but add 6,922 to 11,134 shadow triangles. These are submission observations, not net frame-time results. The preceding pass's 446 removed meshes and earlier rigid pass's 388 removed meshes retain frozen comparisons in [BURIED-BATCHING.md](BURIED-BATCHING.md) and [MESH-MERGING.md](MESH-MERGING.md).

## Harsh review and rejected rounds

All sixty native frames were individually inspected: twelve baseline, twelve per rejected round, and twelve final. Six matched game cameras and six matched model-study cameras use seed 260923, fixed time/light, frozen simulation and a 1440 by 1000 viewport. The fixture intentionally does not update cached HUD depth after direct teleports; it stays 15.6 in all paired game frames. No gameplay input, pointer lock or timing is involved.

1. Round one fails: thick rims read as crackers, chalk has separate fangs, and crystals remain dark and regular. Cavern model cost reaches 109,083 triangles.
2. Round two fails: duplicated undersides create sandwich stripes and raise cavern cost to 146,461 triangles. Chalk still has separate coloured cones; crystals retain the plain dark base.
3. Round three fails: cheaper caps reduce cost to 100,657 triangles, but ribs hang below them, cones remain separate despite matching materials, and crystal roots float ahead of buried stones. An attribute test also fails on missing rib/stone colours; final sources fill them.
4. Final checkpoint: attached ribs, integrated hems and embedded crystal roots correct those defects. This is an incremental checkpoint. Shelves retain broad plate faces and repeated four-cap layouts. Chalk still resembles cloth and loses contrast in the headlamp. Crystal fans and broad facets remain repetitive. Ordinary white spikes, triangular wall shading and primitive salvage/rootway/vault/heart assets remain criticism.

## Verification and delivery

`node tools/test.mjs` ends with **COMPLETE 451 system checks passed** in [the full log](../tools/out/system-cave-form.log). Four new checks cover closed manifold topology and oriented volume across four seeds, opposite-side visibility, complete attributes, supported batching and geometry budgets. Seven existing underground contracts still cover clear routes, excavation/reload, headlamp aim/shadows, accent occlusion, repair glow, moving machines and rendering purity.

The [seventeen-slide review](../tools/out/cave-form-review.html) retains twelve matched comparisons, three rejected stages, costs and criticism. Guarded evaluation verifies decoded images, visible navigation, zero exceptions and no pointer lock. Current portable aim and interpolated capsule translation agree exactly on the RTX 5070 Ti D3D11 renderer. The [twenty-nine-section hub](../tools/out/current-review.html) has no horizontal overflow; its checked comparison is 719 pixels wide and navigation fits the 897-pixel child viewport.

Current build SHA-256: `52bd8d71a7d284ff09d31626a04b0b8df49ebe18dfc36a38c831e666081e8906`. Frozen baseline: `8bd1d5ebb4944ce88e6fefebadbc580d0d830aedca126b95a515c5a870b99cd1`. The portable compiles 69 scripts and retains protocol 3, `ridge-common-v3` and `crew-global-v3`. Public WebRTC evidence remains dated 2.35.0; separate-network traversal is unverified. The current build and receipt hub were sent to the existing Firefox instance through standard new-tab delivery; no window activation was requested and foreground visibility remains unverified. No push or deployment. The broader improvement goal remains active.

- [Frozen baseline](../tools/out/cave-form-before/report.json)
- [Frozen final](../tools/out/cave-form-release/report.json)
- [Conservation](../tools/out/cave-form-conservation.json)
- [Current camera check](../tools/out/cave-form-build-report.json)
- [Deck check](../tools/out/cave-form-review-report.json)
- [Hub check](../tools/out/cave-form-hub-report.json)

- [Visual inspection record](../tools/out/cave-form-inspection.json)
