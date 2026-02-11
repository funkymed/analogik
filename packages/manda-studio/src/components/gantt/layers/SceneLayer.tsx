import { useCallback, useMemo, useState } from "react";
import { useGanttStore } from "@/store/useGanttStore.ts";
import { useTrackHeights } from "@/hooks/useTrackHeights.ts";
import { SceneBlock } from "./SceneBlock.tsx";
import { SceneExpander } from "../scene/SceneExpander.tsx";
import { SceneParametersPanel } from "../scene/SceneParametersPanel.tsx";

interface SceneLayerProps {
  pixelsPerSecond: number;
}

const ROW_BASE_HEIGHT = 40;

export function SceneLayer({ pixelsPerSecond }: SceneLayerProps) {
  const scenes = useGanttStore((s) => s.timeline.scenes);
  const selectedSceneId = useGanttStore((s) => s.selection.sceneId);
  const trackHeight = useGanttStore((s) => s.trackHeight);
  const sceneTrackCount = useGanttStore((s) => s.sceneTrackCount);
  const selectScene = useGanttStore((s) => s.selectScene);
  const updateScene = useGanttStore((s) => s.updateScene);
  const removeScene = useGanttStore((s) => s.removeScene);

  const { sceneTrackHeights } = useTrackHeights();

  // Scene parameters panel (opened on double-click)
  const [paramsPanelSceneId, setParamsPanelSceneId] = useState<string | null>(null);
  const paramsPanelScene = paramsPanelSceneId
    ? scenes.find((s) => s.id === paramsPanelSceneId) ?? null
    : null;

  const scenesByTrack = useMemo(() => {
    const map = new Map<number, typeof scenes>();
    for (let i = 0; i < sceneTrackCount; i++) {
      map.set(i, []);
    }
    for (const scene of scenes) {
      const list = map.get(scene.trackIndex);
      if (list) {
        list.push(scene);
      } else {
        map.get(0)?.push(scene);
      }
    }
    return map;
  }, [scenes, sceneTrackCount]);

  const handleUpdate = useCallback(
    (sceneId: string, patch: { startTime?: number; duration?: number }) => {
      updateScene(sceneId, patch);
    },
    [updateScene],
  );

  const handleToggleCollapse = useCallback(
    (sceneId: string) => {
      const scene = scenes.find((s) => s.id === sceneId);
      if (scene) {
        updateScene(sceneId, { collapsed: !scene.collapsed });
      }
    },
    [scenes, updateScene],
  );

  const handleTrackChange = useCallback(
    (sceneId: string, newTrackIndex: number) => {
      updateScene(sceneId, { trackIndex: newTrackIndex });
    },
    [updateScene],
  );

  const baseRowHeight = Math.round(ROW_BASE_HEIGHT * trackHeight);

  return (
    <div className="relative w-full">
      {/* Scene parameters panel (double-click on scene) */}
      {paramsPanelScene && (
        <SceneParametersPanel
          scene={paramsPanelScene}
          onClose={() => setParamsPanelSceneId(null)}
        />
      )}

      {Array.from({ length: sceneTrackCount }, (_, trackIndex) => {
        const trackScenes = scenesByTrack.get(trackIndex) ?? [];
        const rowHeight = sceneTrackHeights[trackIndex] ?? baseRowHeight;

        return (
          <div
            key={`scene-track-${trackIndex}`}
            className="relative w-full border-b border-zinc-800/30"
            style={{ height: rowHeight }}
          >
            {/* Scene blocks positioned absolutely at the top */}
            {trackScenes.map((scene) => (
              <SceneBlock
                key={scene.id}
                scene={scene}
                pixelsPerSecond={pixelsPerSecond}
                trackHeight={trackHeight}
                isSelected={selectedSceneId === scene.id}
                rowHeight={baseRowHeight}
                trackCount={sceneTrackCount}
                sceneTrackHeights={sceneTrackHeights}
                onSelect={() => selectScene(scene.id)}
                onUpdate={(patch) => handleUpdate(scene.id, patch)}
                onToggleCollapse={() => handleToggleCollapse(scene.id)}
                onRemove={() => removeScene(scene.id)}
                onTrackChange={(ti) => handleTrackChange(scene.id, ti)}
                onDoubleClick={() => setParamsPanelSceneId(scene.id)}
              />
            ))}

            {/* Inline expanded sequences below the scene block area */}
            {trackScenes.map((scene) =>
              !scene.collapsed ? (
                <SceneExpander
                  key={`exp-${scene.id}`}
                  scene={scene}
                  pixelsPerSecond={pixelsPerSecond}
                  topOffset={baseRowHeight}
                  leftOffset={scene.startTime * pixelsPerSecond}
                  widthPx={scene.duration * pixelsPerSecond}
                />
              ) : null,
            )}
          </div>
        );
      })}
    </div>
  );
}
