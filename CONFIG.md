# Configuration

Every option is optional. Anything you leave out falls back to `DEFAULTS`.

```js
import { createSnowfall, DEFAULTS } from 'whiteout';
console.log(DEFAULTS); // the full resolved config
```

---

## Core physics

| Option | Type | Default | Notes |
|---|---|---|---|
| `count` | `number` | `150` | Number of flakes. Clamped to 0–5000. |
| `minSize` | `number` | `1` | Smallest flake, px. |
| `maxSize` | `number` | `4` | Largest flake, px. Forced `>= minSize`. |
| `minSpeed` | `number` | `20` | Slowest fall, px/sec. |
| `maxSpeed` | `number` | `80` | Fastest fall, px/sec. Forced `>= minSpeed`. |
| `wind` | `number` | `0` | Steady horizontal push, px/sec. Negative blows left. |
| `sway` | `number` | `30` | Horizontal sway amplitude, px. |
| `swaySpeed` | `number` | `1` | Sway frequency, radians/sec. |

## Behavior

| Option | Type | Default | Notes |
|---|---|---|---|
| `type` | `SnowType` | `'classic'` | Which renderer to use. |
| `rotation` | `boolean` | `false` | Rotate flakes. Auto-on for `realistic`, `sparkle`, `custom`, `confetti`. |
| `minRotationSpeed` | `number` | `-1` | Radians/sec. Negative spins one way. |
| `maxRotationSpeed` | `number` | `1` | Radians/sec. |
| `opacity` | `number` | `0.9` | Base opacity, 0–1. Clamped. |
| `flicker` | `boolean` | `false` | Opacity flicker. |
| `flickerSpeed` | `number` | `2` | Flicker frequency. |
| `parallax` | `boolean` | `true` | Distant flakes fall slower, render smaller and dimmer. |
| `gust` | `number` | `0` | Sine swell added to `wind`, px/sec. |
| `gustSpeed` | `number` | `6` | Gust period in seconds. Lower = more restless. |

## Color and shape

| Option | Type | Default | Notes |
|---|---|---|---|
| `color` | `string` | `'#ffffff'` | Flake color. Hex, rgb, or hsl. |
| `colors` | `string[]` | `[]` | A palette. Each flake picks one at random. Overrides `color`. |
| `glowColor` | `string` | `'#bfe3ff'` | Bloom color for `glow` and `aurora`. |
| `blur` | `number` | `8` | Shadow blur, px, for `glow` and `aurora`. |
| `customImage` | `string` | `''` | Image URL or data URI for `custom`. |

## Performance

| Option | Type | Default | Notes |
|---|---|---|---|
| `fps` | `number` | `0` | Frame cap. `0` = uncapped, use the display refresh. |
| `pixelRatio` | `number` | `2` | Max `devicePixelRatio` for the buffer. Lower = faster. |
| `pauseWhenOffscreen` | `boolean` | `true` | Stop the loop when the canvas scrolls out of view. |
| `respectReducedMotion` | `boolean` | `true` | Static single frame under `prefers-reduced-motion`. |
| `onFrame` | `function` | — | Per-frame stats callback. See below. |

### `onFrame`

Called after every rendered frame:

```js
onFrame: ({ fps, particles, width, height }) => { ... }
```

- `fps` — smoothed frames per second
- `particles` — flakes currently simulated
- `width` / `height` — canvas size in CSS px

Keep it cheap. It runs 60 times a second.

## Interaction

| Option | Type | Default | Notes |
|---|---|---|---|
| `interactive` | `boolean` | `false` | Let the pointer affect flakes. |
| `mouseMode` | `MouseMode` | `'repel'` | `'repel'`, `'attract'`, or `'trail'`. |
| `mouseRadius` | `number` | `100` | Effect radius, px. |
| `mouseForce` | `number` | `1` | Strength multiplier. |

## Container

| Option | Type | Default | Notes |
|---|---|---|---|
| `zIndex` | `number` | `0` | z-index on the canvas. |
| `background` | `string` | `'transparent'` | Canvas background. Leave transparent to show what's behind. |

---

## Clamping

The engine fixes bad input rather than throwing, so a slider wired to a value
of `NaN` won't kill the effect:

- `count` → 0–5000, rounded
- `opacity` → 0–1
- `pixelRatio` → at least 1
- `maxSize` → never below `minSize`
- `maxSpeed` → never below `minSpeed`
- `minSize`, `minSpeed`, `gust` → never negative
- `gustSpeed` → at least 0.01
- `colors` → non-arrays become `[]`

## Partial configs

Presets are partial. If you read a preset directly, unset keys are `undefined`
— the engine fills them from `DEFAULTS` when it constructs. If you're building
a UI around presets, resolve them yourself so your sliders show real values:

```js
import { PRESETS, DEFAULTS } from 'whiteout';

const resolved = { ...DEFAULTS, ...PRESETS.realistic };
// resolved.wind === 0, resolved.blur === 8, not undefined
```

## Types

```ts
import type {
  SnowConfig, SnowType, SnowController, SnowFrameStats,
  MouseMode, ResolvedSnowConfig,
} from 'whiteout';
```
