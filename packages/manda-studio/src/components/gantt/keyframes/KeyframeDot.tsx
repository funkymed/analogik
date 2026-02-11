import { useCallback, useRef, useState } from "react";

interface KeyframeDotProps {
  keyframeId: string;
  /** Position in pixels from the left of the sequence row. */
  leftPx: number;
  isSelected: boolean;
  onSelect: (keyframeId: string, additive: boolean) => void;
  /** Single click: seek playhead to this keyframe's time. */
  onClick: (keyframeId: string) => void;
  /** Double-click: open the editor popover. */
  onDoubleClick: (keyframeId: string) => void;
  /** Drag delta in pixels (horizontal). Called during drag. */
  onDrag?: (keyframeId: string, deltaPx: number) => void;
  /** Called when drag finishes. */
  onDragEnd?: (keyframeId: string) => void;
}

/** Minimum movement in px before we consider it a drag (not a click). */
const DRAG_THRESHOLD = 3;

/**
 * Diamond-shaped keyframe marker on a sequence row.
 * Supports horizontal dragging to move keyframes in time.
 */
export function KeyframeDot({
  keyframeId,
  leftPx,
  isSelected,
  onSelect,
  onClick,
  onDoubleClick,
  onDrag,
  onDragEnd,
}: KeyframeDotProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; dragging: boolean } | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      onSelect(keyframeId, e.shiftKey || e.metaKey);

      dragRef.current = { startX: e.clientX, dragging: false };

      const handlePointerMove = (ev: PointerEvent) => {
        if (!dragRef.current) return;
        const delta = ev.clientX - dragRef.current.startX;
        if (!dragRef.current.dragging && Math.abs(delta) >= DRAG_THRESHOLD) {
          dragRef.current.dragging = true;
          setIsDragging(true);
        }
        if (dragRef.current.dragging) {
          onDrag?.(keyframeId, delta);
        }
      };

      const handlePointerUp = () => {
        const wasDragging = dragRef.current?.dragging ?? false;
        dragRef.current = null;
        setIsDragging(false);
        cleanupRef.current = null;
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);

        if (wasDragging) {
          onDragEnd?.(keyframeId);
        } else {
          onClick(keyframeId);
        }
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      cleanupRef.current = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };
    },
    [keyframeId, onSelect, onClick, onDrag, onDragEnd],
  );

  // No separate cleanup effect needed — cleanupRef is called in handlePointerUp
  // and listeners are removed. If unmounted mid-drag, React removes the DOM
  // element and the pointermove/pointerup just no-op.

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDoubleClick(keyframeId);
    },
    [keyframeId, onDoubleClick],
  );

  return (
    <div
      data-no-drag
      className={[
        "absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border",
        isDragging ? "cursor-ew-resize" : "cursor-pointer",
        isSelected
          ? "border-yellow-400 bg-yellow-400"
          : "border-yellow-500/60 bg-yellow-500/40 hover:bg-yellow-500/70",
      ].join(" ")}
      style={{ left: leftPx }}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      title="Keyframe"
    />
  );
}
