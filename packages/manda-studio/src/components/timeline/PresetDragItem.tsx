import { useDraggable } from "@dnd-kit/core";

export interface PresetDragItemProps {
  presetId: number;
  name: string;
  thumbnail: string;
}

export function PresetDragItem({ presetId, name, thumbnail }: PresetDragItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `preset-drag-${presetId}`,
    data: { presetId, name, thumbnail },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={[
        "flex h-[60px] w-[80px] shrink-0 cursor-grab flex-col items-center overflow-hidden rounded-md border border-zinc-700 bg-zinc-800 transition-opacity",
        isDragging ? "opacity-40" : "opacity-100 hover:border-zinc-500",
      ].join(" ")}
      title={name}
    >
      {/* Thumbnail */}
      <div className="h-[40px] w-full overflow-hidden bg-zinc-900">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={name}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[9px] text-zinc-600">
            --
          </div>
        )}
      </div>

      {/* Name */}
      <div className="flex w-full flex-1 items-center justify-center px-1">
        <span className="max-w-full truncate text-center text-[9px] leading-tight text-zinc-400">
          {name}
        </span>
      </div>
    </div>
  );
}

/**
 * A non-interactive clone of PresetDragItem, rendered inside DragOverlay.
 */
export function PresetDragOverlay({ name, thumbnail }: { name: string; thumbnail: string }) {
  return (
    <div className="flex h-[60px] w-[80px] shrink-0 flex-col items-center overflow-hidden rounded-md border border-indigo-500 bg-zinc-800 opacity-80 shadow-xl">
      <div className="h-[40px] w-full overflow-hidden bg-zinc-900">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={name}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[9px] text-zinc-600">
            --
          </div>
        )}
      </div>
      <div className="flex w-full flex-1 items-center justify-center px-1">
        <span className="max-w-full truncate text-center text-[9px] leading-tight text-zinc-300">
          {name}
        </span>
      </div>
    </div>
  );
}
