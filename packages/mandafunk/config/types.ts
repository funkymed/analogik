/**
 * @module @mandarine/mandafunk/config/types
 *
 * Type definitions for the Mandafunk visualization engine configuration.
 * These types define the complete schema for controlling scene rendering,
 * audio visualization, post-processing effects, and overlay elements.
 */

// ---------------------------------------------------------------------------
// Animation types
// ---------------------------------------------------------------------------

/** Supported animation easing functions. */
export type AnimationEasing = "linear" | "easeIn" | "easeOut" | "easeInOut";

/**
 * Animation configuration for image overlays.
 * Controls how images move, rotate, or scale over time.
 */
export interface AnimationType {
  /** Whether the animation is active. */
  enabled: boolean;
  /** Animation property to animate (e.g., "rotation", "position", "scale"). */
  property?: string;
  /** Animation speed multiplier. */
  speed?: number;
  /** Animation easing function. */
  easing?: AnimationEasing;
  /** Animation amplitude or range. */
  amplitude?: number;
}

// ---------------------------------------------------------------------------
// Image overlay
// ---------------------------------------------------------------------------

/**
 * Configuration for an image overlay rendered in the 3D scene.
 * Images are placed as textured planes in the Three.js scene.
 */
export interface ImageType {
  /** Whether this image overlay is visible. */
  show: boolean;
  /** Path to the image file (relative or absolute URL). */
  path: string;
  /** Render order for layering (higher values render on top). */
  order: number;
  /** Opacity of the image, from 0 (invisible) to 1 (fully opaque). */
  opacity: number;
  /** Blending mode for the image mesh. */
  blending?: "additive" | "normal" | "subtractive";
  /** X position in the scene (range: -650 to 650). */
  x: number;
  /** Y position in the scene (range: -650 to 650). */
  y: number;
  /** Z position in the scene (range: -5 to -1 for images). */
  z: number;
  /** Zoom / scale factor. */
  zoom: number;
  /** Rotation around the X axis in radians (range: -2 to 2). */
  rotationX: number;
  /** Rotation around the Y axis in radians (range: -2 to 2). */
  rotationY: number;
  /** Rotation around the Z axis in radians (range: -2 to 2). */
  rotationZ: number;
  /** Object type identifier used for scene cleanup. */
  objType?: string;
  /** Optional animation configuration. */
  animation?: AnimationType;
  /** @deprecated Use assetId instead. Library image ID for persistence across sessions. */
  libraryId?: number;
  /** Reference to an asset in the timeline's asset registry. */
  assetId?: string;
}

// ---------------------------------------------------------------------------
// Text overlay
// ---------------------------------------------------------------------------

/**
 * Configuration for a text overlay rendered in the 3D scene.
 * Text is drawn to a canvas texture and placed as a plane in the scene.
 */
export interface TextType {
  /** Whether this text overlay is visible. */
  show: boolean;
  /** The text string to display. */
  text: string;
  /** Render order for layering (higher values render on top). */
  order: number;
  /** Text color as a CSS hex string (e.g., "#ffffff"). */
  color: string;
  /** Font family name. */
  font: string;
  /** Font size in pixels (range: 0 to 256). */
  size: number;
  /** Opacity of the text, from 0 (invisible) to 1 (fully opaque). */
  opacity: number;
  /** Blending mode for the text mesh. */
  blending?: "additive" | "normal" | "subtractive";
  /** X position in the scene (range: -650 to 650). */
  x: number;
  /** Y position in the scene (range: -650 to 650). */
  y: number;
  /** Z position in the scene (range: -650 to -1). */
  z: number;
  /** Rotation around the X axis in radians (range: -2 to 2). */
  rotationX: number;
  /** Rotation around the Y axis in radians (range: -2 to 2). */
  rotationY: number;
  /** Rotation around the Z axis in radians (range: -2 to 2). */
  rotationZ: number;
  /** Object type identifier used for scene cleanup. */
  objType?: string;
}

// ---------------------------------------------------------------------------
// Composer / post-processing
// ---------------------------------------------------------------------------

/** Bloom post-processing effect configuration. */
export interface BloomConfig {
  /** Whether the bloom effect is enabled. */
  show: boolean;
  /** Bloom strength / intensity (range: 0 to 1). */
  strength: number;
  /** Luminance threshold for bloom (range: 0 to 1). */
  threshold: number;
  /** Bloom radius / spread (range: 0 to 10). */
  radius: number;
}

/** RGB shift post-processing effect configuration. */
export interface RgbConfig {
  /** Whether the RGB shift effect is enabled. */
  show: boolean;
  /** Shift amount (range: 0 to 1). */
  amount: number;
  /** Shift angle in radians normalized to PI (range: 0 to 2). */
  angle: number;
}

