# Contributing to whiteout

Small package, short rules.

## Setup

```bash
npm install
npm run verify     # typecheck + build + smoke test
npm run demo       # http://localhost:5173/demo/
```

`npm run demo` serves the repo root so `demo/index.html` can import
`../dist/index.js` as a real ES module. Build before you demo, or you are
looking at stale output.

## Where things live

| Path | What it is |
| --- | --- |
| `src/engine.ts` | The whole simulation: particles, loop, observers, controller API |
| `src/shapes.ts` | One render function per snow type |
| `src/presets.ts` | Tuned configs, labels, descriptions |
| `src/defaults.ts` | The resolved default config |
| `src/types.ts` | Public types |
| `src/vanilla.ts` | `createSnowfall` |
| `src/react/` | `<Snowfall />`, `<SnowfallLayer />` |
| `demo/` | Playground (plain HTML + `app.js`, no build step) |
| `scripts/smoke.mjs` | Headless test over the built bundle |

## Adding a snow type

Four steps, in order:

1. Add the name to `SnowType` in `src/types.ts`.
2. Add a `case` and a draw function in `src/shapes.ts`. Draw centered on the
   origin — the engine translates for you.
3. Add a tuned entry to `PRESETS` in `src/presets.ts`, plus `PRESET_LABELS` and
   `PRESET_DESCRIPTIONS`.
4. Add the name to `SNOW_TYPES` in `src/utils.ts`.

Then `npm run verify`. The smoke test loops every entry in `SNOW_TYPES` and
fails if a renderer puts down no pixels, so a new type cannot ship silently
broken.

## Rules

- **No new runtime dependencies.** This package is zero-dependency on purpose.
- **No `window` at import time.** The root entry must stay SSR-safe.
- **Keep `DEFAULTS` complete.** The engine reads every field; a missing default
  becomes a `NaN` in the physics.
- **Clamp in `applyConfig`, not at the call site.** Users pass nonsense; the
  engine should absorb it.
- **React entry stays thin.** Physics belongs in `SnowEngine`, never in the
  component.

## Commits

Conventional-ish, imperative, lowercase:

```
feat: add aurora snow type
fix: keep trail impulse finite on fast pointer sweeps
docs: document mouseMode
```

## License

MIT. By contributing you agree your work ships under the same license.
