# R4 cave materials and embedded ore

Status: pushed to `codex/cave-geology-20261017`, draft PR #1; not merged into main.

## Exact playable checkpoint

- Rendering commit: `be98ff9e5fe185a973295185c50e0772fcba2c3f`.
- `src/beauty.js` blob: `4065f2b164376ec53de4b924777a5189303a13d2`.
- Complete standalone size: 1,598,324 bytes.
- Standalone SHA-256: `d61255932db1a0b616abd4bb7e06cb640f47e20e2922fd3d082038d569828201`.
- Native build/capture run: https://github.com/TrentSterling/buttloads2/actions/runs/39115377143
- Native artifact: `buttloads2-cave-native`, ID `12131829802` (Actions retention is three days; a copy was delivered in the conversation).
- Shipped comparison baseline: `a28fa21085ddcf30e9d7f77cec74fd99e3657b2b`, version 2.64.0.

## Reference

The user supplied the actual 53.568-second MrCollison clip, `sP5Z8U1j1Xgjq0gS.mp4`. Frames including 17.5 and 37.5 seconds were inspected. The target is dense cellular/faceted mineral stone, directional wet highlights, embedded ore pockets, a focused player light and darker surrounding space—not just fine rock noise.

Reference posts:
- https://x.com/MrCollison/status/2110845251950981465
- https://x.com/MrCollison/status/2111200252136968330

This is original procedural code. No source, texture or mesh from that project was imported. The earlier claim of adapting visible footage before obtaining the clip was incorrect. Historical R3 work is documented separately in CAVE-GEOLOGY.md.

## Implemented

Only `src/beauty.js` changes executable game behavior. It adds dedicated periodic rock albedo/roughness/cavity data and a faceted normal atlas, selective wet roughness and physical clearcoat, colder/darker deeper host rock, changed headlamp/fill contrast and bounded dust/fog treatment. Wet glancing response uses the lighting model's dielectric Fresnel, not an unlit rim.

A camera-local mineral volume is stamped from existing embedded deposits. It excludes collected and loose ore and never creates another collectible or reward. The final finish tightens the inclusion boundary and gives it finer normal/roughness breakup rather than the original blurred colour halo.

Ore uses a five-lobe, 100-triangle clustered template with per-kind material traits and a crystal morph endpoint. Its original IDs, instance slots, matrices, culling policy, physics and sale values remain. Both endpoints fit the old dodecahedral convex support hull. The old collider is therefore conservative around the new visual concavities; it does not exactly follow them.

The final finish also adds triplanar crust and small-scale normal variation to the ore clusters. Existing cached maps are reused. Zero-colour lights skip the added density contact sampling. The original shadow system stays enabled.

## Actual-game verification

The complete game—not a synthetic fixture—built and rendered in headless Chromium through WebGL2/ANGLE SwiftShader. Six main/R4 pairs cover the surface, three real generated caverns, an embedded gold deposit, and that same deposit after production excavation. All twelve main/R4 captures have matched camera/target coordinates and saved-density SHA-256 values, no GL or shader errors, no lost context, and no pointer-lock attempts. The gold keeps ID 18 while changing from embedded to falling; the capture occurs before advancing its gravity.

The surface control differs at five pixels, each by one 8-bit channel value. Dust is hidden above ground. The HUD is deliberately hidden for scene review; the real viewmodel is retained. The harness blocks external requests and uses the game's offline mode, with no OS input, clicks or pointer lock. These are static render/excavation checks, not continuous human play or multiplayer-over-the-internet verification.

The exact final rendering source also passes 20 isolated geology checks and 14 isolated mineral/art checks. The preceding R4 checkpoint `040d2e9ebeddbdcd41d23e55f16e2ff1cb0ff9d4` completed all 627 full-system checks plus the separate 14 art checks. Its overall Actions job was marked cancelled around the 20-minute limit during cleanup after successful test steps and report upload. Those earlier full-suite results are not relabelled as tests of the final shader finish; its complete-system rerun was still in progress when this note was written.

The workflow-only follow-up `2f930040cfce75f914b64b8f0702549b16a29518` gives future system runs 30 minutes, retires temporary shadow-diagnostic injection and adds a manual trigger. It does not change the playable bytes or pretend that an older cancelled job was green.

## Capture correction

Earlier close gold captures contained rectangular stale shadows. The harness disabled automatic renderer-info reset without advancing `info.render.frame` before every warm-up render. Three.js uses that epoch for geometry uploads; edited geometry could be drawn against a shadow cached before the edit.

`tools/test-cave-browser.mjs` now resets before every explicit render, including warm-ups and diagnostic renders. The final main/R4 frames no longer have the rectangular stale-shadow fault with ordinary shadows enabled. No runtime shadow culling, side, bias or cache policy was changed to disguise it. The initial diagnosis of a pre-existing game shadow bug was premature.

## Costs and remaining art work

Two shared 512x512 RGBA8 maps cost about 2.67 MiB with mipmaps, plus a 32 KiB scalar-density volume and 128 KiB mineral volume on WebGL2. The ore template grows from 36 to 100 triangles. Dust adds one underground 128-point draw. Additional texture sampling and fixed-distance contact probes are not free; no hardware FPS or speedup claim is made.

Both local volumes are throttled to one refresh per 100 ms. Lighting or inclusions may briefly lag rapid edits. Density contact reach is 2.5 m, not a full scene shadow or GI solution. WebGL1 omits the volumes but retains rock/ore materials; the final native capture run tests WebGL2, not real WebGL1 hardware.

The comparison is an improvement, not reference parity. Some nearest headlamp highlights are too washed out, the cellular pattern remains regular in places, and the original broad cave silhouettes are unchanged. No radiance-cascade GI, reflected scene capture or refractive crystal transport is implemented. Hardware profiling, continuous excavation/camera-motion review, full latest system completion and a human playtest remain separate acceptance items before merge.
