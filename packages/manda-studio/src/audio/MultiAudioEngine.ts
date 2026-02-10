import type { AudioClip } from "@/timeline/ganttTypes.ts";

/**
 * Tracks the playback state of a single audio clip.
 */
interface ActiveClip {
  clipId: string;
  sourceNode: AudioBufferSourceNode;
  gainNode: GainNode;
}

/**
 * MultiAudioEngine manages multiple audio clips on the timeline.
 *
 * Each clip gets its own AudioBufferSourceNode + GainNode.
 * All route to a shared AnalyserNode (for the renderer's visualizations).
 *
 * `syncToTime()` is called every frame by the PlaybackEngine to
 * start/stop clips based on the current playback position.
 */
export class MultiAudioEngine {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private masterGain: GainNode;

  /** Decoded audio buffers keyed by clip URL. */
  private buffers = new Map<string, AudioBuffer>();
  /** Currently playing source nodes keyed by clip ID. */
  private activeClips = new Map<string, ActiveClip>();

  private disposed = false;

  constructor(audioContext: AudioContext, analyserNode: AnalyserNode) {
    this.audioContext = audioContext;
    this.analyser = analyserNode;

    // Master gain -> analyser (already connected to destination by the existing AudioEngine)
    this.masterGain = audioContext.createGain();
    this.masterGain.connect(this.analyser);
  }

  // -----------------------------------------------------------------------
  // Buffer loading
  // -----------------------------------------------------------------------

  /**
   * Pre-load and decode an audio file from a URL.
   * Returns the decoded AudioBuffer. Caches by URL.
   */
  async loadClipBuffer(url: string): Promise<AudioBuffer> {
    const cached = this.buffers.get(url);
    if (cached) return cached;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`MultiAudioEngine: failed to fetch "${url}" (${response.status})`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.buffers.set(url, audioBuffer);
    return audioBuffer;
  }

  /**
   * Load and decode an audio file from an ArrayBuffer (e.g. File input).
   * The `url` is used as cache key.
   */
  async loadClipFromBuffer(url: string, buffer: ArrayBuffer): Promise<AudioBuffer> {
    const audioBuffer = await this.audioContext.decodeAudioData(buffer);
    this.buffers.set(url, audioBuffer);
    return audioBuffer;
  }

  /**
   * Get the decoded duration for a loaded clip URL.
   */
  getBufferDuration(url: string): number {
    return this.buffers.get(url)?.duration ?? 0;
  }

  /**
   * Get the decoded AudioBuffer for a loaded clip URL (for waveform drawing).
   */
  getBuffer(url: string): AudioBuffer | null {
    return this.buffers.get(url) ?? null;
  }

  // -----------------------------------------------------------------------
  // Sync to timeline position
  // -----------------------------------------------------------------------

  /**
   * Called every frame by the PlaybackEngine.
   * Starts clips that should be playing and stops clips that shouldn't.
   */
  syncToTime(clips: AudioClip[], time: number): void {
    if (this.disposed) return;

    const shouldBePlaying = new Set<string>();

    for (const clip of clips) {
      if (clip.muted) continue;

      const clipEnd = clip.startTime + clip.duration;
      if (time >= clip.startTime && time < clipEnd) {
        shouldBePlaying.add(clip.id);

        // Start if not already playing
        if (!this.activeClips.has(clip.id)) {
          this.startClip(clip, time);
        }
      }
    }

    // Stop clips that should no longer be playing
    for (const [clipId, active] of this.activeClips) {
      if (!shouldBePlaying.has(clipId)) {
        this.stopClip(active);
        this.activeClips.delete(clipId);
      }
    }
  }

  private startClip(clip: AudioClip, currentTime: number): void {
    const buffer = this.buffers.get(clip.url);
    if (!buffer) return; // Not loaded yet

    const sourceNode = this.audioContext.createBufferSource();
    sourceNode.buffer = buffer;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = clip.volume;

    sourceNode.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Calculate where in the audio buffer to start
    const elapsed = currentTime - clip.startTime;
    const bufferOffset = clip.trimStart + elapsed;

    // How much of the clip remains
    const remaining = clip.duration - elapsed;

    sourceNode.onended = () => {
      this.activeClips.delete(clip.id);
      gainNode.disconnect();
    };

    sourceNode.start(0, bufferOffset, remaining);

    this.activeClips.set(clip.id, {
      clipId: clip.id,
      sourceNode,
      gainNode,
    });
  }

  private stopClip(active: ActiveClip): void {
    try {
      active.sourceNode.onended = null;
      active.sourceNode.stop();
    } catch {
      // Already stopped
    }
    active.sourceNode.disconnect();
    active.gainNode.disconnect();
  }

  // -----------------------------------------------------------------------
  // Controls
  // -----------------------------------------------------------------------

  stopAll(): void {
    for (const active of this.activeClips.values()) {
      this.stopClip(active);
    }
    this.activeClips.clear();
  }

  setMasterVolume(volume: number): void {
    this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stopAll();
    this.masterGain.disconnect();
    this.buffers.clear();
  }
}
