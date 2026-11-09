"use client";

/**
 * React + Next.js entry point.
 *
 * `<Snowfall />` renders a canvas and wires it to a {@link SnowEngine} for the
 * lifetime of the component. Pass any {@link SnowConfig} (or spread a
 * {@link PRESETS} entry) as props; changing props live-updates the engine
 * without remounting.
 *
 * The `'use client'` directive makes it safe to import directly in the Next.js
 * App Router. For the Pages Router (or anywhere you want to be explicit), use
 * `next/dynamic` with `ssr: false` — see the README.
 */
import * as React from "react";
import { SnowEngine } from "../engine";
import type { SnowConfig, SnowController } from "../types";

export interface SnowfallProps extends SnowConfig {
    className?: string;

    style?: React.CSSProperties;
    /**
     * When true the canvas is `position: fixed` covering the whole viewport;
     * otherwise it absolutely fills its nearest positioned ancestor.
     * Default `false`.
     */
    fullscreen?: boolean;
    /**
     * Start paused. Useful when the effect should wait for a user action.
     * Default `false`.
     */
    paused?: boolean;
}

/**
 * Imperative handle: the canvas element plus the full controller API, so
 * consumers can pause, resume, retune, or tear down without remounting.
 */
export type SnowfallHandle = HTMLCanvasElement & {
    controller: SnowController | null;
    pause(): void;
    resume(): void;
    update(config: Partial<SnowConfig>): void;
    setCount(count: number): void;
    isRunning(): boolean;
};

export const Snowfall = React.forwardRef<SnowfallHandle, SnowfallProps>(function Snowfall(
    { className, style, fullscreen = false, paused = false, ...config },
    ref,
) {
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
    const engineRef = React.useRef<SnowEngine | null>(null);

    const configRef = React.useRef(config);
    configRef.current = config;

    React.useImperativeHandle(ref, () => {
        const el = canvasRef.current as HTMLCanvasElement;
        const handle = el as unknown as SnowfallHandle;

        handle.controller = engineRef.current;
        handle.pause = () => engineRef.current?.pause();
        handle.resume = () => engineRef.current?.resume();
        handle.update = cfg => engineRef.current?.update(cfg);
        handle.setCount = n => engineRef.current?.setCount(n);
        handle.isRunning = () => engineRef.current?.isRunning() ?? false;
        return handle;
    }, []);

    React.useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new SnowEngine(canvasRef.current, configRef.current, {
            manageStyle: false,
        });
        engineRef.current = engine;
        if (paused) engine.pause();
        return () => {
            engine.destroy();
            engineRef.current = null;
        };
    }, []);

    const configKey = React.useMemo(() => JSON.stringify({ ...config, onFrame: undefined }), [config]);
    React.useEffect(() => {
        if (!engineRef.current) return;
        engineRef.current.update(configRef.current);
    }, [configKey]);

    React.useEffect(() => {
        if (!engineRef.current) return;
        engineRef.current.update({ onFrame: config.onFrame });
    }, [config.onFrame]);

    React.useEffect(() => {
        const engine = engineRef.current;
        if (!engine) return;
        if (paused) engine.pause();
        else engine.resume();
    }, [paused]);

    const mergedStyle: React.CSSProperties = {
        position: fullscreen ? "fixed" : "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: typeof config.zIndex === "number" ? config.zIndex : 0,
        ...style,
    };

    return <canvas ref={canvasRef} className={className} style={mergedStyle} aria-hidden="true" />;
});

export default Snowfall;
