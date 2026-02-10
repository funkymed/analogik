import { useEffect, useRef } from "react";
import { useGanttStore } from "@/store/useGanttStore.ts";
import { useStudioStore } from "@/store/useStudioStore.ts";

/**
 * Bridges the gantt timeline store with the studio config store.
 *
 * When a scene is selected in the gantt timeline, its baseConfig is
 * loaded into the studio store for editing in the left panel.
 *
 * When the studio config changes (user edits via left panel), the
 * selected scene's baseConfig is updated in the gantt store.
 */
export function useGanttBridge() {
  const suppressSyncRef = useRef(false);
  const prevSceneIdRef = useRef<string | null>(null);

  // --- Scene selection -> load config into studio store ---
  useEffect(() => {
    return useGanttStore.subscribe((state) => {
      const sceneId = state.selection.sceneId;
      if (sceneId === prevSceneIdRef.current) return;
      prevSceneIdRef.current = sceneId;

      if (!sceneId) return;
      const scene = state.timeline.scenes.find((s) => s.id === sceneId);
      if (!scene) return;

      suppressSyncRef.current = true;
      useStudioStore.getState().setConfig(structuredClone(scene.baseConfig));
      // Allow sync to resume after Zustand finishes notifying subscribers
      void Promise.resolve().then(() => {
        suppressSyncRef.current = false;
      });
    });
  }, []);

  // --- Studio config edits -> sync back to selected scene ---
  useEffect(() => {
    let prevConfig = useStudioStore.getState().config;

    return useStudioStore.subscribe((state) => {
      if (state.config === prevConfig) return;
      prevConfig = state.config;

      if (suppressSyncRef.current) return;
      const { selection, updateScene, isPlaying } = useGanttStore.getState();
      // Don't sync during playback - PlaybackEngine drives the renderer directly
      if (isPlaying) return;
      if (!selection.sceneId) return;
      updateScene(selection.sceneId, { baseConfig: structuredClone(state.config) });
    });
  }, []);
}
