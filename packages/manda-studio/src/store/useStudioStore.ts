import { create } from "zustand";
import type { ConfigType } from "@mandafunk/config/types";
import { getInitialSampleConfig } from "@/db/samplePresets";

export type PanelName = "shader" | "background" | "vumeters" | "composer" | "texts" | "images" | "sparks";

interface StudioState {
  // Config
  config: ConfigType;
  setConfig: (config: ConfigType) => void;
  updateConfig: (path: string, value: unknown) => void;

  // Audio
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  audioFile: string | null;
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setAudioFile: (file: string | null) => void;

  // Thumbnail capture
  captureThumbnail: (() => string) | null;
  setCaptureThumbnail: (fn: (() => string) | null) => void;

  // UI
  activePanel: PanelName;
  setActivePanel: (panel: PanelName) => void;
  libraryOpen: boolean;
  setLibraryOpen: (open: boolean) => void;
  showExportDialog: boolean;
  setShowExportDialog: (show: boolean) => void;
  showShortcutsHelp: boolean;
  setShowShortcutsHelp: (show: boolean) => void;

  // History (undo/redo)
  history: ConfigType[];
  historyIndex: number;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
}

const MAX_HISTORY = 50;

function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const clone = structuredClone(obj);
  const keys = path.split(".");
  let current: Record<string, unknown> = clone;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (
      current[key] === undefined ||
      typeof current[key] !== "object" ||
      current[key] === null
    ) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = value;
  return clone;
}

export const useStudioStore = create<StudioState>((set, get) => ({
  // Config - initialized with first sample scene (Neon Plasma)
  config: getInitialSampleConfig(),

  setConfig: (config) => set({ config }),

  updateConfig: (path, value) => {
    const { config } = get();
    const updated = setNestedValue(
      config as unknown as Record<string, unknown>,
      path,
      value,
    ) as unknown as ConfigType;

    set({ config: updated });
  },

  // Audio
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  audioFile: null,

  setPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  setAudioFile: (file) => set({ audioFile: file }),

  // Thumbnail capture
  captureThumbnail: null,
  setCaptureThumbnail: (fn) => set({ captureThumbnail: fn }),

  // UI
  activePanel: "shader",
  setActivePanel: (panel) => set({ activePanel: panel }),
  libraryOpen: false,
  setLibraryOpen: (open) => set({ libraryOpen: open }),
  showExportDialog: false,
  setShowExportDialog: (show) => set({ showExportDialog: show }),
  showShortcutsHelp: false,
  setShowShortcutsHelp: (show) => set({ showShortcutsHelp: show }),

  // History
  history: [],
  historyIndex: -1,

  pushHistory: () => {
    const { config, history, historyIndex } = get();

    const snapshot = structuredClone(config);
    const trimmed = history.slice(0, historyIndex + 1);
    trimmed.push(snapshot);

    if (trimmed.length > MAX_HISTORY) {
      trimmed.shift();
    }

    set({
      history: trimmed,
      historyIndex: trimmed.length - 1,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;

    const newIndex = historyIndex - 1;
    set({
      config: structuredClone(history[newIndex]),
      historyIndex: newIndex,
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;

    const newIndex = historyIndex + 1;
    set({
      config: structuredClone(history[newIndex]),
      historyIndex: newIndex,
    });
  },
}));
