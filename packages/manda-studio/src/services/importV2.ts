/**
 * @module importV2
 *
 * Import service for the v2.0 `.manda` project format (ZIP).
 *
 * A `.manda` file is a ZIP archive containing:
 * - `manifest.json` -- lightweight project metadata, diff-only configs, compact keyframes
 * - `assets/`       -- binary asset files (images, audio, video)
 *
 * This module reads the ZIP, inserts assets into the IndexedDB library,
 * reconstructs full internal Timeline objects, and saves projects to the database.
 */

import { unzipSync } from "fflate";
import type { ConfigType, ImageType } from "@mandafunk/config/types";
import { configDefault } from "@mandafunk/config";
import type {
  ProjectExportV2,
  ProjectV2,
  SceneV2,
  SequenceV2,
  KeyframeV2,
  AudioClipV2,
  AssetEntryV2,
} from "@/db/projectTypesV2.ts";
import type {
  Timeline,
  TimelineScene,
  Sequence,
  Keyframe,
  AudioClip,
  AssetEntry,
  SidebarItem,
  SidebarItemType,
} from "@/timeline/ganttTypes.ts";
import type { Project } from "@/db/projectTypes.ts";
import { db } from "@/db/database.ts";
import { generateId, SCENE_COLORS } from "@/store/useGanttStore.ts";
import { mergeWithDefaults } from "@/services/configDiff.ts";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Import projects from a `.manda` ZIP file (v2.0 format).
 *
 * @param file        - The `.manda` File object selected by the user.
 * @param onProgress  - Optional callback: `(current, total)` called after each asset is imported.
 * @returns The number of projects successfully imported.
 */
export async function importProjectsV2(
  file: File,
  onProgress?: (current: number, total: number) => void,
): Promise<number> {
  // 1. Read the ZIP
  const arrayBuffer = await file.arrayBuffer();
  const zipData = unzipSync(new Uint8Array(arrayBuffer));

  // 2. Find and parse manifest.json
  const manifestBytes = zipData["manifest.json"];
  if (!manifestBytes) {
    throw new Error("Invalid .manda file: manifest.json not found in archive.");
  }

  const manifestText = new TextDecoder().decode(manifestBytes);
  const manifest: ProjectExportV2 = JSON.parse(manifestText);

  // 3. Validate version
  if (manifest.version !== "2.0") {
    throw new Error(
      `Unsupported format version: "${manifest.version}". Only v2.0 is supported.`,
    );
  }

  if (!Array.isArray(manifest.projects) || manifest.projects.length === 0) {
    throw new Error("Invalid .manda file: no projects found in manifest.");
  }

  // 4. Count total assets across all projects for progress reporting
  const totalAssets = manifest.projects.reduce(
    (sum, p) => sum + Object.keys(p.assets).length,
    0,
  );
  let processedAssets = 0;

  // 5. Import each project
  let importedCount = 0;

  for (const projectV2 of manifest.projects) {
    const timeline = await importProject(
      projectV2,
      zipData,
      () => {
        processedAssets++;
        onProgress?.(processedAssets, totalAssets);
      },
    );

    const now = new Date().toISOString();
    const project: Omit<Project, "id"> = {
      name: projectV2.name,
      timeline,
      sceneTrackCount: projectV2.tracks.scene,
      audioTrackCount: projectV2.tracks.audio,
      thumbnail: "",
      createdAt: projectV2.createdAt ?? now,
      updatedAt: now,
    };

    await db.projects.add(project as Project);
    importedCount++;
  }

  return importedCount;
}

// ---------------------------------------------------------------------------
// Project reconstruction
// ---------------------------------------------------------------------------

/**
 * Import a single v2.0 project: insert assets into IndexedDB, then
 * reconstruct the internal Timeline format.
 */
async function importProject(
  projectV2: ProjectV2,
  zipData: Record<string, Uint8Array>,
  onAssetDone: () => void,
): Promise<Timeline> {
  // Map from v2 assetId -> internal AssetEntry (with new libraryId)
  const assetMap: Record<string, AssetEntry> = {};

  // 5a. Import assets into IndexedDB library
  for (const [assetId, assetV2] of Object.entries(projectV2.assets)) {
    const entry = await importAsset(assetId, assetV2, zipData);
    if (entry) {
      assetMap[assetId] = entry;
    }
    onAssetDone();
  }

  // 5b. Reconstruct scenes
  const scenes: TimelineScene[] = (projectV2.scenes ?? []).map((sceneV2, index) =>
    reconstructScene(sceneV2, index),
  );

  // 5c. Reconstruct audio clips
  const audioClips: AudioClip[] = (projectV2.audioClips ?? []).map((clipV2) =>
    reconstructAudioClip(clipV2, assetMap),
  );

  // 5d. Reconstruct transitions (currently always empty, but support the field)
  // Transitions in v2 use the same structure, just with short field names.
  // For now transitions are passed through as empty since the format spec
  // shows `transitions?: TransitionV2[]`.

  return {
    assets: assetMap,
    scenes,
    transitions: [],
    audioClips,
  };
}

