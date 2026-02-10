import { useState, useCallback, useEffect, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up.js";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down.js";
import Wand2 from "lucide-react/dist/esm/icons/wand-2.js";
import Trash2 from "lucide-react/dist/esm/icons/trash-2.js";
import Upload from "lucide-react/dist/esm/icons/upload.js";
import Download from "lucide-react/dist/esm/icons/download.js";
import { useTimelineStore } from "@/store/useTimelineStore.ts";
import { usePresets } from "@/hooks/usePresets.ts";
import { exportTimeline, importTimeline } from "@/timeline/index.ts";
import { TrackRow } from "./TrackRow.tsx";
import { PresetPalette } from "./PresetPalette.tsx";
import { PresetDragOverlay } from "./PresetDragItem.tsx";

interface ActiveDrag {
  presetId: number;
  name: string;
  thumbnail: string;
}

export function TimelinePanel() {
  const [expanded, setExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Timeline store
  const tracks = useTimelineStore((s) => s.tracks);
  const assignments = useTimelineStore((s) => s.assignments);
  const selectedTrackIndex = useTimelineStore((s) => s.selectedTrackIndex);
  const setSelectedTrackIndex = useTimelineStore((s) => s.setSelectedTrackIndex);
  const assignPreset = useTimelineStore((s) => s.assignPreset);
  const clearAssignment = useTimelineStore((s) => s.clearAssignment);
  const clearAll = useTimelineStore((s) => s.clearAll);
  const autoAssign = useTimelineStore((s) => s.autoAssign);
  const yearFilter = useTimelineStore((s) => s.yearFilter);
  const authorFilter = useTimelineStore((s) => s.authorFilter);
  const setYearFilter = useTimelineStore((s) => s.setYearFilter);
  const setAuthorFilter = useTimelineStore((s) => s.setAuthorFilter);
  const getFilteredTracks = useTimelineStore((s) => s.getFilteredTracks);
  const getUniqueYears = useTimelineStore((s) => s.getUniqueYears);
  const getUniqueAuthors = useTimelineStore((s) => s.getUniqueAuthors);
  const getAssignedCount = useTimelineStore((s) => s.getAssignedCount);
  const setAssignments = useTimelineStore((s) => s.setAssignments);
  const setTracks = useTimelineStore((s) => s.setTracks);

  // Presets from library
  const { presets } = usePresets();

  // Computed values
  const filteredTracks = getFilteredTracks();
  const uniqueYears = getUniqueYears();
  const uniqueAuthors = getUniqueAuthors();
  const assignedCount = getAssignedCount();

  // DnD state
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);

  // Use PointerSensor with a small activation distance to avoid interfering
  // with clicks on buttons, sliders, and other interactive elements.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as
      | { presetId: number; name: string; thumbnail: string }
      | undefined;
    if (data) {
      setActiveDrag({
        presetId: data.presetId,
        name: data.name,
        thumbnail: data.thumbnail,
      });
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDrag(null);

      const { over } = event;
      if (!over) return;

      const dropData = over.data.current as { trackIndex: number } | undefined;
      if (!dropData) return;

      if (!activeDrag) return;

      assignPreset(dropData.trackIndex, activeDrag.presetId, activeDrag.name);
    },
    [activeDrag, assignPreset],
  );

  const handleDragCancel = useCallback(() => {
    setActiveDrag(null);
  }, []);

  // Auto-assign handler
  const handleAutoAssign = useCallback(() => {
    const ids = presets
      .filter((p) => p.id !== undefined)
      .map((p) => p.id!);
    const nameMap = new Map<number, string>();
    for (const p of presets) {
      if (p.id !== undefined) {
        nameMap.set(p.id, p.name);
      }
    }
    autoAssign(ids, nameMap);
  }, [presets, autoAssign]);

  // Export handler
  const handleExport = useCallback(() => {
    const data = exportTimeline(tracks, assignments);
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "mandastudio-timeline.json";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [tracks, assignments]);

  // Import handler
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      void file.text().then((text) => {
        try {
          const parsed = JSON.parse(text) as ReturnType<typeof exportTimeline>;
          const result = importTimeline(parsed);
          setTracks(result.tracks);
          setAssignments(result.assignments);
        } catch {
          // Silently ignore invalid files
        }
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [setTracks, setAssignments],
  );

  // Scroll compact view to keep selected track visible
  const compactScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedTrackIndex === null || !compactScrollRef.current) return;
    const el = compactScrollRef.current.querySelector(
      `[data-track-index="${selectedTrackIndex}"]`,
    );
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [selectedTrackIndex]);

  // -----------------------------------------------------------------------
  // Compact view
  // -----------------------------------------------------------------------
  if (!expanded) {
    return (
      <div className="flex h-12 shrink-0 items-center gap-3 border-t border-zinc-800 bg-zinc-900/80 px-4">
        {/* Left label */}
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs font-medium text-zinc-400">Timeline</span>
          <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
            {tracks.length}
          </span>
          {assignedCount > 0 && (
            <span className="rounded-full bg-indigo-500/20 px-1.5 py-0.5 text-[10px] text-indigo-400">
              {assignedCount} assigned
            </span>
          )}
        </div>

        {/* Center: scrollable track chips */}
        <div
          ref={compactScrollRef}
          className="flex flex-1 items-center gap-1 overflow-x-auto"
        >
          {tracks.map((track) => {
            const isAssigned = assignments.has(track.index);
            const isSelected = selectedTrackIndex === track.index;
            return (
              <button
                key={track.index}
                type="button"
                data-track-index={track.index}
                onClick={() => setSelectedTrackIndex(track.index)}
                className={[
                  "shrink-0 rounded px-1.5 py-0.5 text-[10px] transition-colors",
                  isAssigned
                    ? "bg-indigo-500/20 text-indigo-400"
                    : "bg-zinc-800 text-zinc-600",
                  isSelected ? "ring-1 ring-indigo-500" : "",
                ].join(" ")}
                title={`${track.filename}${isAssigned ? ` (${assignments.get(track.index)?.presetName ?? ""})` : ""}`}
              >
                {String(track.index).padStart(2, "0")}
              </button>
            );
          })}
        </div>

        {/* Expand button */}
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="shrink-0 rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          aria-label="Expand timeline"
        >
          <ChevronUp size={14} />
        </button>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Expanded view
  // -----------------------------------------------------------------------
  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex h-[300px] shrink-0 flex-col border-t border-zinc-800 bg-zinc-900/80">
        {/* Toolbar */}
        <div className="flex shrink-0 items-center gap-2 border-b border-zinc-800 px-3 py-1.5">
          {/* Year filter */}
          <select
            value={yearFilter ?? ""}
            onChange={(e) => setYearFilter(e.target.value || null)}
            className="rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-300 outline-none"
            aria-label="Filter by year"
          >
            <option value="">All years</option>
            {uniqueYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Author filter */}
          <select
            value={authorFilter ?? ""}
            onChange={(e) => setAuthorFilter(e.target.value || null)}
            className="rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-300 outline-none"
            aria-label="Filter by author"
          >
            <option value="">All authors</option>
            {uniqueAuthors.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <div className="flex-1" />

          {/* Auto-assign */}
          <button
            type="button"
            onClick={handleAutoAssign}
            disabled={presets.length === 0}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-default disabled:text-zinc-600 disabled:hover:bg-transparent"
            title="Auto-assign presets to unassigned tracks"
          >
            <Wand2 size={12} />
            Auto-assign
          </button>

          {/* Clear all */}
          <button
            type="button"
            onClick={clearAll}
            disabled={assignedCount === 0}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-default disabled:text-zinc-600 disabled:hover:bg-transparent"
            title="Clear all assignments"
          >
            <Trash2 size={12} />
            Clear All
          </button>

          {/* Import */}
          <button
            type="button"
            onClick={handleImportClick}
            className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            title="Import timeline"
          >
            <Upload size={12} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Export */}
          <button
            type="button"
            onClick={handleExport}
            disabled={tracks.length === 0}
            className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-default disabled:text-zinc-600 disabled:hover:bg-transparent"
            title="Export timeline"
          >
            <Download size={12} />
          </button>

          {/* Collapse */}
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            aria-label="Collapse timeline"
          >
            <ChevronDown size={14} />
          </button>
        </div>

        {/* Preset palette */}
        <PresetPalette presets={presets.filter((p) => p.id !== undefined)} />

        {/* Track list */}
        <div className="flex-1 overflow-y-auto px-3 py-1.5">
          {filteredTracks.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-zinc-600">
              {tracks.length === 0
                ? "No tracks loaded. Import a timeline or load tracks."
                : "No tracks match the current filters."}
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {filteredTracks.map((track) => (
                <TrackRow
                  key={track.index}
                  track={track}
                  assignment={assignments.get(track.index)}
                  isSelected={selectedTrackIndex === track.index}
                  onSelect={() => setSelectedTrackIndex(track.index)}
                  onClearAssignment={() => clearAssignment(track.index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Drag overlay - rendered outside scroll containers for correct positioning */}
      <DragOverlay dropAnimation={null}>
        {activeDrag ? (
          <PresetDragOverlay
            name={activeDrag.name}
            thumbnail={activeDrag.thumbnail}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
