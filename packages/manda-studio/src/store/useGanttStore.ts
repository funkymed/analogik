import { create } from "zustand";
import type { ConfigType } from "@mandafunk/config/types";
import type {
  Timeline,
  TimelineScene,
  Sequence,
  Keyframe,
  SceneTransition,
  AudioClip,
  AssetEntry,
  GanttSelection,
  SidebarItemType,
  SidebarItem,
} from "@/timeline/ganttTypes.ts";
import { configDefault } from "@mandafunk/config";
import type { TextType, ImageType } from "@mandafunk/config/types";
import { DEFAULT_TEXT, DEFAULT_IMAGE } from "@/components/panels/TextsImagesPanel.tsx";
import { stripRuntimeData } from "@/services/assetRegistry.ts";

// ---------------------------------------------------------------------------
// LocalStorage persistence
// ---------------------------------------------------------------------------

const LS_KEY = "manda-studio:project";

interface PersistedProject {
  timeline: Timeline;
  sceneTrackCount: number;
  audioTrackCount: number;
}

function loadPersistedProject(): PersistedProject | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PersistedProject;
    // Ensure assets map exists (old saves might lack it)
    if (!data.timeline.assets) data.timeline.assets = {};
    return data;
  } catch {
    return null;
  }
}

function savePersistedProject(state: {
  timeline: Timeline;
  sceneTrackCount: number;
  audioTrackCount: number;
}): void {
  try {
    const data: PersistedProject = {
      timeline: stripRuntimeData(state.timeline),
      sceneTrackCount: state.sceneTrackCount,
      audioTrackCount: state.audioTrackCount,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    // Silently fail if storage is full
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Shared empty array for keyframeIds to avoid new `[]` refs on every selection change. */
const _emptyKfIds: string[] = [];

let _idCounter = 0;
export function generateId(prefix = "id"): string {
  _idCounter++;
  return `${prefix}_${Date.now().toString(36)}_${_idCounter.toString(36)}`;
}

export const SCENE_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#f97316", // orange
  "#84cc16", // lime
];

function pickSceneColor(index: number): string {
  return SCENE_COLORS[index % SCENE_COLORS.length];
}

/** Disable all optional visual sections so a new scene starts clean (background only). */
function stripConfigToBackgroundOnly(cfg: ConfigType): ConfigType {
  const c = structuredClone(cfg);
  // Shader off (keep name for export, just hide it)
  c.scene.shader_show = false;
  // Timer / progressbar hidden
  c.timer.show = false;
  c.progressbar.show = false;
  // Vumeters hidden
  c.vumeters.oscilloscop.show = false;
  c.vumeters.spectrum.show = false;
  // Composer effects off
  c.composer.bloom.show = false;
  c.composer.rgb.show = false;
  c.composer.film.show = false;
  c.composer.static.show = false;
  c.composer.hue.show = false;
  // Sparks disabled
  c.sparks.enabled = false;
  // Clear multi-instance items
  (c as Record<string, unknown>).texts = {};
  (c as Record<string, unknown>).images = {};
  return c;
}

/** Enable the config section for a sidebar item type using configDefault values. */
function enableConfigSection(cfg: ConfigType, type: SidebarItemType): ConfigType {
  const c = structuredClone(cfg);
  const d = configDefault;
  switch (type) {
    case "shader":
      c.scene.shader = d.scene.shader;
      c.scene.shader_show = true;
      break;
    case "timecode":
      c.timer = structuredClone(d.timer);
      break;
    case "progressbar":
      c.progressbar = structuredClone(d.progressbar);
      break;
    case "vumeters":
      c.vumeters = structuredClone(d.vumeters);
      break;
    case "composer":
      c.composer = structuredClone(d.composer);
      break;
    case "sparks":
      c.sparks = structuredClone(d.sparks);
      c.sparks.enabled = true;
      break;
    default:
      break;
  }
  return c;
}

/** Disable the config section for a sidebar item type. */
function disableConfigSection(cfg: ConfigType, type: SidebarItemType): ConfigType {
  const c = structuredClone(cfg);
  switch (type) {
    case "shader":
      c.scene.shader_show = false;
      break;
    case "timecode":
      c.timer.show = false;
      break;
    case "progressbar":
      c.progressbar.show = false;
      break;
    case "vumeters":
      c.vumeters.oscilloscop.show = false;
      c.vumeters.spectrum.show = false;
      break;
    case "composer":
      c.composer.bloom.show = false;
      c.composer.rgb.show = false;
      c.composer.film.show = false;
      c.composer.static.show = false;
      c.composer.hue.show = false;
      break;
    case "sparks":
      c.sparks.enabled = false;
      break;
    default:
      break;
  }
  return c;
}

// ---------------------------------------------------------------------------
// State interface
// ---------------------------------------------------------------------------

interface GanttState {
  // --- Timeline document ---
  timeline: Timeline;

  // --- Playback ---
  isPlaying: boolean;
  currentTime: number;
  loopEnabled: boolean;
  masterVolume: number;
  recordEnabled: boolean;
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setLoopEnabled: (enabled: boolean) => void;
  setMasterVolume: (volume: number) => void;
  setRecordEnabled: (enabled: boolean) => void;

  // --- Selection ---
  selection: GanttSelection;
  selectScene: (sceneId: string | null) => void;
  selectSequence: (sequenceId: string | null) => void;
  selectKeyframes: (keyframeIds: string[]) => void;
  clearSelection: () => void;

  // --- Zoom / Scroll ---
  pixelsPerSecond: number;
  scrollLeft: number;
  snapEnabled: boolean;
  snapInterval: number;
  followPlayhead: boolean;
  trackHeight: number;
  timelineHeight: number;
  timelineExpanded: boolean;
  setPixelsPerSecond: (pps: number) => void;
  setScrollLeft: (px: number) => void;
  setSnapEnabled: (enabled: boolean) => void;
  setSnapInterval: (seconds: number) => void;
  setFollowPlayhead: (enabled: boolean) => void;
  setTrackHeight: (scale: number) => void;
  setTimelineHeight: (px: number) => void;
  toggleTimelineExpanded: () => void;

  // --- Track management ---
  sceneTrackCount: number;
  audioTrackCount: number;
  mutedAudioTracks: Set<number>;
  addSceneTrack: () => void;
  removeSceneTrack: (index: number) => void;
  addAudioTrack: () => void;
  removeAudioTrack: (index: number) => void;
  toggleAudioTrackMuted: (index: number) => void;

  // --- Scene CRUD ---
  addScene: (config: ConfigType, name?: string, trackIndex?: number) => string;
  updateScene: (sceneId: string, patch: Partial<Pick<TimelineScene, "name" | "startTime" | "duration" | "color" | "collapsed" | "hidden" | "trackIndex" | "baseConfig">>) => void;
  removeScene: (sceneId: string) => void;
  reorderScene: (sceneId: string, newStartTime: number) => void;

  // --- Sequence CRUD ---
  addSequence: (sceneId: string, sequence: Omit<Sequence, "id">) => string;
  updateSequence: (sceneId: string, sequenceId: string, patch: Partial<Omit<Sequence, "id">>) => void;
  removeSequence: (sceneId: string, sequenceId: string) => void;
  reorderSequences: (sceneId: string, orderedIds: string[]) => void;

  // --- Keyframe CRUD ---
  addKeyframe: (sceneId: string, sequenceId: string, keyframe: Omit<Keyframe, "id">) => string;
  updateKeyframe: (sceneId: string, sequenceId: string, keyframeId: string, patch: Partial<Omit<Keyframe, "id">>) => void;
  removeKeyframe: (sceneId: string, sequenceId: string, keyframeId: string) => void;

  // --- Transition CRUD ---
  addTransition: (transition: Omit<SceneTransition, "id">) => string;
  updateTransition: (transitionId: string, patch: Partial<Omit<SceneTransition, "id">>) => void;
  removeTransition: (transitionId: string) => void;

  // --- Sidebar item CRUD ---
  addSidebarItem: (sceneId: string, type: SidebarItemType) => string;
  removeSidebarItem: (sceneId: string, itemId: string) => void;

  // --- Asset registry ---
  registerAsset: (entry: AssetEntry) => void;
  removeAsset: (assetId: string) => void;

  // --- Audio clip CRUD ---
  addAudioClip: (clip: Omit<AudioClip, "id">) => string;
  updateAudioClip: (clipId: string, patch: Partial<Omit<AudioClip, "id">>) => void;
  removeAudioClip: (clipId: string) => void;

  // --- Computed ---
  getSelectedScene: () => TimelineScene | undefined;
  getTimelineDuration: () => number;
  getSceneAt: (time: number) => TimelineScene | undefined;
  snapTime: (time: number) => number;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const _persisted = loadPersistedProject();

export const useGanttStore = create<GanttState>((set, get) => ({
  // --- Timeline document ---
  timeline: _persisted?.timeline ?? {
    assets: {},
    scenes: [],
    transitions: [],
    audioClips: [],
  },

  // --- Playback ---
  isPlaying: false,
  currentTime: 0,
  loopEnabled: false,
  masterVolume: 1,
  recordEnabled: false,
  setPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setLoopEnabled: (enabled) => set({ loopEnabled: enabled }),
  setMasterVolume: (volume) => set({ masterVolume: Math.max(0, Math.min(1, volume)) }),
  setRecordEnabled: (enabled) => set({ recordEnabled: enabled }),

  // --- Selection ---
  // Shared empty array to avoid new reference on every scene/sequence selection
  selection: { sceneId: null, sequenceId: null, keyframeIds: _emptyKfIds },
  selectScene: (sceneId) =>
    set({ selection: { sceneId, sequenceId: null, keyframeIds: _emptyKfIds } }),
  selectSequence: (sequenceId) =>
    set((s) => ({
      selection: { ...s.selection, sequenceId, keyframeIds: _emptyKfIds },
    })),
  selectKeyframes: (keyframeIds) =>
    set((s) => ({ selection: { ...s.selection, keyframeIds } })),
  clearSelection: () =>
    set({ selection: { sceneId: null, sequenceId: null, keyframeIds: _emptyKfIds } }),

  // --- Zoom / Scroll ---
  pixelsPerSecond: 50,
  scrollLeft: 0,
  snapEnabled: true,
  snapInterval: 0.01,
  followPlayhead: true,
  trackHeight: 1,
  timelineHeight: 200,
  timelineExpanded: false,
  setPixelsPerSecond: (pps) => set({ pixelsPerSecond: Math.max(10, Math.min(500, pps)) }),
  setScrollLeft: (px) => set({ scrollLeft: Math.max(0, px) }),
  setSnapEnabled: (enabled) => set({ snapEnabled: enabled }),
  setSnapInterval: (seconds) => set({ snapInterval: Math.max(0.1, seconds) }),
  setFollowPlayhead: (enabled) => set({ followPlayhead: enabled }),
  setTrackHeight: (scale) => set({ trackHeight: Math.max(0.5, Math.min(3, scale)) }),
  setTimelineHeight: (px) => set({ timelineHeight: Math.max(100, Math.min(1000, px)) }),
  toggleTimelineExpanded: () => set((s) => {
    if (s.timelineExpanded) {
      return { timelineExpanded: false, timelineHeight: 200 };
    }
    const halfScreen = Math.round(window.innerHeight / 2);
    return { timelineExpanded: true, timelineHeight: halfScreen };
  }),

  // --- Track management ---
  sceneTrackCount: _persisted?.sceneTrackCount ?? 1,
  audioTrackCount: _persisted?.audioTrackCount ?? 1,
  mutedAudioTracks: new Set<number>(),

  addSceneTrack: () => set((s) => ({ sceneTrackCount: s.sceneTrackCount + 1 })),
  removeSceneTrack: (index) => {
    const { sceneTrackCount, timeline } = get();
    if (sceneTrackCount <= 1) return;
    if (timeline.scenes.some((s) => s.trackIndex === index)) return;
    set({
      sceneTrackCount: sceneTrackCount - 1,
      timeline: {
        ...timeline,
        scenes: timeline.scenes.map((s) =>
          s.trackIndex > index ? { ...s, trackIndex: s.trackIndex - 1 } : s,
        ),
      },
    });
  },

  toggleAudioTrackMuted: (index) => {
    const next = new Set(get().mutedAudioTracks);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    set({ mutedAudioTracks: next });
  },

  addAudioTrack: () => set((s) => ({ audioTrackCount: s.audioTrackCount + 1 })),
  removeAudioTrack: (index) => {
    const { audioTrackCount, timeline } = get();
    if (audioTrackCount <= 1) return;
    if (timeline.audioClips.some((c) => c.trackIndex === index)) return;
    set({
      audioTrackCount: audioTrackCount - 1,
      timeline: {
        ...timeline,
        audioClips: timeline.audioClips.map((c) =>
          c.trackIndex > index ? { ...c, trackIndex: c.trackIndex - 1 } : c,
        ),
      },
    });
  },

  // --- Scene CRUD ---

  addScene: (config, name, trackIndex) => {
    const { timeline } = get();
    const id = generateId("scene");
    const ti = trackIndex ?? 0;
    const trackScenes = timeline.scenes
      .filter((s) => s.trackIndex === ti)
      .sort((a, b) => a.startTime - b.startTime);
    const lastScene = trackScenes[trackScenes.length - 1];
    const startTime = lastScene
      ? lastScene.startTime + lastScene.duration
      : 0;

    const scene: TimelineScene = {
      id,
      name: name ?? `Scene ${timeline.scenes.length + 1}`,
      startTime,
      duration: 30,
      color: pickSceneColor(timeline.scenes.length),
      collapsed: true,
      hidden: false,
      trackIndex: ti,
      baseConfig: stripConfigToBackgroundOnly(config),
      sequences: [],
      sidebarItems: [{ id: "bg-0", type: "background" }],
    };

    set({
      timeline: {
        ...timeline,
        scenes: [...timeline.scenes, scene],
      },
    });
    return id;
  },

  updateScene: (sceneId, patch) => {
    const { timeline } = get();
    set({
      timeline: {
        ...timeline,
        scenes: timeline.scenes.map((s) =>
          s.id === sceneId ? { ...s, ...patch } : s,
        ),
      },
    });
  },

  removeScene: (sceneId) => {
    const { timeline, selection } = get();
    const updates: Partial<GanttState> = {
      timeline: {
        ...timeline,
        scenes: timeline.scenes.filter((s) => s.id !== sceneId),
        transitions: timeline.transitions.filter(
          (t) => t.fromSceneId !== sceneId && t.toSceneId !== sceneId,
        ),
      },
    };
    if (selection.sceneId === sceneId) {
      updates.selection = { sceneId: null, sequenceId: null, keyframeIds: _emptyKfIds };
    }
    set(updates);
  },

  reorderScene: (sceneId, newStartTime) => {
    const { timeline } = get();
    const snapped = get().snapTime(newStartTime);
    set({
      timeline: {
        ...timeline,
        scenes: timeline.scenes.map((s) =>
          s.id === sceneId ? { ...s, startTime: Math.max(0, snapped) } : s,
        ),
      },
    });
  },

  // --- Sequence CRUD ---

  addSequence: (sceneId, seq) => {
    const { timeline } = get();
    const id = generateId("seq");
    set({
      timeline: {
        ...timeline,
        scenes: timeline.scenes.map((s) =>
          s.id === sceneId
            ? { ...s, sequences: [...s.sequences, { ...seq, id }] }
            : s,
        ),
      },
    });
    return id;
  },

  updateSequence: (sceneId, sequenceId, patch) => {
    const { timeline } = get();
    set({
      timeline: {
        ...timeline,
        scenes: timeline.scenes.map((s) =>
          s.id === sceneId
            ? {
                ...s,
                sequences: s.sequences.map((seq) =>
                  seq.id === sequenceId ? { ...seq, ...patch } : seq,
                ),
              }
            : s,
        ),
      },
    });
  },

  removeSequence: (sceneId, sequenceId) => {
    const { timeline } = get();
    set({
      timeline: {
        ...timeline,
        scenes: timeline.scenes.map((s) =>
          s.id === sceneId
            ? { ...s, sequences: s.sequences.filter((seq) => seq.id !== sequenceId) }
            : s,
        ),
      },
    });
  },

  reorderSequences: (sceneId, orderedIds) => {
    const { timeline } = get();
    set({
      timeline: {
        ...timeline,
        scenes: timeline.scenes.map((s) => {
          if (s.id !== sceneId) return s;
          const byId = new Map(s.sequences.map((seq) => [seq.id, seq]));
          const reordered = orderedIds
            .map((id) => byId.get(id))
            .filter((seq): seq is Sequence => seq !== undefined);
          return { ...s, sequences: reordered };
        }),
      },
    });
  },

  // --- Keyframe CRUD ---

  addKeyframe: (sceneId, sequenceId, kf) => {
    const { timeline } = get();
    const id = generateId("kf");
    set({
      timeline: {
        ...timeline,
        scenes: timeline.scenes.map((s) =>
          s.id === sceneId
            ? {
                ...s,
                sequences: s.sequences.map((seq) =>
                  seq.id === sequenceId
                    ? { ...seq, keyframes: [...seq.keyframes, { ...kf, id }] }
                    : seq,
                ),
              }
            : s,
        ),
      },
    });
    return id;
  },

  updateKeyframe: (sceneId, sequenceId, keyframeId, patch) => {
    const { timeline } = get();
    set({
      timeline: {
        ...timeline,
        scenes: timeline.scenes.map((s) =>
          s.id === sceneId
            ? {
                ...s,
                sequences: s.sequences.map((seq) =>
                  seq.id === sequenceId
                    ? {
                        ...seq,
                        keyframes: seq.keyframes.map((kf) =>
                          kf.id === keyframeId ? { ...kf, ...patch } : kf,
                        ),
                      }
                    : seq,
                ),
              }
            : s,
        ),
      },
    });
  },

  removeKeyframe: (sceneId, sequenceId, keyframeId) => {
    const { timeline } = get();
    set({
      timeline: {
        ...timeline,
        scenes: timeline.scenes.map((s) =>
          s.id === sceneId
            ? {
                ...s,
                sequences: s.sequences.map((seq) =>
                  seq.id === sequenceId
                    ? { ...seq, keyframes: seq.keyframes.filter((kf) => kf.id !== keyframeId) }
                    : seq,
                ),
              }
            : s,
        ),
      },
    });
  },

  // --- Transition CRUD ---

  addTransition: (t) => {
    const { timeline } = get();
    const id = generateId("tr");
    set({
      timeline: {
        ...timeline,
        transitions: [...timeline.transitions, { ...t, id }],
      },
    });
    return id;
  },

  updateTransition: (transitionId, patch) => {
    const { timeline } = get();
    set({
      timeline: {
        ...timeline,
        transitions: timeline.transitions.map((t) =>
          t.id === transitionId ? { ...t, ...patch } : t,
        ),
      },
    });
  },

  removeTransition: (transitionId) => {
    const { timeline } = get();
    set({
      timeline: {
        ...timeline,
        transitions: timeline.transitions.filter((t) => t.id !== transitionId),
      },
    });
  },

  // --- Sidebar item CRUD ---

  addSidebarItem: (sceneId, type) => {
    const { timeline } = get();
    const scene = timeline.scenes.find((s) => s.id === sceneId);
    if (!scene) return "";

    const SINGLE_TYPES: SidebarItemType[] = [
      "shader", "background", "vumeters", "composer", "sparks", "progressbar", "timecode",
    ];

    // For single-instance types, no-op if already present
    if (SINGLE_TYPES.includes(type) && scene.sidebarItems.some((i) => i.type === type)) {
      return scene.sidebarItems.find((i) => i.type === type)!.id;
    }

    const itemId = generateId("si");
    const newItem: SidebarItem = { id: itemId, type };

    // Enable the relevant config section
    let updatedConfig = enableConfigSection(scene.baseConfig, type);
    if (type === "text") {
      const configKey = `text_${Date.now()}`;
      newItem.configKey = configKey;
      updatedConfig = structuredClone(updatedConfig);
      const texts = (updatedConfig.texts ?? {}) as Record<string, TextType>;
      texts[configKey] = structuredClone(DEFAULT_TEXT);
      (updatedConfig as Record<string, unknown>).texts = texts;
    } else if (type === "image") {
      const configKey = `image_${Date.now()}`;
      newItem.configKey = configKey;
      updatedConfig = structuredClone(updatedConfig);
      const images = (updatedConfig.images ?? {}) as Record<string, ImageType>;
      images[configKey] = structuredClone(DEFAULT_IMAGE);
      (updatedConfig as Record<string, unknown>).images = images;
    }

    set({
      timeline: {
        ...timeline,
        scenes: timeline.scenes.map((s) =>
          s.id === sceneId
            ? { ...s, sidebarItems: [...s.sidebarItems, newItem], baseConfig: updatedConfig }
            : s,
        ),
      },
    });
    return itemId;
  },

  removeSidebarItem: (sceneId, itemId) => {
    const { timeline } = get();
    const scene = timeline.scenes.find((s) => s.id === sceneId);
    if (!scene) return;

    const item = scene.sidebarItems.find((i) => i.id === itemId);
    if (!item) return;

    let updatedConfig = structuredClone(scene.baseConfig);

    if (item.type === "text" && item.configKey) {
      const texts = { ...(updatedConfig.texts as Record<string, TextType> ?? {}) };
      delete texts[item.configKey];
      (updatedConfig as Record<string, unknown>).texts = texts;
    } else if (item.type === "image" && item.configKey) {
      const images = { ...(updatedConfig.images as Record<string, ImageType> ?? {}) };
      delete images[item.configKey];
      (updatedConfig as Record<string, unknown>).images = images;
    } else {
      // Single-instance type: disable the section
      updatedConfig = disableConfigSection(updatedConfig, item.type);
    }

    set({
      timeline: {
        ...timeline,
        scenes: timeline.scenes.map((s) =>
          s.id === sceneId
            ? {
                ...s,
                sidebarItems: s.sidebarItems.filter((i) => i.id !== itemId),
                baseConfig: updatedConfig,
              }
            : s,
        ),
      },
    });
  },

  // --- Asset registry ---

  registerAsset: (entry) => {
    const { timeline } = get();
    set({
      timeline: {
        ...timeline,
        assets: { ...timeline.assets, [entry.id]: entry },
      },
    });
  },

  removeAsset: (assetId) => {
    const { timeline } = get();
    const { [assetId]: _removed, ...rest } = timeline.assets;
    set({
      timeline: { ...timeline, assets: rest },
    });
  },

  // --- Audio clip CRUD ---

  addAudioClip: (clip) => {
    const { timeline } = get();
    const id = generateId("audio");
    set({
      timeline: {
        ...timeline,
        audioClips: [...timeline.audioClips, { ...clip, id }],
      },
    });
    return id;
  },

  updateAudioClip: (clipId, patch) => {
    const { timeline } = get();
    set({
      timeline: {
        ...timeline,
        audioClips: timeline.audioClips.map((c) =>
          c.id === clipId ? { ...c, ...patch } : c,
        ),
      },
    });
  },

  removeAudioClip: (clipId) => {
    const { timeline } = get();
    set({
      timeline: {
        ...timeline,
        audioClips: timeline.audioClips.filter((c) => c.id !== clipId),
      },
    });
  },

  // --- Computed ---

  getSelectedScene: () => {
    const { timeline, selection } = get();
    if (!selection.sceneId) return undefined;
    return timeline.scenes.find((s) => s.id === selection.sceneId);
  },

  getTimelineDuration: () => {
    const { timeline } = get();
    let max = 0;
    for (const scene of timeline.scenes) {
      const end = scene.startTime + scene.duration;
      if (end > max) max = end;
    }
    for (const clip of timeline.audioClips) {
      const end = clip.startTime + clip.duration;
      if (end > max) max = end;
    }
    if (max === 0) return 60;
    // Add 10s padding
    return max + 10;
  },

  getSceneAt: (time) => {
    const { timeline } = get();
    let best: TimelineScene | undefined;
    for (const s of timeline.scenes) {
      if (s.hidden) continue;
      if (time >= s.startTime && time < s.startTime + s.duration) {
        if (
          !best ||
          s.trackIndex < best.trackIndex ||
          (s.trackIndex === best.trackIndex && s.startTime > best.startTime)
        ) {
          best = s;
        }
      }
    }
    return best;
  },

  snapTime: (time) => {
    const { snapEnabled, snapInterval } = get();
    if (!snapEnabled) return time;
    return Math.round(time / snapInterval) * snapInterval;
  },
}));

// ---------------------------------------------------------------------------
// Auto-save to localStorage (debounced)
// ---------------------------------------------------------------------------

let _saveTimer: ReturnType<typeof setTimeout> | null = null;
let _saveScheduled = false;

useGanttStore.subscribe((state, prev) => {
  // Only save when the persisted data actually changes
  if (
    state.timeline === prev.timeline &&
    state.sceneTrackCount === prev.sceneTrackCount &&
    state.audioTrackCount === prev.audioTrackCount
  ) return;

  // Mark as needing save but debounce aggressively (2s) to avoid
  // structuredClone storms during rapid edits (slider drags, etc.)
  _saveScheduled = true;
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    if (!_saveScheduled) return;
    _saveScheduled = false;
    savePersistedProject(useGanttStore.getState());
  }, 2000);
});
