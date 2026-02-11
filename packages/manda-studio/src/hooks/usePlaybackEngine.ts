import { useCallback, useEffect, useRef } from "react";
import type { MandaRenderer } from "@mandafunk/core/MandaRenderer";
import { PlaybackEngine } from "@/timeline/PlaybackEngine.ts";
import { MultiAudioEngine } from "@/audio/MultiAudioEngine.ts";
import { useGanttStore } from "@/store/useGanttStore.ts";
import { useStudioStore } from "@/store/useStudioStore.ts";
import { createAudio } from "@/db/libraryService.ts";
import { createAssetEntry } from "@/services/assetRegistry.ts";

export interface UsePlaybackEngineReturn {
  /** Call to connect the renderer once it's initialized. */
  setRenderer: (renderer: MandaRenderer | null) => void;
  /** Load an audio file and add it as a clip on the timeline. */
  addAudioFile: (file: File, trackIndex?: number, startTime?: number, libraryId?: number) => Promise<void>;
  /** Get a decoded AudioBuffer by clip URL (for waveform drawing). */
  getAudioBuffer: (url: string) => AudioBuffer | null;
  /** Pre-load an audio buffer from a blob URL into the engine. */
  loadAudioClipBuffer: (url: string) => Promise<void>;
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

      // Scene selection changed while paused → render the newly selected scene
      if (
        !state.isPlaying &&
        !engine.isPlaying() &&
        state.selection.sceneId !== prevState.selection.sceneId
      ) {
        // Small delay to let the bridge push the selected scene's config to studio
        setTimeout(() => {
          const studioConfig = useStudioStore.getState().config;
          void engine.renderSelectedConfig(studioConfig);
        }, 0);
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
          void engine.renderSelectedConfig(useStudioStore.getState().config);
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
  const addAudioFile = useCallback(async (file: File, trackIndex?: number, startTime?: number, libraryId?: number) => {
    const multiAudio = multiAudioRef.current;
    if (!multiAudio) return;

    // Save to library if not already there (raw file drop from desktop)
    let resolvedLibraryId = libraryId;
    if (resolvedLibraryId === undefined) {
      try {
        resolvedLibraryId = await createAudio(file);
      } catch (err) {
        console.warn("Failed to save audio to library:", err);
      }
    }

    const blobUrl = URL.createObjectURL(file);
    // Track immediately so dispose always revokes, even on partial failure.
    blobUrlsRef.current.add(blobUrl);

    try {
      const buffer = await file.arrayBuffer();
      const audioBuffer = await multiAudio.loadClipFromBuffer(blobUrl, buffer);

      // Register asset in the timeline registry
      let assetId: string | undefined;
      if (resolvedLibraryId !== undefined) {
        const entry = await createAssetEntry(resolvedLibraryId, "audio");
        if (entry) {
          // Override runtimeUrl to use the same blobUrl we already loaded
          entry.runtimeUrl = blobUrl;
          useGanttStore.getState().registerAsset(entry);
          assetId = entry.id;
        }
      }

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
        ...(resolvedLibraryId !== undefined ? { libraryId: resolvedLibraryId } : {}),
        ...(assetId ? { assetId } : {}),
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

  // --- Pre-load an audio buffer from a blob URL ---
  const loadAudioClipBuffer = useCallback(async (url: string): Promise<void> => {
    const multiAudio = multiAudioRef.current;
    if (!multiAudio) return;
    try {
      await multiAudio.loadClipBuffer(url);
    } catch (err) {
      console.warn("Failed to pre-load audio buffer:", url, err);
    }
  }, []);

  return { setRenderer, addAudioFile, getAudioBuffer, loadAudioClipBuffer };
}
