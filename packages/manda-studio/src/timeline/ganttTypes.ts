import type { ConfigType } from "@mandafunk/config/types";

// ---------------------------------------------------------------------------
// Asset Registry
// ---------------------------------------------------------------------------

export type AssetType = "image" | "audio" | "video" | "font";

export interface AssetEntry {
  /** Stable unique identifier (generated once, persisted across sessions). */
  id: string;
  /** Kind of asset. */
  type: AssetType;
  /** Original file name. */
  name: string;
  /** MIME type (e.g. "image/png", "audio/mpeg"). */
  mimeType: string;
  /** Relative path inside an export ZIP (e.g. "assets/img-abc123.png"). */
  filePath?: string;
  /** IndexedDB library ID (internal to the studio). */
  libraryId?: number;
  /** Blob URL created at runtime – never persisted. */
  runtimeUrl?: string;
  /** Optional metadata. */
  meta?: {
    width?: number;
    height?: number;
    duration?: number;
  };
}

// ---------------------------------------------------------------------------
// Easing
// ---------------------------------------------------------------------------

export type EasingType =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "elasticIn"
  | "elasticOut"
  | "elasticInOut"
  | "bounceIn"
  | "bounceOut"
  | "bounceInOut"
  | "cubicBezier";

export interface EasingConfig {
  type: EasingType;
  /** Control points for cubicBezier: [x1, y1, x2, y2] */
  bezierPoints?: [number, number, number, number];
}

// ---------------------------------------------------------------------------
// Keyframe
// ---------------------------------------------------------------------------

export interface Keyframe {
  id: string;
  /** Time relative to the parent sequence start (seconds). */
  time: number;
  /** Dot-path into the sequence's baseConfig, e.g. "bloom.strength". */
  path: string;
  /** Value at this keyframe. */
  value: number | string | boolean;
  /** Easing to interpolate FROM this keyframe TO the next one. */
  easing: EasingConfig;
}

// ---------------------------------------------------------------------------
// Sequence
// ---------------------------------------------------------------------------

export type SequenceType =
  | "shader"
  | "vumeters"
  | "images"
  | "texts"
  | "composer";

export interface Sequence {
  id: string;
  type: SequenceType;
  label: string;
  /** Offset from the parent scene's startTime (seconds). */
  startOffset: number;
  /** Duration in seconds. */
  duration: number;
  /** Z-order for rendering priority within the scene. */
  order: number;
  /** Subset of ConfigType relevant to this sequence type. */
  baseConfig: Record<string, unknown>;
  keyframes: Keyframe[];
}

// ---------------------------------------------------------------------------
// Sidebar items (per-scene accordion system)
// ---------------------------------------------------------------------------

export type SidebarItemType =
  | "shader"
  | "background"
  | "vumeters"
  | "composer"
  | "sparks"
  | "progressbar"
  | "timecode"
  | "text"
  | "image";

export interface SidebarItem {
  id: string;
  type: SidebarItemType;
  /** For multi-instance types (text/image): key into config.texts / config.images Record */
  configKey?: string;
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

export interface TimelineScene {
  id: string;
  name: string;
  /** Absolute start time on the timeline (seconds). */
  startTime: number;
  /** Duration in seconds. */
  duration: number;
  /** Display color for the block. */
  color: string;
  /** Whether the scene's sequences are collapsed in the UI. */
  collapsed: boolean;
  /** Whether this scene is hidden (not rendered). */
  hidden: boolean;
  /** Track index for multi-track layout (0 = first track). */
  trackIndex: number;
  /** Full configuration for this scene. */
  baseConfig: ConfigType;
  /** Internal sequences (shader, vumeters, etc.). */
  sequences: Sequence[];
  /** Sidebar accordion items for this scene. */
  sidebarItems: SidebarItem[];
}

// ---------------------------------------------------------------------------
// Transition
// ---------------------------------------------------------------------------

export type TransitionType = "fade" | "crossfade" | "wipe" | "dissolve";

export interface SceneTransition {
  id: string;
  fromSceneId: string;
  toSceneId: string;
  /** Duration in seconds. */
  duration: number;
  type: TransitionType;
  easing: EasingConfig;
}

// ---------------------------------------------------------------------------
// Audio clip
// ---------------------------------------------------------------------------

export interface AudioClip {
  id: string;
  name: string;
  /** URL or blob URL of the audio file. */
  url: string;
  /** Absolute start time on the timeline (seconds). */
  startTime: number;
  /** Duration in seconds (playback length, not file length). */
  duration: number;
  /** Trim from the start of the audio file (seconds). */
  trimStart: number;
  /** Volume multiplier (0 to 1). */
  volume: number;
  /** Whether this clip is muted. */
  muted: boolean;
  /** Track index for multi-track layout (0 = first track). */
  trackIndex: number;
  /** @deprecated Use assetId instead. Library audio ID for persistence across sessions. */
  libraryId?: number;
  /** Reference to an asset in the timeline's asset registry. */
  assetId?: string;
}

// ---------------------------------------------------------------------------
// Timeline (root document)
// ---------------------------------------------------------------------------

export interface Timeline {
  /** Centralised asset registry – every image/audio/video referenced by scenes or clips. */
  assets: Record<string, AssetEntry>;
  scenes: TimelineScene[];
  transitions: SceneTransition[];
  audioClips: AudioClip[];
}

// ---------------------------------------------------------------------------
// Selection state
// ---------------------------------------------------------------------------

export interface GanttSelection {
  sceneId: string | null;
  sequenceId: string | null;
  keyframeIds: string[];
  /** Id of the keyframe currently open in the editor popover (only one at a time). */
  editingKeyframeId: string | null;
}
