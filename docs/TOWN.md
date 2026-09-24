# Ridge Common, local 2.14.0

The first town checkpoint added an expanded surface and two functional residents. Local 2.12.0 also includes cave networks, combat and deeper regions. Otis now offers free return travel to restored lower stations; both residents react to opening the rootway and repairing machinery. See DEEP-WORKINGS.md. Local 2.13.0 adds the furnace victory: a powered well and road, new merchant reactions and the earned foundry bore. Local 2.14.0 adds Inez Rook: rescue her survey bell to reopen the survey office and gain mineral charts and discovery leads. See RESCUE.md. Further residents and parcels remain outstanding under BEAUTY-DEPTH-COMBAT-PLAN.md. The deployed site remains 2.8.0 until a later publish.

## Surface and services

The walkable surface spans x -58 to 58 and z -50 to 68 metres. The existing 28 m excavation square remains the owned claim. Gate openings lead through the old yard fences onto common footpaths. A road beyond the headframe reaches two shops, a common with a well and benches, and a survey office staffed by Inez after her rescue. Property signs explain where walking is allowed and excavation is not. Other claims are scenery for now; purchases are not implemented.

Vale Supply stands at (-9, 36), Bell Works at (19, 37). Both have enterable doors, counters, shelves and residents. Mara Vale sells existing charge/light packs and buys carried minerals plus delivered freight through the existing inventory ledger. Otis Bell sells the existing equipment upgrades and gated freight rig/cage. The claim-side workshop and hopper remain usable. No prices, mining unlocks or campaign rewards were changed.

Approach a resident, aim and press E. Conversations pause the game and clear held movement, firing and throws. Closing returns to play through the existing human input path. Talking requires reach, aim, terrain visibility and a clear line through building obstacles. Walls and counters have shared geometry/collision definitions. Stale service buttons cannot transact after leaving the conversation; actual economy methods recheck funds and unlocks.

Residents have distinct procedural models and vector portraits, idle poses, head turns and blinking. Dialogue reacts to introductions, first sales, the flywheel, the engine, the awakening and the final recoveries. Advice explains existing actions instead of adding quotas. Town history saves under expedition.town; older claims gain empty history without resetting their field, inventories or discoveries. Positions outside the former yard bounds now validate and restore.

## Visual audit and design

The existing surface had one service shed, perimeter scenery and a movement boundary close to the yard. This made the setting feel like a fenced test area and offered no inhabitants. New roads, readable shop fronts, framed windows, weatherboards, porches, stock shelves, warm interior lamps, roof ribs and chimneys add scale and landmarks. Two shop colors distinguish services while keeping the game's warm metal and timber palette. Existing trees are excluded from the new streets and building sites; remaining nearby trunks have collision.

The redesign-existing-projects skill informed the service-panel pass. It retains vanilla CSS and the local type palette. A character portrait and dialogue lead the panel; the cash/supply ledger and enabled/disabled service buttons sit below. Name, role, conversation topics, prices, empty cargo and completed upgrades have explicit states. The panel scrolls within the viewport and has narrow/short-screen rules. Focus rings and an explicit return button remain available.

Offline projected-geometry previews in tools/out/town-street.png and town-mara.png were inspected for proportions and model placement. They use actual Three.js mesh geometry projected into a Pillow image, without starting a browser. They omit textures, proper clipping, shadows and WebGL shading, so they do not certify the game's rendered appearance. Browser visual and sound review remain outstanding under AGENTS.md. No OS input, browser focus or pointer-lock automation was used.

## Validation

The focused town suite exercises actual Game construction; finite geometry; walking through both doors and back to the claim; surface gates and protection of unowned soil; wall/counter/roof/resident collision; aim/reach/occluded interactions; the production E binding and input cancellation; real supplies, upgrades and sales; freight gates; stale buttons; progression dialogue; expanded-position portable saves; exact terrain retention; older-save migration; malformed history rejection; and render-state isolation.

The combined thunderstone/freight/mysteries pilot completes the original campaign in 386.7 simulated seconds with the town installed. This is an automated route with coordinate knowledge, not a human pacing estimate. A legacy concrete check classified every horizontal face as a top face; its new normal filter retains the intended ground-flicker assertion while allowing the well's downward-facing underside.

The following local 2.10.0 checkpoint adds persistent pre-existing caves and survey cabinets; see CAVERNS.md. Tool damage and deeper-descent foundations remain next. Do not treat the town or cave checkpoints as completion of the broad game-improvement goal.
