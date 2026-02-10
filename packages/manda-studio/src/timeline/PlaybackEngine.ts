import type { MandaRenderer } from "@mandafunk/core/MandaRenderer";
import type { ConfigType } from "@mandafunk/config/types";
import type { Timeline } from "./ganttTypes.ts";
import { evaluateTimelineAtTime } from "./evaluator.ts";
import type { MultiAudioEngine } from "@/audio/MultiAudioEngine.ts";

/**
 * PlaybackEngine drives timeline playback outside of React.
 *
 * It runs a RAF loop that:
 * 1. Advances currentTime based on wall-clock delta
 * 2. Evaluates the timeline to find the active scene's config
 * 3. Pushes config to the MandaRenderer directly (60fps)
 * 4. Syncs audio clips via MultiAudioEngine
 * 5. Updates the gantt store's currentTime at ~10fps (for UI playhead)
 */
export class PlaybackEngine {
  private renderer: MandaRenderer | null = null;
  private audioEngine: MultiAudioEngine | null = null;

  private playing = false;
  private currentTime = 0;
  private loopEnabled = false;

  private rafId: number | null = null;
  private lastFrameTime: number | null = null;

  /** Current shader name to detect shader changes. */
  private currentShader: string | undefined;
  /** Flag to avoid overlapping async loadConfig calls. */
  private loadingConfig = false;

  /** Callback to update the gantt store's currentTime. Throttled. */
  private onTimeUpdate: ((time: number) => void) | null = null;
  /** Callback when playback reaches the end. */
  private onPlaybackEnd: (() => void) | null = null;
  /** Callback when the active scene changes. */
  private onSceneChange: ((sceneId: string | null) => void) | null = null;

  /** Last scene id to detect scene transitions. */
  private lastSceneId: string | null = null;

  /** Throttle: only update the store every ~100ms. */
  private lastStoreUpdateTime = 0;
  private static readonly STORE_UPDATE_INTERVAL = 100; // ms

  // -----------------------------------------------------------------------
  // Setup
  // -----------------------------------------------------------------------

  setRenderer(renderer: MandaRenderer | null): void {
    this.renderer = renderer;
  }

  setAudioEngine(engine: MultiAudioEngine | null): void {
    this.audioEngine = engine;
  }

  setOnTimeUpdate(cb: ((time: number) => void) | null): void {
    this.onTimeUpdate = cb;
  }

  setOnPlaybackEnd(cb: (() => void) | null): void {
    this.onPlaybackEnd = cb;
  }

  setOnSceneChange(cb: ((sceneId: string | null) => void) | null): void {
    this.onSceneChange = cb;
  }

  // -----------------------------------------------------------------------
  // Transport
  // -----------------------------------------------------------------------

  play(): void {
    if (this.playing) return;
    this.playing = true;
    this.lastFrameTime = null;
    this.startLoop();
  }

  pause(): void {
    if (!this.playing) return;
    this.playing = false;
    this.stopLoop();
  }

  stop(): void {
    this.playing = false;
    this.stopLoop();
    this.currentTime = 0;
    this.lastSceneId = null;
    this.onTimeUpdate?.(0);
    this.audioEngine?.stopAll();
  }

  seek(time: number): void {
    this.currentTime = Math.max(0, time);
    this.lastFrameTime = null; // reset delta so next frame doesn't jump
    this.onTimeUpdate?.(this.currentTime);
  }

  isPlaying(): boolean {
    return this.playing;
  }

  getCurrentTime(): number {
    return this.currentTime;
  }

  setLoopEnabled(enabled: boolean): void {
    this.loopEnabled = enabled;
  }

  // -----------------------------------------------------------------------
  // RAF loop
  // -----------------------------------------------------------------------

  private startLoop(): void {
    this.stopLoop();

    const tick = (timestamp: number) => {
      if (!this.playing) return;

      // Compute delta
      if (this.lastFrameTime === null) {
        this.lastFrameTime = timestamp;
      }
      const deltaMs = timestamp - this.lastFrameTime;
      this.lastFrameTime = timestamp;

      // Advance time
      this.currentTime += deltaMs / 1000;

      // Schedule next frame before heavy work
      this.rafId = requestAnimationFrame(tick);

      // Evaluate timeline and push to renderer
      this.evaluate();

      // Throttled store update for UI
      if (timestamp - this.lastStoreUpdateTime >= PlaybackEngine.STORE_UPDATE_INTERVAL) {
        this.lastStoreUpdateTime = timestamp;
        this.onTimeUpdate?.(this.currentTime);
      }
    };

    this.rafId = requestAnimationFrame(tick);
  }

  private stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.lastFrameTime = null;
  }

  // -----------------------------------------------------------------------
  // Evaluation
  // -----------------------------------------------------------------------

  /**
   * Evaluate the timeline at currentTime.
   * Must be called with a `timeline` argument, or it reads from the
   * gantt store directly. We pass the timeline in to avoid importing
   * the store here (keeping this class standalone).
   */
  evaluateWithTimeline(timeline: Timeline): void {
    const result = evaluateTimelineAtTime(timeline, this.currentTime);

    // Check end of timeline
    const duration = this.getTimelineDuration(timeline);
    if (this.currentTime >= duration) {
      if (this.loopEnabled) {
        this.currentTime = 0;
        this.lastSceneId = null;
      } else {
        this.playing = false;
        this.stopLoop();
        this.onPlaybackEnd?.();
        return;
      }
    }

    // Scene change detection
    const newSceneId = result.activeScene?.id ?? null;
    if (newSceneId !== this.lastSceneId) {
      this.lastSceneId = newSceneId;
      this.currentShader = undefined; // force shader reload on scene change
      this.onSceneChange?.(newSceneId);
    }

    // Push config to renderer
    if (result.config && this.renderer) {
      this.pushConfigToRenderer(result.config);
    }

    // Sync audio clips
    if (this.audioEngine) {
      this.audioEngine.syncToTime(timeline.audioClips, this.currentTime);
    }
  }

  /** Internal evaluate - reads timeline from the import. */
  private evaluate(): void {
    // We need the timeline - import the store lazily to avoid circular deps
    // The hook that creates this engine will call evaluateWithTimeline instead
  }

  private pushConfigToRenderer(config: ConfigType): void {
    if (!this.renderer) return;

    const shaderChanged = config.scene?.shader !== this.currentShader;

    if (shaderChanged && !this.loadingConfig) {
      this.currentShader = config.scene?.shader;
      this.loadingConfig = true;
      void this.renderer.loadConfig(structuredClone(config)).then(() => {
        this.loadingConfig = false;
      });
    } else if (!shaderChanged && !this.loadingConfig) {
      this.renderer.updateConfig(structuredClone(config));
    }
    // If loadingConfig is true, skip updates until the async load finishes
  }

  private getTimelineDuration(timeline: Timeline): number {
    let max = 0;
    for (const scene of timeline.scenes) {
      const end = scene.startTime + scene.duration;
      if (end > max) max = end;
    }
    for (const clip of timeline.audioClips) {
      const end = clip.startTime + clip.duration;
      if (end > max) max = end;
    }
    return max;
  }

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------

  dispose(): void {
    this.stop();
    this.renderer = null;
    this.audioEngine = null;
    this.onTimeUpdate = null;
    this.onPlaybackEnd = null;
    this.onSceneChange = null;
  }
}
