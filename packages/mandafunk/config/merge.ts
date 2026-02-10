/**
 * @module @mandarine/mandafunk/config/merge
 *
 * Deep merge utilities for Mandafunk configuration objects.
 * Follows the same merge semantics as the original `deepMergeObjects`
 * utility from the Analogik project, where source values overwrite
 * target values recursively.
 */

import type { ConfigType } from "./types";
import { configDefault } from "./defaults";

/**
 * Deep clones a value using structured clone when available,
 * falling back to JSON serialization.
 *
 * @param obj - The value to clone.
 * @returns A deep copy of the input.
 */
function deepClone<T>(obj: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Checks whether a value is a plain object (not an array, null, Date, etc.).
 *
 * @param value - The value to check.
 * @returns `true` if the value is a plain object.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !(value instanceof RegExp)
  );
}

/**
 * Recursively merges properties from `source` into `target`.
 *
 * This follows the same semantics as the original Analogik
 * `deepMergeObjects(source, target)` function:
 * - Primitive values in `source` overwrite values in `target`.
 * - Nested objects are merged recursively.
 * - Arrays in `source` replace arrays in `target` entirely.
 * - Properties not present in `source` are left unchanged in `target`.
 *
 * @param source - The object containing override values.
 * @param target - The object to merge into (mutated in place).
 * @returns The mutated `target` object.
 */
function deepMergeInto(
  source: Record<string, unknown>,
  target: Record<string, unknown>,
): Record<string, unknown> {
  for (const key of Object.keys(source)) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue;

    const sourceVal = source[key];
    const targetVal = target[key];

    if (isPlainObject(sourceVal)) {
      // Ensure target has an object to merge into
      if (!isPlainObject(targetVal)) {
        target[key] = {};
      }
      deepMergeInto(
        sourceVal as Record<string, unknown>,
        target[key] as Record<string, unknown>,
      );
    } else {
      // Primitives, arrays, and other values are assigned directly
      target[key] = sourceVal;
    }
  }

  return target;
}

/**
 * Merges a partial configuration into a base configuration,
 * producing a new complete {@link ConfigType}.
 *
 * The base configuration is deep-cloned before merging, so the
 * original object is never mutated.
 *
 * @param base - The complete base configuration to start from.
 * @param partial - The partial overrides to apply.
 * @returns A new, complete configuration with overrides applied.
 *
 * @example
 * ```typescript
 * import { configDefault, mergeConfig } from "@mandarine/mandafunk/config";
 *
 * const custom = mergeConfig(configDefault, {
 *   scene: { shader: "Tunnel", brightness: 60 },
 *   composer: { bloom: { strength: 1.0 } },
 * });
 * ```
 */
export function mergeConfig(
  base: ConfigType,
  partial: Partial<ConfigType>,
): ConfigType {
  const result = deepClone(base);
  deepMergeInto(
    partial as Record<string, unknown>,
    result as unknown as Record<string, unknown>,
  );
  return result;
}

/**
 * Creates a complete configuration by merging partial overrides
 * into the default configuration.
 *
 * Convenience wrapper around {@link mergeConfig} using
 * {@link configDefault} as the base.
 *
 * @param partial - The partial overrides to apply on top of defaults.
 * @returns A new, complete configuration with overrides applied.
 *
 * @example
 * ```typescript
 * import { createConfig } from "@mandarine/mandafunk/config";
 *
 * const config = createConfig({
 *   scene: { shader: "Plasma" },
 * });
 * ```
 */
export function createConfig(partial: Partial<ConfigType>): ConfigType {
  return mergeConfig(configDefault, partial);
}