/** Film grain post-processing effect configuration. */
export interface FilmConfig {
  /** Whether the film grain effect is enabled. */
  show: boolean;
  /** Scanline count (range: 0 to 1000). */
  count: number;
  /** Scanline intensity (range: 0 to 3). */
  sIntensity: number;
  /** Noise intensity (range: 0 to 3). */
  nIntensity: number;
  /** Whether to render in grayscale. */
  grayscale: boolean;
}

/** Static / noise post-processing effect configuration. */
export interface StaticConfig {
  /** Whether the static noise effect is enabled. */
  show: boolean;
  /** Amount of static noise (range: 0 to 1). */
  amount: number;
  /** Size of static noise pixels (range: 0 to 256). */
  size: number;
}

/** Hue/saturation post-processing effect configuration. */
export interface HueConfig {
  /** Whether the hue/saturation adjustment is enabled. */
  show: boolean;
  /** Hue rotation (range: 0 to 1). */
  hue: number;
  /** Saturation adjustment (range: 0 to 1). */
  saturation: number;
}

/** Lens distortion post-processing effect configuration. */
export interface LensConfig {
  /** Whether the lens distortion effect is enabled. */
  show: boolean;
  /** Lens distortion strength (range: 0 to 1). */
  strength: number;
  /** Lens height factor. */
  height: number;
  /** Cylindrical ratio (range: 0.25 to 4). */
  cylindricalRatio: number;
}

/** Kaleidoscope post-processing effect configuration. */
export interface KaleidoscopeConfig {
  /** Whether the kaleidoscope effect is enabled. */
  show: boolean;
  /** Number of kaleidoscope sides. */
  sides: number;
}

/**
 * Complete post-processing pipeline configuration.
 * Each effect can be independently enabled and configured.
 */
export interface ComposerType {
  /** Bloom / glow effect. */
  bloom: BloomConfig;
  /** RGB chromatic aberration shift. */
  rgb: RgbConfig;
  /** Film grain and scanlines. */
  film: FilmConfig;
  /** Static noise overlay. */
  static: StaticConfig;
  /** Hue and saturation adjustment. */
  hue: HueConfig;
  /** Lens distortion effect. */
  lens?: LensConfig;
  /** Kaleidoscope mirror effect. */
  kaleidoscope?: KaleidoscopeConfig;
}

// ---------------------------------------------------------------------------
// Scene configuration
// ---------------------------------------------------------------------------

/**
 * Scene background and shader configuration.
 * Controls the visual backdrop including GLSL shader effects.
 */
export interface SceneConfig {
  /** Whether the scene is visible during playback. Defaults to true. */
  show?: boolean;
  /** Background color as a CSS hex string. Empty string for no solid background. */
  bgColor: string;
  /** Background image URL. Empty string for no background image. */
  background: string;
  /** @deprecated Use bgAssetId instead. Library image ID for background persistence across sessions. */
  bgLibraryId?: number;
  /** Reference to an asset in the timeline's asset registry for the background image. */
  bgAssetId?: string;
  /** Background image sizing mode: "cover" keeps aspect ratio, "fit" stretches to fill. */
  bgFit?: "cover" | "fit" | "contain";
  /** Background image blur amount in pixels (range: 0 to 200). */
  blur: number;
  /** Background brightness percentage (range: 0 to 200). */
  brightness: number;
  /** GLSL shader name or empty string for no shader. */
  shader?: string;
  /** Whether the shader is visible (defaults to true when shader is set). */
  shader_show?: boolean;
  /** Shader animation speed multiplier. */
  shader_speed?: number;
  /** Shader opacity (range: 0 to 1). */
  shader_opacity?: number;
  /** Shader blend mode: "additive", "normal", or "subtractive". */
  shader_blending?: "additive" | "normal" | "subtractive";
  /** Shader zoom level. */
  shader_zoom?: number;
  /** Whether the shader uses sin/cos modulation on the X axis. */
  shader_sin_cos_x?: boolean;
  /** Whether the shader uses sin/cos modulation on the Y axis. */
  shader_sin_cos_y?: boolean;
  /** Speed of sin/cos modulation. */
  shader_sin_cos_speed?: number;
  /** Spatial frequency of sin/cos modulation. */
  shader_sin_cos_space?: number;
  /** Whether particle spark effects are enabled. */
  sparks?: boolean;
}

// ---------------------------------------------------------------------------
// Timer display
// ---------------------------------------------------------------------------

/** Text alignment options for the timer display. */
export type TimerAlign = "left" | "center";

/**
 * Timer display configuration.
 * Renders current playback position and duration as text.
 */
