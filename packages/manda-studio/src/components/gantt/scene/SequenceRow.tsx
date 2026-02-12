import { useCallback, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Sequence, Keyframe } from "@/timeline/ganttTypes.ts";
import { useGanttStore } from "@/store/useGanttStore.ts";
import { SequenceLabel } from "./SequenceLabel.tsx";
import { KeyframeDot } from "../keyframes/KeyframeDot.tsx";
import { KeyframeEditor } from "../keyframes/KeyframeEditor.tsx";

interface SequenceRowProps {
  sceneId: string;
  sequence: Sequence;
  pixelsPerSecond: number;
  /** Absolute start time of the parent scene. */
  sceneStartTime: number;
}

/**
 * A single sequence row inside an expanded scene.
 * Shows the sequence label on the left and keyframe dots on the timeline area.
 */
export function SequenceRow({
  sceneId,
  sequence,
  pixelsPerSecond,
  sceneStartTime,
}: SequenceRowProps) {
  const selectedKeyframeIds = useGanttStore((s) => s.selection.keyframeIds);
  const editingKeyframeId = useGanttStore((s) => s.selection.editingKeyframeId);
  const selectKeyframes = useGanttStore((s) => s.selectKeyframes);
  const setEditingKeyframe = useGanttStore((s) => s.setEditingKeyframe);
  const addKeyframe = useGanttStore((s) => s.addKeyframe);
  const updateKeyframe = useGanttStore((s) => s.updateKeyframe);
  const removeKeyframe = useGanttStore((s) => s.removeKeyframe);
  const removeSequence = useGanttStore((s) => s.removeSequence);
  const setCurrentTime = useGanttStore((s) => s.setCurrentTime);

  const rowRef = useRef<HTMLDivElement>(null);

  // --- DnD sortable ---
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sequence.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Find the editing keyframe from the global editingKeyframeId
  const editingKeyframe = editingKeyframeId
    ? sequence.keyframes.find((kf) => kf.id === editingKeyframeId) ?? null
    : null;

  // --- Keyframe selection ---
  const handleSelectKeyframe = useCallback(
    (kfId: string, additive: boolean) => {
      if (additive) {
        const current = useGanttStore.getState().selection.keyframeIds;
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

  // Single click on keyframe: seek playhead to that keyframe's time
  const handleClickKeyframe = useCallback(
    (kfId: string) => {
      const kf = sequence.keyframes.find((k) => k.id === kfId);
      if (kf) {
        setCurrentTime(sceneStartTime + sequence.startOffset + kf.time);
      }
    },
    [sequence.keyframes, sequence.startOffset, sceneStartTime, setCurrentTime],
  );

  // Double-click on keyframe: open editor popover (global — closes any other open editor)
  const handleDoubleClickKeyframe = useCallback(
    (kfId: string) => {
      setEditingKeyframe(kfId);
    },
    [setEditingKeyframe],
  );

  // --- Add keyframe on double-click in empty area ---
  const handleDoubleClickRow = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      // Don't add keyframe when clicking on existing dot or label area
      if (target.closest("[data-no-drag]")) return;

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      // Convert px to time relative to sequence
      const timeInSequence = Math.max(0, x / pixelsPerSecond - sequence.startOffset);

      // Prompt: add a keyframe with a default path
      const path = prompt("Property path (e.g. composer.bloom.strength):");
      if (!path) return;

      const valueStr = prompt("Value:", "0");
      if (valueStr === null) return;

      let value: number | string | boolean;
      if (valueStr === "true") value = true;
      else if (valueStr === "false") value = false;
      else if (!isNaN(Number(valueStr)) && valueStr.trim() !== "") value = Number(valueStr);
      else value = valueStr;

      addKeyframe(sceneId, sequence.id, {
        time: Math.min(timeInSequence, sequence.duration),
        path,
        value,
        easing: { type: "linear" },
      });
    },
    [addKeyframe, sceneId, sequence.id, sequence.startOffset, sequence.duration, pixelsPerSecond],
  );

  // --- Keyframe editor callbacks ---
  const handleUpdateKeyframe = useCallback(
    (patch: Partial<Omit<Keyframe, "id">>) => {
      if (!editingKeyframeId) return;
      updateKeyframe(sceneId, sequence.id, editingKeyframeId, patch);
    },
    [sceneId, sequence.id, editingKeyframeId, updateKeyframe],
  );

  const handleRemoveKeyframe = useCallback(() => {
    if (!editingKeyframeId) return;
    removeKeyframe(sceneId, sequence.id, editingKeyframeId);
    setEditingKeyframe(null);
  }, [sceneId, sequence.id, editingKeyframeId, removeKeyframe, setEditingKeyframe]);

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        (rowRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      style={style}
      {...attributes}
      className="relative flex h-6 w-full border-b border-zinc-800/30"
      onDoubleClick={handleDoubleClickRow}
    >
      {/* Label area */}
      <SequenceLabel
        label={sequence.label}
        type={sequence.type}
        dragHandleRef={setActivatorNodeRef}
        dragHandleListeners={listeners}
        onRemove={() => removeSequence(sceneId, sequence.id)}
      />

      {/* Keyframe area - relative to sequence timing */}
      <div className="relative flex-1">
        {/* Sequence extent indicator */}
        <div
          className="absolute top-0 h-full rounded-sm bg-white/5"
          style={{
            left: sequence.startOffset * pixelsPerSecond,
            width: sequence.duration * pixelsPerSecond,
          }}
        />

        {/* Keyframe dots */}
        {sequence.keyframes.map((kf) => {
          const leftPx = (sequence.startOffset + kf.time) * pixelsPerSecond;
          return (
            <KeyframeDot
              key={kf.id}
              keyframeId={kf.id}
              leftPx={leftPx}
              isSelected={selectedKeyframeIds.includes(kf.id)}
              onSelect={handleSelectKeyframe}
              onClick={handleClickKeyframe}
              onDoubleClick={handleDoubleClickKeyframe}
            />
          );
        })}

        {/* Keyframe editor popover (portal) */}
        {editingKeyframe && (
          <KeyframeEditor
            keyframe={editingKeyframe}
            anchorEl={rowRef.current}
            anchorLeftPx={(sequence.startOffset + editingKeyframe.time) * pixelsPerSecond}
            onUpdate={handleUpdateKeyframe}
            onRemove={handleRemoveKeyframe}
            onClose={() => setEditingKeyframe(null)}
          />
        )}
      </div>
    </div>
  );
}
