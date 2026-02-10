/**
 * @module @mandarine/mandafunk/config/validator
 *
 * Configuration validation utilities for the Mandafunk engine.
 * Validates that configuration values fall within acceptable ranges
 * based on the GUI editor constraints.
 */

import type { ConfigType, ComposerType } from "./types";

/**
 * Result of a configuration validation.
 */
export interface ValidationResult {
  /** Whether the configuration is valid (no errors). */
  valid: boolean;
  /** List of validation error messages. Empty when valid. */
  errors: string[];
}

// ---------------------------------------------------------------------------
// Numeric range definitions (derived from GUI editor varFloat)
// ---------------------------------------------------------------------------

/**
 * Numeric range constraints for configuration values.
 * Format: [min, max, step].
 *
 * These ranges mirror the constraints defined in the GUI editor
 * to ensure configurations stay within renderable bounds.
 */
const NUMERIC_RANGES: Record<string, [number, number, number]> = {
  blur: [0, 200, 1],
  hue: [0, 1, 0.01],
  saturation: [0, 1, 0.01],
  brightness: [0, 200, 1],
  opacity: [0, 1, 0.01],
  width: [0, 1024, 1],
  height: [0, 1024, 1],
  bars: [0, 256, 1],
  amount: [0, 1, 0.001],
  count: [0, 1000, 1],
  size: [0, 256, 1],
  radius: [0, 10, 0.1],
  threshold: [0, 1, 0.01],
  strength: [0, 1, 0.01],
  angle: [0, 2, 0.01],
  sIntensity: [0, 3, 0.01],
  nIntensity: [0, 3, 0.01],
  rotationX: [-2, 2, 0.01],
  rotationY: [-2, 2, 0.01],
  rotationZ: [-2, 2, 0.01],
  cylindricalRatio: [0.25, 4, 0.1],
  motionBlurLength: [0, 1, 0.01],
  shader_speed: [0, 10, 0.01],
  shader_opacity: [0, 1, 0.01],
  shader_zoom: [0, 10, 0.01],
  shader_sin_cos_speed: [0, 10, 0.01],
  shader_sin_cos_space: [0, 10, 0.01],
  zoom: [0, 10, 0.01],
};

/** Position range for scene elements (timer, vumeters, progressbar, texts). */
const POSITION_RANGE: Record<string, [number, number]> = {
  x: [-650, 650],
  y: [-650, 650],
  z: [-650, -1],
};

/** Position range for image overlays. */
const IMAGE_POSITION_RANGE: Record<string, [number, number]> = {
  x: [-2, 2],
  y: [-2, 2],
  z: [-5, -1],
};

// ---------------------------------------------------------------------------
// Hex color validation
// ---------------------------------------------------------------------------

