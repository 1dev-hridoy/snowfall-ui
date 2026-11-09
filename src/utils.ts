import type { SnowConfig, SnowType } from "./types";

/** Clamp `v` to the inclusive `[min, max]` range. */
export function clamp(v: number, min: number, max: number): number {
    return v < min ? min : v > max ? max : v;
}

export function rand(min: number, max: number): number {
    return min + Math.random() * (max - min);
}

export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

export function damp(value: number, factor: number, dt: number): number {
    return value * Math.pow(factor, dt * 60);
}

export function withAlpha(color: string, alpha: number): string {
    if (color.startsWith("rgba") || color.startsWith("hsl")) return color;
    const hex = color.replace("#", "");
    const full =
        hex.length === 3
            ? hex
                  .split("")
                  .map(c => c + c)
                  .join("")
            : hex.length === 8
              ? hex.slice(0, 6)
              : hex;
    if (full.length !== 6) return color;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function isBrowser(): boolean {
    return typeof window !== "undefined" && typeof document !== "undefined";
}

export const SNOW_TYPES: SnowType[] = [
    "classic",
    "realistic",
    "blizzard",
    "sparkle",
    "glow",
    "dust",
    "hail",
    "aurora",
    "confetti",
    "custom",
];

/**
 * Build an inline SVG data URI that renders an emoji as a flake.
 *
 * ```ts
 * createSnowfall('#scene', { ...PRESETS.custom, customImage: emojiFlake('🍁') });
 * ```
 */
export function emojiFlake(emoji: string, size = 32): string {
    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
        `<text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" ` +
        `font-size="${Math.round(size * 0.82)}">${emoji}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Serialize a config into a copy-pasteable snippet, omitting fields that match
 * the defaults so the output stays short. Used by the playground's export box.
 */
export function toSnippet(config: SnowConfig, indent = 2): string {
    const pad = " ".repeat(indent);
    const lines: string[] = [];
    for (const [key, value] of Object.entries(config)) {
        if (value === undefined) continue;
        if (Array.isArray(value) && value.length === 0) continue;
        if (key === "onFrame") continue;
        lines.push(`${pad}${key}: ${JSON.stringify(value)}`);
    }
    return `{\n${lines.join(",\n")}\n}`;
}
