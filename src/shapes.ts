/**
 * Canvas 2D shape renderers for each {@link SnowType}.
 *
 * Every renderer draws centered at the origin (the caller translates first),
 * so shapes are pure and reusable. `drawFlake` is the single entry point used
 * by the engine.
 */
import type { SnowType } from "./types";

export interface FlakeRender {
    x: number;
    y: number;
    size: number;
    rotation: number;
    opacity: number;
    motionAngle?: number;
    color?: string;
}

interface DrawArgs {
    ctx: CanvasRenderingContext2D;
    type: SnowType;
    p: FlakeRender;
    color: string;
    glowColor: string;
    blur: number;
    img: HTMLImageElement | null;
    imgReady: boolean;
}

export function drawFlake(args: DrawArgs): void {
    const { ctx, type, p, color, glowColor, blur, img, imgReady } = args;
    const paint = p.color || color;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = p.opacity;

    switch (type) {
        case "classic":
            drawDot(ctx, p.size, paint);
            break;
        case "realistic":
            ctx.save();
            ctx.rotate(p.rotation);
            drawSnowflake(ctx, p.size, paint);
            ctx.restore();
            break;
        case "blizzard":
            drawStreak(ctx, p.size, paint, p.motionAngle ?? Math.PI / 2);
            break;
        case "sparkle":
            ctx.save();
            ctx.rotate(p.rotation);
            drawSparkle(ctx, p.size, paint);
            ctx.restore();
            break;
        case "glow":
            drawGlow(ctx, p.size, paint, glowColor, blur);
            break;
        case "dust":
            drawDust(ctx, p.size, paint);
            break;
        case "hail":
            drawHail(ctx, p.size, paint);
            break;
        case "aurora":
            ctx.save();
            ctx.rotate(p.rotation);
            drawAurora(ctx, p.size, paint, glowColor, blur);
            ctx.restore();
            break;
        case "confetti":
            ctx.save();
            ctx.rotate(p.rotation);
            drawConfetti(ctx, p.size, paint);
            ctx.restore();
            break;
        case "custom":
            ctx.save();
            ctx.rotate(p.rotation);
            drawImageFlake(ctx, p.size, img, imgReady);
            ctx.restore();
            break;
    }

    ctx.restore();
}

function drawDot(ctx: CanvasRenderingContext2D, size: number, color: string): void {
    const r = size / 2;
    if (r <= 0) return;
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    grad.addColorStop(0, color);
    grad.addColorStop(0.7, color);
    grad.addColorStop(1, withFade(color, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
}

function drawSnowflake(ctx: CanvasRenderingContext2D, size: number, color: string): void {
    const r = size / 2;
    if (r <= 0) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(0.6, size / 14);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.rotate((Math.PI / 3) * i);
        ctx.beginPath();

        ctx.moveTo(0, 0);
        ctx.lineTo(0, -r);

        ctx.moveTo(0, -r * 0.55);
        ctx.lineTo(r * 0.24, -r * 0.75);
        ctx.moveTo(0, -r * 0.55);
        ctx.lineTo(-r * 0.24, -r * 0.75);

        ctx.moveTo(0, -r * 0.82);
        ctx.lineTo(r * 0.15, -r * 0.96);
        ctx.moveTo(0, -r * 0.82);
        ctx.lineTo(-r * 0.15, -r * 0.96);
        ctx.stroke();
        ctx.restore();
    }
}

function drawStreak(ctx: CanvasRenderingContext2D, size: number, color: string, angle: number): void {
    const len = size * 2.4;
    if (len <= 0) return;
    ctx.save();
    ctx.rotate(angle - Math.PI / 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(0.5, size * 0.55);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, len / 2);
    ctx.lineTo(0, -len / 2);
    ctx.stroke();
    ctx.restore();
}

function drawSparkle(ctx: CanvasRenderingContext2D, size: number, color: string): void {
    const r = size;
    if (r <= 0) return;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.28, -r * 0.28);
    ctx.lineTo(r, 0);
    ctx.lineTo(r * 0.28, r * 0.28);
    ctx.lineTo(0, r);
    ctx.lineTo(-r * 0.28, r * 0.28);
    ctx.lineTo(-r, 0);
    ctx.lineTo(-r * 0.28, -r * 0.28);
    ctx.closePath();
    ctx.fill();
}

function drawGlow(ctx: CanvasRenderingContext2D, size: number, color: string, glowColor: string, blur: number): void {
    const r = size;
    if (r <= 0) return;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = blur;
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    grad.addColorStop(0, color);
    grad.addColorStop(0.45, withFade(glowColor, 0.7));
    grad.addColorStop(1, withFade(glowColor, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawDust(ctx: CanvasRenderingContext2D, size: number, color: string): void {
    const r = Math.max(0.35, size / 2);
    ctx.fillStyle = withFade(color, 0.55);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
}

function drawHail(ctx: CanvasRenderingContext2D, size: number, color: string): void {
    const r = Math.max(0.5, size / 2);
    ctx.fillStyle = withFade(color, 0.9);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = withFade(color, 1);
    ctx.lineWidth = Math.max(0.4, r * 0.28);
    ctx.stroke();

    ctx.fillStyle = withFade("#ffffff", 0.85);
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.3, Math.max(0.3, r * 0.28), 0, Math.PI * 2);
    ctx.fill();
}

function drawAurora(ctx: CanvasRenderingContext2D, size: number, color: string, glowColor: string, blur: number): void {
    const r = Math.max(0.5, size / 2);
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = blur;
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    grad.addColorStop(0, color);
    grad.addColorStop(0.5, withFade(color, 0.55));
    grad.addColorStop(1, withFade(glowColor, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.55, r * 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawConfetti(ctx: CanvasRenderingContext2D, size: number, color: string): void {
    const w = Math.max(1, size * 1.15);
    const h = Math.max(1, size * 0.6);
    ctx.fillStyle = color;
    ctx.fillRect(-w / 2, -h / 2, w, h);
}

function drawImageFlake(
    ctx: CanvasRenderingContext2D,
    size: number,
    img: HTMLImageElement | null,
    ready: boolean,
): void {
    if (!ready || !img) return;
    const s = size;
    ctx.drawImage(img, -s / 2, -s / 2, s, s);
}

/** Convert a hex/rgb color into an rgba() string at the given alpha. */
function withFade(color: string, alpha: number): string {
    if (color.startsWith("rgba") || color.startsWith("rgb(")) {
        return color;
    }
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
