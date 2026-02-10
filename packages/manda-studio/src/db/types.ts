import type { ConfigType } from "@mandafunk/config/types";

export interface ScenePreset {
  /** Auto-increment ID from IndexedDB. */
  id?: number;
  /** Human-readable name. */
  name: string;
  /** Optional description. */
  description: string;
  /** Tags for filtering (e.g., ["dark", "energetic", "minimal"]). */
  tags: string[];
  /** The full mandafunk ConfigType. */
  config: ConfigType;
  /** Base64 PNG thumbnail (data URL). */
  thumbnail: string;
  /** ISO timestamp of creation. */
  createdAt: string;
  /** ISO timestamp of last update. */
  updatedAt: string;
}

/** JSON export format for presets. */
export interface PresetExport {
  version: "1.0";
  exportedAt: string;
  presets: ScenePreset[];
}
