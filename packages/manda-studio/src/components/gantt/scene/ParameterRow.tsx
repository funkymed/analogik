import { useCallback, useRef, useState } from "react";
import type { Keyframe } from "@/timeline/ganttTypes.ts";
import { useGanttStore } from "@/store/useGanttStore.ts";
import { KeyframeDot } from "../keyframes/KeyframeDot.tsx";
import { KeyframeEditor } from "../keyframes/KeyframeEditor.tsx";

export interface ParameterEntry {
  keyframe: Keyframe;
  sequenceId: string;
  startOffset: number;
}

interface ParameterRowProps {
  sceneId: string;
  entries: ParameterEntry[];
  pixelsPerSecond: number;
  sceneStartTime: number;
  rowHeight?: number;
}

/**
 * A single parameter row inside an expanded scene.
 * Keyframe dots only — labels are rendered in TrackLabelsPanel.
 */
export function ParameterRow({
  sceneId,
  entries,
  pixelsPerSecond,
  sceneStartTime,
  rowHeight,
}: ParameterRowProps) {
  const selectedKeyframeIds = useGanttStore((s) => s.selection.keyframeIds);
  const selectKeyframes = useGanttStore((s) => s.selectKeyframes);
  const updateKeyframe = useGanttStore((s) => s.updateKeyframe);
  const removeKeyframe = useGanttStore((s) => s.removeKeyframe);
  const setCurrentTime = useGanttStore((s) => s.setCurrentTime);

  const [editingEntry, setEditingEntry] = useState<ParameterEntry | null>(null);

  // Track the original keyframe time when drag starts, keyed by keyframeId
  const dragOriginsRef = useRef<Map<string, number>>(new Map());

  const handleSelectKeyframe = useCallback(
    (kfId: string, additive: boolean) => {
      const current = useGanttStore.getState().selection.keyframeIds;
      if (additive) {
        if (current.includes(kfId)) {
          selectKeyframes(current.filter((id) => id !== kfId));
        } else {
          selectKeyframes([...current, kfId]);
        }
      } else {
        selectKeyframes([kfId]);
      }
    },
    [selectKeyframes],
  );

  const handleClickKeyframe = useCallback(
    (kfId: string) => {
      const entry = entries.find((e) => e.keyframe.id === kfId);
      if (entry) {
        setCurrentTime(sceneStartTime + entry.startOffset + entry.keyframe.time);
      }
    },
    [entries, sceneStartTime, setCurrentTime],
  );

  const handleDoubleClickKeyframe = useCallback(
    (kfId: string) => {
      const entry = entries.find((e) => e.keyframe.id === kfId);
      if (entry) setEditingEntry(entry);
    },
    [entries],
  );

  const handleDragKeyframe = useCallback(
    (kfId: string, deltaPx: number) => {
      const entry = entries.find((e) => e.keyframe.id === kfId);
      if (!entry) return;

      // Store original time on first drag call
      if (!dragOriginsRef.current.has(kfId)) {
        dragOriginsRef.current.set(kfId, entry.keyframe.time);
      }
      const originTime = dragOriginsRef.current.get(kfId)!;
      const timeDelta = deltaPx / pixelsPerSecond;
      const newTime = Math.max(0, originTime + timeDelta);
      const snapped = useGanttStore.getState().snapTime(newTime);

      updateKeyframe(sceneId, entry.sequenceId, entry.keyframe.id, { time: snapped });
      // Also move the playhead to follow the dragged keyframe
      setCurrentTime(sceneStartTime + entry.startOffset + snapped);
    },
    [entries, pixelsPerSecond, sceneId, sceneStartTime, updateKeyframe, setCurrentTime],
  );

  const handleDragEndKeyframe = useCallback(
    (kfId: string) => {
      dragOriginsRef.current.delete(kfId);
    },
    [],
  );

  const handleUpdateKeyframe = useCallback(
    (patch: Partial<Omit<Keyframe, "id">>) => {
      if (!editingEntry) return;
      updateKeyframe(sceneId, editingEntry.sequenceId, editingEntry.keyframe.id, patch);
    },
    [sceneId, editingEntry, updateKeyframe],
  );

  const handleRemoveKeyframe = useCallback(() => {
    if (!editingEntry) return;
    removeKeyframe(sceneId, editingEntry.sequenceId, editingEntry.keyframe.id);
    setEditingEntry(null);
  }, [sceneId, editingEntry, removeKeyframe]);

  return (
    <div className="relative flex w-full border-b border-zinc-800/30" style={{ height: rowHeight ?? 24 }}>
      {/* Keyframe area (labels are in TrackLabelsPanel) */}
      <div className="relative flex-1">
        {entries.map((entry) => {
          const leftPx = (entry.startOffset + entry.keyframe.time) * pixelsPerSecond;
          return (
            <KeyframeDot
              key={entry.keyframe.id}
              keyframeId={entry.keyframe.id}
              leftPx={leftPx}
              isSelected={selectedKeyframeIds.includes(entry.keyframe.id)}
              onSelect={handleSelectKeyframe}
              onClick={handleClickKeyframe}
              onDoubleClick={handleDoubleClickKeyframe}
              onDrag={handleDragKeyframe}
              onDragEnd={handleDragEndKeyframe}
            />
          );
        })}

        {/* Keyframe editor popover */}
        {editingEntry && (
          <KeyframeEditor
            keyframe={editingEntry.keyframe}
            anchorLeftPx={
              (editingEntry.startOffset + editingEntry.keyframe.time) * pixelsPerSecond
            }
            onUpdate={handleUpdateKeyframe}
            onRemove={handleRemoveKeyframe}
            onClose={() => setEditingEntry(null)}
          />
        )}
      </div>
    </div>
  );
}
