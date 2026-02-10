import type { ConfigType } from "@mandafunk/config/types";
import type { Timeline, TimelineScene, Sequence, Keyframe } from "./ganttTypes.ts";
import { applyEasing, interpolateValue } from "./interpolation.ts";

/**
 * Result of evaluating the timeline at a given time.
 */
export interface EvaluationResult {
  /** The resolved config to apply to the renderer. null if no scene is active. */
  config: ConfigType | null;
  /** The active scene (if any). */
  activeScene: TimelineScene | null;
}

/**
 * Find the scene that is active at the given absolute time.
 * If multiple scenes overlap, the one with the latest startTime wins.
 */
function findActiveScene(
  scenes: TimelineScene[],
  time: number,
): TimelineScene | null {
  let best: TimelineScene | null = null;
  for (const scene of scenes) {
    if (time >= scene.startTime && time < scene.startTime + scene.duration) {
      if (!best || scene.startTime > best.startTime) {
        best = scene;
      }
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Dot-path utilities
// ---------------------------------------------------------------------------

/**
 * Set a nested value on an object using a dot-separated path.
 * Mutates the object in place (caller should pass a clone).
 */
function setByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(".");
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (current[key] == null || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
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

    // Before first keyframe: use first keyframe's value
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
 */
function evaluateScene(scene: TimelineScene, time: number): ConfigType {
  const config = structuredClone(scene.baseConfig) as ConfigType & Record<string, unknown>;

  if (scene.sequences.length === 0) return config;

  // Time relative to scene start
  const sceneLocalTime = time - scene.startTime;

  // Sort sequences by order for deterministic layering
  const sorted = [...scene.sequences].sort((a, b) => a.order - b.order);

  for (const seq of sorted) {
    // Check if sequence is active at this time
    if (
      sceneLocalTime < seq.startOffset ||
      sceneLocalTime >= seq.startOffset + seq.duration
    ) {
      continue;
    }

    const sequenceTime = sceneLocalTime - seq.startOffset;

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
  const activeScene = findActiveScene(timeline.scenes, time);

  if (!activeScene) {
    return { config: null, activeScene: null };
  }

  const config = evaluateScene(activeScene, time);

  return { config, activeScene };
}
