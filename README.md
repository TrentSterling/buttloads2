# BUTTLOADS 2

First-person digging prototype. Excavate a small backyard claim, expose and collect copper, iron and crystal, sell at the hopper, upgrade the cutter, bag and scanner, and reach the buried signal.

Play: https://tront.xyz/buttloads2/

Spiritual successor to [BUTTLOADS!](https://tront.xyz/blog/posts/bacon-game-jam-buttloads/), the 2015 Motherload-style jam game. That one was 3D models on 2D gameplay. This time you are inside the hole.

- Single HTML file, Three.js r140 embedded, no build step, no CDN.
- Terrain is a density field meshed with incremental Surface Nets, adapted from [Terrain Lab](https://tront.xyz/terrainlab/).
- Saves in IndexedDB plus JSON export and import. Saves are the current field and resource state, not an undo history.
- Early prototype. The question it exists to answer: after the first sale and upgrade, do you want to go back down?

Controls: WASD move, Shift run, hold left mouse to dig, Space jump or lift, E interact, F scan, Esc menu.

`HANDOFF.md` carries the design notes and the rules inherited from Terrain Lab (no brush rate limits, held trigger survives ray misses, weak starter gear still feels responsive).

`tools/og-shot.mjs` renders the social image headlessly through Chrome DevTools Protocol.

Game code MIT, Trent Sterling. Three.js MIT, Three.js authors.
