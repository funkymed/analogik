import { db } from "./database";
import type { Project, ProjectExport } from "./projectTypes";
import { stripRuntimeData } from "@/services/assetRegistry";

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

export async function exportProjects(ids?: number[]): Promise<string> {
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

export async function importProjects(file: File): Promise<number> {
  const text = await file.text();
  const data: ProjectExport = JSON.parse(text);
  if (data.version !== "1.0" || !Array.isArray(data.projects)) {
    throw new Error("Invalid project export file");
  }
  let count = 0;
  for (const project of data.projects) {
    const { id: _id, ...rest } = project;
    await db.projects.add(rest as Project);
    count++;
  }
  return count;
}
