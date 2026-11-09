/**
 * SnowEngine — framework-agnostic Canvas 2D snow animation core.
 *
 * Owns the canvas buffer, particle pool, animation loop, input listeners and
 * resize/intersection observers. Both the React component and the vanilla
 * `createSnowfall` helper are thin wrappers around this class, so all physics
 * and rendering live in exactly one place.
 */
import { DEFAULTS, type ResolvedSnowConfig } from "./defaults";
import { drawFlake, type FlakeRender } from "./shapes";
import type { SnowConfig, SnowController } from "./types";
import { clamp, damp, isBrowser, rand } from "./utils";

interface Particle {
    baseX: number;

    y: number;

    size: number;

    speed: number;

    sway: number;

    swaySpeed: number;

    swayPhase: number;

    rotation: number;

    rotationSpeed: number;

    baseOpacity: number;

    opacity: number;

    depth: number;

    vx: number;

    vy: number;

    flickerPhase: number;

    color?: string;
}

export interface EngineOptions {
    /**
     * Whether the engine may mutate the canvas's CSS. `true` (default) for
     * vanilla usage where the engine owns the element; `false` for React where
     * the framework controls inline styles.
     */
    manageStyle?: boolean;
}

export class SnowEngine implements SnowController {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private config: ResolvedSnowConfig = { ...DEFAULTS };
    private opts: Required<EngineOptions>;

    private particles: Particle[] = [];
    private rafId = 0;
    private lastTime = 0;
    private accumulator = 0;
    private frameInterval = 0;

    private width = 0;
    private height = 0;
    private dpr = 1;

    private mouse = { x: -9999, y: -9999, active: false };
    private img: HTMLImageElement | null = null;
    private imgReady = false;

    private running = false;
    private userPaused = false;
    private visible = true;

    private elapsed = 0;
    /** Smoothed FPS for {@link SnowConfig.onFrame}. */
    private fpsAvg = 0;

    private pointerVx = 0;
    private pointerVy = 0;
    private lastPointer = { x: 0, y: 0, t: 0 };
    private reducedMotion = false;
    private mediaQuery: MediaQueryList | null = null;

    private resizeObserver: ResizeObserver | null = null;
    private intersectionObserver: IntersectionObserver | null = null;

    constructor(canvas: HTMLCanvasElement, config?: SnowConfig, options?: EngineOptions) {
        this.canvas = canvas;
        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) throw new Error("whiteout: unable to acquire a 2D canvas context");
        this.ctx = ctx;

        this.opts = { manageStyle: options?.manageStyle ?? true };
        this.applyConfig(config);

        if (!isBrowser()) return;

        this.setupCanvas();
        this.onResize();
        this.spawn();
        this.bindEvents();

        if (this.config.respectReducedMotion && typeof window.matchMedia === "function") {
            this.mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
            this.reducedMotion = this.mediaQuery.matches;
            this.mediaQuery.addEventListener?.("change", this.onMotionPreference);
        }
        if (this.reducedMotion) {
            this.render();
            return;
        }