/** Regular expression matching valid CSS hex color strings (#RGB, #RRGGBB, #RRGGBBAA). */
const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/** Regular expression matching hex colors with optional 0x prefix. */
const HEX_COLOR_LOOSE_REGEX = /^(#|0x)([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/**
 * Checks whether a string is a valid hex color.
 *
 * @param value - The string to test.
 * @returns `true` if the string is a valid hex color.
 */
function isValidHexColor(value: string): boolean {
  if (!value || value === "") return true; // empty is allowed (no color)
  return HEX_COLOR_LOOSE_REGEX.test(value);
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Casts a typed object to a generic record for iteration.
 * This is safe because we only read values; we never write back.
 */
function asRecord(obj: unknown): Record<string, unknown> {
  return obj as unknown as Record<string, unknown>;
}

/**
 * Validates a numeric value against a known range.
 *
 * @param path - Dot-separated path for error messages (e.g., "scene.blur").
 * @param key - The property name to look up the range for.
 * @param value - The value to validate.
 * @param errors - Array to push error messages into.
 */
function validateNumericRange(
  path: string,
  key: string,
  value: number,
  errors: string[],
): void {
  const range = NUMERIC_RANGES[key];
  if (range) {
    const [min, max] = range;
    if (value < min || value > max) {
      errors.push(`${path}: value ${value} is out of range [${min}, ${max}]`);
    }
  }
}

/**
 * Validates position coordinates (x, y, z) for a scene element.
 *
 * @param path - Dot-separated path for error messages.
 * @param obj - Object containing x, y, z properties.
 * @param isImage - Whether this is an image overlay (uses tighter ranges).
 * @param errors - Array to push error messages into.
 */
function validatePosition(
  path: string,
  obj: Record<string, unknown>,
  isImage: boolean,
  errors: string[],
): void {
  const ranges = isImage ? IMAGE_POSITION_RANGE : POSITION_RANGE;

  for (const axis of ["x", "y", "z"] as const) {
    if (typeof obj[axis] === "number") {
      const [min, max] = ranges[axis];
      const value = obj[axis] as number;
      if (value < min || value > max) {
        errors.push(
          `${path}.${axis}: value ${value} is out of range [${min}, ${max}]`,
        );
      }
    }
  }
}

/**
 * Validates a color property on an object.
 *
 * @param path - Dot-separated path for error messages.
 * @param key - Property name.
 * @param value - The color string to validate.
 * @param errors - Array to push error messages into.
 */
function validateColor(
  path: string,
  key: string,
  value: unknown,
  errors: string[],
): void {
  if (typeof value === "string" && value !== "") {
    if (!isValidHexColor(value)) {
      errors.push(`${path}.${key}: "${value}" is not a valid hex color`);
    }
  }
}

/**
 * Recursively validates numeric and color values in an object.
 *
 * @param path - Dot-separated path prefix.
 * @param obj - The object to validate.
 * @param errors - Array to push error messages into.
 * @param isImage - Whether this is an image overlay context.
 */
function validateObject(
  path: string,
  obj: Record<string, unknown>,
  errors: string[],
  isImage: boolean = false,
): void {
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;

    if (typeof value === "number") {
      validateNumericRange(`${path}.${key}`, key, value, errors);
    } else if (typeof value === "string") {
      if (key === "color" || key === "bgColor" || key === "cursorColor") {
        validateColor(path, key, value, errors);
      }
    } else if (typeof value === "object" && !Array.isArray(value)) {
      validateObject(
        `${path}.${key}`,
        value as unknown as Record<string, unknown>,
        errors,
        isImage,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validates a partial or complete Mandafunk configuration.
 *
 * Checks that:
 * - Numeric values fall within their defined ranges (based on GUI editor constraints).
 * - Color strings are valid hex colors (#RGB, #RRGGBB, #RRGGBBAA, or 0xRRGGBB).
 * - Position coordinates (x, y, z) fall within scene bounds.
 * - Shader names are accepted as strings (actual shader validation happens at load time).
 *
 * @param config - The configuration (partial or complete) to validate.
 * @returns A {@link ValidationResult} indicating whether the config is valid.
 *
 * @example
 * ```typescript
 * import { validateConfig } from "@mandarine/mandafunk/config";
 *
 * const result = validateConfig({
 *   scene: { brightness: 300 },
 * });
 *
 * if (!result.valid) {
 *   console.error("Config errors:", result.errors);
 *   // ["scene.brightness: value 300 is out of range [0, 200]"]
 * }
 * ```
 */
export function validateConfig(
  config: Partial<ConfigType>,
): ValidationResult {
  const errors: string[] = [];

  // Validate scene
  if (config.scene) {
    validateObject("scene", config.scene as unknown as Record<string, unknown>, errors);

    if (config.scene.bgColor && typeof config.scene.bgColor === "string") {
      validateColor("scene", "bgColor", config.scene.bgColor, errors);
    }
  }

  // Validate timer
  if (config.timer) {
    validateObject("timer", config.timer as unknown as Record<string, unknown>, errors);
    validatePosition(
      "timer",
      config.timer as unknown as Record<string, unknown>,
      false,
      errors,
    );
  }

  // Validate progressbar
  if (config.progressbar) {
    validateObject(
      "progressbar",
      config.progressbar as unknown as Record<string, unknown>,
      errors,
    );
    validatePosition(
      "progressbar",
      config.progressbar as unknown as Record<string, unknown>,
      false,
      errors,
    );
  }

  // Validate vumeters
  if (config.vumeters) {
    if (config.vumeters.oscilloscop) {
      validateObject(
        "vumeters.oscilloscop",
        config.vumeters.oscilloscop as unknown as Record<string, unknown>,
        errors,
      );
      validatePosition(
        "vumeters.oscilloscop",
        config.vumeters.oscilloscop as unknown as Record<string, unknown>,
        false,
        errors,
      );
    }
    if (config.vumeters.spectrum) {
      validateObject(
        "vumeters.spectrum",
        config.vumeters.spectrum as unknown as Record<string, unknown>,
        errors,
      );
      validatePosition(
        "vumeters.spectrum",
        config.vumeters.spectrum as unknown as Record<string, unknown>,
        false,
        errors,
      );
    }
  }

  // Validate composer
  if (config.composer) {
    validateObject(
      "composer",
      config.composer as unknown as Record<string, unknown>,
      errors,
    );
  }

  // Validate images
  if (config.images) {
    const images = config.images;
    const entries = Array.isArray(images)
      ? images.map((img, i) => [String(i), img] as const)
      : Object.entries(images);

    for (const [key, img] of entries) {
      if (img) {
        validateObject(
          `images.${key}`,
          img as unknown as Record<string, unknown>,
          errors,
          true,
        );
        validatePosition(
          `images.${key}`,
          img as unknown as Record<string, unknown>,
          true,
          errors,
        );
      }
    }
  }

  // Validate texts
  if (config.texts) {
    const texts = config.texts;
    const entries = Array.isArray(texts)
      ? texts.map((txt, i) => [String(i), txt] as const)
      : Object.entries(texts);

    for (const [key, txt] of entries) {
      if (txt) {
        validateObject(
          `texts.${key}`,
          txt as unknown as Record<string, unknown>,
          errors,
        );
        validatePosition(
          `texts.${key}`,
          txt as unknown as Record<string, unknown>,
          false,
          errors,
        );
        validateColor(`texts.${key}`, "color", (txt as unknown as Record<string, unknown>).color, errors);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
