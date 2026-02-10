import { create } from "zustand";
import type { ConfigType } from "@mandafunk/config/types";
import type { Track, TrackAssignment } from "@/timeline/types.ts";

interface TimelineState {
  // -------------------------------------------------------------------------
  // Tracks
  // -------------------------------------------------------------------------
  tracks: Track[];
  setTracks: (tracks: Track[]) => void;

  // -------------------------------------------------------------------------
  // Assignments
  // -------------------------------------------------------------------------
  assignments: Map<number, TrackAssignment>;
  assignPreset: (
    trackIndex: number,
    presetId: number,
    presetName: string,
  ) => void;
  assignConfig: (trackIndex: number, config: ConfigType) => void;
  clearAssignment: (trackIndex: number) => void;

  // -------------------------------------------------------------------------
  // Batch operations
  // -------------------------------------------------------------------------
  autoAssign: (
    presetIds: number[],
    presetNames: Map<number, string>,
  ) => void;
  clearAll: () => void;

  // -------------------------------------------------------------------------
  // Filters
  // -------------------------------------------------------------------------
  yearFilter: string | null;
  authorFilter: string | null;
  setYearFilter: (year: string | null) => void;
  setAuthorFilter: (author: string | null) => void;

  // -------------------------------------------------------------------------
  // Selection
  // -------------------------------------------------------------------------
  selectedTrackIndex: number | null;
  setSelectedTrackIndex: (index: number | null) => void;

  // -------------------------------------------------------------------------
  // Computed helpers
  // -------------------------------------------------------------------------
  getFilteredTracks: () => Track[];
  getAssignment: (trackIndex: number) => TrackAssignment | undefined;
  getUniqueYears: () => string[];
  getUniqueAuthors: () => string[];
  getAssignedCount: () => number;
  getUnassignedCount: () => number;
}

/**
 * Fisher-Yates shuffle (in-place, returns the same array).
 */
function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = array[i];
    array[i] = array[j];
    array[j] = tmp;
  }
  return array;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  // -------------------------------------------------------------------------
  // Tracks
  // -------------------------------------------------------------------------
  tracks: [],

  setTracks: (tracks) => set({ tracks }),

  // -------------------------------------------------------------------------
  // Assignments
  // -------------------------------------------------------------------------
  assignments: new Map<number, TrackAssignment>(),

  assignPreset: (trackIndex, presetId, presetName) => {
    const prev = get().assignments;
    const next = new Map(prev);
    next.set(trackIndex, {
      trackIndex,
      presetId,
      presetName,
      config: null,
    });
    set({ assignments: next });
  },

  assignConfig: (trackIndex, config) => {
    const prev = get().assignments;
    const next = new Map(prev);
    next.set(trackIndex, {
      trackIndex,
      presetId: null,
      presetName: null,
      config,
    });
    set({ assignments: next });
  },

  clearAssignment: (trackIndex) => {
    const prev = get().assignments;
    if (!prev.has(trackIndex)) return;
    const next = new Map(prev);
    next.delete(trackIndex);
    set({ assignments: next });
  },

  // -------------------------------------------------------------------------
  // Batch operations
  // -------------------------------------------------------------------------

  autoAssign: (presetIds, presetNames) => {
    if (presetIds.length === 0) return;

    const { tracks, assignments: prev } = get();

    // Collect unassigned track indices
    const unassigned = tracks
      .filter((t) => !prev.has(t.index))
      .map((t) => t.index);

    if (unassigned.length === 0) return;

    // Shuffle the preset pool so distribution feels random
    const pool = shuffle([...presetIds]);

    const next = new Map(prev);
    let poolIdx = 0;

    for (const trackIndex of unassigned) {
      // Pick a preset, skipping if it would repeat the previous assignment
      let chosen = pool[poolIdx % pool.length];

      if (pool.length > 1) {
        // Look at the previous track's assignment to avoid consecutive dupes
        const prevTrackAssignment = next.get(trackIndex - 1);
        const prevPresetId = prevTrackAssignment?.presetId ?? null;

        if (chosen === prevPresetId) {
          poolIdx++;
          chosen = pool[poolIdx % pool.length];
        }
      }

      next.set(trackIndex, {
        trackIndex,
        presetId: chosen,
        presetName: presetNames.get(chosen) ?? null,
        config: null,
      });

      poolIdx++;
    }

    set({ assignments: next });
  },

  clearAll: () => set({ assignments: new Map<number, TrackAssignment>() }),

  // -------------------------------------------------------------------------
  // Filters
  // -------------------------------------------------------------------------
  yearFilter: null,
  authorFilter: null,

  setYearFilter: (year) => set({ yearFilter: year }),
  setAuthorFilter: (author) => set({ authorFilter: author }),

  // -------------------------------------------------------------------------
  // Selection
  // -------------------------------------------------------------------------
  selectedTrackIndex: null,

  setSelectedTrackIndex: (index) => set({ selectedTrackIndex: index }),

  // -------------------------------------------------------------------------
  // Computed helpers
  // -------------------------------------------------------------------------

  getFilteredTracks: () => {
    const { tracks, yearFilter, authorFilter } = get();

    return tracks.filter((track) => {
      if (yearFilter && track.year !== yearFilter) return false;
      if (authorFilter && !track.author.includes(authorFilter)) return false;
      return true;
    });
  },

  getAssignment: (trackIndex) => {
    return get().assignments.get(trackIndex);
  },

  getUniqueYears: () => {
    const { tracks } = get();
    const years = new Set<string>();
    for (const track of tracks) {
      years.add(track.year);
    }
    return Array.from(years).sort();
  },

  getUniqueAuthors: () => {
    const { tracks } = get();
    const authors = new Set<string>();
    for (const track of tracks) {
      for (const author of track.author) {
        authors.add(author);
      }
    }
    return Array.from(authors).sort();
  },

  getAssignedCount: () => {
    return get().assignments.size;
  },

  getUnassignedCount: () => {
    const { tracks, assignments } = get();
    return tracks.length - assignments.size;
  },
}));