        this.start();
    }

    private readonly onMotionPreference = (e: MediaQueryListEvent): void => {
        this.reducedMotion = e.matches;
        if (e.matches) {
            this.stop();
            this.render();
        } else if (!this.userPaused && this.visible) {
            this.start();
        }
    };

    // ---- configuration -------------------------------------------------------

    private applyConfig(config?: SnowConfig): void {
        const next = { ...DEFAULTS, ...config } as ResolvedSnowConfig;
        next.count = clamp(Math.round(next.count), 0, 5000);
        next.minSize = Math.max(0, next.minSize);
        next.maxSize = Math.max(next.minSize, next.maxSize);
        next.minSpeed = Math.max(0, next.minSpeed);
        next.maxSpeed = Math.max(next.minSpeed, next.maxSpeed);
        next.opacity = clamp(next.opacity, 0, 1);
        next.pixelRatio = Math.max(1, next.pixelRatio);
        next.gust = Math.max(0, next.gust);
        next.gustSpeed = Math.max(0.01, next.gustSpeed);
        if (!Array.isArray(next.colors)) next.colors = [];
        this.config = next;
        this.frameInterval = next.fps > 0 ? 1000 / next.fps : 0;

        if (next.type === "custom" && next.customImage) {
            this.loadImage(next.customImage);
        } else if (next.type !== "custom") {
            this.img = null;
            this.imgReady = false;
        }
    }

    private loadImage(src: string): void {
        if (!isBrowser()) return;
        try {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.decoding = "async";
            img.onload = () => {
                this.img = img;
                this.imgReady = true;
            };
            img.onerror = () => {
                this.imgReady = false;
            };
            img.src = src;
        } catch {
            /* ignore — image simply won't render */
        }
    }

    private setupCanvas(): void {
        if (!this.opts.manageStyle) return;
        const style = this.canvas.style;
        style.position = "absolute";
        style.top = "0";
        style.left = "0";
        style.width = "100%";
        style.height = "100%";
        style.pointerEvents = "none";
        style.zIndex = String(this.config.zIndex);
        if (this.config.background && this.config.background !== "transparent") {
            style.background = this.config.background;
        }
    }

    // ---- sizing --------------------------------------------------------------

    private readonly onResize = (): void => {
        if (!isBrowser()) return;
        const parent = this.canvas.parentElement;
        const rect = parent ? parent.getBoundingClientRect() : this.canvas.getBoundingClientRect();
        this.width = Math.max(1, rect.width);
        this.height = Math.max(1, rect.height);
        this.dpr = Math.min(window.devicePixelRatio || 1, this.config.pixelRatio);
        this.canvas.width = Math.floor(this.width * this.dpr);
        this.canvas.height = Math.floor(this.height * this.dpr);
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.adjustCount();
    };

    // ---- particle pool -------------------------------------------------------

    private makeParticle(initial: boolean): Particle {
        const c = this.config;
        const depth = c.parallax ? rand(0.4, 1) : 1;
        const size = rand(c.minSize, c.maxSize) * (c.parallax ? depth : 1);
        return {
            baseX: Math.random() * this.width,
            y: initial ? Math.random() * this.height : -rand(0, this.height * 0.5) - size,
            size,
            speed: rand(c.minSpeed, c.maxSpeed),
            sway: c.sway,
            swaySpeed: c.swaySpeed * rand(0.7, 1.3),
            swayPhase: Math.random() * Math.PI * 2,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: rand(c.minRotationSpeed, c.maxRotationSpeed),
            baseOpacity: c.opacity * (c.parallax ? 0.5 + depth * 0.5 : 1),
            opacity: c.opacity,
            depth,
            vx: 0,
            vy: 0,
            flickerPhase: Math.random() * Math.PI * 2,
            color: c.colors.length ? c.colors[Math.floor(Math.random() * c.colors.length)] : undefined,
        };
    }

    private spawn(): void {
        this.particles = [];
        for (let i = 0; i < this.config.count; i++) {
            this.particles.push(this.makeParticle(true));
        }
    }

    private adjustCount(): void {
        const target = this.config.count;
        while (this.particles.length < target) {
            this.particles.push(this.makeParticle(false));
        }
        if (this.particles.length > target) {
            this.particles.length = target;
        }
    }

    // ---- simulation ----------------------------------------------------------

    private step(dt: number): void {
        const c = this.config;
        const W = this.width;
        const H = this.height;
        const rotateTypes = c.type === "realistic" || c.type === "custom" || c.type === "sparkle";
        const shouldRotate = c.rotation || rotateTypes;

        this.elapsed += dt;

        const gust = c.gust > 0 ? Math.sin(this.elapsed * ((Math.PI * 2) / c.gustSpeed)) * c.gust : 0;
        const wind = c.wind + gust;
        const mode = c.mouseMode;

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];

            p.swayPhase += p.swaySpeed * dt;
            p.baseX += wind * p.depth * dt;
            p.y += p.speed * p.depth * dt;

            if (shouldRotate) {
                p.rotation += p.rotationSpeed * dt;
            }

            if (c.flicker) {
                p.flickerPhase += c.flickerSpeed * dt;
                const flick = 0.5 + 0.5 * Math.sin(p.flickerPhase);
                p.opacity = p.baseOpacity * (0.25 + 0.75 * flick);
            } else {
                p.opacity = p.baseOpacity;
            }

            if (c.interactive && this.mouse.active) {
                const displayX = p.baseX + Math.sin(p.swayPhase) * p.sway * p.depth;
                const dx = displayX - this.mouse.x;
                const dy = p.y - this.mouse.y;
                const dist = Math.hypot(dx, dy);

                if (mode === "trail") {
                    if (dist < c.mouseRadius && dist > 0.01) {
                        const falloff = 1 - dist / c.mouseRadius;
                        p.vx += this.pointerVx * falloff * c.mouseForce * dt * 6;
                        p.vy += this.pointerVy * falloff * c.mouseForce * dt * 6;
                    }
                } else if (dist < c.mouseRadius && dist > 0.01) {
                    const force = (1 - dist / c.mouseRadius) * c.mouseForce * 400 * p.depth;
                    const sign = mode === "attract" ? -1 : 1;
                    p.vx += (dx / dist) * force * sign * dt;
                    p.vy += (dy / dist) * force * sign * dt;
                }
            }

            p.baseX += p.vx * dt;
            p.y += p.vy * dt;
            p.vx = damp(p.vx, 0.9, dt);
            p.vy = damp(p.vy, 0.9, dt);

            if (p.y - p.size > H) {
                p.y = -p.size;
                p.baseX = Math.random() * W;
                p.vx = 0;
                p.vy = 0;
            }

            if (p.baseX < -100) p.baseX += W + 200;
            else if (p.baseX > W + 100) p.baseX -= W + 200;
        }
    }

    private render(): void {
        const c = this.config;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        if (c.background && c.background !== "transparent") {
            ctx.fillStyle = c.background;
            ctx.fillRect(0, 0, this.width, this.height);
        }

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            const displayX = p.baseX + Math.sin(p.swayPhase) * p.sway * p.depth;
            const mx = c.wind * p.depth + p.vx;
            const my = p.speed * p.depth + p.vy;
            const flake: FlakeRender = {
                x: displayX,
                y: p.y,
                size: p.size,
                rotation: p.rotation,
                opacity: p.opacity,
                color: p.color,
                motionAngle: c.type === "blizzard" && (mx !== 0 || my !== 0) ? Math.atan2(my, mx) : Math.PI / 2,
            };
            drawFlake({
                ctx,
                type: c.type,
                p: flake,
                color: c.color,
                glowColor: c.glowColor,
                blur: c.blur,
                img: this.img,
                imgReady: this.imgReady,
            });
        }
    }

    // ---- input + lifecycle observers ----------------------------------------

    private readonly onMouse = (e: MouseEvent): void => {
        if (!this.config.interactive) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.trackPointer(x, y);
        this.mouse.x = x;
        this.mouse.y = y;
        this.mouse.active = true;
    };

    private readonly onTouch = (e: TouchEvent): void => {
        if (!this.config.interactive || !e.touches.length) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        this.trackPointer(x, y);
        this.mouse.x = x;
        this.mouse.y = y;
        this.mouse.active = true;
    };

    /** Derive pointer velocity (px/s) for the `trail` interaction mode. */
    private trackPointer(x: number, y: number): void {
        const now = typeof performance !== "undefined" ? performance.now() : Date.now();
        const dt = (now - this.lastPointer.t) / 1000;
        if (dt > 0 && dt < 0.25) {
            this.pointerVx = this.pointerVx * 0.6 + ((x - this.lastPointer.x) / dt) * 0.4;
            this.pointerVy = this.pointerVy * 0.6 + ((y - this.lastPointer.y) / dt) * 0.4;
        }
        this.lastPointer = { x, y, t: now };
    }

    private readonly onLeave = (): void => {
        this.mouse.active = false;
        this.pointerVx = 0;
        this.pointerVy = 0;
    };

    private bindEvents(): void {
        if (!isBrowser()) return;
        window.addEventListener("resize", this.onResize);

        const parent = this.canvas.parentElement;
        if (typeof ResizeObserver !== "undefined" && parent) {
            this.resizeObserver = new ResizeObserver(this.onResize);
            this.resizeObserver.observe(parent);
        }

        if (this.config.interactive) {
            window.addEventListener("mousemove", this.onMouse, { passive: true });
            window.addEventListener("touchmove", this.onTouch, { passive: true });
            window.addEventListener("touchend", this.onLeave, { passive: true });
            window.addEventListener("mouseout", this.onLeave);
        }

        if (this.config.pauseWhenOffscreen && typeof IntersectionObserver !== "undefined" && parent) {
            this.intersectionObserver = new IntersectionObserver(entries => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        this.visible = true;
                        if (!this.userPaused) this.start();
                    } else {
                        this.visible = false;
                        this.stop();
                    }
                }
            });
            this.intersectionObserver.observe(parent);
        }
    }

    private unbindEvents(): void {
        if (!isBrowser()) return;
        window.removeEventListener("resize", this.onResize);
        window.removeEventListener("mousemove", this.onMouse);
        window.removeEventListener("touchmove", this.onTouch);
        window.removeEventListener("touchend", this.onLeave);
        window.removeEventListener("mouseout", this.onLeave);
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
        this.intersectionObserver?.disconnect();
        this.intersectionObserver = null;
    }

    // ---- loop ----------------------------------------------------------------

    private readonly loop = (now: number): void => {
        if (!this.running) return;
        if (!this.lastTime) this.lastTime = now;
        let dt = (now - this.lastTime) / 1000;
        this.lastTime = now;
        if (dt > 0.1) dt = 0.1;

        if (this.frameInterval > 0) {
            this.accumulator += dt * 1000;
            if (this.accumulator >= this.frameInterval) {
                const stepDt = this.frameInterval / 1000;
                this.step(stepDt);
                this.render();
                this.accumulator = 0;
            }
        } else {
            this.step(dt);
            this.render();
        }

        if (dt > 0) {
            const instant = 1 / dt;
            this.fpsAvg = this.fpsAvg ? this.fpsAvg * 0.9 + instant * 0.1 : instant;
        }
        this.config.onFrame?.({
            fps: Math.round(this.fpsAvg),
            particles: this.particles.length,
            width: Math.round(this.width),
            height: Math.round(this.height),
        });

        this.rafId = requestAnimationFrame(this.loop);
    };

    // ---- public controller API ----------------------------------------------

    start(): void {
        if (this.running || !isBrowser()) return;
        this.running = true;
        this.lastTime = 0;
        this.rafId = requestAnimationFrame(this.loop);
    }

    stop(): void {
        this.running = false;
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.rafId = 0;
    }

    pause(): void {
        this.userPaused = true;
        this.stop();
    }

    resume(): void {
        this.userPaused = false;
        if (this.visible) this.start();
    }

    update(config: Partial<SnowConfig>): void {
        this.applyConfig({ ...this.config, ...config });
        if (!isBrowser()) return;
        this.setupCanvas();
        this.unbindEvents();
        this.bindEvents();
        this.onResize();

        if (this.reducedMotion) {
            this.stop();
            this.render();
        } else if (!this.userPaused && this.visible) {
            this.start();
        }
    }

    setCount(count: number): void {
        this.update({ count });
    }

    isRunning(): boolean {
        return this.running;
    }

    getConfig(): Readonly<ResolvedSnowConfig> {
        return { ...this.config };
    }

    destroy(): void {
        this.stop();
        this.unbindEvents();
        this.mediaQuery?.removeEventListener?.("change", this.onMotionPreference);
        this.mediaQuery = null;
        if (isBrowser()) this.ctx.clearRect(0, 0, this.width, this.height);
        this.particles = [];
    }

    getElement(): HTMLCanvasElement {
        return this.canvas;
    }
}
