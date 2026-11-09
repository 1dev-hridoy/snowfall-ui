# Changelog

All notable changes to `whiteout`. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[SemVer](https://semver.org/).

## [Unreleased]

### Changed

- **Renamed the package to `whiteout`** (was `@snowfall/ui`). Import paths are
  now `whiteout`, `whiteout/vanilla`, and `whiteout/react`.
- README rewritten as a usage guide rather than a spec sheet. Added
  `CONFIG.md` (full option reference) and `demo/html-guide.html` (a standalone
  HTML walkthrough with a live engine on the page).

## [0.2.0]

### Added

- **Four new snow types**, each with its own renderer: `dust` (fine ambient
  motes), `hail` (hard ice pellets with a specular highlight), `aurora` (slow
  teal/violet light streaks), `confetti` (multicolor tumbling chips).
- **`colors`**: per-particle palette. When set, each flake picks a color at
  random and `color` is ignored.
- **`gust` / `gustSpeed`**: a slow sine swell layered on `wind`, so the field
  breathes instead of drifting at a constant rate.
- **`mouseMode`**: `'repel'` (default), `'attract'`, or `'trail'` — the last
  drags flakes along in the pointer's wake, using smoothed pointer velocity.
- **`respectReducedMotion`**: honours `prefers-reduced-motion: reduce` by
  painting one static frame instead of animating. Default `true`. Listens for
  live changes to the preference.
- **`onFrame`**: per-frame stats callback (`fps`, `particles`, `width`,
  `height`) for FPS meters and tuning UIs.
- **`SnowController.isRunning()`** and **`getConfig()`**.
- **`<SnowfallLayer />`**: fixed full-viewport snow with a `children` slot
  already lifted above the canvas.
- **`SnowfallHandle`**: the React ref now exposes `pause`, `resume`, `update`,
  `setCount`, `isRunning`, and `controller` alongside the canvas element.
- **`PRESET_LABELS`**, **`PRESET_DESCRIPTIONS`**, **`emojiFlake()`**, and
  **`toSnippet()`** for building UIs and docs.
- **`npm test`** — a headless smoke suite (`scripts/smoke.mjs`) that constructs,
  renders, and destroys every preset against a stubbed canvas, then checks
  hostile physics, live updates, clamping, and helpers.
- **`npm run verify`** — typecheck + build + test, also wired to
  `prepublishOnly`.
- **`Snowfall` `paused` prop** to mount in a paused state.

### Changed

- `ResolvedSnowConfig` is now exported from `types.ts` and keeps `onFrame`
  optional (it is a callback, not a value).
- The React component no longer reconfigures the engine when only the `onFrame`
  identity changes.
- `update()` now starts or stops the loop to match the current reduced-motion
  state.
- The playground was rebuilt: live per-preset thumbnails rendered by the real
  engine, a schema-driven panel, keyboard shortcuts, and copy-to-clipboard
  config export. Demo logic moved to `demo/app.js`.

### Fixed

- `toSnippet()` emitted a trailing comma, producing invalid JavaScript.
- `mouseout` left the pointer flagged active, so the field kept reacting to a
  pointer that had left the window.

## [0.1.0]

### Added

- Initial release: `classic`, `realistic`, `blizzard`, `sparkle`, `glow`, and
  `custom` types; `createSnowfall`; `<Snowfall />`; ESM + CJS + types for three
  entry points; `'use client'` on the React entry.
