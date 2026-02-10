import Dexie, { type Table } from "dexie";
import type { ScenePreset } from "./types";

class StudioDatabase extends Dexie {
  presets!: Table<ScenePreset, number>;

  constructor() {
    super("MandaStudioDB");
    this.version(1).stores({
      presets: "++id, name, *tags, createdAt, updatedAt",
    });
  }
}

export const db = new StudioDatabase();
