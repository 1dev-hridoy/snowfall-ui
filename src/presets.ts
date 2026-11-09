/**
 * Built-in snow effect presets. Each preset is a partial {@link SnowConfig}
 * that selects a {@link SnowType} and ships sensible defaults for it.
 *
 * Pass a preset to `createSnowfall` / `<Snowfall />` by spreading it:
 *
 * ```ts
 * import { PRESETS, createSnowfall } from 'whiteout';
 * createSnowfall('#scene', { ...PRESETS.blizzard, wind: 200 });
 * ```
 */
import type { SnowConfig, SnowType } from "./types";

export const PRESETS: Record<SnowType, SnowConfig> = {
    classic: {
        type: "classic",
        count: 150,
        minSize: 1,
        maxSize: 4,
        minSpeed: 20,
        maxSpeed: 70,
        sway: 25,
        swaySpeed: 0.8,
        rotation: false,
        parallax: true,
        opacity: 0.85,
        color: "#ffffff",
    },

    realistic: {
        type: "realistic",
        count: 80,
        minSize: 6,
        maxSize: 16,
        minSpeed: 15,
        maxSpeed: 50,
        sway: 40,
        swaySpeed: 1.2,
        rotation: true,
        minRotationSpeed: -1.5,
        maxRotationSpeed: 1.5,
        parallax: true,
        opacity: 0.95,
        color: "#ffffff",
    },

    blizzard: {
        type: "blizzard",
        count: 400,
        minSize: 1,
        maxSize: 5,
        minSpeed: 120,
        maxSpeed: 260,
        wind: 120,
        sway: 60,
        swaySpeed: 2,
        rotation: false,
        parallax: true,
        opacity: 0.8,
        color: "#e8f2ff",
    },

    sparkle: {
        type: "sparkle",
        count: 220,
        minSize: 0.5,
        maxSize: 2.5,
        minSpeed: 8,
        maxSpeed: 30,
        sway: 15,
        swaySpeed: 1.5,
        rotation: false,
        flicker: true,
        flickerSpeed: 4,
        parallax: true,
        opacity: 1,
        color: "#fff7cc",
    },

    glow: {
        type: "glow",
        count: 60,
        minSize: 4,
        maxSize: 14,
        minSpeed: 10,
        maxSpeed: 35,
        sway: 35,
        swaySpeed: 0.6,
        rotation: false,
        parallax: true,
        opacity: 0.6,
        color: "#ffffff",
        glowColor: "#aee3ff",
        blur: 12,
    },

    custom: {
        type: "custom",
        count: 80,
        minSize: 12,
        maxSize: 28,
        minSpeed: 20,
        maxSpeed: 60,
        sway: 30,
        swaySpeed: 1,
        rotation: true,
        minRotationSpeed: -2,
        maxRotationSpeed: 2,
        parallax: true,
        opacity: 1,
        customImage: "",
    },

    dust: {
        type: "dust",
        count: 320,
        minSize: 0.6,
        maxSize: 2,
        minSpeed: 4,
        maxSpeed: 18,
        wind: 6,
        sway: 22,
        swaySpeed: 0.5,
        gust: 8,
        gustSpeed: 9,
        parallax: true,
        opacity: 0.5,
        color: "#dfe9ff",
    },

    hail: {
        type: "hail",
        count: 180,
        minSize: 2,
        maxSize: 6,
        minSpeed: 260,
        maxSpeed: 520,
        wind: 40,
        sway: 10,
        swaySpeed: 2.5,
        rotation: false,
        parallax: true,
        opacity: 0.9,
        color: "#dcecff",
        mouseMode: "repel",
        mouseRadius: 130,
        mouseForce: 1.6,
    },

    aurora: {
        type: "aurora",
        count: 90,
        minSize: 3,
        maxSize: 10,
        minSpeed: 6,
        maxSpeed: 26,
        wind: 14,
        sway: 46,
        swaySpeed: 0.35,
        gust: 22,
        gustSpeed: 11,
        rotation: false,
        flicker: true,
        flickerSpeed: 1.2,
        parallax: true,
        opacity: 0.75,
        color: "#8ef0d8",
        glowColor: "#7f8cff",
        blur: 18,
    },

    confetti: {
        type: "confetti",
        count: 160,
        minSize: 5,
        maxSize: 11,
        minSpeed: 60,
        maxSpeed: 170,
        wind: 30,
        sway: 55,
        swaySpeed: 1.8,
        rotation: true,
        minRotationSpeed: -5,
        maxRotationSpeed: 5,
        parallax: true,
        opacity: 1,
        color: "#ffffff",
        colors: ["#ff5d8f", "#ffd166", "#5ce1e6", "#a78bfa", "#7bed9f", "#ff9f68"],
    },
};

export function preset(type: SnowType): SnowConfig {
    return { ...PRESETS[type] };
}

export const PRESET_LABELS: Record<SnowType, string> = {
    classic: "Classic",
    realistic: "Realistic",
    blizzard: "Blizzard",
    sparkle: "Sparkle",
    glow: "Glow",
    dust: "Dust",
    hail: "Hail",
    aurora: "Aurora",
    confetti: "Confetti",
    custom: "Custom",
};

export const PRESET_DESCRIPTIONS: Record<SnowType, string> = {
    classic: "Soft round dots with a gentle sway. The safe default.",
    realistic: "Six-point snowflakes that rotate as they fall.",
    blizzard: "Dense, fast, wind-driven streaks.",
    sparkle: "Tiny flickering glitter.",
    glow: "Soft blurred orbs with bloom.",
    dust: "Barely-there motes for ambient haze.",
    hail: "Hard ice pellets at speed.",
    aurora: "Slow teal and violet light streaks.",
    confetti: "Multicolor chips for celebrations.",
    custom: "Your own image or emoji.",
};
