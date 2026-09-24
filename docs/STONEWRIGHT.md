# Stonewright workshop and mineral sling

Local 2.16.0 adds a buried workshop and a tool that turns detached minerals into physical projectiles. The published site remains 2.8.0. Existing terrain, mineral IDs, collected inventory and earlier discoveries are retained.

## Discover and recover

The workshop sits in the second lower cave, around 134 m. Otis offers a lead after the rootway opens. F detects its frame; visible exploration discovers it; M retains its marker. The bench is a physical 4.2 x 2.4 x 1.5 m body. Removing its support makes the whole assembly fall, including its field coils, console, light and scanner marker.

Uncover both field coils and aim the resonator at each. Rock blocks the connection and the rootway must be open. Charged coils glow mint. Clear the entire frame, then use E at its front console to recover the sling. This is a permanent equipment reward with no supply cost. Reusing the console cannot repeat the reward. The journal and field kit explain the controls.

## Throw the ore you found

Equip with 7. Aim at an exposed, detached mineral within 8 m and hold the primary trigger. The field pulls it toward a point 2.15 m in front of the player at up to 12 m/s. It reaches full charge after 0.85 seconds. Release to launch at 12 to 24 m/s, with normal gravity. A pair of rings follows the actual mineral; the tool's forks and charge meter show its charge. The field turns amber and displays a clearance hint when rock or machinery blocks the hold.

The sling moves the existing mineral. It does not consume cargo or manufacture copies. A held or active projectile cannot be automatically collected. After impact, the same mineral can be collected and sold. Selecting another tool, pausing, recalling or canceling touch releases the grip without firing. A normal touch release fires before pointer capture ends. Blasts break a grip before applying their impulse.

Movement uses the existing 120 Hz ore solver and the mineral's actual contact shape. Holding sweeps through terrain and machinery; it cannot pull an ore body through a wall. Projectile sweeps stop at terrain, equipment or a creature, whichever is first. Creature hits also require a clear line to the body. One flight can damage once, then returns to ordinary loose-ore motion. Up to six flights may coexist; each expires after three seconds.

Impact damage scales with speed, capped at 78. Crawlers take increased shell damage from kinetic impacts; their exposed rear retains its existing damage rule. Exposed furnace locks also accept physical hits. Friendly residents and town equipment are obstacles, not damage targets.

## Persistence and integration

`src/kinetics.js` owns recovery, targeting, holding, flight, collision and save validation. `src/kinetic-view.js` owns the procedural bench, recovered tool and holding-field visuals. Rendering advances no gameplay state. The workshop's model bounds are checked against its collision body.

Additive `expedition.kinetics` state records discovery, charged coils, recovered equipment, bench movement, the held mineral and active flight timers. Physical mineral transforms remain in the existing loose-ore snapshot. Import validates IDs, timers, unlock prerequisites, held distance/velocity, duplicate projectiles and bench clearance before installation. Loading a held save releases the rock; loading a flight continues that same projectile. Older saves initialize the workshop without changing a terrain sample or an existing ore ID.

The Game loop reserves aimed ammunition from pickup, supplies physical obstacles, routes kinetic hits through the existing combat system and dispatches feedback. Ore-system hooks add held movement, swept projectile contact and terrain impact without changing the unhooked charge-preview solver. The explosive impulse hook drops a held mineral before the velocity changes, keeping an immediately saved claim valid.

## Evidence and limits

The aggregate suite passed 234 system checks, including 16 kinetic checks. Coverage includes real resonator acquisition, buried/occluded coils, terrain and equipment shielding, one-hit damage, collectible mineral identity, armor, furnace locks, 30/60/120 Hz equivalence, midflight saves, held-save restoration, blast interruption, real pause/tool/touch input paths, falling workshop geometry, old terrain retention and invalid-state rejection.

An actual Three.js geometry projection was inspected for the bench and gauntlet. It is not a WebGL screenshot. Browser appearance, rendered lighting, audio playback, human aiming and combat feel remain unreviewed under the session's input restriction.

The complete fresh-claim route is run with `node tools/simulate-journey.mjs --kinetics --foreman`. See VERIFICATION.md for the final checkpoint result. The pilot knows coordinates; simulated seconds do not estimate human playtime.
