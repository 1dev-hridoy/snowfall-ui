import type { MouseMode, ResolvedSnowConfig, SnowFrameStats, SnowType } from "./types";

/**
 * Resolved default configuration. Every field the engine reads is present here,
 * so consumers can omit any subset of {@link SnowConfig}.
 */
export const DEFAULTS = {
    count: 150,
    minSize: 1,
    maxSize: 4,
    minSpeed: 20,
    maxSpeed: 80,
    wind: 0,
    sway: 30,
    swaySpeed: 1,

    type: "classic" as SnowType,
    rotation: false,
    minRotationSpeed: -1,
    maxRotationSpeed: 1,
    opacity: 0.9,
    flicker: false,
    flickerSpeed: 2,
    parallax: true,
    gust: 0,
    gustSpeed: 6,

    color: "#ffffff",
    colors: [] as string[],
    glowColor: "#bfe3ff",
    blur: 8,
    customImage: "",

    fps: 0,
    pixelRatio: 2,
    pauseWhenOffscreen: true,
    respectReducedMotion: true,
    onFrame: undefined as ((stats: SnowFrameStats) => void) | undefined,

    interactive: false,
    mouseMode: "repel" as MouseMode,
    mouseRadius: 100,
    mouseForce: 1,

    zIndex: 0,
    background: "transparent",
} satisfies ResolvedSnowConfig;

export type { ResolvedSnowConfig };
