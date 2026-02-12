import { useEffect, useRef } from "react";
import { useGanttStore } from "@/store/useGanttStore.ts";
import { useStudioStore } from "@/store/useStudioStore.ts";
import { evaluateSceneAtTime } from "@/timeline/evaluator.ts";
import { diffConfig } from "@/utils/diffConfig.ts";
import { getSequenceTypeFromPath } from "@/utils/getSequenceTypeFromPath.ts";

/**
 * Bridges the gantt timeline store with the studio config store.
 *
 * - When a scene is selected or the playhead moves, the evaluated config
 *   (baseConfig + keyframes at currentTime) is pushed to the studio store.
 * - When the user edits config in the studio panel:
 *   - Record OFF: updates the scene's baseConfig
 *   - Record ON: creates keyframes at current playhead position
 */
export function useGanttBridge() {
  // Global syncing flag — prevents re-entrant update loops between the two stores.
  const isSyncingRef = useRef(false);
  // Track which scene the current studio config belongs to.
  const configSceneIdRef = useRef<string | null>(null);

  // --- Evaluate at current time → push to studio store ---
  useEffect(() => {
    let prevSceneId: string | null = null;
    let prevTime = -1;
    let prevTimeline = useGanttStore.getState().timeline;

    return useGanttStore.subscribe((state) => {
      // Block re-entrant calls: if the reverse-sync is writing to gantt, skip.
      if (isSyncingRef.current) return;
      if (state.isPlaying) return;

      const sceneId = state.selection.sceneId;
      const time = state.currentTime;
      const timeline = state.timeline;

      const sceneChanged = sceneId !== prevSceneId;
      const timeChanged = Math.abs(time - prevTime) > 0.001;
      const timelineChanged = timeline !== prevTimeline;

      if (!sceneChanged && !timeChanged && !timelineChanged) return;

      prevSceneId = sceneId;
      prevTime = time;
      prevTimeline = timeline;

      if (!sceneId) return;

      const scene = timeline.scenes.find((s) => s.id === sceneId);
      if (!scene) return;

      const config = evaluateSceneAtTime(scene, time);
      if (!config) return;

      // Shallow clone: creates a new reference so the studio store doesn't
      // hold the same object as the gantt store. Nested objects are shared
      // (safe because updateConfig does path-based shallow cloning).
      configSceneIdRef.current = sceneId;

      // Push to studio inside the syncing guard
      isSyncingRef.current = true;
      try {
        useStudioStore.getState().setConfig({ ...config });
      } finally {
        isSyncingRef.current = false;
      }
    });
  }, []);

  // --- Studio config edits → sync back to gantt ---
  useEffect(() => {
    let prevConfig = useStudioStore.getState().config;

    return useStudioStore.subscribe((state) => {
      if (state.config === prevConfig) return;
      const oldConfig = prevConfig;
      prevConfig = state.config;

      // Block re-entrant calls: if the evaluate effect is pushing to studio, skip.
      if (isSyncingRef.current) return;

      const gantt = useGanttStore.getState();
      const { currentTime, timeline, isPlaying, recordEnabled } = gantt;
      if (isPlaying) return;

      const targetSceneId = configSceneIdRef.current;
      if (!targetSceneId) return;

      const scene = timeline.scenes.find((s) => s.id === targetSceneId);
      if (!scene) return;

      // Write back inside the syncing guard
      isSyncingRef.current = true;
      try {
        if (recordEnabled) {
          const changes = diffConfig(
            oldConfig as unknown as Record<string, unknown>,
            state.config as unknown as Record<string, unknown>,
          );

          if (changes.length === 0) return;

          const relativeTime = currentTime - scene.startTime;

          for (const { path, value } of changes) {
            const seqType = getSequenceTypeFromPath(path);

            let seq = scene.sequences.find((s) => s.type === seqType);
            if (!seq) {
              const seqId = gantt.addSequence(scene.id, {
                type: seqType,
                label: seqType,
                startOffset: 0,
                duration: scene.duration,
                order: scene.sequences.length,
                baseConfig: {},
                keyframes: [],
              });
              const updatedScene = useGanttStore.getState().timeline.scenes.find((s) => s.id === scene.id);
              seq = updatedScene?.sequences.find((s) => s.id === seqId);
              if (!seq) continue;
              gantt.updateScene(scene.id, { collapsed: false });
            }

            const existing = seq.keyframes.find(
              (kf) => kf.path === path && Math.abs(kf.time - relativeTime) < 0.01,
            );

            const kfValue = typeof value === "number" || typeof value === "string" || typeof value === "boolean"
              ? value
              : String(value);

            if (existing) {
              gantt.updateKeyframe(scene.id, seq.id, existing.id, { value: kfValue });
            } else {
              gantt.addKeyframe(scene.id, seq.id, {
                time: relativeTime,
                path,
                value: kfValue,
                easing: { type: "linear" },
              });
            }
          }
        } else {
          // Deep clone needed here: baseConfig is persisted in the gantt timeline
          // and must be fully isolated from the studio store's live config.
          // This path only runs on manual edits while paused (low frequency).
          gantt.updateScene(targetSceneId, { baseConfig: structuredClone(state.config) });
        }
      } finally {
        isSyncingRef.current = false;
      }
    });
  }, []);
}
