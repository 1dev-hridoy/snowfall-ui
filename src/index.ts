/**
 * whiteout — framework-agnostic snow effect for React, Next.js & vanilla HTML.
 *
 * This root entry is framework-free (no React import). Vanilla and
 * framework-agnostic consumers import from here; React consumers import from
 * `whiteout/react`.
 */
export * from './types';
export * from './defaults';
export * from './presets';
export * from './utils';
export { SnowEngine } from './engine';
export type { EngineOptions } from './engine';
export { createSnowfall } from './vanilla';
