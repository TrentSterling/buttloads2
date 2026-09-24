# Shale Crawlers, local 2.15.0

Three armored ground creatures now occupy lower-mine chambers near 91, 177 and 220 m. This gives the lower workings a different encounter from the upper cinder moths, with an equipment reward that connects the mine to Otis's workshop. Existing town, rescue, station and furnace progression remains included. This is a local checkpoint; the published version remains 2.8.0.

## Encounter and excavation

A crawler has 110 health and 90 shell strength. Front and side hits strike its shell first; the hard-rock lance and explosives break it quickly. Rear strikes bypass the shell and deal 1.25 times normal damage. Shell break briefly staggers it and exposes the orange body. Resonance, rifts and blasts also stagger; an unarmored crawler can be staggered by an axe and drawn with gravity.

Raised claws and a shrinking ground ring signal a 0.95-second windup. The following 0.42-second charge follows its stored direction, allowing a sidestep or lift dodge. A hit deals 24 damage through the existing one-second player damage grace period. The creature recovers for 1.35 seconds. Armor slows its ordinary movement from 2 to 1.35 m/s. Encounters remain local to their home chambers and do not chase players into town.

The full 1.8 x 1 x 1.8 m body uses terrain sampling, swept contact and supported steps. A bounded local A* search finds routes around rock; every actual movement remains checked against current terrain and machinery. Crawlers can step over low irregularities but cannot deliberately walk across unsupported gaps. Removing their floor causes a swept fall, interrupts an attack and inflicts landing damage on an encountered creature. Their initial settling before discovery does not damage them. Corpses also fall when undermined and remain physical obstacles. Freight checks these bodies before moving its cage.

Cleared creatures stay cleared. E collects one basalt tooth per corpse and up to three blasting charges. Supplies that exceed the pouch limit remain in the shell; the tooth can still be collected with a full pouch. M records discovered creatures and unclaimed rewards. Field notes and the threat HUD explain shell damage, the rear opening and the claw tell.

## Equipment and town

After the first tooth, Otis offers an impact axe head for $240. The purchase is permanent and cannot charge twice. It changes axe damage from 34 to 52 and doubles axe terrain-cutting strength without changing reach, swing timing or supply use. The tool model gains a basalt edge and fitting; the HUD and field kit identify the modification. Lower-mine station gearing still combines with it.

`src/crawlers.js` owns navigation, physics, attacks, armor, loot and equipment state. `src/crawler-view.js` builds the original procedural shell, body, legs, claws, eyes, attack ring and tool fitting. Shared actions, pulses and blast records route through `Combat.hit`; crawlers have distinct IDs to preserve once-per-explosion damage. Rendering does not advance simulation.

## Persistence and evidence

The additive `expedition.crawlers` record saves positions, velocities, health, armor, phase, timer, facing, committed attack direction, last sighting, discovery, tooth recovery, unclaimed charges and the purchased head. Validation rejects non-finite values, malformed directions, bodies in rock, inconsistent loot and unearned upgrades. Remembered player sightings allow the player's narrower clearance at the claim edge. Older saves initialize the encounters without changing a terrain sample or existing mineral ledger.

All 218 aggregate checks passed. The 12 focused crawler checks passed again after widening only the remembered-sighting validator to accept a player at x=13.4 while keeping crawler bounds unchanged. Tests cover shared tool targeting, shell/rear distinctions, committed attacks and dodging, supported detours, gap rejection, swept falls and landing damage, blast occlusion/deduplication, partial rewards, paid modification, actual excavation strength, mid-windup saves at 30/60/120 Hz, Game/town callbacks, HUD, model containment and old-claim retention.

`node tools/simulate-journey.mjs --crawlers --foreman` completed from a fresh claim using earned equipment and ordinary actions. It recovered the first tooth at 313.1 simulated seconds, bought/reloaded the head and used Otis's return service at 326.1, collected the other teeth at 387.1 and 428.4, restored the final station at 452.6, defeated the furnace and used/reloaded the bore at 492.6, and returned to the powered common at 511.3. It also completed the upper machinery, seal, heart and geodes. No fixture shafts, direct teleports or free resources were used. These timings reflect coordinate-aware automation, not human playtime or difficulty.

An early pilot continued drilling while a crawler attacked, was rescued and later targeted the previous station instead of the next one. The corrected pilot notices nearby creatures, fights with lance/axe, then verifies the station ID before interacting. An isolated test caught landing velocity being cleared before fall damage; the final simulation now applies impact damage first.

Generated evidence: `tools/out/verification-2.15.log`, `tools/out/journey-crawlers.json` and `tools/out/crawler-projection.png`. The projection uses the actual model, but is not a WebGL screenshot. No browser, real audio device or OS input was used. Visual quality, browser layout, sound and human combat feel remain unreviewed under AGENTS.md. Further structures, surface parcels and enemy types remain in BEAUTY-DEPTH-COMBAT-PLAN.md.
