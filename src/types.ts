/**
 * Public type definitions for whiteout.
 */

/** The built-in visual styles of falling snow. */
export type SnowType =
    | "classic"
    | "realistic"
    | "blizzard"
    | "sparkle"
    | "glow"
    | "dust"
    | "hail"
    | "aurora"
    | "confetti"
    | "custom";

/**
 * Full configuration for a snow effect. Every field is optional; unset fields
 * fall back to {@link DEFAULTS}. Pass a {@link PRESETS} entry to start from a
 * tuned baseline for a given {@link SnowType}.
 */
export interface SnowConfig {
    // --- Core physics ---
    count?: number;
    minSize?: number;
    maxSize?: number;
    minSpeed?: number;
    maxSpeed?: number;
    wind?: number;
    sway?: number;
    swaySpeed?: number;

    // --- Behavior ---

    type?: SnowType;

    rotation?: boolean;

    minRotationSpeed?: number;

    maxRotationSpeed?: number;

    opacity?: number;

    flicker?: boolean;

    flickerSpeed?: number;

    parallax?: boolean;

    gust?: number;
    gustSpeed?: number;

    // --- Color & shape ---
    /** Particle color. Default '#ffffff'. */
    color?: string;

    colors?: string[];

    glowColor?: string;

    blur?: number;

    customImage?: string;

    // --- Performance ---
    fps?: number;
    pixelRatio?: number;
    pauseWhenOffscreen?: boolean;

    respectReducedMotion?: boolean;

    onFrame?: (stats: SnowFrameStats) => void;

    // --- Interactions ---

    interactive?: boolean;

    mouseMode?: MouseMode;

    mouseRadius?: number;

    mouseForce?: number;

    zIndex?: number;

    background?: string;
}

export type MouseMode = "repel" | "attract" | "trail";

/** Live statistics reported to {@link SnowConfig.onFrame}. */
export interface SnowFrameStats {
    fps: number;
    particles: number;
    width: number;
    height: number;
}

/**
 * A config with every field filled in. Identical to `Required<SnowConfig>`
 * except `onFrame`, which stays optional because it is a callback, not a value.
 */
export type ResolvedSnowConfig = Required<Omit<SnowConfig, "onFrame">> & {
    onFrame?: (stats: SnowFrameStats) => void;
};

/**
 * Handle returned by `createSnowfall` and the React imperative ref. Use it to
 * start, stop, reconfigure, or tear down a running effect.
 */
export interface SnowController {
    start(): void;
    stop(): void;
    pause(): void;
    resume(): void;
    update(config: Partial<SnowConfig>): void;
    destroy(): void;
    getElement(): HTMLCanvasElement;
    setCount(count: number): void;
    isRunning(): boolean;
    getConfig(): Readonly<ResolvedSnowConfig>;
}
