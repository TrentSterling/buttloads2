# Buttloads 2: remake direction

Requested by Trent, September 2026. This replaces the first playable's implementation. HANDOFF.md remains historical context; the current user request overrides its old prohibition on rewriting systems.

## Research and design decisions

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
