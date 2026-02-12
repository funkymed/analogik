import { db } from "./database";
import type { Project, ProjectExport } from "./projectTypes";
import { stripRuntimeData } from "@/services/assetRegistry";
import { importProjectsV2 } from "@/services/importV2.ts";
import { exportProjectsV2, exportCurrentV2, downloadBlob } from "@/services/exportV2.ts";
import type { Timeline } from "@/timeline/ganttTypes.ts";

export async function getAllProjects(): Promise<Project[]> {
  return await db.projects.orderBy("updatedAt").reverse().toArray();
}

export async function getProject(id: number): Promise<Project | undefined> {
  return await db.projects.get(id);
}

export async function createProject(project: Omit<Project, "id">): Promise<number> {
  return await db.projects.add(project as Project);
}

export async function updateProject(id: number, changes: Partial<Project>): Promise<void> {
  await db.projects.update(id, { ...changes, updatedAt: new Date().toISOString() });
}

export async function deleteProject(id: number): Promise<void> {
  await db.projects.delete(id);
}

export async function searchProjects(query: string): Promise<Project[]> {
  const lower = query.toLowerCase();
  return await db.projects
    .filter((item) => item.name.toLowerCase().includes(lower))
    .toArray();
}

/**
 * Export projects as a v2.0 `.manda` ZIP file and trigger a browser download.
 *
 * The ZIP contains a `manifest.json` with diff-only configs, compact keyframes,
 * deduplicated assets, and no UI state, plus an `assets/` folder with the raw
 * binary files.
 *
 * @param ids      - Optional list of project IDs. If empty/undefined, exports all projects.
 * @param filename - Download filename (default: "manda-projects.manda").
 * @returns The generated ZIP as a Blob.
 */
export async function exportProjects(
  ids?: number[],
  filename = "manda-projects.manda",
): Promise<Blob> {
  const blob = await exportProjectsV2(ids);
  downloadBlob(blob, filename);
  return blob;
}

/**
 * Export the current in-memory timeline as a v2.0 `.manda` ZIP file.
 * Does not require the project to be saved in IndexedDB first.
 */
export async function exportCurrentProject(
  name: string,
  timeline: Timeline,
  sceneTrackCount: number,
  audioTrackCount: number,
  filename?: string,
): Promise<Blob> {
  const blob = await exportCurrentV2(name, timeline, sceneTrackCount, audioTrackCount);
  const safeName = (name || "project").replace(/[^a-zA-Z0-9_-]/g, "_");
  downloadBlob(blob, filename ?? `${safeName}.manda`);
  return blob;
}

/**
 * @deprecated Use `exportProjects()` which now produces v2.0 `.manda` ZIP files.
 * Kept temporarily for backward compatibility during the transition period.
 */
export async function exportProjectsV1(ids?: number[]): Promise<string> {
  let projects: Project[];
  if (ids && ids.length > 0) {
    projects = (await Promise.all(ids.map((id) => db.projects.get(id)))).filter(
      (p): p is Project => p !== undefined,
    );
  } else {
    projects = await getAllProjects();
  }
  // Strip runtime blob URLs from all timelines before exporting
  const cleaned = projects.map((p) => ({
    ...p,
    timeline: stripRuntimeData(p.timeline),
  }));
  const data: ProjectExport = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    projects: cleaned,
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Import projects from a `.manda` ZIP file (v2.0 format).
 *
 * Delegates to `importProjectsV2` which handles:
 * - ZIP decompression via fflate
 * - Asset extraction and insertion into IndexedDB library
 * - Full timeline reconstruction from compact manifest
 *
 * @param file        - The `.manda` File selected by the user.
 * @param onProgress  - Optional callback `(current, total)` for asset import progress.
 * @returns The number of projects imported.
 */
export async function importProjects(
  file: File,
  onProgress?: (current: number, total: number) => void,
): Promise<number> {
  return importProjectsV2(file, onProgress);
}
