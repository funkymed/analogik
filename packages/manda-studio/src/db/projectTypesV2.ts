/**
 * @module projectTypesV2
 *
 * v2.0 project export format types for manda-studio.
 *
 * Key differences from v1.0:
 * - Diff-only configs (only non-default values serialized)
 * - Deduplicated assets with ZIP-relative file paths
 * - Compact keyframe format (t/p/v/e instead of time/path/value/easing)
 * - Short field names (start/dur/track instead of startTime/duration/trackIndex)
 * - No UI state (collapsed, hidden, sidebarItems omitted)
 * - Linear easing omitted from keyframes (it is the default)
 */

import type { ConfigType } from "@mandafunk/config/types";
import type { SequenceType, TransitionType, EasingConfig } from "@/timeline/ganttTypes.ts";

// ---------------------------------------------------------------------------
// Top-level export envelope
// ---------------------------------------------------------------------------

/** Root object of a v2.0 `.manda` manifest. */
export interface ProjectExportV2 {
  version: "2.0";
  exportedAt: string;
  /** Hash of `configDefault` at export time -- import can warn on mismatch. */
  defaultsHash?: string;
  projects: ProjectV2[];
}

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------

export interface ProjectV2 {
  name: string;
  id?: number;
  createdAt: string;
  updatedAt: string;
  /** Track counts: scene tracks and audio tracks. */
  tracks: { scene: number; audio: number };
  /** Deduplicated asset registry. Key = assetId. */
  assets: Record<string, AssetEntryV2>;
  scenes: SceneV2[];
  audioClips: AudioClipV2[];
  transitions?: TransitionV2[];
}

// ---------------------------------------------------------------------------
// Asset
// ---------------------------------------------------------------------------

export interface AssetEntryV2 {
  type: "image" | "audio" | "video" | "font";
  /** Original file name (e.g. "robot2.jpg"). */
  name: string;
  /** MIME type (e.g. "image/jpeg"). */
  mime: string;
  /** Relative path inside the ZIP (e.g. "assets/robot2.jpg"). */
  file: string;
  /** Optional metadata. */
  meta?: { w?: number; h?: number; dur?: number };
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

export interface SceneV2 {
  id: string;
  name: string;
  /** Absolute start time on the timeline (seconds). */
  start: number;
  /** Duration in seconds. */
  dur: number;
  /** Track index (default 0, omitted when 0). */
  track?: number;
  /** Display color override (auto-derived from index if omitted). */
  color?: string;
  /** Diff-only config: only keys that differ from configDefault. Deep-merged on import. */
  config?: Partial<ConfigType>;
  /** Sequences with at least one keyframe. Empty sequences are stripped at export. */
  sequences?: SequenceV2[];
}

// ---------------------------------------------------------------------------
// Sequence
// ---------------------------------------------------------------------------

export interface SequenceV2 {
  id: string;
  type: SequenceType;
  /** Label (omitted when same as type). */
  label?: string;
  /** Offset from the parent scene start (seconds). Default 0. */
  startOffset?: number;
  /** Duration in seconds. Default: parent scene duration. */
  dur?: number;
  /** Z-order for rendering priority. Default 0. */
  order?: number;
  keyframes: KeyframeV2[];
}

// ---------------------------------------------------------------------------
// Keyframe
// ---------------------------------------------------------------------------

export interface KeyframeV2 {
  /** Time relative to the sequence start (seconds). */
  t: number;
  /** Dot-path into the config (e.g. "scene.brightness"). */
  p: string;
  /** Value at this keyframe. */
  v: number | string | boolean;
  /** Easing config. Omitted when linear (the default). */
  e?: EasingConfig;
}

// ---------------------------------------------------------------------------
// Audio clip
// ---------------------------------------------------------------------------

export interface AudioClipV2 {
  id: string;
  /** Reference to an asset in the project's asset registry. */
  assetId: string;
  /** Absolute start time on the timeline (seconds). */
  start: number;
  /** Duration in seconds. */
  dur: number;
  /** Trim from the start of the audio file (seconds). Default 0. */
  trimStart?: number;
  /** Volume multiplier (0-1). Default 1. */
  volume?: number;
  /** Whether this clip is muted. Default false. */
  muted?: boolean;
  /** Track index. Default 0. */
  track?: number;
}

// ---------------------------------------------------------------------------
// Transition
// ---------------------------------------------------------------------------

export interface TransitionV2 {
  id: string;
  fromSceneId: string;
  toSceneId: string;
  /** Duration in seconds. */
  dur: number;
  type: TransitionType;
  /** Easing config. Omitted when linear (the default). */
  easing?: EasingConfig;
}
