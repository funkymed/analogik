import type { Ref } from "react";
import GripVertical from "lucide-react/dist/esm/icons/grip-vertical.js";
import X from "lucide-react/dist/esm/icons/x.js";
import type { SequenceType } from "@/timeline/ganttTypes.ts";

interface SequenceLabelProps {
  label: string;
  type: SequenceType;
  /** Ref forwarded from useSortable for the drag handle. */
  dragHandleRef?: Ref<HTMLButtonElement>;
  /** Drag handle listeners from useSortable. */
  dragHandleListeners?: Record<string, unknown>;
  onRemove: () => void;
}

const TYPE_COLORS: Record<SequenceType, string> = {
  shader: "bg-indigo-500/30 text-indigo-300",
  vumeters: "bg-cyan-500/30 text-cyan-300",
  images: "bg-pink-500/30 text-pink-300",
  texts: "bg-amber-500/30 text-amber-300",
  composer: "bg-violet-500/30 text-violet-300",
};

/**
 * Label shown on the left side of a sequence row, with drag handle and type badge.
 */
export function SequenceLabel({
  label,
  type,
  dragHandleRef,
  dragHandleListeners,
  onRemove,
}: SequenceLabelProps) {
  return (
    <div className="flex h-full w-[120px] shrink-0 items-center gap-1 border-r border-zinc-800/50 px-1">
      {/* Drag handle */}
      <button
        ref={dragHandleRef}
        type="button"
        className="cursor-grab touch-none text-zinc-600 hover:text-zinc-400 active:cursor-grabbing"
        {...(dragHandleListeners as Record<string, unknown>)}
      >
        <GripVertical size={10} />
      </button>

      {/* Type badge */}
      <span
        className={[
          "rounded px-1 py-0.5 text-[8px] font-medium uppercase leading-none",
          TYPE_COLORS[type],
        ].join(" ")}
      >
        {type.slice(0, 3)}
      </span>

      {/* Label */}
      <span className="flex-1 truncate text-[9px] text-zinc-400">{label}</span>

      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 text-zinc-600 hover:text-zinc-400"
      >
        <X size={8} />
      </button>
    </div>
  );
}
