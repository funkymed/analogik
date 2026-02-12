/**
 * @module @mandarine/mandafunk/config/defaults
 *
 * Default configuration values for the Mandafunk visualization engine.
 * These defaults produce a clean, balanced visual output suitable as a
 * starting point for any track configuration.
 */

import type { ConfigType } from "./types";

/**
 * Default configuration for the Mandafunk visualization engine.
 *
 * Provides sensible defaults for all visual components:
 * - White-on-dark color scheme
 * - Bloom and film grain post-processing enabled
 * - Oscilloscope and spectrum analyzer visible
 * - Timer and progress bar positioned at the bottom
 *
 * Use {@link mergeConfig} to override specific values while keeping
 * the rest at their defaults.
 *
 * @example
 * ```typescript
 * import { configDefault, mergeConfig } from "@mandarine/mandafunk/config";
 *
 * const custom = mergeConfig(configDefault, {
 *   scene: { shader: "Plasma", brightness: 80 },
 * });
 * ```
 */
export const configDefault: ConfigType = {
  scene: {
    show: true,
    bgColor: "",
    background: "",
    blur: 0,
    brightness: 100,
    shader: "",
    shader_speed: 1,
    shader_opacity: 1.0,
    shader_blending: "additive" as const,
  },

  music: "",

  timer: {
    show: false,
    color: "#ffffff",
    bgColor: false,
    opacity: 0.7,
    order: 1,
    width: 512,
    height: 64,
    size: 20,
    font: "Kdam Thmor Pro",
    align: "center",
    x: 0,
    y: -227.4,
    z: -500,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
  },

  progressbar: {
    show: false,
    color: "#ffffff",
    cursorColor: "#ffffff",
    bgColor: false,
    opacity: 0.32,
    order: 1,
    width: 512,
    height: 64,
    x: 0,
    y: -185.4,
    z: -500,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
  },

  vumeters: {
    oscilloscop: {
      show: false,
      color: "#ffffff",
      bgColor: false,
      motionBlur: true,
      motionBlurLength: 0.25,
      opacity: 1,
      order: 1,
      width: 1024,
      height: 92,
      x: 0,
      y: 0,
      z: -250,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
    },
    spectrum: {
      show: false,
      color: "#ffffff",
      bgColor: false,
      multiColor: true,
      centerSpectrum: false,
      motionBlur: true,
      motionBlurLength: 0.25,
      opacity: 0.69,
      order: 1,
      bars: 128,
      width: 512,
      height: 48,
      x: 0,
      y: -156.3,
      z: -500,
      zoom: 1,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
    },
  },

  composer: {
    bloom: {
      show: false,
      strength: 0.85,
      threshold: 0.73,
      radius: 0.3,
    },
    rgb: {
      show: false,
      amount: 0.005,
      angle: 0.7,
    },
    film: {
      show: false,
      count: 1000,
      sIntensity: 0.22,
      nIntensity: 0.59,
      grayscale: false,
    },
    static: {
      show: false,
      amount: 0.2,
      size: 2,
    },
    hue: {
      show: false,
      hue: 0,
      saturation: 0,
    },
  },

  images: {},
  texts: {},

  sparks: {
    enabled: false,
    emitters: [],
  },
};
