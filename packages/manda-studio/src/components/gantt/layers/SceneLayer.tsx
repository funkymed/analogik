import { useCallback } from "react";
import { useGanttStore } from "@/store/useGanttStore.ts";
import { SceneBlock } from "./SceneBlock.tsx";
import { SceneExpander } from "../scene/SceneExpander.tsx";

interface SceneLayerProps {
  pixelsPerSecond: number;
}

export function SceneLayer({ pixelsPerSecond }: SceneLayerProps) {
  const scenes = useGanttStore((s) => s.timeline.scenes);
  const selectedSceneId = useGanttStore((s) => s.selection.sceneId);
  const trackHeight = useGanttStore((s) => s.trackHeight);
  const selectScene = useGanttStore((s) => s.selectScene);
  const updateScene = useGanttStore((s) => s.updateScene);
  const removeScene = useGanttStore((s) => s.removeScene);
  const reorderScene = useGanttStore((s) => s.reorderScene);

  const handleMove = useCallback(
    (sceneId: string, newStartTime: number) => {
      reorderScene(sceneId, newStartTime);
    },
    [reorderScene],
  );

  const handleResize = useCallback(
    (sceneId: string, newDuration: number, _side: "left" | "right") => {
      updateScene(sceneId, { duration: newDuration });
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

  return (
    <div className="w-full">
      {/* Scene blocks row */}
      <div className="relative w-full" style={{ height: Math.round(40 * trackHeight) }}>
        {/* Layer label */}
        <div className="absolute -left-0 top-0 flex items-center pl-1" style={{ height: Math.round(40 * trackHeight) }}>
          <span className="text-[10px] font-medium text-zinc-500">Scenes</span>
        </div>

        {/* Scene blocks */}
        {scenes.map((scene) => (
          <SceneBlock
            key={scene.id}
            scene={scene}
            pixelsPerSecond={pixelsPerSecond}
            trackHeight={trackHeight}
            isSelected={selectedSceneId === scene.id}
            onSelect={() => selectScene(scene.id)}
            onMove={(t) => handleMove(scene.id, t)}
            onResize={(d, side) => handleResize(scene.id, d, side)}
            onToggleCollapse={() => handleToggleCollapse(scene.id)}
            onRemove={() => removeScene(scene.id)}
          />
        ))}
      </div>

      {/* Expanded scene sequences */}
      {scenes.map((scene) =>
        !scene.collapsed ? (
          <SceneExpander
            key={`exp-${scene.id}`}
            scene={scene}
            pixelsPerSecond={pixelsPerSecond}
          />
        ) : null,
      )}
    </div>
  );
}
