# Field kit audit, 2.8.0

The redesign-existing-projects skill guided this source audit. The game keeps vanilla CSS, local assets, its existing colors and system fonts. No new framework, font service or runtime dependency was added. Procedural game colors continue to distinguish minerals and equipment.

## Findings and changes

| Source finding | Change |
| --- | --- |
| Live readout repeated long descriptions alongside all tool and charge slots. | Compact live equipment strip; descriptions and charge choices in the paused I field kit. |
| Locked magical tools were visible at the start. | HUD and kit reveal owned tools only; next stratum remains a visible prospect. |
| Mechanical tools displayed an unused charge meter. | Meter shown only for resonance and the heart. |
| Touch exposed the anchor before its recovery and a tool cycle with only one tool. | Those actions appear when useful; unavailable interactions are disabled. |
| New controls relied on workshop/about text and remembered hotkeys. | Optional contextual tips, successful-action retirement, Y dismissal and a saved opt-out setting. |
| A clickable dismissal alone would be unusable with captured mouse look. | Y dismisses the current tip while leaving movement and firing intact. |
| Tool descriptions and selection were awkward to inspect while digging. | Kit pauses the mine and supports buttons plus 1?5/X/N without resuming. |
| Existing media rules stacked ever-taller panels over the center of the view. | New HUD layout rules reserve the center for aiming/interaction and adapt coarse input separately. Actual viewport review remains unverified. |
| Cut label stayed unchanged for magical tools. | Cut, Pulse and Draw labels follow the equipped tool. |

## Evidence and limits

Ten focused tests exercise production Game callbacks with an inert DOM. They cover unlocks, keyboard and button selection, cancellation of held bombs and freight placement, pause/resume state, no automatic resumption on selection, tip priorities, dismissal during firing, failed-deployment behavior, save migration, malformed history and touch wording.

This audit does not claim pixel or browser-layout validation. No browser or OS input automation was used. The desired human review covers 1440x900 desktop, 1280x720 laptop, narrow desktop windows, and coarse-input portrait/landscape states at the first haul, 9 m, engine recovery and awakening. Check readable text, useful click targets and separation of equipment, telemetry, scan results, interactions and touch controls. The broad game goal remains open for visual review and play feedback.
