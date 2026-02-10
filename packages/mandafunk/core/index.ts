/**
 * @module @mandarine/mandafunk/core
 *
 * Core rendering classes for the MandaFunk visualization engine.
 * These classes manage the Three.js scene, post-processing pipeline,
 * static visual elements (spectrum, oscilloscope, timer, progress bar),
 * and the unified renderer facade.
 */

export { MandaScene } from "./MandaScene";
export { Composer } from "./Composer";
export { StaticItems } from "./StaticItems";
export { MandaRenderer } from "./MandaRenderer";
export type { MandaRendererOptions } from "./MandaRenderer";