// ---------------------------------------------------------------------------
// Asset import
// ---------------------------------------------------------------------------

/**
 * Extract an asset binary from the ZIP, insert it into the IndexedDB library,
 * and return a fully populated AssetEntry for the timeline's asset registry.
 */
async function importAsset(
  assetId: string,
  assetV2: AssetEntryV2,
  zipData: Record<string, Uint8Array>,
): Promise<AssetEntry | null> {
  const fileBytes = zipData[assetV2.file];
  if (!fileBytes) {
    console.warn(
      `[importV2] Asset "${assetV2.name}" references missing file "${assetV2.file}" in ZIP. Skipping.`,
    );
    return null;
  }

  const blob = new Blob([fileBytes], { type: assetV2.mime });
  let libraryId: number | undefined;

  // Insert into the appropriate IndexedDB library table
  if (assetV2.type === "image") {
    libraryId = await insertImageToLibrary(blob, assetV2);
  } else if (assetV2.type === "audio") {
    libraryId = await insertAudioToLibrary(blob, assetV2);
  }
  // video/font types could be added later

  const entry: AssetEntry = {
    id: assetId,
    type: assetV2.type,
    name: assetV2.name,
    mimeType: assetV2.mime,
    libraryId,
    meta: {},
  };

  if (assetV2.meta) {
    if (assetV2.meta.w !== undefined) entry.meta!.width = assetV2.meta.w;
    if (assetV2.meta.h !== undefined) entry.meta!.height = assetV2.meta.h;
    if (assetV2.meta.dur !== undefined) entry.meta!.duration = assetV2.meta.dur;
  }

  return entry;
}

/**
 * Insert an image blob into the libraryImages table.
 * Generates a thumbnail for the library browser.
 */
