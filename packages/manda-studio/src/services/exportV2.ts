/**
 * @module exportV2
 *
 * v2.0 export pipeline for manda-studio projects.
 *
 * Produces a `.manda` ZIP file (via fflate) containing:
 * - `manifest.json` -- lightweight JSON with diff-only configs, compact keyframes,
 *   deduplicated assets, and no UI state.
 * - `assets/` -- raw binary files (images, audio, video) referenced by the manifest.
 *
 * The resulting Blob can be downloaded directly as `{project-name}.manda`.
 */

import { zipSync } from "fflate";
import { db } from "@/db/database.ts";
import { getImage, getAudioItem } from "@/db/libraryService.ts";
import { collectGarbage } from "@/services/assetRegistry.ts";
import { diffFromDefaults } from "@/services/configDiff.ts";
import type { Project } from "@/db/projectTypes.ts";
import type {
  ProjectExportV2,
  ProjectV2,
  AssetEntryV2,
  SceneV2,
  SequenceV2,
  KeyframeV2,
  AudioClipV2,
  TransitionV2,
} from "@/db/projectTypesV2.ts";
import type { AssetEntry, Timeline, TimelineScene, Sequence, Keyframe, AudioClip, SceneTransition } from "@/timeline/ganttTypes.ts";
import type { ConfigType } from "@mandafunk/config/types";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Convert a Blob to a Uint8Array suitable for fflate.
 */
async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Derive a safe filename for an asset inside the ZIP.
 * Handles name collisions by suffixing with a short ID fragment.
 */
function deriveAssetFilename(
  entry: AssetEntry,
  assetId: string,
  usedNames: Set<string>,
): string {
  const base = entry.name || "unnamed";

  // Split name and extension
  const dotIdx = base.lastIndexOf(".");
  const stem = dotIdx > 0 ? base.slice(0, dotIdx) : base;
  const ext = dotIdx > 0 ? base.slice(dotIdx) : "";

  let candidate = `assets/${stem}${ext}`;
  if (!usedNames.has(candidate)) {
    usedNames.add(candidate);
    return candidate;
  }

  // Collision: append a short ID fragment
  // Extract the unique part from the assetId (e.g. "asset_mlia8rtu_1" -> "mlia8rtu_1")
  const idSuffix = assetId.replace(/^asset_/, "").slice(0, 8);
  candidate = `assets/${stem}_${idSuffix}${ext}`;
  usedNames.add(candidate);
  return candidate;
}

// ---------------------------------------------------------------------------
// Scene conversion
// ---------------------------------------------------------------------------

function convertKeyframe(kf: Keyframe): KeyframeV2 {
  const compact: KeyframeV2 = {
    t: kf.time,
    p: kf.path,
    v: kf.value,
  };

  // Omit easing when it is the default (linear with no bezier points)
  if (kf.easing && kf.easing.type !== "linear") {
    compact.e = kf.easing;
  }

  return compact;
}

function convertSequence(seq: Sequence, parentDuration: number): SequenceV2 | null {
  // Strip empty sequences (no keyframes)
  if (seq.keyframes.length === 0) return null;

  const compact: SequenceV2 = {
    id: seq.id,
    type: seq.type,
    keyframes: seq.keyframes.map(convertKeyframe),
  };

  // Omit label when it matches type
  if (seq.label && seq.label !== seq.type) {
    compact.label = seq.label;
  }

  // Omit startOffset when 0
  if (seq.startOffset !== 0) {
    compact.startOffset = seq.startOffset;
  }

  // Omit duration when it matches parent scene duration
  if (seq.duration !== parentDuration) {
    compact.dur = seq.duration;
  }

  // Omit order when 0
  if (seq.order !== 0) {
    compact.order = seq.order;
  }

  return compact;
}

