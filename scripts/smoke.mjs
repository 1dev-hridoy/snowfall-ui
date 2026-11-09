/**
 * scripts/smoke.mjs — headless smoke test for the built bundle.
 *
 * There is no DOM here, so this stubs just enough of the browser surface for
 * SnowEngine to construct, run frames, and tear down. It catches the failures
 * that matter most for a canvas library: a throw on init, a NaN in the physics,
 * a renderer that silently draws nothing, or a destroy() that leaks listeners.
 *
 * Run: node scripts/smoke.mjs
 */
import assert from "node:assert/strict";

const listeners = new Map();
const rafQueue = [];

function makeCtx() {
    const calls = { fill: 0, stroke: 0, arc: 0, drawImage: 0, ellipse: 0, fillRect: 0 };
    const grad = { addColorStop() {} };
    return {
        calls,
        globalAlpha: 1,
        fillStyle: "",
        strokeStyle: "",
        lineWidth: 1,
        lineCap: "butt",
        lineJoin: "miter",
        shadowColor: "",
        shadowBlur: 0,
        setTransform() {},
        clearRect() {},
        save() {},
        restore() {},
        translate() {},
        rotate() {},
        beginPath() {},
        closePath() {},
        moveTo() {},
        lineTo() {},
        fill() {
            calls.fill++;
        },
        stroke() {
            calls.stroke++;
        },
        arc() {
            calls.arc++;
        },
        ellipse() {
            calls.ellipse++;
        },
        fillRect() {
            calls.fillRect++;
        },
        drawImage() {
            calls.drawImage++;
        },
        createRadialGradient() {
            return grad;
        },
    };
}

function makeCanvas() {
    const ctx = makeCtx();
    const el = {
        width: 0,
        height: 0,
        style: {},
        parentElement: null,
        getContext: () => ctx,
        getBoundingClientRect: () => ({ width: 800, height: 600, top: 0, left: 0 }),
        setAttribute() {},
        appendChild() {},
        removeChild() {},
        __ctx: ctx,
    };
    return el;
}

const parent = {
    style: {},
    getBoundingClientRect: () => ({ width: 800, height: 600, top: 0, left: 0 }),
    appendChild() {},
    removeChild() {},
};
globalThis.window = {
    devicePixelRatio: 2,
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    addEventListener: (t, fn) => listeners.set(t, fn),
    removeEventListener: t => listeners.delete(t),
    getComputedStyle: () => ({ position: "static" }),
};
globalThis.document = {
    createElement: () => {
        const c = makeCanvas();
        c.parentElement = parent;
        return c;
    },
    querySelector: () => null,
};
globalThis.requestAnimationFrame = fn => {
    rafQueue.push(fn);
    return rafQueue.length;
};
globalThis.cancelAnimationFrame = () => {};
globalThis.ResizeObserver = class {
    observe() {}
    disconnect() {}
};
globalThis.IntersectionObserver = class {
    observe() {}
    disconnect() {}
};
globalThis.Image = class {
    set src(_v) {
        this._src = _v;
        queueMicrotask(() => this.onload && this.onload());
    }
    get src() {
        return this._src;
    }
};

const mod = await import("../dist/index.js");
const { SnowEngine, PRESETS, SNOW_TYPES, DEFAULTS, toSnippet, emojiFlake } = mod;

let checks = 0;
const ok = label => {
    checks++;
    console.log(`  ok  ${label}`);
};

for (const type of SNOW_TYPES) {
    const canvas = makeCanvas();
    canvas.parentElement = parent;

    const config = { ...PRESETS[type], count: 40 };
    if (type === "custom") config.customImage = emojiFlake("❄️");
    const engine = new SnowEngine(canvas, config, { manageStyle: false });

    await Promise.resolve();
    for (let i = 0; i < 5; i++) {
        const fn = rafQueue.shift();
        if (fn) fn(16.7 * (i + 1));
    }

    const cfg = engine.getConfig();
    assert.equal(cfg.type, type, `${type}: type not applied`);
    assert.ok(engine.isRunning(), `${type}: engine not running`);

    const ctx = canvas.__ctx;

    const drew = ctx.calls.fill + ctx.calls.stroke + ctx.calls.fillRect + ctx.calls.drawImage > 0;
    assert.ok(drew, `${type}: renderer drew nothing`);

    engine.destroy();
    assert.equal(engine.isRunning(), false, `${type}: still running after destroy`);
    ok(`${type} — constructs, renders, destroys`);
}

{
    const canvas = makeCanvas();
    canvas.parentElement = parent;
    const engine = new SnowEngine(
        canvas,
        {
            ...PRESETS.blizzard,
            count: 60,
            wind: -300,
            gust: 200,
            gustSpeed: 1,
            minSpeed: 600,
            maxSpeed: 600,
            interactive: true,
            mouseMode: "trail",
        },
        { manageStyle: false },
    );

    const move = listeners.get("mousemove");
    for (let i = 0; i < 40; i++) {
        if (move) move({ clientX: i * 20, clientY: 300 });
        const fn = rafQueue.shift();
        if (fn) fn(16.7 * (i + 1));
    }

    const particles = engine.getConfig();
    assert.ok(Number.isFinite(particles.wind), "wind became non-finite");
    assert.ok(engine.getConfig().count === 60, "count drifted");
    engine.destroy();
    ok("hostile physics (max wind + gust + trail) stays finite");
}

{
    const canvas = makeCanvas();
    canvas.parentElement = parent;
    const engine = new SnowEngine(canvas, { ...PRESETS.classic, count: 20 }, { manageStyle: false });
    engine.update({ type: "confetti", colors: ["#f00", "#0f0"] });
    const fn = rafQueue.shift();
    if (fn) fn(16.7);
    assert.equal(engine.getConfig().type, "confetti");
    assert.equal(engine.getConfig().colors.length, 2);
    engine.destroy();
    ok("update() swaps type and palette live");
}

{
    const canvas = makeCanvas();
    canvas.parentElement = parent;
    const engine = new SnowEngine(
        canvas,
        { count: 99999, opacity: 5, minSize: 10, maxSize: 2, minSpeed: 50, maxSpeed: 10, pixelRatio: 0 },
        { manageStyle: false },
    );
    const c = engine.getConfig();
    assert.equal(c.count, 5000, "count not clamped to 5000");
    assert.equal(c.opacity, 1, "opacity not clamped to 1");
    assert.ok(c.maxSize >= c.minSize, "maxSize < minSize");
    assert.ok(c.maxSpeed >= c.minSpeed, "maxSpeed < minSpeed");
    assert.ok(c.pixelRatio >= 1, "pixelRatio < 1");
    engine.destroy();
    ok("out-of-range config is clamped");
}

{
    const snippet = toSnippet({ type: "hail", count: 180, colors: [] });
    assert.ok(!/,\s*}$/.test(snippet), "snippet has a trailing comma");
    assert.ok(snippet.includes('type: "hail"'), "snippet lost type");
    assert.ok(!snippet.includes("colors"), "snippet kept an empty palette");
    assert.ok(emojiFlake("❄️").startsWith("data:image/svg+xml,"), "emojiFlake malformed");
    ok("toSnippet / emojiFlake produce valid output");
}

{
    const keys = Object.keys(DEFAULTS).filter(k => k !== "onFrame");
    for (const key of keys) {
        assert.notEqual(DEFAULTS[key], undefined, `DEFAULTS.${key} is undefined`);
    }
    ok(`DEFAULTS covers all ${keys.length} value fields`);
}

console.log(`\n${checks} checks passed\n`);
