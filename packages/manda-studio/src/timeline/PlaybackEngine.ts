import type { MandaRenderer } from "@mandafunk/core/MandaRenderer";
import type { ConfigType } from "@mandafunk/config/types";
import type { Timeline } from "./ganttTypes.ts";
import { evaluateTimelineAtTime } from "./evaluator.ts";
import type { MultiAudioEngine } from "@/audio/MultiAudioEngine.ts";

/**
 * PlaybackEngine drives timeline playback outside of React.
 *
 * It runs a single RAF loop that:
 * 1. Advances currentTime based on wall-clock delta
 * 2. Calls onTick to get the latest timeline from the store
 * 3. Evaluates the timeline to find the active scene's config
 * 4. Pushes config + renders via renderer.render(time)
 * 5. Syncs audio clips via MultiAudioEngine
 * 6. Updates the gantt store's currentTime at ~10fps (for UI playhead)
 *
 * When paused, call renderFrame() to render a single frame at currentTime
 * (for seek preview, config edits, etc.). No RAF runs in pause = 0 CPU.
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
  /** Last config reference pushed to renderer — skip updateConfig if unchanged. */
  private lastPushedConfig: ConfigType | null = null;

  /** Callback to update the gantt store's currentTime. Throttled. */
  private onTimeUpdate: ((time: number) => void) | null = null;
  /** Callback when playback reaches the end. */
  private onPlaybackEnd: (() => void) | null = null;
  /** Callback when the active scene changes. */
  private onSceneChange: ((sceneId: string | null) => void) | null = null;
  /** Callback to get the latest timeline on each tick (avoids importing store). */
  private onTick: (() => Timeline) | null = null;

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

  setOnTick(cb: (() => Timeline) | null): void {
    this.onTick = cb;
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
    this.lastPushedConfig = null;
    this.onTimeUpdate?.(0);
    this.audioEngine?.stopAll();
  }

  seek(time: number): void {
    this.currentTime = Math.max(0, time);
    this.lastFrameTime = null; // reset delta so next frame doesn't jump
    this.lastPushedConfig = null; // force re-evaluation after seek
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
  // Single-frame render (for pause: seek, config edits)
  // -----------------------------------------------------------------------

  /**
   * Render exactly one frame at the current time.
   * Called when paused and something changes (seek, config edit).
   * No RAF loop — just evaluate + render once.
   */
  renderFrame(): void {
    if (!this.renderer || this.playing) return;

    if (this.onTick) {
      const timeline = this.onTick();
      this.evaluateWithTimeline(timeline);
    }

    this.renderer.render(this.currentTime);
  }

  /**
   * Render a single frame using a specific config (the selected scene's config).
   * Used when paused and editing a scene that the playhead isn't on.
   */
  renderSelectedConfig(config: ConfigType): void {
    if (!this.renderer || this.playing) return;

    this.pushConfigToRenderer(config);
    this.renderer.render(this.currentTime);
  }

  // -----------------------------------------------------------------------
  // RAF loop (single loop — runs only during playback)
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

      // Get the latest timeline from the hook and evaluate
      if (this.onTick) {
        const timeline = this.onTick();
        this.evaluateWithTimeline(timeline);
      }

      // Render the frame at the current timeline time
      if (this.renderer) {
        this.renderer.render(this.currentTime);
      }

      // Throttled store update for UI
      if (timestamp - this.lastStoreUpdateTime >= PlaybackEngine.STORE_UPDATE_INTERVAL) {
        this.lastStoreUpdateTime = timestamp;
        this.onTimeUpdate?.(this.currentTime);
      }

      // Schedule next frame AFTER work so stop() during evaluation
      // doesn't cause an extra tick.
      if (this.playing) {
        this.rafId = requestAnimationFrame(tick);
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
   * Called from the single RAF loop via onTick, or from renderFrame().
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
      this.lastPushedConfig = null;   // force config push on scene change
      this.onSceneChange?.(newSceneId);
    }

    // Push config to renderer (does NOT render — render() is called separately)
    if (result.config && this.renderer) {
      this.pushConfigToRenderer(result.config);
    }

    // Sync audio clips (only during playback — not when paused/seeking)
    if (this.audioEngine && this.playing) {
      this.audioEngine.syncToTime(timeline.audioClips, this.currentTime);
    }
  }

  private pushConfigToRenderer(config: ConfigType): void {
    if (!this.renderer) return;

    // Skip if the config reference is the same as last frame (no change).
    if (config === this.lastPushedConfig) return;
    this.lastPushedConfig = config;

    const newShader = config.scene?.shader;

    // First time seeing a shader — just sync the name without reloading.
    // PreviewCanvas already loaded the shader during init.
    if (this.currentShader === undefined) {
      this.currentShader = newShader;
      this.renderer.updateConfig(config);
      return;
    }

    const shaderChanged = newShader !== this.currentShader;

    if (shaderChanged && !this.loadingConfig) {
      this.currentShader = newShader;
      this.loadingConfig = true;
      void this.renderer.loadConfig(config).then(() => {
        this.loadingConfig = false;
      });
    } else if (!shaderChanged) {
      this.renderer.updateConfig(config);
    }
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
    this.onTick = null;
  }
}