function convertScene(scene: TimelineScene): SceneV2 {
  const compact: SceneV2 = {
    id: scene.id,
    name: scene.name,
    start: scene.startTime,
    dur: scene.duration,
  };

  // Omit track when 0
  if (scene.trackIndex !== 0) {
    compact.track = scene.trackIndex;
  }

  // Keep color (optional override)
  if (scene.color) {
    compact.color = scene.color;
  }

  // Diff-only config: only non-default values
  if (scene.baseConfig) {
    const diff = diffFromDefaults(scene.baseConfig);
    if (Object.keys(diff).length > 0) {
      compact.config = diff as Partial<ConfigType>;
    }
  }

  // Convert sequences, stripping empty ones
  const sequences: SequenceV2[] = [];
  for (const seq of scene.sequences) {
    const converted = convertSequence(seq, scene.duration);
    if (converted) sequences.push(converted);
  }
  if (sequences.length > 0) {
    compact.sequences = sequences;
  }

  // UI state fields (collapsed, hidden, sidebarItems) are intentionally omitted

  return compact;
}

// ---------------------------------------------------------------------------
// Audio clip conversion
// ---------------------------------------------------------------------------

function convertAudioClip(clip: AudioClip): AudioClipV2 | null {
  // Audio clips must reference an asset
  if (!clip.assetId) {
    console.warn(`[exportV2] Audio clip "${clip.id}" has no assetId, skipping.`);
    return null;
  }

  const compact: AudioClipV2 = {
    id: clip.id,
    assetId: clip.assetId,
    start: clip.startTime,
    dur: clip.duration,
  };

  // Only include non-default fields
  if (clip.trimStart !== 0) compact.trimStart = clip.trimStart;
  if (clip.volume !== 1) compact.volume = clip.volume;
  if (clip.muted) compact.muted = clip.muted;
  if (clip.trackIndex !== 0) compact.track = clip.trackIndex;

  return compact;
}

// ---------------------------------------------------------------------------
// Transition conversion
// ---------------------------------------------------------------------------

function convertTransition(t: SceneTransition): TransitionV2 {
  const compact: TransitionV2 = {
    id: t.id,
    fromSceneId: t.fromSceneId,
    toSceneId: t.toSceneId,
    dur: t.duration,
    type: t.type,
  };

  // Omit easing when linear
  if (t.easing && t.easing.type !== "linear") {
    compact.easing = t.easing;
  }

  return compact;
}

// ---------------------------------------------------------------------------
// Main export function
// ---------------------------------------------------------------------------

/**
 * Build a v2.0 `.manda` ZIP file for the given project IDs (or all projects).
 *
 * @param ids - Optional list of project IDs. If empty/undefined, exports all projects.
 * @returns A Blob containing the ZIP file, ready for download.
 */
