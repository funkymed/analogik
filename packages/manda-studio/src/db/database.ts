import Dexie, { type Table } from "dexie";
import type { ScenePreset } from "./types";
import type { LibraryImage, LibraryAudio, LibraryVideo } from "./libraryTypes";
import type { Project } from "./projectTypes";

class StudioDatabase extends Dexie {
  presets!: Table<ScenePreset, number>;
  libraryImages!: Table<LibraryImage, number>;
  libraryAudio!: Table<LibraryAudio, number>;
  libraryVideos!: Table<LibraryVideo, number>;
  projects!: Table<Project, number>;

  constructor() {
    super("MandaStudioDB");
    this.version(1).stores({
      presets: "++id, name, *tags, createdAt, updatedAt",
    });
    this.version(2).stores({
      presets: "++id, name, *tags, createdAt, updatedAt",
      libraryImages: "++id, name, *tags, createdAt",
      libraryAudio: "++id, name, *tags, createdAt",
      libraryVideos: "++id, name, *tags, createdAt",
    });
    this.version(3).stores({
      presets: "++id, name, *tags, createdAt, updatedAt",
      libraryImages: "++id, name, *tags, createdAt",
      libraryAudio: "++id, name, *tags, createdAt",
      libraryVideos: "++id, name, *tags, createdAt",
      projects: "++id, name, createdAt, updatedAt",
    });
  }
}

export const db = new StudioDatabase();
