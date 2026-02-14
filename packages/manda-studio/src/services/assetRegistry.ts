import type { AssetEntry, AssetType, Timeline } from "@/timeline/ganttTypes.ts";
import type { ImageType, SceneConfig } from "@mandafunk/config/types";
import { generateId } from "@/store/useGanttStore.ts";
import { getImage, getAudioItem } from "@/db/libraryService.ts";

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

/**
 * Creates an AssetEntry from a library item, generates a runtime blob URL,
 * and returns the new entry ready to be stored in `timeline.assets`.
 */
export async function createAssetEntry(
  libraryId: number,
  type: AssetType,
  /** Pass an existing blob URL to avoid creating a duplicate. */
  existingRuntimeUrl?: string,
): Promise<AssetEntry | null> {
  if (type === "image") {
    const img = await getImage(libraryId);
    if (!img) return null;
    const runtimeUrl = existingRuntimeUrl ?? URL.createObjectURL(img.blob);
    return {
      id: generateId("asset"),
      type,
      name: img.name,
      mimeType: img.mimeType,
      libraryId,
      runtimeUrl,
      meta: { width: img.width, height: img.height },
    };
  }
  if (type === "audio") {
    const audio = await getAudioItem(libraryId);
    if (!audio) return null;
    const runtimeUrl = existingRuntimeUrl ?? URL.createObjectURL(audio.blob);
    return {
      id: generateId("asset"),
      type,
      name: audio.name,
      mimeType: audio.mimeType,
      libraryId,
      runtimeUrl,
      meta: { duration: audio.duration },
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Resolve
// ---------------------------------------------------------------------------

/**
 * Walk the entire timeline and create blob URLs for every asset that has a
 * `libraryId` but no `runtimeUrl`. Then patch scene configs and audio clips
 * so the engine receives valid URLs in `path`/`background`/`url`.
 */
export async function resolveAllAssets(timeline: Timeline): Promise<void> {
  const { assets } = timeline;

  // 1. Resolve runtimeUrl for every asset entry
  for (const entry of Object.values(assets)) {
    if (!entry.libraryId) continue;

    if (entry.type === "image") {
      // Skip if already resolved
      if (entry.runtimeUrl) continue;
      const img = await getImage(entry.libraryId);
      if (img) {
        entry.runtimeUrl = URL.createObjectURL(img.blob);
      }
    } else if (entry.type === "audio") {
      if (entry.runtimeUrl) continue;
      const audio = await getAudioItem(entry.libraryId);
      if (audio) {
        entry.runtimeUrl = URL.createObjectURL(audio.blob);
      }
    }
  }

  // 2. Patch scene configs to use runtime URLs from registry
  for (const scene of timeline.scenes) {
    const cfg = scene.baseConfig;
    if (!cfg) continue;

    // Background
    if (cfg.scene.bgAssetId) {
      const url = assets[cfg.scene.bgAssetId]?.runtimeUrl;
      if (url) cfg.scene.background = url;
    }

    // Image overlays
    if (cfg.images && !Array.isArray(cfg.images)) {
      for (const imgCfg of Object.values(cfg.images as Record<string, ImageType>)) {
        if (imgCfg.assetId) {
          const url = assets[imgCfg.assetId]?.runtimeUrl;
          if (url) imgCfg.path = url;
        }
      }
    }
  }

  // 3. Patch audio clips
  for (const clip of timeline.audioClips) {
    if (clip.assetId) {
      const url = assets[clip.assetId]?.runtimeUrl;
      if (url) clip.url = url;
    }
  }
}

// ---------------------------------------------------------------------------
// Strip (for persistence / export)
// ---------------------------------------------------------------------------

/**
 * Deep-clone the timeline and remove all `runtimeUrl` fields from assets.
 * Also clears runtime-only `path`/`background`/`url` that came from blob URLs.
 */
export function stripRuntimeData(timeline: Timeline): Timeline {
  const clone = structuredClone(timeline);

  for (const entry of Object.values(clone.assets ?? {})) {
    delete entry.runtimeUrl;
  }

  // Clear blob URLs from scene configs (they will be re-resolved on load)
  for (const scene of clone.scenes) {
    const cfg = scene.baseConfig;
    if (!cfg) continue;

    if (cfg.scene.bgAssetId) {
      cfg.scene.background = "";
    }

    if (cfg.images && !Array.isArray(cfg.images)) {
      for (const imgCfg of Object.values(cfg.images as Record<string, ImageType>)) {
        if (imgCfg.assetId) {
          imgCfg.path = "";
        }
      }
    }
  }

  // Clear blob URLs from audio clips
  for (const clip of clone.audioClips) {
    if (clip.assetId) {
      clip.url = "";
    }
  }

  return clone;
}

// ---------------------------------------------------------------------------
// Migration: legacy projects without asset registry
// ---------------------------------------------------------------------------

/**
 * Scans scenes and audio clips for `libraryId`/`bgLibraryId` without a
 * corresponding `assetId`, creates asset entries, and wires them up.
 * Call this once when loading a project that predates the asset registry.
 */
export async function migrateToAssetRegistry(timeline: Timeline): Promise<void> {
  if (!timeline.assets) {
    timeline.assets = {};
  }

  // Helper: find or create an asset for a libraryId + type
  const getOrCreate = async (
    libraryId: number,
    type: AssetType,
  ): Promise<string | null> => {
    // Reuse existing entry with the same libraryId
    for (const entry of Object.values(timeline.assets)) {
      if (entry.libraryId === libraryId && entry.type === type) {
        return entry.id;
      }
    }
    const entry = await createAssetEntry(libraryId, type);
    if (!entry) return null;
    timeline.assets[entry.id] = entry;
    return entry.id;
  };

  // Scenes
  for (const scene of timeline.scenes) {
    const cfg = scene.baseConfig;
    if (!cfg) continue;

    // Background
    if (cfg.scene.bgLibraryId && !cfg.scene.bgAssetId) {
      const assetId = await getOrCreate(cfg.scene.bgLibraryId, "image");
      if (assetId) cfg.scene.bgAssetId = assetId;
    }

    // Image overlays
    if (cfg.images && !Array.isArray(cfg.images)) {
      for (const imgCfg of Object.values(cfg.images as Record<string, ImageType>)) {
        if (imgCfg.libraryId && !imgCfg.assetId) {
          const assetId = await getOrCreate(imgCfg.libraryId, "image");
          if (assetId) imgCfg.assetId = assetId;
        }
      }
    }
  }

  // Audio clips
  for (const clip of timeline.audioClips) {
    if (clip.libraryId && !clip.assetId) {
      const assetId = await getOrCreate(clip.libraryId, "audio");
      if (assetId) clip.assetId = assetId;
    }
  }
}

// ---------------------------------------------------------------------------
// Garbage collection: prune unreferenced assets
// ---------------------------------------------------------------------------

/**
 * Returns a new Timeline with only the assets that are actually referenced
 * by at least one scene (background, image overlay, spark emitter sprite)
 * or audio clip. Does NOT mutate the input.
 *
 * Call this before export to eliminate orphaned assets created by
 * repeated drag-and-drop operations.
 */
export function collectGarbage(timeline: Timeline): Timeline {
  const usedIds = new Set<string>();

  // Scan scenes
  for (const scene of timeline.scenes ?? []) {
    const cfg = scene.baseConfig;
    if (!cfg) continue;

    // Background image
    if (cfg.scene.bgAssetId) {
      usedIds.add(cfg.scene.bgAssetId);
    }

    // Image overlays
    if (cfg.images && !Array.isArray(cfg.images)) {
      for (const imgCfg of Object.values(cfg.images as Record<string, ImageType>)) {
        if (imgCfg.assetId) {
          usedIds.add(imgCfg.assetId);
        }
      }
    }

    // Spark emitter sprites
    if (cfg.sparks?.emitters && Array.isArray(cfg.sparks.emitters)) {
      for (const emitter of cfg.sparks.emitters) {
        if (emitter.assetId) {
          usedIds.add(emitter.assetId);
        }
      }
    }
  }

  // Scan audio clips
  for (const clip of timeline.audioClips ?? []) {
    if (clip.assetId) {
      usedIds.add(clip.assetId);
    }
  }

  // Build pruned asset map
  const prunedAssets: Record<string, AssetEntry> = {};
  for (const [id, entry] of Object.entries(timeline.assets ?? {})) {
    if (usedIds.has(id)) {
      prunedAssets[id] = entry;
    }
  }

  return { ...timeline, assets: prunedAssets };
}
