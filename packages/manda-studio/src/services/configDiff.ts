/**
 * @module configDiff
 *
 * Deep-diff and deep-merge utilities for ConfigType.
 * Used by the v2.0 export/import pipeline to serialize only the config values
 * that differ from `configDefault`, and reconstruct full configs on import.
 *
 * Rules:
 * - Nested plain objects are recursed into.
 * - Arrays are treated as atomic values (not recursed).
 * - The `texts` and `images` keys are treated as dynamic Record maps:
 *   they have no default counterpart, so all present entries are always included.
 */

import type { ConfigType } from "@mandafunk/config/types";
import { configDefault } from "@mandafunk/config";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Keys in ConfigType that hold dynamic Record<string, T> maps with no default counterpart. */
const DYNAMIC_RECORD_KEYS = new Set(["texts", "images"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Deep-compare two values. Arrays are compared by JSON serialization
 * (they are atomic in our model). Objects are compared recursively.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((k) => deepEqual(a[k], b[k]));
  }

  return false;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compute the diff between `actual` and `defaults`.
 * Returns a new object containing only the keys/values in `actual` that differ
 * from `defaults`. Nested objects are recursed into (except arrays, which are atomic).
 *
 * Dynamic-record keys (`texts`, `images`) are always included in full if they
 * have any entries, since they have no default counterpart to diff against.
 *
 * @param actual  - The full config to diff.
 * @param defaults - The default config to compare against (typically `configDefault`).
 * @returns A partial config containing only the differences.
 */
export function diffConfig(
  actual: Record<string, unknown>,
  defaults: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(actual)) {
    const av = actual[key];
    const dv = defaults[key];

    // Dynamic record keys: always include if they have entries
    if (DYNAMIC_RECORD_KEYS.has(key)) {
      if (isPlainObject(av) && Object.keys(av).length > 0) {
        result[key] = structuredClone(av);
      }
      continue;
    }

    // Both are plain objects (and not arrays): recurse
    if (isPlainObject(av) && isPlainObject(dv)) {
      const inner = diffConfig(av, dv);
      if (Object.keys(inner).length > 0) {
        result[key] = inner;
      }
      continue;
    }

    // Atomic comparison (primitives, arrays, or type mismatch)
    if (!deepEqual(av, dv)) {
      result[key] = Array.isArray(av) ? structuredClone(av) : av;
    }
  }

  return result;
}

/**
 * Convenience wrapper: diff a full ConfigType against `configDefault`.
 */
export function diffFromDefaults(actual: ConfigType): Partial<ConfigType> {
  return diffConfig(
    actual as unknown as Record<string, unknown>,
    configDefault as unknown as Record<string, unknown>,
  ) as Partial<ConfigType>;
}

/**
 * Deep-merge a partial config on top of defaults.
 * Returns a new object -- neither `partial` nor `defaults` are mutated.
 *
 * Dynamic-record keys (`texts`, `images`) from `partial` replace the default
 * entirely (they are user-created collections, not overlay on defaults).
 *
 * @param partial  - The diff-only config (from export).
 * @param defaults - The default config to merge onto (typically `configDefault`).
 * @returns A full config with all fields populated.
 */
export function mergeWithDefaults(
  partial: Record<string, unknown>,
  defaults: Record<string, unknown>,
): Record<string, unknown> {
  const result = structuredClone(defaults);

  for (const key of Object.keys(partial)) {
    const pv = partial[key];
    const dv = result[key];

    // Dynamic record keys: take the partial value as-is (it is the full collection)
    if (DYNAMIC_RECORD_KEYS.has(key)) {
      result[key] = structuredClone(pv);
      continue;
    }

    // Both are plain objects (and not arrays): recurse
    if (isPlainObject(pv) && isPlainObject(dv)) {
      result[key] = mergeWithDefaults(pv, dv);
      continue;
    }

    // Atomic value: take the partial value
    result[key] = Array.isArray(pv) ? structuredClone(pv) : pv;
  }

  return result;
}

/**
 * Convenience wrapper: merge a partial config onto `configDefault` and return a full ConfigType.
 */
export function mergeOntoDefaults(partial: Partial<ConfigType>): ConfigType {
  return mergeWithDefaults(
    partial as unknown as Record<string, unknown>,
    configDefault as unknown as Record<string, unknown>,
  ) as ConfigType;
}
