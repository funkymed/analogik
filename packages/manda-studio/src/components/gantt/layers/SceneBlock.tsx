import { useCallback, useEffect, useRef, useState } from "react";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right.js";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down.js";
import X from "lucide-react/dist/esm/icons/x.js";
import { useGanttStore } from "@/store/useGanttStore.ts";
import type { TimelineScene } from "@/timeline/ganttTypes.ts";

const MIN_DURATION = 0.5; // seconds

interface SceneBlockProps {
  scene: TimelineScene;
  pixelsPerSecond: number;
  trackHeight: number;
  isSelected: boolean;
  /** Pixel height of the base scene row (without expanded sequences). */
  rowHeight: number;
  /** Total number of scene tracks available. */
  trackCount: number;
  /** Actual pixel heights of each scene track row (accounts for expanded sequences). */
  sceneTrackHeights: number[];
  onSelect: () => void;
  onUpdate: (patch: Partial<Pick<TimelineScene, "startTime" | "duration">>) => void;
  onToggleCollapse: () => void;
  onRemove: () => void;
  onTrackChange: (newTrackIndex: number) => void;
  onDoubleClick?: () => void;
}

export function SceneBlock({
  scene,
  pixelsPerSecond,
  trackHeight,
  isSelected,
  rowHeight,
  trackCount,
  sceneTrackHeights,
  onSelect,
  onUpdate,
  onToggleCollapse,
  onRemove,
  onTrackChange,
  onDoubleClick,
}: SceneBlockProps) {
  const snapTime = useGanttStore((s) => s.snapTime);

  const left = scene.startTime * pixelsPerSecond;
  const width = scene.duration * pixelsPerSecond;

  // --- Drag to move ---
  const dragRef = useRef<{
    clientX: number;
    clientY: number;
    startTime: number;
    trackIndex: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => { cleanupRef.current?.(); };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
      e.stopPropagation();
      onSelect();
      dragRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        startTime: scene.startTime,
        trackIndex: scene.trackIndex,
      };

      const handlePointerMove = (ev: PointerEvent) => {
        if (!dragRef.current) return;
        const deltaX = ev.clientX - dragRef.current.clientX;
        const deltaY = ev.clientY - dragRef.current.clientY;
        setIsDragging(true);

        // Horizontal: snap the new start time
        const rawTime = dragRef.current.startTime + deltaX / pixelsPerSecond;
        const snapped = snapTime(Math.max(0, rawTime));
        onUpdate({ startTime: snapped });

        // Vertical: compute target track from cumulative heights
        let startTrackY = 0;
        for (let i = 0; i < dragRef.current.trackIndex; i++) {
          startTrackY += sceneTrackHeights[i] ?? rowHeight;
        }
        const targetY = startTrackY + rowHeight / 2 + deltaY;
        let cumY = 0;
        let newTrack = 0;
        for (let i = 0; i < trackCount; i++) {
          const h = sceneTrackHeights[i] ?? rowHeight;
          if (targetY < cumY + h) {
            newTrack = i;
            break;
          }
          cumY += h;
          newTrack = i;
        }
        newTrack = Math.max(0, Math.min(trackCount - 1, newTrack));
        if (newTrack !== scene.trackIndex) {
          onTrackChange(newTrack);
        }
      };

      const handlePointerUp = () => {
        dragRef.current = null;
        setIsDragging(false);
        cleanupRef.current = null;
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      cleanupRef.current = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };
    },
    [onSelect, scene.startTime, scene.trackIndex, pixelsPerSecond, rowHeight, trackCount, sceneTrackHeights, onUpdate, onTrackChange, snapTime],
  );

  // --- Resize ---
  const resizeRef = useRef({ startTime: scene.startTime, duration: scene.duration });

  // Keep ref in sync when not dragging
  useEffect(() => {
    if (!isDragging) {
      resizeRef.current = { startTime: scene.startTime, duration: scene.duration };
    }
  }, [scene.startTime, scene.duration, isDragging]);

  const resizeCleanupRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    return () => { resizeCleanupRef.current?.(); };
  }, []);

  const handleResizeStart = useCallback((e: React.PointerEvent, side: "left" | "right") => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const initial = { ...resizeRef.current };

    const handlePointerMove = (ev: PointerEvent) => {
      const deltaPx = ev.clientX - startX;
      const timeDelta = deltaPx / pixelsPerSecond;

      if (side === "right") {
        const rawEnd = initial.startTime + initial.duration + timeDelta;
        const snappedEnd = snapTime(rawEnd);
        const newDuration = Math.max(MIN_DURATION, snappedEnd - initial.startTime);
        onUpdate({ duration: newDuration });
      } else {
        const endTime = initial.startTime + initial.duration;
        const rawStart = initial.startTime + timeDelta;
        const snappedStart = snapTime(Math.max(0, rawStart));
        const newDuration = endTime - snappedStart;
        if (newDuration >= MIN_DURATION) {
          onUpdate({ startTime: snappedStart, duration: newDuration });
        }
      }
    };

    const handlePointerUp = () => {
      resizeCleanupRef.current = null;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    resizeCleanupRef.current = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [pixelsPerSecond, snapTime, onUpdate, scene.startTime, scene.duration]);

  return (
    <div
      className={[
        "absolute rounded-md border select-none",
        isSelected
          ? "border-white/40 shadow-lg"
          : "border-white/10 hover:border-white/25",
        isDragging ? "cursor-grabbing opacity-80" : "cursor-grab",
        scene.hidden ? "opacity-30" : "",
      ].join(" ")}
      style={{
        left,
        top: Math.round(4 * trackHeight),
        height: Math.round(32 * trackHeight),
        width: Math.max(width, 20),
        backgroundColor: scene.color + "cc",
      }}
      onPointerDown={handlePointerDown}
      onDoubleClick={(e) => {
        if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
        e.stopPropagation();
        onDoubleClick?.();
      }}
    >
      {/* Left resize handle */}
      <div
        data-no-drag
        onPointerDown={(e) => handleResizeStart(e, "left")}
        className="absolute top-0 left-0 z-10 h-full w-1.5 cursor-col-resize opacity-0 transition-opacity hover:opacity-100"
        style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
      />

      {/* Content */}
      <div className="flex h-full items-center gap-1 overflow-hidden px-1.5">
        <button
          type="button"
          data-no-drag
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          className="shrink-0 text-white/60 hover:text-white/90"
        >
          {scene.collapsed ? (
            <ChevronRight size={12} />
          ) : (
            <ChevronDown size={12} />
          )}
        </button>

        <span className="truncate text-[10px] font-medium text-white/90">
          {scene.name}
        </span>

        <div className="flex-1" />

        <button
          type="button"
          data-no-drag
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="shrink-0 text-white/30 hover:text-white/70"
        >
          <X size={10} />
        </button>
      </div>

      {/* Right resize handle */}
      <div
        data-no-drag
        onPointerDown={(e) => handleResizeStart(e, "right")}
        className="absolute top-0 right-0 z-10 h-full w-1.5 cursor-col-resize opacity-0 transition-opacity hover:opacity-100"
        style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
      />
    </div>
  );
}
