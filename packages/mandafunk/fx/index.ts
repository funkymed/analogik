/**
 * @module @mandarine/mandafunk/fx
 *
 * Visual effects and audio visualization modules for the MandaFunk engine.
 * Includes canvas-based renderers for audio data visualization,
 * image/text overlay management, and post-processing shader passes.
 */

// Audio visualizations
export { oscillo } from "./oscilloscope";
export { spectrum } from "./spectrum";
export { progressbar } from "./progressbar";
export { progresstimer } from "./progresstimer";

// Scene overlay management
export { updateImages, updateImageAnimation, updateImageFast } from "./image";
export { updateTexts } from "./text";

// Post-processing shader passes
export { FilmShader } from "./passes/FilmShader";
export { StaticShader } from "./passes/StaticShader";
export { RGBShiftShader } from "./passes/RGBShiftShader";
export { HueSaturationShader } from "./passes/HueSaturationShader";
export { KaleidoShader } from "./passes/KaleidoShader";
export { LensShader } from "./passes/LensShader";
export { FXAAShader } from "./passes/FXAAShader";
export { ColorifyShader } from "./passes/ColorifyShader";
export { WaterShader } from "./passes/WaterShader";
export { SelectiveUnrealBloomPass } from "./passes/UnrealBloomPass";