export interface TimerConfig {
  /** Whether the timer is visible. */
  show: boolean;
  /** Text color as a CSS hex string. */
  color: string;
  /** Whether to show a background behind the timer text. */
  bgColor: boolean;
  /** Opacity (range: 0 to 1). */
  opacity: number;
  /** Render order for layering. */
  order: number;
  /** Canvas texture width in pixels (range: 0 to 1024). */
  width: number;
  /** Canvas texture height in pixels (range: 0 to 1024). */
  height: number;
  /** Font size in pixels (range: 0 to 256). */
  size: number;
  /** Font family name. */
  font: string;
  /** Text alignment. */
  align: TimerAlign;
  /** Blending mode for the timer mesh. */
  blending?: "additive" | "normal" | "subtractive";
  /** X position in the scene (range: -650 to 650). */
  x: number;
  /** Y position in the scene (range: -650 to 650). */
  y: number;
  /** Z position in the scene (range: -650 to -1). */
  z: number;
  /** Rotation around the X axis in radians (range: -2 to 2). */
  rotationX: number;
  /** Rotation around the Y axis in radians (range: -2 to 2). */
  rotationY: number;
  /** Rotation around the Z axis in radians (range: -2 to 2). */
  rotationZ: number;
}

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

/**
 * Progress bar configuration.
 * Renders a horizontal bar indicating playback progress.
 */
export interface ProgressBarConfig {
  /** Whether the progress bar is visible. */
  show: boolean;
  /** Bar fill color as a CSS hex string. */
  color: string;
  /** Cursor / playhead color as a CSS hex string. */
  cursorColor: string;
  /** Whether to show a background behind the bar. */
  bgColor: boolean;
  /** Opacity (range: 0 to 1). */
  opacity: number;
  /** Render order for layering. */
  order: number;
  /** Canvas texture width in pixels (range: 0 to 1024). */
  width: number;
  /** Canvas texture height in pixels (range: 0 to 1024). */
  height: number;
  /** Blending mode for the progress bar mesh. */
  blending?: "additive" | "normal" | "subtractive";
  /** X position in the scene (range: -650 to 650). */
  x: number;
  /** Y position in the scene (range: -650 to 650). */
  y: number;
  /** Z position in the scene (range: -650 to -1). */
  z: number;
  /** Rotation around the X axis in radians (range: -2 to 2). */
  rotationX: number;
  /** Rotation around the Y axis in radians (range: -2 to 2). */
  rotationY: number;
  /** Rotation around the Z axis in radians (range: -2 to 2). */
  rotationZ: number;
}

// ---------------------------------------------------------------------------
// Oscilloscope
// ---------------------------------------------------------------------------

/**
 * Oscilloscope (waveform) visualization configuration.
 * Draws the audio waveform as a line graph on a canvas texture.
 */
export interface OscilloscopeConfig {
  /** Whether the oscilloscope is visible. */
  show: boolean;
  /** Line color as a CSS hex string. */
  color: string;
  /** Whether to show a background behind the oscilloscope. */
  bgColor: boolean;
  /** Whether additive blending (motion blur effect) is enabled. */
  motionBlur: boolean;
  /** Motion blur trail length (range: 0 to 1). */
  motionBlurLength: number;
  /** Opacity (range: 0 to 1). */
  opacity: number;
  /** Render order for layering. */
  order: number;
  /** Canvas texture width in pixels (range: 0 to 1024). */
  width: number;
  /** Canvas texture height in pixels (range: 0 to 1024). */
  height: number;
  /** Blending mode for the oscilloscope mesh. */
  blending?: "additive" | "normal" | "subtractive";
  /** X position in the scene (range: -650 to 650). */
  x: number;
  /** Y position in the scene (range: -650 to 650). */
  y: number;
  /** Z position in the scene (range: -650 to -1). */
  z: number;
  /** Rotation around the X axis in radians (range: -2 to 2). */
  rotationX: number;
  /** Rotation around the Y axis in radians (range: -2 to 2). */
  rotationY: number;
  /** Rotation around the Z axis in radians (range: -2 to 2). */
  rotationZ: number;
}

// ---------------------------------------------------------------------------
// Spectrum analyzer
// ---------------------------------------------------------------------------

/**
 * Spectrum analyzer (frequency bars) visualization configuration.
 * Draws frequency data as vertical bars on a canvas texture.
 */
