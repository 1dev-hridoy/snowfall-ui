'use client';

/**
 * `<SnowfallLayer />` — the 90% case, packaged.
 *
 * Renders a fixed, full-viewport snow canvas behind your content, with sensible
 * defaults and a `children` slot that is already lifted above the canvas. Use
 * `<Snowfall />` directly when you need to control the positioning context.
 */
import * as React from 'react';
import { Snowfall, type SnowfallProps } from './Snowfall';
import { PRESETS } from '../presets';

export interface SnowfallLayerProps extends Omit<SnowfallProps, 'fullscreen'> {
  /** Content rendered above the snow. */
  children?: React.ReactNode;
  /** Extra class on the wrapper. */
  className?: string;
  /** Extra style on the wrapper. */
  style?: React.CSSProperties;
}

export function SnowfallLayer({
  children,
  className,
  style,
  zIndex = 0,
  ...config
}: SnowfallLayerProps) {
  return (
    <>
      <Snowfall {...PRESETS.classic} {...config} fullscreen zIndex={zIndex} />
      <div
        className={className}
        style={{ position: 'relative', zIndex: zIndex + 1, ...style }}
      >
        {children}
      </div>
    </>
  );
}

export default SnowfallLayer;
