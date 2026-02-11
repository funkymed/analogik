import { useCallback, useEffect, useRef } from "react";
import type { MandaRenderer } from "@mandafunk/core/MandaRenderer";
import { PlaybackEngine } from "@/timeline/PlaybackEngine.ts";
import { MultiAudioEngine } from "@/audio/MultiAudioEngine.ts";
import { useGanttStore } from "@/store/useGanttStore.ts";
import { useStudioStore } from "@/store/useStudioStore.ts";

export interface UsePlaybackEngineReturn {
  /** Call to connect the renderer once it's initialized. */
  setRenderer: (renderer: MandaRenderer | null) => void;
  /** Load an audio file and add it as a clip on the timeline. */
  addAudioFile: (file: File, trackIndex?: number, startTime?: number) => Promise<void>;
  /** Get a decoded AudioBuffer by clip URL (for waveform drawing). */
  getAudioBuffer: (url: string) => AudioBuffer | null;
}

export function usePlaybackEngine(
  audioContext: AudioContext | null,
  analyserNode: AnalyserNode | null,
): UsePlaybackEngineReturn {
  const engineRef = useRef<PlaybackEngine | null>(null);
  const multiAudioRef = useRef<MultiAudioEngine | null>(null);
  /** Track blob URLs so we can revoke them on dispose. */
  const blobUrlsRef = useRef<Set<string>>(new Set());

  // --- Initialize engines ---
  useEffect(() => {
    if (!audioContext || !analyserNode) return;

    const playback = new PlaybackEngine();
    const multiAudio = new MultiAudioEngine(audioContext, analyserNode);

    playback.setAudioEngine(multiAudio);

    // Wire store updates
    playback.setOnTimeUpdate((time) => {
      useGanttStore.getState().setCurrentTime(time);
    });

    playback.setOnPlaybackEnd(() => {
      useGanttStore.getState().setPlaying(false);
    });

    playback.setOnSceneChange((_sceneId) => {
      // Optionally auto-select scene during playback
    });

    // Provide timeline to the engine's single RAF loop (avoids 2nd RAF loop).
    playback.setOnTick(() => useGanttStore.getState().timeline);

    // Apply current master volume
    multiAudio.setMasterVolume(useGanttStore.getState().masterVolume);

    engineRef.current = playback;
    multiAudioRef.current = multiAudio;

    return () => {
      playback.dispose();
      multiAudio.dispose();
      engineRef.current = null;
      multiAudioRef.current = null;

      // Revoke all tracked blob URLs
      for (const url of blobUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
      blobUrlsRef.current.clear();
    };
  }, [audioContext, analyserNode]);

  // --- React to gantt store changes (play/pause, seek, loop, masterVolume) ---
  useEffect(() => {
    return useGanttStore.subscribe((state, prevState) => {
      const engine = engineRef.current;
      const multiAudio = multiAudioRef.current;
      if (!engine) return;

      // Play/Pause toggled from UI
      if (state.isPlaying !== prevState.isPlaying) {
        if (state.isPlaying) {
          engine.seek(state.currentTime);
          engine.play();
        } else {
          engine.pause();
          multiAudio?.stopAll();
        }
      }

      // Seek from ruler click / scrub (when not playing) → render one frame
      if (
        !state.isPlaying &&
        state.currentTime !== prevState.currentTime &&
        !engine.isPlaying()
      ) {
        engine.seek(state.currentTime);
        engine.renderFrame();
      }

      // Timeline changed while paused (keyframe edit, config change via bridge)
      // → re-evaluate and render one frame
      if (
        !state.isPlaying &&
        !engine.isPlaying() &&
        state.timeline !== prevState.timeline &&
        state.currentTime === prevState.currentTime
      ) {
        // When a scene is selected, render that scene's config (from studio store)
        // instead of evaluating at the playhead (which might be on a different scene).
        if (state.selection.sceneId) {
          engine.renderSelectedConfig(useStudioStore.getState().config);
        } else {
          engine.renderFrame();
        }
      }

      // Loop toggle
      if (state.loopEnabled !== prevState.loopEnabled) {
        engine.setLoopEnabled(state.loopEnabled);
      }

      // Master volume
      if (state.masterVolume !== prevState.masterVolume && multiAudio) {
        multiAudio.setMasterVolume(state.masterVolume);
      }
    });
  }, []);

  // --- Expose renderer setter ---
  const setRenderer = useCallback((renderer: MandaRenderer | null) => {
    engineRef.current?.setRenderer(renderer);
  }, []);

  // --- Add audio file as timeline clip ---
  const addAudioFile = useCallback(async (file: File, trackIndex?: number, startTime?: number) => {
    const multiAudio = multiAudioRef.current;
    if (!multiAudio) return;

    const blobUrl = URL.createObjectURL(file);
    // Track immediately so dispose always revokes, even on partial failure.
    blobUrlsRef.current.add(blobUrl);

    try {
      const buffer = await file.arrayBuffer();
      const audioBuffer = await multiAudio.loadClipFromBuffer(blobUrl, buffer);

      const gantt = useGanttStore.getState();
      gantt.addAudioClip({
        name: file.name,
        url: blobUrl,
        startTime: startTime ?? gantt.currentTime,
        duration: audioBuffer.duration,
        trimStart: 0,
        volume: 1,
        muted: false,
        trackIndex: trackIndex ?? 0,
      });
    } catch (err) {
      console.error("Failed to load audio file:", err);
      blobUrlsRef.current.delete(blobUrl);
      URL.revokeObjectURL(blobUrl);
    }
  }, []);

  // --- Get audio buffer for waveform ---
  const getAudioBuffer = useCallback((url: string): AudioBuffer | null => {
    return multiAudioRef.current?.getBuffer(url) ?? null;
  }, []);

  return { setRenderer, addAudioFile, getAudioBuffer };
}
