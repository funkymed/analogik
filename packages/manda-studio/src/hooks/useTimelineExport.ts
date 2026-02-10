import { useCallback } from "react";
import type { ConfigType } from "@mandafunk/config/types";
import { useTimelineStore } from "@/store/useTimelineStore.ts";
import {
  exportTimeline,
  parseTracksJson,
  parseTracksArray,
  importTimeline,
} from "@/timeline/timelineService.ts";
import type { Track, TimelineExport } from "@/timeline/types.ts";
import { downloadJson } from "@/utils/downloadFile.ts";
import { downloadTextFile } from "@/utils/downloadTextFile.ts";
import { readJsonFile } from "@/utils/readJsonFile.ts";
import {
  generateConfigVariationsJs,
  generateTracksJs,
  generateTypescriptExport,
} from "@/utils/generateExports.ts";
import { getPreset } from "@/db/presetService.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve all preset configs referenced by assignments from IndexedDB.
 * Returns a list of unique configs with their names and a mapping from
 * track index to the config's position in that list.
 */
async function resolveAssignmentConfigs(
  assignments: Map<number, { trackIndex: number; presetId: number | null; presetName: string | null; config: ConfigType | null }>,
): Promise<{
  configs: ConfigType[];
  names: Array<string | null>;
  trackToIndex: Map<number, number>;
}> {
  const configs: ConfigType[] = [];
  const names: Array<string | null> = [];
  const trackToIndex = new Map<number, number>();
  const presetIdToIndex = new Map<number, number>();

  for (const assignment of assignments.values()) {
    if (assignment.presetId !== null) {
      // Preset-based assignment: deduplicate by preset ID
      if (presetIdToIndex.has(assignment.presetId)) {
        trackToIndex.set(
          assignment.trackIndex,
          presetIdToIndex.get(assignment.presetId)!,
        );
        continue;
      }

      let config = assignment.config;
      if (!config) {
        const preset = await getPreset(assignment.presetId);
        config = preset?.config ?? null;
      }
      if (!config) continue;

      const idx = configs.length;
      configs.push(config);
      names.push(assignment.presetName);
      presetIdToIndex.set(assignment.presetId, idx);
      trackToIndex.set(assignment.trackIndex, idx);
    } else if (assignment.config) {
      // Inline config: each one is unique
      const idx = configs.length;
      configs.push(assignment.config);
      names.push(null);
      trackToIndex.set(assignment.trackIndex, idx);
    }
  }

  return { configs, names, trackToIndex };
}

/**
 * Type guard for TimelineExport shape.
 */
function isTimelineExport(value: unknown): value is TimelineExport {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    obj["version"] === "1.0" &&
    Array.isArray(obj["tracks"]) &&
    Array.isArray(obj["assignments"])
  );
}

/**
 * Strip common JS/TS wrappers from pasted text to extract a raw JSON array.
 * Handles patterns like:
 *   export const tracks = [ ... ];
 *   const tracks = [ ... ];
 *   module.exports = [ ... ];
 */
function extractArrayFromPaste(text: string): string {
  let cleaned = text.trim();

  // Remove export / const / let / var / module.exports = ...
  cleaned = cleaned.replace(
    /^(?:export\s+)?(?:const|let|var)\s+\w+\s*=\s*/,
    "",
  );
  cleaned = cleaned.replace(/^module\.exports\s*=\s*/, "");

  // Remove trailing semicolon
  cleaned = cleaned.replace(/;\s*$/, "");

  return cleaned;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseTimelineExportReturn {
  exportAsJson: () => void;
  exportAsJs: () => Promise<void>;
  exportAsTs: () => Promise<void>;
  importFromJson: (file: File) => Promise<void>;
  importFromPaste: (text: string) => void;
}

export function useTimelineExport(): UseTimelineExportReturn {
  const tracks = useTimelineStore((s) => s.tracks);
  const assignments = useTimelineStore((s) => s.assignments);
  const setTracks = useTimelineStore((s) => s.setTracks);

  const exportAsJson = useCallback(() => {
    const data = exportTimeline(tracks, assignments);
    downloadJson(data, "mandastudio-timeline.json");
  }, [tracks, assignments]);

  const exportAsJs = useCallback(async () => {
    const { configs, names, trackToIndex } =
      await resolveAssignmentConfigs(assignments);

    // ConfigVariations.js
    const variationsContent = generateConfigVariationsJs(configs, names);
    downloadTextFile(
      variationsContent,
      "ConfigVariations.js",
      "application/javascript",
    );

    // tracks.js
    const trackEntries = tracks.map((t) => ({
      url: t.url,
      year: t.year,
      author: t.author,
      filename: t.filename,
      bleep: t.bleep,
      pouet: t.pouet,
    }));
    const tracksContent = generateTracksJs(trackEntries, trackToIndex);
    downloadTextFile(tracksContent, "tracks.js", "application/javascript");
  }, [tracks, assignments]);

  const exportAsTs = useCallback(async () => {
    const { configs, names } = await resolveAssignmentConfigs(assignments);

    const namedConfigs = configs.map((config, i) => ({
      name: names[i] ?? `Scene ${i + 1}`,
      config,
    }));

    const content = generateTypescriptExport(namedConfigs);
    downloadTextFile(content, "scenes.ts", "application/typescript");
  }, [assignments]);

  const importFromJson = useCallback(
    async (file: File) => {
      const parsed = await readJsonFile<unknown>(file);

      if (isTimelineExport(parsed)) {
        const result = importTimeline(parsed);
        setTracks(result.tracks);
        // Restore assignments into the store
        const store = useTimelineStore.getState();
        for (const [key, value] of result.assignments) {
          if (value.presetId !== null && value.presetName !== null) {
            store.assignPreset(key, value.presetId, value.presetName);
          } else if (value.config) {
            store.assignConfig(key, value.config);
          }
        }
        return;
      }

      // Try as plain Track[] array
      if (Array.isArray(parsed)) {
        const importedTracks = parseTracksArray(parsed as unknown[]);
        if (importedTracks.length > 0) {
          setTracks(importedTracks);
          return;
        }
      }

      // Try as object with tracks property
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "tracks" in (parsed as Record<string, unknown>)
      ) {
        const obj = parsed as Record<string, unknown>;
        if (Array.isArray(obj["tracks"])) {
          const importedTracks = parseTracksArray(
            obj["tracks"] as unknown[],
          );
          if (importedTracks.length > 0) {
            setTracks(importedTracks);
            return;
          }
        }
      }

      throw new Error("Could not parse the file as a valid track list.");
    },
    [setTracks],
  );

  const importFromPaste = useCallback(
    (text: string) => {
      const cleaned = extractArrayFromPaste(text);

      let importedTracks: Track[];
      try {
        importedTracks = parseTracksJson(cleaned);
      } catch {
        throw new Error(
          "Could not parse the pasted text. Ensure it is a valid JavaScript array.",
        );
      }

      if (importedTracks.length === 0) {
        throw new Error("No valid tracks found in the pasted text.");
      }

      setTracks(importedTracks);
    },
    [setTracks],
  );

  return {
    exportAsJson,
    exportAsJs,
    exportAsTs,
    importFromJson,
    importFromPaste,
  };
}