async function insertImageToLibrary(
  blob: Blob,
  assetV2: AssetEntryV2,
): Promise<number> {
  const { thumbnailUrl, width, height } = await generateImageThumbnail(blob);
  return await db.libraryImages.add({
    name: assetV2.name,
    tags: [],
    mimeType: assetV2.mime,
    blob,
    thumbnailUrl,
    width: assetV2.meta?.w ?? width,
    height: assetV2.meta?.h ?? height,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Insert an audio blob into the libraryAudio table.
 * Decodes audio to get duration metadata.
 */
async function insertAudioToLibrary(
  blob: Blob,
  assetV2: AssetEntryV2,
): Promise<number> {
  // Use the duration from manifest metadata if available, otherwise decode
  let duration = assetV2.meta?.dur ?? 0;
  if (duration === 0) {
    try {
      duration = await getAudioDuration(blob);
    } catch {
      console.warn(
        `[importV2] Could not decode audio duration for "${assetV2.name}". Using 0.`,
      );
    }
  }

  return await db.libraryAudio.add({
    name: assetV2.name,
    tags: [],
    mimeType: assetV2.mime,
    blob,
    duration,
    createdAt: new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------------
// Scene reconstruction
// ---------------------------------------------------------------------------

/**
 * Reconstruct a full TimelineScene from a compact SceneV2.
 *
 * - Expands diff-only `config` to full `baseConfig` via mergeWithDefaults.
 * - Expands compact keyframes: t->time, p->path, v->value, e->easing.
 * - Reconstructs `sidebarItems` from the config.
 * - Restores `collapsed: true`, `hidden: false`.
 * - Renames fields: start->startTime, dur->duration, track->trackIndex.
 */
function reconstructScene(sceneV2: SceneV2, index: number): TimelineScene {
  // Merge diff-only config with defaults
  const baseConfig = mergeWithDefaults(
    (sceneV2.config ?? {}) as Record<string, unknown>,
    configDefault as unknown as Record<string, unknown>,
  ) as unknown as ConfigType;

  // Reconstruct sequences
  const sequences: Sequence[] = (sceneV2.sequences ?? []).map((seqV2) =>
    reconstructSequence(seqV2, sceneV2.dur),
  );

  // Derive sidebar items from the config
  const sidebarItems = deriveSidebarItems(baseConfig);

  return {
    id: sceneV2.id,
    name: sceneV2.name,
    startTime: sceneV2.start,
    duration: sceneV2.dur,
    color: sceneV2.color ?? SCENE_COLORS[index % SCENE_COLORS.length],
    collapsed: true,
    hidden: false,
    trackIndex: sceneV2.track ?? 0,
    baseConfig,
    sequences,
    sidebarItems,
  };
}

/**
 * Reconstruct a full Sequence from a compact SequenceV2.
 *
 * - Restores default values for omitted fields.
 * - Expands compact keyframes.
 */
function reconstructSequence(seqV2: SequenceV2, parentDuration: number): Sequence {
  return {
    id: seqV2.id,
    type: seqV2.type,
    label: seqV2.label ?? seqV2.type,
    startOffset: seqV2.startOffset ?? 0,
    duration: seqV2.dur ?? parentDuration,
    order: seqV2.order ?? 0,
    baseConfig: {},
    keyframes: seqV2.keyframes.map(expandKeyframe),
  };
}

/**
 * Expand a compact KeyframeV2 to a full Keyframe.
 *
 * - `t` -> `time`
 * - `p` -> `path`
 * - `v` -> `value`
 * - `e` -> `easing` (defaults to `{ type: "linear" }` when omitted)
 */
function expandKeyframe(kfV2: KeyframeV2): Keyframe {
  return {
    id: generateId("kf"),
    time: kfV2.t,
    path: kfV2.p,
    value: kfV2.v,
    easing: kfV2.e ?? { type: "linear" },
  };
}

// ---------------------------------------------------------------------------
// Audio clip reconstruction
// ---------------------------------------------------------------------------

/**
 * Reconstruct a full AudioClip from a compact AudioClipV2.
 *
 * - Renames fields: start->startTime, dur->duration, track->trackIndex.
 * - Restores defaults: trimStart: 0, volume: 1, muted: false.
 * - Reconstructs `name` and `url: ""` from the asset entry.
 */
function reconstructAudioClip(
  clipV2: AudioClipV2,
  assetMap: Record<string, AssetEntry>,
): AudioClip {
  const asset = assetMap[clipV2.assetId];

  return {
    id: clipV2.id,
    name: asset?.name ?? "Unknown Audio",
    url: "",
    startTime: clipV2.start,
    duration: clipV2.dur,
    trimStart: clipV2.trimStart ?? 0,
    volume: clipV2.volume ?? 1,
    muted: clipV2.muted ?? false,
    trackIndex: clipV2.track ?? 0,
    assetId: clipV2.assetId,
  };
}

// ---------------------------------------------------------------------------
// deriveSidebarItems
// ---------------------------------------------------------------------------

/**
 * Derive sidebar accordion items from a full ConfigType.
 *
 * The sidebar shows which visual sections are active for a scene.
 * This function inspects the config and creates sidebar entries for
 * each section that is present or enabled.
 */
function deriveSidebarItems(config: ConfigType): SidebarItem[] {
  const items: SidebarItem[] = [];

  // Background is always present
  items.push({ id: "bg-0", type: "background" as SidebarItemType });

  // Shader
  if (config.scene.shader_show === true) {
    items.push({ id: generateId("si"), type: "shader" as SidebarItemType });
  }

  // VU meters (oscilloscope / spectrum)
  if (config.vumeters.oscilloscop.show || config.vumeters.spectrum.show) {
    items.push({ id: generateId("si"), type: "vumeters" as SidebarItemType });
  }

  // Composer (any post-processing effect with show: true)
  const composerEffects = config.composer;
  const hasActiveComposer =
    composerEffects.bloom?.show ||
    composerEffects.rgb?.show ||
    composerEffects.film?.show ||
    composerEffects.static?.show ||
    composerEffects.hue?.show ||
    composerEffects.lens?.show ||
    composerEffects.kaleidoscope?.show;
  if (hasActiveComposer) {
    items.push({ id: generateId("si"), type: "composer" as SidebarItemType });
  }

  // Texts (dynamic Record)
  if (config.texts && !Array.isArray(config.texts)) {
    for (const configKey of Object.keys(config.texts as Record<string, unknown>)) {
      items.push({
        id: generateId("si"),
        type: "text" as SidebarItemType,
        configKey,
      });
    }
  }

  // Images (dynamic Record)
  if (config.images && !Array.isArray(config.images)) {
    for (const configKey of Object.keys(config.images as Record<string, ImageType>)) {
      items.push({
        id: generateId("si"),
        type: "image" as SidebarItemType,
        configKey,
      });
    }
  }

  // Sparks
  if (config.sparks?.enabled) {
    items.push({ id: generateId("si"), type: "sparks" as SidebarItemType });
  }

  // Timecode
  if (config.timer.show) {
    items.push({ id: generateId("si"), type: "timecode" as SidebarItemType });
  }

  // Progressbar
  if (config.progressbar.show) {
    items.push({ id: generateId("si"), type: "progressbar" as SidebarItemType });
  }

  return items;
}

// ---------------------------------------------------------------------------
// Utility helpers (duplicated from libraryService to avoid circular deps)
// ---------------------------------------------------------------------------

function generateImageThumbnail(
  blob: Blob,
): Promise<{ thumbnailUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const maxSize = 200;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);

      const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.7);
      URL.revokeObjectURL(url);
      resolve({ thumbnailUrl, width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image for thumbnail: ${blob.type}`));
    };
    img.src = url;
  });
}

function getAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const ctx = new AudioContext();
      try {
        const buffer = await ctx.decodeAudioData(reader.result as ArrayBuffer);
        resolve(buffer.duration);
      } catch (err) {
        reject(err);
      } finally {
        await ctx.close();
      }
    };
    reader.onerror = () => reject(new Error("Failed to read audio file"));
    reader.readAsArrayBuffer(blob);
  });
}
