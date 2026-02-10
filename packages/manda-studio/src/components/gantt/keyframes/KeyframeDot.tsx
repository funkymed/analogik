import { useCallback } from "react";

interface KeyframeDotProps {
  keyframeId: string;
  /** Position in pixels from the left of the sequence row. */
  leftPx: number;
  isSelected: boolean;
  onSelect: (keyframeId: string, additive: boolean) => void;
  onDoubleClick: (keyframeId: string) => void;
}

/**
 * Diamond-shaped keyframe marker on a sequence row.
 */
export function KeyframeDot({
  keyframeId,
  leftPx,
  isSelected,
  onSelect,
  onDoubleClick,
}: KeyframeDotProps) {
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      onSelect(keyframeId, e.shiftKey || e.metaKey);
    },
    [keyframeId, onSelect],
  );

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
        "absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 cursor-pointer border",
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
