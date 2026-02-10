import { useCallback, useEffect, useRef, useState } from "react";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right.js";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down.js";
import X from "lucide-react/dist/esm/icons/x.js";
import { ResizeHandle } from "../shared/ResizeHandle.tsx";
import type { TimelineScene } from "@/timeline/ganttTypes.ts";

interface SceneBlockProps {
  scene: TimelineScene;
  pixelsPerSecond: number;
  trackHeight: number;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (newStartTime: number) => void;
  onResize: (newDuration: number, side: "left" | "right") => void;
  onToggleCollapse: () => void;
  onRemove: () => void;
}

export function SceneBlock({
  scene,
  pixelsPerSecond,
  trackHeight,
  isSelected,
  onSelect,
  onMove,
  onResize,
  onToggleCollapse,
  onRemove,
}: SceneBlockProps) {
  const left = scene.startTime * pixelsPerSecond;
  const width = scene.duration * pixelsPerSecond;

  // --- Drag to move ---
  const dragStartRef = useRef<{ clientX: number; startTime: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCleanupRef = useRef<(() => void) | null>(null);

  // Cleanup drag listeners on unmount to prevent leaks
  useEffect(() => {
    return () => { dragCleanupRef.current?.(); };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Ignore if clicking on resize handle or buttons
      if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
      e.stopPropagation();
      onSelect();
      dragStartRef.current = { clientX: e.clientX, startTime: scene.startTime };

      const handlePointerMove = (ev: PointerEvent) => {
        if (!dragStartRef.current) return;
        const delta = ev.clientX - dragStartRef.current.clientX;
        const timeDelta = delta / pixelsPerSecond;
        setIsDragging(true);
        onMove(Math.max(0, dragStartRef.current.startTime + timeDelta));
      };

      const handlePointerUp = () => {
        dragStartRef.current = null;
        setIsDragging(false);
        dragCleanupRef.current = null;
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);

      dragCleanupRef.current = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };
    },
    [onSelect, scene.startTime, pixelsPerSecond, onMove],
  );

  // --- Resize ---
  const resizeStartRef = useRef({ duration: scene.duration, startTime: scene.startTime });

  const handleResizeLeft = useCallback(
    (deltaPx: number) => {
      const timeDelta = deltaPx / pixelsPerSecond;
      const newStart = Math.max(0, resizeStartRef.current.startTime + timeDelta);
      const newDuration = resizeStartRef.current.duration - (newStart - resizeStartRef.current.startTime);
      if (newDuration >= 1) {
        onResize(newDuration, "left");
        onMove(newStart);
      }
    },
    [pixelsPerSecond, onResize, onMove],
  );

  const handleResizeRight = useCallback(
    (deltaPx: number) => {
      const timeDelta = deltaPx / pixelsPerSecond;
      const newDuration = Math.max(1, resizeStartRef.current.duration + timeDelta);
      onResize(newDuration, "right");
    },
    [pixelsPerSecond, onResize],
  );

  const handleResizeEnd = useCallback(() => {
    resizeStartRef.current = { duration: scene.duration, startTime: scene.startTime };
  }, [scene.duration, scene.startTime]);

  // Keep resizeStartRef in sync when scene changes (non-drag)
  useEffect(() => {
    if (!isDragging) {
      resizeStartRef.current = { duration: scene.duration, startTime: scene.startTime };
    }
  }, [scene.duration, scene.startTime, isDragging]);

  return (
    <div
      className={[
        "absolute rounded-md border select-none",
        isSelected
          ? "border-white/40 shadow-lg"
          : "border-white/10 hover:border-white/25",
        isDragging ? "cursor-grabbing opacity-80" : "cursor-grab",
      ].join(" ")}
      style={{
        left,
        top: Math.round(4 * trackHeight),
        height: Math.round(32 * trackHeight),
        width: Math.max(width, 20),
        backgroundColor: scene.color + "cc",
      }}
      onPointerDown={handlePointerDown}
    >
      {/* Left resize handle */}
      <ResizeHandle
        side="left"
        onResize={handleResizeLeft}
        onResizeEnd={handleResizeEnd}
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
      <ResizeHandle
        side="right"
        onResize={handleResizeRight}
        onResizeEnd={handleResizeEnd}
      />
    </div>
  );
}
