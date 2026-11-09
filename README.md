# Whiteout

Snow for your website. Ten styles, zero dependencies, one small file.

I got tired of snow effects that were either a GIF or a 400KB particle library
that cooked your laptop. So this is one canvas engine you point at a div. It
snows in the div. That's the whole idea.

```bash
npm i whiteout
```

## Use it

**Plain HTML.** No build step, no bundler:

```html
<div id="scene" style="height: 100vh; background: #0a1024"></div>

<script type="module">
    import { createSnowfall, PRESETS } from "https://esm.sh/whiteout";
    createSnowfall("#scene", PRESETS.classic);
</script>
```

**React.** Works in the Next.js App Router as-is:

```tsx
import { Snowfall, PRESETS } from "whiteout/react";

export default function Page() {
    return (
        <main style={{ position: "relative", height: "100vh" }}>
            <Snowfall {...PRESETS.realistic} interactive />
            <h1>Happy winter</h1>
        </main>
    );
}
```

One thing that trips people up: the div needs a height. An empty div is zero
pixels tall, and zero pixels of snow looks exactly like no snow.

## The styles

Ten of them, and each is a real renderer, not the same dot with different
settings:

- **classic** — soft round dots, gentle sway. The safe default.
- **realistic** — six-point snowflakes that actually rotate.
- **blizzard** — dense, fast, blown sideways.
- **sparkle** — tiny glitter that flickers.
- **glow** — soft blurred orbs with a bloom.
- **dust** — barely-there motes. Ambient haze, not weather.
- **hail** — hard ice pellets with a highlight. Fast.
- **aurora** — slow teal and violet light streaks.
- **confetti** — multicolor chips. For launches, not winter.
- **custom** — your own image or emoji.

Every preset is just a starting point. Spread it and override whatever:

```js
createSnowfall("#scene", { ...PRESETS.blizzard, wind: 200, count: 600 });
```

## Making it look right

There are about 30 options. These are the ones you'll actually touch:

```js
createSnowfall("#scene", {
    ...PRESETS.classic,
    count: 400, // how many flakes. 150 is calm, 600 is a storm
    minSize: 2, // flake size in px
    maxSize: 6,
    minSpeed: 20, // fall speed in px/sec
    maxSpeed: 90,
    wind: 40, // sideways push. negative blows left
    gust: 30, // slow swell on top of wind, so it breathes
    sway: 40, // how far flakes drift side to side
    color: "#ffffff", // or use `colors: [...]` for a palette
    opacity: 0.9,
    parallax: true, // distant flakes fall slower and dimmer. keep this on
});
```

The full list is in [CONFIG.md](./CONFIG.md). Or open the playground and drag
sliders until it looks right, which is faster.

## Mouse

Turn on `interactive` and the pointer disturbs the field. Three modes, and they
feel genuinely different:

```js
createSnowfall("#scene", {
    ...PRESETS.classic,
    interactive: true,
    mouseMode: "trail", // 'repel' | 'attract' | 'trail'
    mouseRadius: 140,
    mouseForce: 1.2,
});
```

- **repel** pushes flakes away. A snowplough.
- **attract** pulls them in. A slow vortex.
- **trail** drags them along in your wake.

For a hero section, `trail` is the one. It feels like you're disturbing air
rather than shoving things around. Works on touch too.

## Changing it after it starts

`createSnowfall` gives you a controller back. Keep the reference:

```js
const snow = createSnowfall("#scene", PRESETS.classic);

snow.update({ count: 400, wind: 100 }); // retune live, no remount
snow.pause();
snow.resume();
snow.setCount(50);
snow.isRunning();
snow.destroy(); // stop and remove the canvas
```

React works the same way through the ref:

```tsx
const ref = useRef<SnowfallHandle>(null)

<Snowfall ref={ref} {...PRESETS.glow} />

ref.current?.update({ blur: 24 })
ref.current?.pause()
```

## Snow on the whole page

If you want it behind everything, use the layer. Your content is already lifted
above the canvas, so no z-index fights:

```tsx
import { SnowfallLayer, PRESETS } from "whiteout/react";

export default function Layout({ children }) {
    return (
        <SnowfallLayer {...PRESETS.dust} opacity={0.35}>
            {children}
        </SnowfallLayer>
    );
}
```

## Emoji instead of snow

Any image URL or data URI works. For emoji there's a helper:

```js
import { createSnowfall, PRESETS, emojiFlake } from "whiteout";

createSnowfall("#scene", {
    ...PRESETS.custom,
    customImage: emojiFlake("🍁"),
});
```

## When it's slow

In order of how much each one helps:

1. Lower `count`. Biggest lever by far.
2. Cap `fps` to 30. You won't see the difference on falling snow.
3. Set `pixelRatio: 1`. Skips the retina buffer. Noticeable on phones.
4. Turn `parallax` off.

It already pauses when scrolled off screen and when the tab is hidden, so the
usual battery complaints shouldn't apply.

Want live numbers? Pass `onFrame`:

```js
createSnowfall("#scene", {
    ...PRESETS.blizzard,
    onFrame: ({ fps, particles }) => {
        meter.textContent = `${fps} fps · ${particles} flakes`;
    },
});
```

Keep that callback cheap. It runs 60 times a second.

## Things I handled so you don't have to

- **It stops when you're not looking.** Off screen or background tab, the loop
  pauses.
- **It respects reduced motion.** If someone has `prefers-reduced-motion` on,
  they get one static frame instead of animation. On by default. Turn it off
  with `respectReducedMotion: false` if you have a reason.
- **The canvas is `aria-hidden`.** Screen readers skip it.
- **Retina without the cost.** Buffer capped at 2× DPR.
- **SSR-safe.** Importing on the server never touches `window`. Under SSR,
  `createSnowfall` returns a do-nothing controller instead of throwing.

## The playground

```bash
git clone https://github.com/1dev-hridoy/whiteout
cd whiteout
npm install
npm run build
npm run demo
```

Then open http://localhost:5173/demo/. Every setting on a slider, ten live
previews, keyboard shortcuts, and a button that copies your config as
paste-ready code.

There's also [demo/html-guide.html](./demo/html-guide.html), a walkthrough page
with the engine running live in the middle of it.

## The API, briefly

`createSnowfall(target, config?)` mounts a canvas inside `target` (selector or
element) and returns a controller with `start`, `stop`, `pause`, `resume`,
`update`, `setCount`, `isRunning`, `getConfig`, `getElement`, and `destroy`.

`<Snowfall />` takes every config option as a prop, plus `className`, `style`,
`fullscreen`, and `paused`. Changing a prop retunes the running engine, no
remount.

`<SnowfallLayer />` is `<Snowfall>` with `fullscreen` on and a `children` slot
already above the canvas.

Import from `whiteout` for anything, `whiteout/vanilla` for just
`createSnowfall`, or `whiteout/react` for the components. ESM and CJS, types
included.

## Browser support

Anything with Canvas 2D and `requestAnimationFrame`, which is every browser from
the last decade.

## License

MIT. Do what you want.

Built by [1dev-hridoy](https://github.com/1dev-hridoy).
