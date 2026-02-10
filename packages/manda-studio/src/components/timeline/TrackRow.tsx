import { useCallback } from "react";
import { useDroppable } from "@dnd-kit/core";
import X from "lucide-react/dist/esm/icons/x.js";
import type { Track, TrackAssignment } from "@/timeline/types.ts";

export interface TrackRowProps {
  track: Track;
  assignment: TrackAssignment | undefined;
  isSelected: boolean;
  onSelect: () => void;
  onClearAssignment: () => void;
}

function padIndex(index: number): string {
  return String(index).padStart(3, "0");
}

export function TrackRow({
  track,
  assignment,
  isSelected,
  onSelect,
  onClearAssignment,
}: TrackRowProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `track-drop-${track.index}`,
    data: { trackIndex: track.index },
  });

  const isAssigned = assignment?.presetId !== undefined && assignment?.presetId !== null;

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClearAssignment();
    },
    [onClearAssignment],
  );

  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={[
        "flex cursor-pointer items-center gap-3 rounded-md px-3 py-1.5 text-xs transition-colors",
        isAssigned
          ? "border-l-2 border-l-indigo-500 bg-zinc-800"
          : "bg-zinc-900 text-zinc-500",
        isSelected ? "ring-1 ring-indigo-500" : "",
        isOver ? "border border-dashed border-indigo-400 bg-zinc-800/80" : "",
      ].join(" ")}
    >
      {/* Index */}
      <span className="w-8 shrink-0 font-mono text-zinc-600">
        {padIndex(track.index)}
      </span>

      {/* Filename */}
      <span
        className={[
          "min-w-0 flex-1 truncate",
          isAssigned ? "text-zinc-200" : "text-zinc-500",
        ].join(" ")}
        title={track.filename}
      >
        {track.filename}
      </span>

      {/* Authors */}
      <span className="hidden shrink-0 text-zinc-500 sm:inline">
        {track.author.join(" & ")}
      </span>

      {/* Year */}
      <span className="w-10 shrink-0 text-right text-zinc-600">{track.year}</span>

      {/* Assignment status */}
      <span className="w-32 shrink-0 truncate text-right">
        {isAssigned ? (
          <span className="inline-flex items-center gap-1">
            <span className="truncate text-indigo-400" title={assignment.presetName ?? undefined}>
              {assignment.presetName}
            </span>
            <button
              type="button"
              onClick={handleClear}
              className="rounded p-0.5 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-300"
              aria-label={`Clear assignment for track ${track.index}`}
            >
              <X size={10} />
            </button>
          </span>
        ) : (
          <span className="text-zinc-600">unassigned</span>
        )}
      </span>
    </div>
  );
}