export interface SpectrumConfig {
  /** Whether the spectrum analyzer is visible. */
  show: boolean;
  /** Bar color as a CSS hex string, or false for default. */
  color: string | boolean;
  /** Background color as a CSS hex string, or false for transparent. */
  bgColor: string | boolean;
  /** Whether to use multi-color gradient bars. */
  multiColor: boolean;
  /** Whether to center the spectrum (mirror effect). */
  centerSpectrum: boolean;
  /** Whether additive blending (motion blur effect) is enabled. */
  motionBlur: boolean;
  /** Motion blur trail length (range: 0 to 1). */
  motionBlurLength: number;
  /** Opacity (range: 0 to 1). */
  opacity: number;
  /** Render order for layering. */
  order: number;
  /** Number of frequency bars to display (range: 0 to 256). */
  bars: number;
  /** Canvas texture width in pixels (range: 0 to 1024). */
  width: number;
  /** Canvas texture height in pixels (range: 0 to 1024). */
  height: number;
  /** Blending mode for the spectrum mesh. */
  blending?: "additive" | "normal" | "subtractive";
  /** X position in the scene (range: -650 to 650). */
  x: number;
  /** Y position in the scene (range: -650 to 650). */
  y: number;
  /** Z position in the scene (range: -650 to -1). */
  z: number;
  /** Zoom / scale factor for the spectrum mesh. */
  zoom: number;
  /** Rotation around the X axis in radians (range: -2 to 2). */
  rotationX: number;
  /** Rotation around the Y axis in radians (range: -2 to 2). */
  rotationY: number;
  /** Rotation around the Z axis in radians (range: -2 to 2). */
  rotationZ: number;
}

// ---------------------------------------------------------------------------
// VU meters (oscilloscope + spectrum)
// ---------------------------------------------------------------------------

/**
 * Combined audio visualization meters configuration.
 * Groups the oscilloscope and spectrum analyzer settings.
 */
export interface VuMetersConfig {
  /** Oscilloscope (waveform) display settings. */
  oscilloscop: OscilloscopeConfig;
  /** Spectrum (frequency bars) display settings. */
  spectrum: SpectrumConfig;
}

// ---------------------------------------------------------------------------
// Root configuration
// ---------------------------------------------------------------------------

/**
 * Complete Mandafunk visualization engine configuration.
 *
 * This is the root configuration type that controls all aspects of the
 * rendering: scene background, GLSL shaders, audio visualizations,
 * post-processing effects, and overlay elements (images and text).
 *
 * @example
 * ```typescript
 * import { ConfigType, configDefault } from "@mandarine/mandafunk/config";
 *
 * const myConfig: ConfigType = {
 *   ...configDefault,
 *   scene: {
 *     ...configDefault.scene,
 *     shader: "Plasma",
 *     brightness: 80,
 *   },
 * };
 * ```
 */
// ---------------------------------------------------------------------------
// Sparks / particle system
// ---------------------------------------------------------------------------

/** Configuration for the sparks particle system. */
export interface SparksConfig {
  /** Whether the sparks system is globally enabled. */
  enabled: boolean;
  /** List of particle emitters. */
  emitters: SparkEmitter[];
}

/** Configuration for a single spark emitter. */
export interface SparkEmitter {
  /** Unique identifier for the emitter. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Number of particles. */
  count: number;
  /** Particle color as a CSS hex string. */
  color: string;
  /** Particle opacity (0-1). */
  opacity: number;
  /** Particle size. */
  size: number;
  /** Acceleration factor. */
  acceleration: number;
  /** Emission origin point. */
  emissionOrigin: { x: number; y: number; z: number };
  /** Direction of emission. */
  emissionDirection: "up" | "down" | "left" | "right" | "radial";
  /** Perturbation settings for wobble effect. */
  perturbation: { enabled: boolean; amplitude: number; frequency: number };
  /** Sprite texture path. */
  sprite: string;
  /** Reference to an asset in the timeline's asset registry for the sprite. */
  assetId?: string;
  /** Blending mode for particles. */
  blending: "additive" | "normal";
  /** Whether this emitter is muted (hidden). */
  muted: boolean;
}

// ---------------------------------------------------------------------------
// Root configuration
// ---------------------------------------------------------------------------

/**
 * Complete Mandafunk visualization engine configuration.
 *
 * This is the root configuration type that controls all aspects of the
 * rendering: scene background, GLSL shaders, audio visualizations,
 * post-processing effects, and overlay elements (images and text).
 *
 * @example
 * ```typescript
 * import { ConfigType, configDefault } from "@mandarine/mandafunk/config";
 *
 * const myConfig: ConfigType = {
 *   ...configDefault,
 *   scene: {
 *     ...configDefault.scene,
 *     shader: "Plasma",
 *     brightness: 80,
 *   },
 * };
 * ```
 */
export interface ConfigType {
  /** Scene background and shader configuration. */
  scene: SceneConfig;
  /** Music file URL or path. */
  music: string;
  /** Timer display configuration. */
  timer: TimerConfig;
  /** Progress bar configuration. */
  progressbar: ProgressBarConfig;
  /** Audio visualization meters (oscilloscope and spectrum). */
  vumeters: VuMetersConfig;
  /** Post-processing effects pipeline configuration. */
  composer: ComposerType;
  /** Image overlay configurations, keyed by name. */
  images?: Record<string, ImageType> | ImageType[];
  /** Text overlay configurations, keyed by name. */
  texts?: Record<string, TextType> | TextType[];
  /** Sparks particle system configuration. */
  sparks?: SparksConfig;
}
