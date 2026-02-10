import { useCallback, useState } from "react";
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
  const selectKeyframes = useGanttStore((s) => s.selectKeyframes);
  const addKeyframe = useGanttStore((s) => s.addKeyframe);
  const updateKeyframe = useGanttStore((s) => s.updateKeyframe);
  const removeKeyframe = useGanttStore((s) => s.removeKeyframe);
  const removeSequence = useGanttStore((s) => s.removeSequence);

  const [editingKeyframeId, setEditingKeyframeId] = useState<string | null>(null);

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

  const handleDoubleClickKeyframe = useCallback((kfId: string) => {
    setEditingKeyframeId(kfId);
  }, []);

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
  const editingKeyframe = editingKeyframeId
    ? sequence.keyframes.find((kf) => kf.id === editingKeyframeId) ?? null
    : null;

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
    setEditingKeyframeId(null);
  }, [sceneId, sequence.id, editingKeyframeId, removeKeyframe]);

  const handleCloseEditor = useCallback(() => {
    setEditingKeyframeId(null);
  }, []);

  return (
    <div
      ref={setNodeRef}
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
              onDoubleClick={handleDoubleClickKeyframe}
            />
          );
        })}

        {/* Keyframe editor popover */}
        {editingKeyframe && (
          <KeyframeEditor
            keyframe={editingKeyframe}
            anchorLeftPx={(sequence.startOffset + editingKeyframe.time) * pixelsPerSecond}
            onUpdate={handleUpdateKeyframe}
            onRemove={handleRemoveKeyframe}
            onClose={handleCloseEditor}
          />
        )}
      </div>
    </div>
  );
}
