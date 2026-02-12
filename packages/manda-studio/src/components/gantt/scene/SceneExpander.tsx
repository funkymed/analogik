import { useMemo } from "react";
import type { TimelineScene } from "@/timeline/ganttTypes.ts";
import { ParameterRow, type ParameterEntry } from "./ParameterRow.tsx";

interface SceneExpanderProps {
  scene: TimelineScene;
  pixelsPerSecond: number;
  /** Pixel offset from the top of the track row (below the scene block). */
  topOffset?: number;
  /** Pixel offset from the left (scene start position). */
  leftOffset?: number;
  /** Pixel width (scene duration). */
  widthPx?: number;
  /** Scaled height per parameter row. */
  paramRowHeight?: number;
}

/**
 * Collapsible container that shows per-parameter keyframe rows below a scene block.
 * Each unique keyframe path across all sequences becomes its own row.
 */
export function SceneExpander({
  scene,
  pixelsPerSecond,
  topOffset = 0,
  leftOffset,
  widthPx,
  paramRowHeight,
}: SceneExpanderProps) {
  // Collect all keyframes grouped by path across all sequences
  const parameterGroups = useMemo(() => {
    const byPath = new Map<string, ParameterEntry[]>();

    for (const seq of scene.sequences) {
      for (const kf of seq.keyframes) {
        let entries = byPath.get(kf.path);
        if (!entries) {
          entries = [];
          byPath.set(kf.path, entries);
        }
        entries.push({
          keyframe: kf,
          sequenceId: seq.id,
          startOffset: seq.startOffset,
        });
      }
    }

    // Sort paths alphabetically for stable order
    return [...byPath.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([path, entries]) => ({ path, entries }));
  }, [scene.sequences]);

  if (parameterGroups.length === 0) return null;

  return (
    <div
      className="absolute"
      style={{
        top: topOffset,
        left: leftOffset ?? 0,
        width: widthPx ?? "100%",
      }}
    >
      {parameterGroups.map(({ path, entries }) => (
        <ParameterRow
          key={path}
          sceneId={scene.id}
          entries={entries}
          pixelsPerSecond={pixelsPerSecond}
          sceneStartTime={scene.startTime}
          rowHeight={paramRowHeight}
        />
      ))}
    </div>
  );
}
