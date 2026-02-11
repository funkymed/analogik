import { useMemo } from "react";
import { useGanttStore } from "@/store/useGanttStore.ts";
import type { TimelineScene } from "@/timeline/ganttTypes.ts";

const SCENE_ROW_BASE = 40;
const PARAMETER_ROW_HEIGHT = 24;
const AUDIO_ROW_BASE = 36;

/** Count unique keyframe paths across all sequences in a scene. */
function countUniquePaths(scene: TimelineScene): number {
  const paths = new Set<string>();
  for (const seq of scene.sequences) {
    for (const kf of seq.keyframes) {
      paths.add(kf.path);
    }
  }
  return paths.size;
}

export function useTrackHeights() {
  const scenes = useGanttStore((s) => s.timeline.scenes);
  const sceneTrackCount = useGanttStore((s) => s.sceneTrackCount);
  const audioTrackCount = useGanttStore((s) => s.audioTrackCount);
  const trackHeight = useGanttStore((s) => s.trackHeight);

  return useMemo(() => {
    const sceneTrackHeights: number[] = [];
    for (let i = 0; i < sceneTrackCount; i++) {
      let extra = 0;
      for (const scene of scenes) {
        if (scene.trackIndex === i && !scene.collapsed) {
          const pathCount = countUniquePaths(scene);
          extra += pathCount * PARAMETER_ROW_HEIGHT;
        }
      }
      sceneTrackHeights.push(Math.round((SCENE_ROW_BASE + extra) * trackHeight));
    }
    const audioTrackHeights: number[] = [];
    for (let i = 0; i < audioTrackCount; i++) {
      audioTrackHeights.push(Math.round(AUDIO_ROW_BASE * trackHeight));
    }
    const totalHeight =
      sceneTrackHeights.reduce((a, b) => a + b, 0) +
      audioTrackHeights.reduce((a, b) => a + b, 0);

    return { sceneTrackHeights, audioTrackHeights, totalHeight };
  }, [scenes, sceneTrackCount, audioTrackCount, trackHeight]);
}
