# Buttloads 2

Read README.md and docs/REMAKE.md for the current architecture. HANDOFF.md describes the superseded prototype.

Trent explicitly instructed that automation must not take over his mouse cursor. Never use OS mouse/keyboard automation, activate a browser window, or allow a test page to acquire pointer lock. The CDP helper disables pointer-lock requests before navigation. Do not remove that guard. Prefer pure-system tests and page-scoped evaluation; do not launch further browser interaction tests during the current session.

Game input still supports pointer lock when a human presses Start. The restriction applies to agent-driven testing, not normal play.

Run `node tools/test.mjs` for pure-system validation. `node tools/build.mjs` creates the standalone release. Browser verification must respect the input restriction above.
