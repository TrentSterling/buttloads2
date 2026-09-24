# Eastcut: a neighboring claim

Local 2.17.0 adds a land purchase at Vale Supply. The published site remains 2.8.0. Older claims retain their exact original terrain, mineral IDs, inventory and discoveries.

## Buy and explore

Recover the resonance engine, visit Mara in Ridge Common and buy the Eastcut deed for $1,500. Claim 03 occupies 32 by 12 metres immediately east of the original claim, north of the eastern road. Its board and pale markers identify it before purchase. Walking is allowed before ownership; excavation and equipment deployment require the deed. After purchase the markers change to yellow and black and the board's lamp lights up. The road remains common land.

The parcel adds 384 square metres, 348 minerals in 58 seams, and three connected cave chambers around 18, 35 and 58 metres. Iron gives way to silver, gold and prism. Eastcut has shallow bedrock at 73 metres; Claim 02 retains its deeper rootway and 297 metre continuation. The join between claims can be excavated wherever they share an owned boundary.

Lamps, explosives, minerals, return anchors, the scanner, both survey panes and cargo recovery work in the new ground. The crane gantry extends to a protected support at the parcel's eastern edge. Existing shipments retain their cage position and cargo when the deed is bought; they continue to the extended depot. Both old and new ore use the same inventory and sale ledger.

Purchasing suspends gameplay and further town transactions while terrain builds. Repeated purchases cannot charge twice. A failed construction restores the old claim without charging the deed price. Buying does not replace the world with a new seed.

## Terrain and saves

`src/parcels.js` defines ownership, seeded caves and appended deposits. `src/parcel-view.js` builds the board, ownership markers and temporary surface cap for unowned land. World, freight, equipment, survey, town and persistence share the ownership query.

The original 65 x 613 x 65 field is retained. The annex adds a separate 64 x 165 x 65 field covering x=16.5..48, y=-80..2 and z=-16..16. Original columns own the shared x=16 sample plane. Meshing and edits read both buffers through the same sample function, with chunk halos across the join. The shallow annex avoids allocating another full 304 metre column of terrain.

An additive `parcelVersion: 1` and `parcelField` in the v2 snapshot record the purchase and excavation. Version zero or absent means unowned. Original mineral IDs retain their order; annex nodes append after all previous deposits. Survey IDs also append after the old main-mine range. Import validates the field size, finite samples, purchase prerequisites, physical bodies and full inventory ledger before installation.

Loose minerals and deployed equipment share the surface's physical horizontal bounds, keeping outward throws reachable. Their saves admit the full surface area and a 48 metre ceiling instead of the old 24 metre width and 20 metre height limits. Ordinary mining, projectile motion and collection retain their existing solver and identities.

## Verification and limits

Run `node tools/test-parcels.mjs` for focused checks and `node tools/test.mjs` for regressions. Coverage includes original terrain and ore preservation, payment/concurrency/rollback, connected full-body cave routes across three seeds, seam/cold-remesh equivalence, protected roads/rim/floor, ore gravity and once-only sales, equipment/chart reloads, corrupt saves, freight, recovery caches, old claims, purchases mid-shipment and surface throws.

`node tools/simulate-journey.mjs --parcel` starts from a fresh claim, completes the upper campaign to earn money and equipment, walks to Mara, buys the deed, visits Otis, mines Eastcut, reaches a natural chamber, places and reloads a lamp and anchor, places a freight dock, excavates its shaft, reloads the shipment, sells at Mara and returns to the anchor. It uses production input and services, with no fixture excavation, free money or direct teleports. The pilot knows coordinates; simulated duration is not a human pacing estimate.

Tests use an inert scene and DOM. An offline projection of actual scene triangles checks the plot's arrangement, but cannot certify WebGL lighting, sign textures or play feel. See VERIFICATION.md for results. The broader beauty, resident and underground discovery work remains in BEAUTY-DEPTH-COMBAT-PLAN.md.
