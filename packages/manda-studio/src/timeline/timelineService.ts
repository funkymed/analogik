import type { ConfigType } from "@mandafunk/config/types";
import type { Track, TrackAssignment, TimelineExport } from "./types.ts";

// ---------------------------------------------------------------------------
// Raw track shape coming from tracks.js (untyped source)
// ---------------------------------------------------------------------------

interface RawTrack {
  url: string;
  year: string;
  author: string[];
  filename: string;
  bleep?: boolean;
  pouet?: boolean;
  shader?: number;
}

/**
 * Type-guard that validates a single raw track object.
 */
function isRawTrack(value: unknown): value is RawTrack {
  if (typeof value !== "object" || value === null) return false;

  const obj = value as Record<string, unknown>;

  return (
    typeof obj["url"] === "string" &&
    typeof obj["year"] === "string" &&
    Array.isArray(obj["author"]) &&
    (obj["author"] as unknown[]).every((a) => typeof a === "string") &&
    typeof obj["filename"] === "string"
  );
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * Parse a tracks.js-style array into typed Track objects.
 * Each element is validated; invalid entries are silently skipped.
 */
export function parseTracksArray(tracksArray: unknown[]): Track[] {
  const tracks: Track[] = [];

  for (let i = 0; i < tracksArray.length; i++) {
    const raw = tracksArray[i];
    if (!isRawTrack(raw)) continue;

    tracks.push({
      index: i,
      url: raw.url,
      year: raw.year,
      author: raw.author,
      filename: raw.filename,
      ...(raw.bleep !== undefined && { bleep: raw.bleep }),
      ...(raw.pouet !== undefined && { pouet: raw.pouet }),
    });
  }

  return tracks;
}

/**
 * Import tracks from a JSON string.
 * Expects either a plain array of track objects or a TimelineExport envelope.
 */
export function parseTracksJson(json: string): Track[] {
  const parsed: unknown = JSON.parse(json);

  if (Array.isArray(parsed)) {
    return parseTracksArray(parsed);
  }

  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "tracks" in (parsed as Record<string, unknown>)
  ) {
    const envelope = parsed as Record<string, unknown>;
    if (Array.isArray(envelope["tracks"])) {
      return parseTracksArray(envelope["tracks"] as unknown[]);
    }
  }

  return [];
}

// ---------------------------------------------------------------------------
// Export / Import timeline
// ---------------------------------------------------------------------------

/**
 * Export the current tracks and assignments as a serialisable TimelineExport.
 */
export function exportTimeline(
  tracks: Track[],
  assignments: Map<number, TrackAssignment>,
): TimelineExport {
  const exportedAssignments = Array.from(assignments.values()).map((a) => ({
    trackIndex: a.trackIndex,
    presetId: a.presetId,
    presetName: a.presetName,
    config: a.config,
  }));

  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    tracks,
    assignments: exportedAssignments,
  };
}

/**
 * Import a previously exported timeline.
 * Returns re-hydrated tracks and an assignment Map.
 */
export function importTimeline(
  data: TimelineExport,
): { tracks: Track[]; assignments: Map<number, TrackAssignment> } {
  const tracks = data.tracks;
  const assignments = new Map<number, TrackAssignment>();

  for (const a of data.assignments) {
    assignments.set(a.trackIndex, {
      trackIndex: a.trackIndex,
      presetId: a.presetId,
      presetName: a.presetName,
      config: a.config,
    });
  }

  return { tracks, assignments };
}

// ---------------------------------------------------------------------------
// Code generation (Analogik compatibility)
// ---------------------------------------------------------------------------

/**
 * Generate a ConfigVariations.js source string from the current assignments.
 *
 * Collects every unique config (by preset ID) and outputs them as an
 * exported array. Returns both the source string and a mapping from
 * preset ID to variation index so callers can patch track references.
 */
export function generateConfigVariationsJs(
  assignments: Map<number, TrackAssignment>,
  presetConfigs: Map<number, ConfigType>,
): string {
  // Collect unique configs keyed by preset ID (preserves insertion order)
  const uniqueConfigs: ConfigType[] = [];
  const presetIdToIndex = new Map<number, number>();

  for (const assignment of assignments.values()) {
    if (assignment.presetId === null) continue;
    if (presetIdToIndex.has(assignment.presetId)) continue;

    const config = assignment.config ?? presetConfigs.get(assignment.presetId);
    if (!config) continue;

    presetIdToIndex.set(assignment.presetId, uniqueConfigs.length);
    uniqueConfigs.push(config);
  }

  // Also include inline configs (no preset ID) as individual entries
  for (const assignment of assignments.values()) {
    if (assignment.presetId !== null) continue;
    if (!assignment.config) continue;

    // Use the negative track index as a synthetic key
    presetIdToIndex.set(-assignment.trackIndex - 1, uniqueConfigs.length);
    uniqueConfigs.push(assignment.config);
  }

  const configStrings = uniqueConfigs.map(
    (config) => `  ${JSON.stringify(config, null, 2).split("\n").join("\n  ")}`,
  );

  return [
    "// Auto-generated by MandaStudio",
    `// ${new Date().toISOString()}`,
    "",
    `export const ConfigVariations = [`,
    configStrings.join(",\n"),
    `];`,
    "",
  ].join("\n");
}

/**
 * Generate a tracks.js source string with shader indices pointing into
 * ConfigVariations.
 */
export function generateTracksJs(
  tracks: Track[],
  assignments: Map<number, TrackAssignment>,
): string {
  // Build a mapping: presetId -> variation index (same logic as generateConfigVariationsJs)
  const presetIdToIndex = new Map<number, number>();
  let variationIndex = 0;

  // First pass: assigned presets (unique)
  const seenPresetIds = new Set<number>();
  for (const assignment of assignments.values()) {
    if (assignment.presetId === null) continue;
    if (seenPresetIds.has(assignment.presetId)) continue;
    seenPresetIds.add(assignment.presetId);
    presetIdToIndex.set(assignment.presetId, variationIndex++);
  }

  // Second pass: inline configs (no preset)
  for (const assignment of assignments.values()) {
    if (assignment.presetId !== null) continue;
    if (!assignment.config) continue;
    presetIdToIndex.set(-assignment.trackIndex - 1, variationIndex++);
  }

  const trackLines = tracks.map((track) => {
    const assignment = assignments.get(track.index);

    let shaderIndex: number | undefined;
    if (assignment) {
      if (assignment.presetId !== null) {
        shaderIndex = presetIdToIndex.get(assignment.presetId);
      } else if (assignment.config) {
        shaderIndex = presetIdToIndex.get(-track.index - 1);
      }
    }

    const parts: string[] = [
      `    url: ${JSON.stringify(track.url)}`,
      `    year: ${JSON.stringify(track.year)}`,
      `    author: ${JSON.stringify(track.author)}`,
      `    filename: ${JSON.stringify(track.filename)}`,
    ];

    if (track.bleep) parts.push(`    bleep: true`);
    if (track.pouet) parts.push(`    pouet: true`);
    if (shaderIndex !== undefined) parts.push(`    shader: ${shaderIndex}`);

    return `  {\n${parts.join(",\n")}\n  }`;
  });

  return [
    "// Auto-generated by MandaStudio",
    `// ${new Date().toISOString()}`,
    "",
    `export const tracks = [`,
    trackLines.join(",\n"),
    `];`,
    "",
  ].join("\n");
}
