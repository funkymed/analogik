import type { ConfigType } from "@mandafunk/config/types";
import type { Timeline, TimelineScene, Sequence, Keyframe } from "./ganttTypes.ts";
import { applyEasing, interpolateValue } from "./interpolation.ts";

/**
 * A single evaluated layer: one active scene with its resolved config.
 */
export interface EvaluatedLayer {
  config: ConfigType;
  scene: TimelineScene;
}

/**
 * Result of evaluating the timeline at a given time.
 */
export interface EvaluationResult {
  /** The resolved config to apply to the renderer. null if no scene is active. */
  config: ConfigType | null;
  /** The active scene (if any). */
  activeScene: TimelineScene | null;
  /** All active layers sorted by priority (lowest trackIndex first). */
  layers: EvaluatedLayer[];
}

/**
 * Find the scene that is active at the given absolute time.
 * If multiple scenes overlap, lower trackIndex wins (higher priority).
 * Within the same track, latest startTime wins.
 */
/**
 * Return all scenes active at the given time, sorted by priority
 * (lower trackIndex first, then latest startTime first within the same track).
 */
function findActiveScenesAtTime(
  scenes: TimelineScene[],
  time: number,
): TimelineScene[] {
  const candidates: TimelineScene[] = [];
  for (const scene of scenes) {
    if (time >= scene.startTime && time < scene.startTime + scene.duration) {
      candidates.push(scene);
    }
  }
  candidates.sort((a, b) => {
    if (a.trackIndex !== b.trackIndex) return a.trackIndex - b.trackIndex;
    return b.startTime - a.startTime;
  });
  return candidates;
}

// ---------------------------------------------------------------------------
// Dot-path utilities
// ---------------------------------------------------------------------------

/**
 * Set a nested value on an object using a dot-separated path.
 * Shallow-clones each intermediate object along the path so the
 * original baseConfig is never mutated.
 */
function setByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(".");
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const child = current[key];
    if (child == null || typeof child !== "object") {
      const fresh: Record<string, unknown> = {};
      current[key] = fresh;
      current = fresh;
    } else {
      // Shallow clone this level so we don't mutate the original
      const cloned = { ...(child as Record<string, unknown>) };
      current[key] = cloned;
      current = cloned;
    }
  }
  current[parts[parts.length - 1]] = value;
}

// ---------------------------------------------------------------------------
// Keyframe interpolation
// ---------------------------------------------------------------------------

/**
 * For a given sequence and a time relative to the sequence start,
 * evaluate all keyframe paths and return a map of path -> interpolated value.
 */
function evaluateKeyframes(
  keyframes: Keyframe[],
  sequenceTime: number,
): Map<string, number | string | boolean> {
  if (keyframes.length === 0) return new Map();

  // Group keyframes by path
  const byPath = new Map<string, Keyframe[]>();
  for (const kf of keyframes) {
    let list = byPath.get(kf.path);
    if (!list) {
      list = [];
      byPath.set(kf.path, list);
    }
    list.push(kf);
  }

  const result = new Map<string, number | string | boolean>();

  for (const [path, kfs] of byPath) {
    // Sort by time
    kfs.sort((a, b) => a.time - b.time);

    // Before first keyframe: hold first keyframe's value
    if (sequenceTime <= kfs[0].time) {
      result.set(path, kfs[0].value);
      continue;
    }

    // After last keyframe: use last keyframe's value
    if (sequenceTime >= kfs[kfs.length - 1].time) {
      result.set(path, kfs[kfs.length - 1].value);
      continue;
    }

    // Find the two surrounding keyframes
    for (let i = 0; i < kfs.length - 1; i++) {
      const a = kfs[i];
      const b = kfs[i + 1];
      if (sequenceTime >= a.time && sequenceTime <= b.time) {
        const span = b.time - a.time;
        const rawT = span > 0 ? (sequenceTime - a.time) / span : 0;
        const easedT = applyEasing(a.easing, rawT);
        result.set(path, interpolateValue(a.value, b.value, easedT));
        break;
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Scene evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluate a scene at a given absolute time, applying active sequences
 * with their keyframes on top of the scene's baseConfig.
 * Returns null if the time is outside the scene range.
 */
export function evaluateSceneAtTime(scene: TimelineScene, time: number): ConfigType | null {
  const sceneEnd = scene.startTime + scene.duration;
  if (time < scene.startTime || time >= sceneEnd) {
    // Playhead outside scene — still return baseConfig so the UI
    // shows the scene's config when selected.
    return scene.baseConfig;
  }
  return evaluateScene(scene, time);
}

function evaluateScene(scene: TimelineScene, time: number): ConfigType {
  // Fast path: when no sequences exist, no mutations are needed,
  // so we can return the baseConfig directly. The renderer clones internally.
  if (scene.sequences.length === 0) return scene.baseConfig;

  // Time relative to scene start
  const sceneLocalTime = time - scene.startTime;

  // Sequences are assumed to be stored in order (no sort needed at 60fps).
  // Collect only active sequences to avoid cloning when none are active.
  const activeSeqs: { seq: Sequence; sequenceTime: number }[] = [];
  for (const seq of scene.sequences) {
    if (
      sceneLocalTime < seq.startOffset ||
      sceneLocalTime >= seq.startOffset + seq.duration
    ) {
      continue;
    }
    activeSeqs.push({ seq, sequenceTime: sceneLocalTime - seq.startOffset });
  }

  // No active sequences: return baseConfig directly (renderer clones internally).
  if (activeSeqs.length === 0) return scene.baseConfig;

  // Shallow clone top-level + deep clone only the mutated sub-sections.
  // Much cheaper than structuredClone of the entire config on every frame.
  const config = { ...scene.baseConfig } as ConfigType & Record<string, unknown>;

  for (const { seq, sequenceTime } of activeSeqs) {
    // Apply sequence's baseConfig overrides
    applyBaseConfig(config, seq);

    // Apply keyframe interpolations
    const interpolated = evaluateKeyframes(seq.keyframes, sequenceTime);
    for (const [path, value] of interpolated) {
      setByPath(config, path, value);
    }
  }

  return config;
}

/**
 * Apply a sequence's baseConfig values onto the config.
 * The sequence baseConfig is a flat Record matching the sequence type's
 * section in ConfigType (e.g. composer.bloom.strength).
 */
function applyBaseConfig(
  config: Record<string, unknown>,
  seq: Sequence,
): void {
  for (const [path, value] of Object.entries(seq.baseConfig)) {
    setByPath(config, path, value);
  }
}

// ---------------------------------------------------------------------------
// Main evaluator
// ---------------------------------------------------------------------------

/**
 * Evaluate the timeline at a given absolute time.
 * Returns the active scene's config with sequences and keyframes applied.
 */
export function evaluateTimelineAtTime(
  timeline: Timeline,
  time: number,
): EvaluationResult {
  const candidates = findActiveScenesAtTime(timeline.scenes, time);

  // Evaluate ALL visible candidates to build the layers array
  const layers: EvaluatedLayer[] = [];
  for (const scene of candidates) {
    const config = evaluateScene(scene, time);
    if (config.scene?.show === false) continue;
    layers.push({ config, scene });
  }

  // Primary = first layer (highest priority); backward-compat fields
  const primary = layers[0] ?? null;
  return {
    config: primary?.config ?? null,
    activeScene: primary?.scene ?? null,
    layers,
  };
}
