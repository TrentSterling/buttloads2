# Bring Inez home, local 2.14.0

Inez Rook is stranded in a survey bell at (8, -23, 8). Mara can mark the last known position on the mine survey. F also detects the bell. Expose the front intercom and press E to speak; excavate the whole housing before fitting one work-light cell to power its winch.

The bell is 1.5 m wide and 2.5 m high. Its existing cable and safety brake suspend it from a surface cantilever on the protected rim. It does not float freely when undermined. The powered winch lifts at 2 m/s, stops against actual rock, the player or large equipment, and resumes after the obstruction clears. An orange marker identifies the rock contact. E at the intercom can hold/resume the winch without spending another cell. Excavation tools and explosives cannot injure the occupant. The bell has no timer or failure penalty.

When the whole capsule reaches the surface, Inez relocates to the survey office west of the common. The empty bell stays at the yard. Her character, office light, desk chart and open sign appear; Mara and Otis have new conversation. The office's entrance and furniture exist before rescue, but the surveyor and her collision/interaction do not. The staffed office has three services:

- A $40 mineral survey marks an unscanned, uncollected seam on M. It selects real remaining deposits, no more than 12 m beyond the deepest point reached, and respects the sealed floor. Funds and available minerals are checked again when purchasing. Maps neither excavate nor grant ore.
- Reading the old survey reveals one previously unknown optional structure. This marks its actual location and field notes; its puzzle and reward remain uncompleted.
- Open the latest purchased chart at its deposit's depth.

Town callbacks require the active conversation and actual reach/visibility. Leaving the panel makes stale purchase callbacks ineffective. Inez has an original helmet/headlamp model, blue coat and portrait. The bell has an intercom, glazing, rails, motor and cable, plus an occluded local lamp. Render updates follow simulation state without advancing it.

## Persistence

`expedition.rescue` is additive version 1: `known`, `met`, `phase`, `y`, and the latest chart's deposit ID. The only phases are stranded, hoisting, held and rescued. The bell's x/z and limits are authored constants. Full-volume terrain validation rejects active capsules in rock; rescue requires the final height and an established introduction. Purchased chart IDs must exist in the saved mineral survey. Town history cannot contain Inez or rescue reactions without the completed rescue.

Older claims receive a stranded capsule and an empty office without changes to the terrain field, deposited mineral IDs, money or inventory. The installation's existing collision fallback handles a saved player position overlapping new machinery. Neither the rescue nor NPC arrival rerolls caves. The winch pauses with the game and resumes from its saved height after import/reload.

## Verification

`node tools/test.mjs` passes 206 system checks, including 11 rescue checks. The focused rescue suite additionally checks actual model bounds against the physical bell. Cases cover real E/button bindings, input cancellation, missing supplies, full-body exposure and ascent, rock/player/equipment obstruction, frame-rate equivalence, paused/mid-lift saves, office traversal, economy and chart effects, stale callbacks, contradictory snapshots, exact old terrain retention, and render isolation.

`node tools/simulate-journey.mjs --rescue` completes a fresh claim in 326.5 simulated seconds. It earns the first upgrades, excavates and raises Inez at 25.6 seconds, walks through the town, sells the recovered haul, buys/reloads a chart at 48.2 seconds, then completes the original machinery, seal, heart and geode progression. It uses production tools, controls, transactions, ordinary recall and saves. No fixture tunnels, free money or direct player teleports. Early pilot failures were navigation errors: a straight line into the old shed, an arrival tolerance smaller than its steering deadzone, and a route through a lamp post. The final pilot walks around them. Coordinate knowledge and precise aim make these reachability timings, not estimates of human play length.

`tools/out/rescue-projection.png` is an inspected projection of the actual mesh geometry. It establishes proportions and placement, not WebGL lighting, glass, texture rendering, layout or visual quality in the browser. The inert harness never starts a browser or acquires OS input. Human gameplay and audiovisual review remain outstanding.

This checkpoint adds one rescue and a useful third resident. Further structures, enemy variety, parcels and the broader beauty work remain in BEAUTY-DEPTH-COMBAT-PLAN.md. The live site remains 2.8.0 until publication.
