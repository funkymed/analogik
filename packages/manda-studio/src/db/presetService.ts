import { db } from "./database";
import type { ScenePreset, PresetExport } from "./types";
import type { ConfigType } from "@mandafunk/config/types";

/** Get all presets, ordered by updatedAt descending. */
export async function getAllPresets(): Promise<ScenePreset[]> {
  return await db.presets.orderBy("updatedAt").reverse().toArray();
}

/** Get a single preset by ID. */
export async function getPreset(id: number): Promise<ScenePreset | undefined> {
  return await db.presets.get(id);
}

/** Create a new preset. Returns the auto-generated ID. */
export async function createPreset(
  name: string,
  config: ConfigType,
  thumbnail: string = "",
  tags: string[] = [],
  description: string = "",
): Promise<number> {
  const now = new Date().toISOString();
  return await db.presets.add({
    name,
    config,
    thumbnail,
    tags,
    description,
    createdAt: now,
    updatedAt: now,
  });
}

/** Update an existing preset. Automatically updates `updatedAt`. */
export async function updatePreset(
  id: number,
  changes: Partial<
    Pick<ScenePreset, "name" | "description" | "tags" | "config" | "thumbnail">
  >,
): Promise<void> {
  await db.presets.update(id, {
    ...changes,
    updatedAt: new Date().toISOString(),
  });
}

/** Duplicate a preset with a new name. Returns the new ID. */
export async function duplicatePreset(
  id: number,
  newName?: string,
): Promise<number> {
  const original = await db.presets.get(id);
  if (!original) {
    throw new Error(`Preset with id ${id} not found`);
  }
  const now = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _stripId, ...rest } = original;
  return await db.presets.add({
    ...rest,
    name: newName ?? `${original.name} (copy)`,
    createdAt: now,
    updatedAt: now,
  });
}

/** Delete a preset by ID. */
export async function deletePreset(id: number): Promise<void> {
  await db.presets.delete(id);
}

/** Search presets by name (case-insensitive substring match). */
export async function searchPresets(query: string): Promise<ScenePreset[]> {
  const lowerQuery = query.toLowerCase();
  return await db.presets
    .filter((preset) => preset.name.toLowerCase().includes(lowerQuery))
    .toArray();
}

/** Filter presets by tag. */
export async function filterByTag(tag: string): Promise<ScenePreset[]> {
  return await db.presets.where("tags").equals(tag).toArray();
}

/** Get all unique tags across all presets. */
export async function getAllTags(): Promise<string[]> {
  const allPresets = await db.presets.toArray();
  const tagSet = new Set<string>();
  for (const preset of allPresets) {
    for (const tag of preset.tags) {
      tagSet.add(tag);
    }
  }
  return [...tagSet].sort();
}

/** Export selected presets as JSON. */
export async function exportPresets(ids: number[]): Promise<PresetExport> {
  const presets = await db.presets.where("id").anyOf(ids).toArray();
  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    presets,
  };
}

/** Export all presets as JSON. */
export async function exportAllPresets(): Promise<PresetExport> {
  const presets = await db.presets.toArray();
  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    presets,
  };
}

/** Import presets from a JSON export. Returns count of imported presets. */
export async function importPresets(data: PresetExport): Promise<number> {
  if (data.version !== "1.0") {
    throw new Error(`Unsupported export version: ${data.version}`);
  }
  const now = new Date().toISOString();
  const presetsToAdd = data.presets.map(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ id: _stripId, ...rest }) =>
      ({
        ...rest,
        createdAt: rest.createdAt ?? now,
        updatedAt: rest.updatedAt ?? now,
      }) as ScenePreset,
  );
  await db.presets.bulkAdd(presetsToAdd);
  return presetsToAdd.length;
}
