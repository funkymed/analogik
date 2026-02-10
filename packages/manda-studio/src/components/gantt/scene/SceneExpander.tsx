import { useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import Plus from "lucide-react/dist/esm/icons/plus.js";
import type { TimelineScene, SequenceType } from "@/timeline/ganttTypes.ts";
import { useGanttStore } from "@/store/useGanttStore.ts";
import { SequenceRow } from "./SequenceRow.tsx";

interface SceneExpanderProps {
  scene: TimelineScene;
  pixelsPerSecond: number;
}

const SEQUENCE_TYPES: { value: SequenceType; label: string }[] = [
  { value: "shader", label: "Shader" },
  { value: "composer", label: "Composer" },
  { value: "vumeters", label: "Vumeters" },
  { value: "images", label: "Images" },
  { value: "texts", label: "Texts" },
];

/**
 * Collapsible container that shows sequences below a scene block.
 * Only rendered when scene.collapsed === false.
 */
export function SceneExpander({ scene, pixelsPerSecond }: SceneExpanderProps) {
  const addSequence = useGanttStore((s) => s.addSequence);
  const reorderSequences = useGanttStore((s) => s.reorderSequences);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const ids = scene.sequences.map((s) => s.id);
      const oldIndex = ids.indexOf(active.id as string);
      const newIndex = ids.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return;

      // arrayMove
      const reordered = [...ids];
      const [removed] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, removed);

      reorderSequences(scene.id, reordered);
    },
    [scene.id, scene.sequences, reorderSequences],
  );

  const handleAddSequence = useCallback(
    (type: SequenceType) => {
      addSequence(scene.id, {
        type,
        label: `${type} ${scene.sequences.length + 1}`,
        startOffset: 0,
        duration: scene.duration,
        order: scene.sequences.length,
        baseConfig: {},
        keyframes: [],
      });
    },
    [addSequence, scene.id, scene.duration, scene.sequences.length],
  );

  const sequenceIds = scene.sequences.map((s) => s.id);

  return (
    <div className="border-b border-zinc-800/30 bg-zinc-900/40">
      {/* Sequence rows */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sequenceIds} strategy={verticalListSortingStrategy}>
          {scene.sequences.map((seq) => (
            <SequenceRow
              key={seq.id}
              sceneId={scene.id}
              sequence={seq}
              pixelsPerSecond={pixelsPerSecond}
              sceneStartTime={scene.startTime}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Add sequence button row */}
      <div className="flex h-5 items-center gap-1 px-1">
        <Plus size={8} className="text-zinc-600" />
        {SEQUENCE_TYPES.map((st) => (
          <button
            key={st.value}
            type="button"
            onClick={() => handleAddSequence(st.value)}
            className="rounded px-1 py-0.5 text-[8px] text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400"
          >
            {st.label}
          </button>
        ))}
      </div>
    </div>
  );
}
