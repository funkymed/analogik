import { PresetDragItem } from "./PresetDragItem.tsx";
import type { ScenePreset } from "@/db/types.ts";

export interface PresetPaletteProps {
  presets: ScenePreset[];
}

export function PresetPalette({ presets }: PresetPaletteProps) {
  if (presets.length === 0) {
    return (
      <div className="px-3 py-2 text-xs text-zinc-600">
        No presets in library. Save a scene first.
      </div>
    );
  }

  return (
    <div className="shrink-0 border-b border-zinc-800 px-3 py-2">
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        Drag presets to tracks:
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {presets.map((preset) => (
          <PresetDragItem
            key={preset.id}
            presetId={preset.id!}
            name={preset.name}
            thumbnail={preset.thumbnail}
          />
        ))}
      </div>
    </div>
  );
}
