export interface ConfigChange {
  path: string;
  value: unknown;
}

/**
 * Deep-diff two objects and return an array of changed leaf values
 * using dot-path notation (e.g. "composer.bloom.strength").
 */
export function diffConfig(
  prev: Record<string, unknown>,
  next: Record<string, unknown>,
  prefix = "",
): ConfigChange[] {
  const changes: ConfigChange[] = [];

  const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);

  for (const key of allKeys) {
    const path = prefix ? `${prefix}.${key}` : key;
    const a = prev[key];
    const b = next[key];

    if (a === b) continue;

    if (
      a !== null &&
      b !== null &&
      typeof a === "object" &&
      typeof b === "object" &&
      !Array.isArray(a) &&
      !Array.isArray(b)
    ) {
      changes.push(
        ...diffConfig(
          a as Record<string, unknown>,
          b as Record<string, unknown>,
          path,
        ),
      );
    } else {
      changes.push({ path, value: b });
    }
  }

  return changes;
}
