# Public crew compatibility, local 2.28.2

The [six-slide review](../tools/out/crew-compat-review.html) records a reproduced co-op movement defect. Before this fix, a preserved 2.28.0 tab and a current 2.28.1 miner joined the same public room under protocol 1. The oldest tab could own simulation despite using a solid well blocker and no shared bench seat contact.

Identical production capsule input for 1.5 seconds puts the old host at z=44.40 and the current guest at z=41.76. The 2.63 m difference exceeds the production guest's 2.5 m teleport threshold. Passing these endpoints to `Crew.updateGuest` reproduces a 2.63 m position correction through the visible seat. This probe deliberately bypasses admission to isolate the existing correction behavior. It does not establish that mixed builds caused Trent's physical Firefox mouse complaint.

## Change

Simulation compatibility generation 2 uses protocol 2, public room `ridge-common-v2` and crew save slot `crew-global-v2`. Bundled Trystero still joins automatically; there is no room-code step. The existing app ID, trackers, STUN configuration, transport actions and personal `current` slot remain in use. Explicit test-room overrides retain protocol admission, so overriding the room cannot make an older hello or teleport packet valid.

Generation changes cover incompatible prediction or static contact as well as wire changes. Cosmetic art changes should retain the generation. Older builds continue in their earlier crew; current builds elect and replicate among compatible miners.

Startup prefers the current crew save, then reads the prior `crew-global-v1` claim if the new slot is absent. Validation and production install retain its density field and funds. Future writes use the new slot. The old crew and personal slots are retained, so stale tabs cannot overwrite the new crew's saves.

## Evidence

- [Before replay](../tools/out/crew-compat/before.json): the current protocol-1 miner accepts the older hello and elects the older host; paired contact differs by 2.63 m.
- [After replay](../tools/out/crew-compat/after.json): the older hello is rejected and the current miner retains authority. Current/current capsule endpoints match exactly. Production reconciliation reproduces the underlying teleport when admission is deliberately bypassed.
- `node tools/test-crew-compat.mjs`: five checks pass. Two production Crew instances automatically join the current room, compress/install the exact excavated field and funds, acknowledge transfer, use identical bench contact, and migrate authority. Old and current save selection run through production `Game.boot` and `Crew.start`.
- `node tools/test.mjs`: **COMPLETE 376 system checks passed**. [Full log](../tools/out/system-compat.log).
- `node tools/build.mjs`: portable 1356 KiB, 65 scripts compile, no external scripts or stylesheets. [Current release hash](../tools/out/crew-compat/release.json).
- [Presentation verification](../tools/out/crew-compat-review-report.json): all six slides render, their navigation stays in the viewport, zero runtime errors and no pointer lock. Each slide was visually inspected. [Portable verification](../tools/out/movement-build-2.28.2-report.json) confirms version 2.28.2, protocol 2, the current room/save slot, immediate aim and interpolated translation; its build hash matches the release record.

The transport integration uses an inert Trystero-shaped room implementation in Node. This is evidence for game admission, snapshots, contact, persistence and migration; earlier public WebRTC receipts remain dated evidence. No new public-internet test, full fossil campaign or physical mouse test is claimed here. The prior art and performance measurements remain dated 2.28.1 in their separate review tab. No push or deployment is part of this checkpoint.

Physical Firefox mouse delivery and human movement feel remain open for play review. The powered-well beacon, repeated conifers, sparse slopes, old outcrops and simple garden flowers remain open art findings. The broader improvement goal stays active.
