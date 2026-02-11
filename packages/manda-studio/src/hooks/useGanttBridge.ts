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
  // Track the last config reference we pushed to studio so we can skip
  // our own pushes in the reverse-sync subscription.
  const lastPushedRef = useRef<unknown>(null);
  // When the reverse-sync (effect 2) modifies the timeline, skip the
  // next evaluation (effect 1) to avoid a redundant structuredClone cycle.
  const skipNextEvalRef = useRef(false);

  // --- Evaluate at current time → push to studio store ---
  useEffect(() => {
    let prevSceneId: string | null = null;
    let prevTime = -1;
    let prevTimeline = useGanttStore.getState().timeline;

    return useGanttStore.subscribe((state) => {
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

      // If the timeline changed because the reverse-sync just wrote
      // keyframes, skip re-evaluation (studio already has the right values).
      if (skipNextEvalRef.current && timelineChanged && !sceneChanged && !timeChanged) {
        skipNextEvalRef.current = false;
        return;
      }
      skipNextEvalRef.current = false;

      if (!sceneId) return;

      const scene = timeline.scenes.find((s) => s.id === sceneId);
      if (!scene) return;

      // Evaluate the **selected** scene directly (not whichever scene
      // happens to be active at the playhead). This ensures edits and
      // keyframes are reflected even when the playhead sits outside the
      // highest-priority active scene.
      const config = evaluateSceneAtTime(scene, time);
      if (!config) return;

      const clone = structuredClone(config);
      lastPushedRef.current = clone;
      useStudioStore.getState().setConfig(clone);
    });
  }, []);

  // --- Studio config edits → sync back to gantt ---
  useEffect(() => {
    let prevConfig = useStudioStore.getState().config;

    return useStudioStore.subscribe((state) => {
      if (state.config === prevConfig) return;
      const oldConfig = prevConfig;
      prevConfig = state.config;

      // Skip configs that we pushed ourselves from the evaluate effect
      if (state.config === lastPushedRef.current) return;

      const gantt = useGanttStore.getState();
      const { selection, currentTime, timeline, isPlaying, recordEnabled } = gantt;
      if (isPlaying) return;
      if (!selection.sceneId) return;

      const scene = timeline.scenes.find((s) => s.id === selection.sceneId);
      if (!scene) return;

      // Signal the first effect to skip the next re-evaluation triggered
      // by our own store modifications below.
      skipNextEvalRef.current = true;

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
        gantt.updateScene(selection.sceneId, { baseConfig: structuredClone(state.config) });
      }
    });
  }, []);
}
