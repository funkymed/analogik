import Dexie, { type Table } from "dexie";
import type { ScenePreset } from "./types";
import type { LibraryImage, LibraryAudio, LibraryVideo } from "./libraryTypes";

class StudioDatabase extends Dexie {
  presets!: Table<ScenePreset, number>;
  libraryImages!: Table<LibraryImage, number>;
  libraryAudio!: Table<LibraryAudio, number>;
  libraryVideos!: Table<LibraryVideo, number>;

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
  }
}

export const db = new StudioDatabase();
