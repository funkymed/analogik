import { useCallback, useEffect, useRef } from "react";
import type { MandaRenderer } from "@mandafunk/core/MandaRenderer";
import { PlaybackEngine } from "@/timeline/PlaybackEngine.ts";
import { MultiAudioEngine } from "@/audio/MultiAudioEngine.ts";
import { useGanttStore } from "@/store/useGanttStore.ts";

export interface UsePlaybackEngineReturn {
  /** Call to connect the renderer once it's initialized. */
  setRenderer: (renderer: MandaRenderer | null) => void;
  /** Load an audio file and add it as a clip on the timeline. */
  addAudioFile: (file: File) => Promise<void>;
  /** Get a decoded AudioBuffer by clip URL (for waveform drawing). */
  getAudioBuffer: (url: string) => AudioBuffer | null;
}

export function usePlaybackEngine(
  audioContext: AudioContext | null,
  analyserNode: AnalyserNode | null,
): UsePlaybackEngineReturn {
  const engineRef = useRef<PlaybackEngine | null>(null);
  const multiAudioRef = useRef<MultiAudioEngine | null>(null);

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

    // Apply current master volume
    multiAudio.setMasterVolume(useGanttStore.getState().masterVolume);

    engineRef.current = playback;
    multiAudioRef.current = multiAudio;

    return () => {
      playback.dispose();
      multiAudio.dispose();
      engineRef.current = null;
      multiAudioRef.current = null;
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
        }
      }

      // Seek from ruler click (when not playing)
      if (
        !state.isPlaying &&
        state.currentTime !== prevState.currentTime &&
        !engine.isPlaying()
      ) {
        engine.seek(state.currentTime);
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

  // --- Drive the evaluation with the latest timeline data ---
  useEffect(() => {
    let rafId: number | null = null;

    const tick = () => {
      const engine = engineRef.current;
      if (!engine || !engine.isPlaying()) {
        rafId = null;
        return;
      }

      const timeline = useGanttStore.getState().timeline;
      engine.evaluateWithTimeline(timeline);

      rafId = requestAnimationFrame(tick);
    };

    const unsub = useGanttStore.subscribe((state, prevState) => {
      if (state.isPlaying && !prevState.isPlaying) {
        if (rafId === null) {
          rafId = requestAnimationFrame(tick);
        }
      } else if (!state.isPlaying && prevState.isPlaying) {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        multiAudioRef.current?.stopAll();
      }
    });

    return () => {
      unsub();
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  // --- Expose renderer setter ---
  const setRenderer = useCallback((renderer: MandaRenderer | null) => {
    engineRef.current?.setRenderer(renderer);
  }, []);

  // --- Add audio file as timeline clip ---
  const addAudioFile = useCallback(async (file: File) => {
    const multiAudio = multiAudioRef.current;
    if (!multiAudio) return;

    const blobUrl = URL.createObjectURL(file);

    try {
      const buffer = await file.arrayBuffer();
      const audioBuffer = await multiAudio.loadClipFromBuffer(blobUrl, buffer);

      const gantt = useGanttStore.getState();
      gantt.addAudioClip({
        name: file.name,
        url: blobUrl,
        startTime: gantt.currentTime,
        duration: audioBuffer.duration,
        trimStart: 0,
        volume: 1,
        muted: false,
      });
    } catch (err) {
      console.error("Failed to load audio file:", err);
      URL.revokeObjectURL(blobUrl);
    }
  }, []);

  // --- Get audio buffer for waveform ---
  const getAudioBuffer = useCallback((url: string): AudioBuffer | null => {
    return multiAudioRef.current?.getBuffer(url) ?? null;
  }, []);

  return { setRenderer, addAudioFile, getAudioBuffer };
}