export async function exportProjectsV2(ids?: number[]): Promise<Blob> {
  // 1. Load projects from IndexedDB (queried directly to avoid circular imports)
  let projects: Project[];
  if (ids && ids.length > 0) {
    projects = (await Promise.all(ids.map((id) => db.projects.get(id)))).filter(
      (p): p is Project => p !== undefined,
    );
  } else {
    projects = await db.projects.orderBy("updatedAt").reverse().toArray();
  }

  if (projects.length === 0) {
    throw new Error("No projects to export.");
  }

  // Track filenames to avoid collisions across all projects
  const usedFilenames = new Set<string>();
  // Map from (assetId) -> ZIP path, for assets that have been added
  const assetFileMap = new Map<string, string>();
  // Map from (libraryId:type) -> ZIP path, to deduplicate same blobs across projects
  const libraryFileMap = new Map<string, string>();
  // Binary data to include in the ZIP: path -> Uint8Array
  const zipEntries: Record<string, Uint8Array> = {};

  // 2. Convert each project
  const v2Projects: ProjectV2[] = [];

  for (const project of projects) {
    // 2a. Garbage-collect orphaned assets
    const cleanTimeline = collectGarbage(project.timeline);

    // 2b. Convert scenes
    const scenes = cleanTimeline.scenes.map(convertScene);

    // 2c. Convert audio clips
    const audioClips: AudioClipV2[] = [];
    for (const clip of cleanTimeline.audioClips) {
      const converted = convertAudioClip(clip);
      if (converted) audioClips.push(converted);
    }

    // 2d. Convert transitions
    let transitions: TransitionV2[] | undefined;
    if (cleanTimeline.transitions.length > 0) {
      transitions = cleanTimeline.transitions.map(convertTransition);
    }

    // 2e. Build v2 asset entries and collect binary data
    const v2Assets: Record<string, AssetEntryV2> = {};

    for (const [assetId, entry] of Object.entries(cleanTimeline.assets)) {
      // Determine the ZIP file path for this asset
      let filePath = assetFileMap.get(assetId);

      if (!filePath) {
        // Deduplicate across projects: same libraryId+type = same binary file
        const libraryKey = entry.libraryId != null ? `${entry.libraryId}:${entry.type}` : null;

        if (libraryKey && libraryFileMap.has(libraryKey)) {
          // Reuse the file path from a previous project's identical asset
          filePath = libraryFileMap.get(libraryKey)!;
        } else {
          filePath = deriveAssetFilename(entry, assetId, usedFilenames);

          // Read the binary data from IndexedDB
          const binaryData = await readAssetBlob(entry);
          if (binaryData) {
            zipEntries[filePath] = binaryData;
          } else {
            console.warn(
              `[exportV2] Could not read asset "${entry.name}" (libraryId: ${entry.libraryId}, type: ${entry.type}). It will be referenced in the manifest but missing from the ZIP.`,
            );
          }

          if (libraryKey) {
            libraryFileMap.set(libraryKey, filePath);
          }
        }

        assetFileMap.set(assetId, filePath);
      }

      // Build the v2 asset entry
      const v2Entry: AssetEntryV2 = {
        type: entry.type,
        name: entry.name,
        mime: entry.mimeType,
        file: filePath,
      };

      // Compact metadata
      if (entry.meta) {
        const meta: AssetEntryV2["meta"] = {};
        if (entry.meta.width != null) meta.w = entry.meta.width;
        if (entry.meta.height != null) meta.h = entry.meta.height;
        if (entry.meta.duration != null) meta.dur = entry.meta.duration;
        if (Object.keys(meta).length > 0) v2Entry.meta = meta;
      }

      v2Assets[assetId] = v2Entry;
    }

    // 2f. Build the ProjectV2 object
    const v2Project: ProjectV2 = {
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      tracks: {
        scene: project.sceneTrackCount,
        audio: project.audioTrackCount,
      },
      assets: v2Assets,
      scenes,
      audioClips,
    };

    // Preserve id if present
    if (project.id != null) v2Project.id = project.id;

    // Include transitions only if non-empty
    if (transitions) v2Project.transitions = transitions;

    v2Projects.push(v2Project);
  }

  // 3. Build the manifest
  const manifest: ProjectExportV2 = {
    version: "2.0",
    exportedAt: new Date().toISOString(),
    projects: v2Projects,
  };

  const manifestJson = JSON.stringify(manifest, null, 2);
  const manifestBytes = new TextEncoder().encode(manifestJson);
  zipEntries["manifest.json"] = manifestBytes;

  // 4. Create the ZIP
  const zipped = zipSync(zipEntries);

  return new Blob([zipped], { type: "application/zip" });
}

// ---------------------------------------------------------------------------
// Export current in-memory timeline (no DB lookup)
// ---------------------------------------------------------------------------

/**
 * Build a v2.0 `.manda` ZIP from the current in-memory timeline state.
 * Unlike `exportProjectsV2`, this does NOT read from IndexedDB projects table —
 * it works directly with the provided timeline data.
 */
