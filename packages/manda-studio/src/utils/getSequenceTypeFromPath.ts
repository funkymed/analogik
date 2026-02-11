import type { SequenceType } from "@/timeline/ganttTypes.ts";

const PREFIX_MAP: [string, SequenceType][] = [
  ["scene", "shader"],
  ["composer", "composer"],
  ["vumeters", "vumeters"],
  ["images", "images"],
  ["texts", "texts"],
];

/**
 * Maps a config dot-path prefix to a SequenceType.
 * e.g. "composer.bloom.strength" -> "composer"
 *      "scene.shader" -> "shader"
 */
export function getSequenceTypeFromPath(path: string): SequenceType {
  const root = path.split(".")[0];
  for (const [prefix, type] of PREFIX_MAP) {
    if (root === prefix) return type;
  }
  // Default to shader for unknown paths
  return "shader";
}
