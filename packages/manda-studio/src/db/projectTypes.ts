import type { Timeline } from "@/timeline/ganttTypes";

export interface Project {
  /** Auto-increment ID from IndexedDB. */
  id?: number;
  /** Human-readable name. */
  name: string;
  /** Full timeline state (scenes, transitions, audioClips). */
  timeline: Timeline;
  /** Number of scene tracks. */
  sceneTrackCount: number;
  /** Number of audio tracks. */
  audioTrackCount: number;
  /** Base64 PNG thumbnail (data URL). */
  thumbnail: string;
  /** ISO timestamp of creation. */
  createdAt: string;
  /** ISO timestamp of last update. */
  updatedAt: string;
}

/** JSON export format for projects. */
export interface ProjectExport {
  version: "1.0";
  exportedAt: string;
  projects: Project[];
}