export async function exportCurrentV2(
  name: string,
  timeline: Timeline,
  sceneTrackCount: number,
  audioTrackCount: number,
): Promise<Blob> {
  const usedFilenames = new Set<string>();
  const assetFileMap = new Map<string, string>();
  const libraryFileMap = new Map<string, string>();
  const zipEntries: Record<string, Uint8Array> = {};

  const cleanTimeline = collectGarbage(timeline);

  const scenes = cleanTimeline.scenes.map(convertScene);

  const audioClips: AudioClipV2[] = [];
  for (const clip of cleanTimeline.audioClips) {
    const converted = convertAudioClip(clip);
    if (converted) audioClips.push(converted);
  }

  let transitions: TransitionV2[] | undefined;
  if (cleanTimeline.transitions.length > 0) {
    transitions = cleanTimeline.transitions.map(convertTransition);
  }

  const v2Assets: Record<string, AssetEntryV2> = {};

  for (const [assetId, entry] of Object.entries(cleanTimeline.assets)) {
    let filePath = assetFileMap.get(assetId);

    if (!filePath) {
      const libraryKey = entry.libraryId != null ? `${entry.libraryId}:${entry.type}` : null;

      if (libraryKey && libraryFileMap.has(libraryKey)) {
        filePath = libraryFileMap.get(libraryKey)!;
      } else {
        filePath = deriveAssetFilename(entry, assetId, usedFilenames);

        const binaryData = await readAssetBlob(entry);
        if (binaryData) {
          zipEntries[filePath] = binaryData;
        }

        if (libraryKey) {
          libraryFileMap.set(libraryKey, filePath);
        }
      }

      assetFileMap.set(assetId, filePath);
    }

    const v2Entry: AssetEntryV2 = {
      type: entry.type,
      name: entry.name,
      mime: entry.mimeType,
      file: filePath,
    };

    if (entry.meta) {
      const meta: AssetEntryV2["meta"] = {};
      if (entry.meta.width != null) meta.w = entry.meta.width;
      if (entry.meta.height != null) meta.h = entry.meta.height;
      if (entry.meta.duration != null) meta.dur = entry.meta.duration;
      if (Object.keys(meta).length > 0) v2Entry.meta = meta;
    }

    v2Assets[assetId] = v2Entry;
  }

  const now = new Date().toISOString();
  const v2Project: ProjectV2 = {
    name,
    createdAt: now,
    updatedAt: now,
    tracks: { scene: sceneTrackCount, audio: audioTrackCount },
    assets: v2Assets,
    scenes,
    audioClips,
  };

  if (transitions) v2Project.transitions = transitions;

  const manifest: ProjectExportV2 = {
    version: "2.0",
    exportedAt: now,
    projects: [v2Project],
  };

  const manifestJson = JSON.stringify(manifest, null, 2);
  zipEntries["manifest.json"] = new TextEncoder().encode(manifestJson);

  const zipped = zipSync(zipEntries);
  return new Blob([zipped], { type: "application/zip" });
}

// ---------------------------------------------------------------------------
// Asset blob reader
// ---------------------------------------------------------------------------

/**
 * Read the binary data for an asset from IndexedDB.
 * Returns null if the asset cannot be found.
 */
async function readAssetBlob(entry: AssetEntry): Promise<Uint8Array | null> {
  if (entry.libraryId == null) return null;

  try {
    if (entry.type === "image") {
      const img = await getImage(entry.libraryId);
      if (!img?.blob) return null;
      return blobToUint8Array(img.blob);
    }

    if (entry.type === "audio") {
      const audio = await getAudioItem(entry.libraryId);
      if (!audio?.blob) return null;
      return blobToUint8Array(audio.blob);
    }

    // video, font, etc. -- not yet supported
    console.warn(`[exportV2] Asset type "${entry.type}" not yet supported for binary export.`);
    return null;
  } catch (err) {
    console.warn(`[exportV2] Failed to read asset blob (libraryId: ${entry.libraryId}):`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Download helper
// ---------------------------------------------------------------------------

/**
 * Trigger a browser download of the given Blob with the specified filename.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
