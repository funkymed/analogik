/**
 * @mandarine/mandafunk
 *
 * WebGL visualization engine for chiptune music.
 *
 * Provides GLSL shader backgrounds, audio-reactive visualizations
 * (oscilloscope, spectrum analyzer), post-processing effects, and
 * a unified rendering facade built on Three.js.
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * import {
 *   MandaRenderer,
 *   createConfig,
 *   availableShaders,
 *   loadShader,
 * } from "@mandarine/mandafunk";
 *
 * // Create renderer
 * const renderer = new MandaRenderer(canvas, audioCtx, analyser);
 * await renderer.init();
 *
 * // Load a configuration
 * const config = createConfig({
 *   scene: { shader: "Plasma", brightness: 80 },
 *   composer: { bloom: { strength: 1.0 } },
 * });
 * await renderer.loadConfig(config);
 *
 * // Render loop
 * function animate() {
 *   requestAnimationFrame(animate);
 *   renderer.render();
 * }
 * animate();
 * ```
 */

// ---------------------------------------------------------------------------
// Core renderer facade
// ---------------------------------------------------------------------------

export { MandaRenderer } from "./core/MandaRenderer";
export type { MandaRendererOptions } from "./core/MandaRenderer";

// ---------------------------------------------------------------------------
// Configuration types and utilities
// ---------------------------------------------------------------------------

export type {
  ConfigType,
  SceneConfig,
  TimerConfig,
  TimerAlign,
  ProgressBarConfig,
  OscilloscopeConfig,
  SpectrumConfig,
  VuMetersConfig,
  ComposerType,
  BloomConfig,
  RgbConfig,
  FilmConfig,
  StaticConfig,
  HueConfig,
  LensConfig,
  KaleidoscopeConfig,
  ImageType,
  TextType,
  AnimationType,
  AnimationEasing,
} from "./config/types";

export { configDefault } from "./config/defaults";

export { validateConfig } from "./config/validator";
export type { ValidationResult } from "./config/validator";

export { mergeConfig, createConfig } from "./config/merge";

// ---------------------------------------------------------------------------
// Shader system
// ---------------------------------------------------------------------------

export { availableShaders, loadShader } from "./shaders/index";
export { ShaderAbstract } from "./shaders/index";
export type { BackgroundShader, TextureSpectrumProvider } from "./shaders/index";

// ---------------------------------------------------------------------------
// Core classes (scene, composer, static items)
// ---------------------------------------------------------------------------

export { MandaScene } from "./core/MandaScene";
export { Composer } from "./core/Composer";
export { StaticItems } from "./core/StaticItems";
