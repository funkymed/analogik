import type { ConfigType } from "@mandafunk/config/types";

/** A track from the Analogik project or imported JSON. */
export interface Track {
  /** Unique index (position in array). */
  index: number;
  /** Relative path to the audio file. */
  url: string;
  /** Year of the track. */
  year: string;
  /** Author(s) of the track. */
  author: string[];
  /** Filename only. */
  filename: string;
  /** Selection flags. */
  bleep?: boolean;
  pouet?: boolean;
}

/** Assignment of a scene preset to a track. */
export interface TrackAssignment {
  /** Track index. */
  trackIndex: number;
  /** Preset ID from the Library (IndexedDB). null = no assignment. */
  presetId: number | null;
  /** Preset name (cached for display). */
  presetName: string | null;
  /** Inline config override (for tracks without a preset). */
  config: ConfigType | null;
}

/** Format for importing/exporting track assignments. */
export interface TimelineExport {
  version: "1.0";
  exportedAt: string;
  tracks: Track[];
  assignments: Array<{
    trackIndex: number;
    presetId: number | null;
    presetName: string | null;
    config: ConfigType | null;
  }>;
}
