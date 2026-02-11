import { useCallback, useEffect, useRef, useState } from "react";
import Volume2 from "lucide-react/dist/esm/icons/volume-2.js";
import VolumeX from "lucide-react/dist/esm/icons/volume-x.js";
import X from "lucide-react/dist/esm/icons/x.js";
import { ResizeHandle } from "../shared/ResizeHandle.tsx";
import { drawWaveform } from "@/utils/drawWaveform.ts";
import type { AudioClip } from "@/timeline/ganttTypes.ts";

interface AudioClipBlockProps {
  clip: AudioClip;
  pixelsPerSecond: number;
  trackHeight: number;
  isSelected: boolean;
  audioBuffer: AudioBuffer | null;
  /** Pixel height of one track row (for vertical drag calculations). */
  rowHeight: number;
  /** Total number of audio tracks available. */
  trackCount: number;
  onSelect: () => void;
  onMove: (newStartTime: number) => void;
  onResize: (newDuration: number) => void;
  onToggleMute: () => void;
  onRemove: () => void;
  onTrackChange: (newTrackIndex: number) => void;
}

export function AudioClipBlock({
  clip,
  pixelsPerSecond,
  trackHeight,
  isSelected,
  audioBuffer,
  rowHeight,
  trackCount,
  onSelect,
  onMove,
  onResize,
  onToggleMute,
  onRemove,
  onTrackChange,
}: AudioClipBlockProps) {
  const left = clip.startTime * pixelsPerSecond;
  const width = clip.duration * pixelsPerSecond;

  // --- Waveform canvas ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer) return;

    let rafId: number | null = null;

    const draw = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      canvas.width = Math.floor(rect.width);
      canvas.height = Math.floor(rect.height);
      drawWaveform(canvas, audioBuffer, clip.trimStart, clip.duration, "rgba(16, 185, 129, 0.4)");
    };

    draw();

    // Throttle ResizeObserver redraws via RAF to avoid N simultaneous
    // canvas redraws during timeline zoom operations.
    const throttledDraw = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        draw();
      });
    };

    const observer = new ResizeObserver(throttledDraw);
    if (canvas.parentElement) {
      observer.observe(canvas.parentElement);
    }

    return () => {
      observer.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [audioBuffer, clip.trimStart, clip.duration]);

  // --- Drag to move (horizontal + vertical) ---
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    startTime: number;
    trackIndex: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCleanupRef = useRef<(() => void) | null>(null);

  // Cleanup drag listeners on unmount to prevent leaks
  useEffect(() => {
    return () => { dragCleanupRef.current?.(); };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
      e.stopPropagation();
      onSelect();
      dragStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        startTime: clip.startTime,
        trackIndex: clip.trackIndex,
      };

      const handlePointerMove = (ev: PointerEvent) => {
        if (!dragStartRef.current) return;
        const deltaX = ev.clientX - dragStartRef.current.clientX;
        const deltaY = ev.clientY - dragStartRef.current.clientY;
        const timeDelta = deltaX / pixelsPerSecond;
        setIsDragging(true);
        onMove(Math.max(0, dragStartRef.current.startTime + timeDelta));

        // Vertical: compute track change
        const trackDelta = Math.round(deltaY / rowHeight);
        const newTrack = Math.max(
          0,
          Math.min(trackCount - 1, dragStartRef.current.trackIndex + trackDelta),
        );
        if (newTrack !== clip.trackIndex) {
          onTrackChange(newTrack);
        }
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
    [onSelect, clip.startTime, clip.trackIndex, pixelsPerSecond, rowHeight, trackCount, onMove, onTrackChange],
  );

  // --- Resize (right only for audio clips) ---
  const resizeStartRef = useRef({ duration: clip.duration });

  const handleResizeRight = useCallback(
    (deltaPx: number) => {
      const timeDelta = deltaPx / pixelsPerSecond;
      const newDuration = Math.max(0.5, resizeStartRef.current.duration + timeDelta);
      onResize(newDuration);
    },
    [pixelsPerSecond, onResize],
  );

  const handleResizeEnd = useCallback(() => {
    resizeStartRef.current = { duration: clip.duration };
  }, [clip.duration]);

  useEffect(() => {
    if (!isDragging) {
      resizeStartRef.current = { duration: clip.duration };
    }
  }, [clip.duration, isDragging]);

  return (
    <div
      ref={containerRef}
      className={[
        "absolute rounded border select-none",
        isSelected
          ? "border-emerald-400/50 shadow-lg"
          : "border-emerald-600/30 hover:border-emerald-500/40",
        clip.muted ? "opacity-40" : "",
        isDragging ? "cursor-grabbing opacity-80" : "cursor-grab",
      ].join(" ")}
      style={{
        left,
        top: Math.round(4 * trackHeight),
        height: Math.round(28 * trackHeight),
        width: Math.max(width, 20),
        backgroundColor: "rgba(16, 185, 129, 0.25)",
      }}
      onPointerDown={handlePointerDown}
    >
      {/* Waveform canvas (background) */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />

      {/* Content */}
      <div className="relative z-10 flex h-full items-center gap-1 overflow-hidden px-1.5">
        <button
          type="button"
          data-no-drag
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
          }}
          className="shrink-0 text-emerald-400/70 hover:text-emerald-300"
        >
          {clip.muted ? <VolumeX size={10} /> : <Volume2 size={10} />}
        </button>

        <span className="truncate text-[9px] font-medium text-emerald-300/90">
          {clip.name}
        </span>

        <div className="flex-1" />

        <button
          type="button"
          data-no-drag
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="shrink-0 text-emerald-400/30 hover:text-emerald-300/70"
        >
          <X size={9} />
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
