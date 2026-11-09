/**
 * Vanilla JS entry point. `createSnowfall` mounts a snow canvas inside any
 * element and returns a {@link SnowController} for live control + cleanup.
 *
 * This file is framework-free: it has no React dependency, so vanilla and
 * framework-agnostic users import only from `whiteout/vanilla` (or the
 * package root) and never pull React into their bundle.
 */
import { DEFAULTS } from "./defaults";
import { SnowEngine } from "./engine";
import type { SnowConfig, SnowController } from "./types";
import { isBrowser } from "./utils";

/**
 * Mount a snow effect inside `target`.
 *
 * @param target  A CSS selector or an HTMLElement. The element becomes the
 *                positioning context (its `position` is set to `relative` if
 *                currently `static`).
 * @param config  Optional {@link SnowConfig}; spread a {@link PRESETS} entry
 *                to start from a tuned baseline.
 * @returns       A {@link SnowController}; call `.destroy()` to clean up.
 */
export function createSnowfall(target: HTMLElement | string, config?: SnowConfig): SnowController {
    if (!isBrowser()) {
        /** SSR guard: return a no-op controller so importing on the server is safe. */
        return noopController();
    }

    const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
    if (!el) {
        throw new Error(`whiteout: target "${target}" was not found`);
    }

    const computed = window.getComputedStyle(el);
    if (computed.position === "static") {
        el.style.position = "relative";
    }

    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    el.appendChild(canvas);

    const engine = new SnowEngine(canvas, config, { manageStyle: true });

    const controller: SnowController = {
        start: () => engine.start(),
        stop: () => engine.stop(),
        pause: () => engine.pause(),
        resume: () => engine.resume(),
        update: cfg => engine.update(cfg),
        setCount: n => engine.setCount(n),
        getElement: () => engine.getElement(),
        isRunning: () => engine.isRunning(),
        getConfig: () => engine.getConfig(),
        destroy: () => {
            engine.destroy();
            if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        },
    };
    return controller;
}

/** A controller whose every method is a no-op; returned under SSR. */
function noopController(): SnowController {
    const empty = document.createElement("canvas");
    return {
        start: () => {},
        stop: () => {},
        pause: () => {},
        resume: () => {},
        update: () => {},
        setCount: () => {},
        getElement: () => empty,
        isRunning: () => false,
        getConfig: () => ({ ...DEFAULTS }),
        destroy: () => {},
    };
}
