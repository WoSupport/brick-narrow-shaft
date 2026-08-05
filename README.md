# The Narrow Shaft — Idle Edition

A Breakout-style idle game. **You don't play it — you watch it.**

An autopilot AI paddle plays everything: it threads the narrow glowing slit in the
steel wall, rides the auto-play cascade, catches ⚡ split pickups to trigger
multiball chain reactions, and advances through all 5 levels on its own.

- A **fortress of steel** spans the screen with a single **one-brick-wide slit** — the only way in.
- The AI threads the ball through the slit into the **prize chamber**, where it auto-plays and self-sustains.
- ⚡ **split** pickups cause multiball **chain reactions** that clear the rest.
- 🔁 Levels vary the slit position / chamber size and cycle forever.

Playable at:
https://wosupport.github.io/brick-narrow-shaft/

## Nothing to do
Just open the page and watch. Controls are disabled in idle mode (a quick
manual mode is still possible if you set the `autoMode` flag to `false` in `index.html`).

## Files
- `index.html` — the entire game (vanilla HTML5 Canvas, no dependencies)
- `docs/` — the deployable copy served by GitHub Pages
- `verify/` — headless Chromium (Puppeteer) verification scripts

