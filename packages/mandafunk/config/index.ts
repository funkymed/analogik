/**
 * @module @mandarine/mandafunk/config
 *
 * Configuration module for the Mandafunk visualization engine.
 *
 * Exports all configuration types, default values, validation,
 * and merge utilities needed to create and manage engine configs.
 *
 * @example
 * ```typescript
 * import {
 *   type ConfigType,
 *   configDefault,
 *   mergeConfig,
 *   createConfig,
 *   validateConfig,
 * } from "@mandarine/mandafunk/config";
 * ```
 */

// Types
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
} from "./types";

// Defaults
export { configDefault } from "./defaults";

// Validation
export { validateConfig } from "./validator";
export type { ValidationResult } from "./validator";

// Merge utilities
export { mergeConfig, createConfig } from "./merge";
