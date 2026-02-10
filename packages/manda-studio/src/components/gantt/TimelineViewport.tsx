import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { useGanttStore } from "@/store/useGanttStore.ts";
import { TimeGrid } from "./shared/TimeGrid.tsx";
import { Playhead } from "./shared/Playhead.tsx";

interface TimelineViewportProps {
  children: ReactNode;
}

export function TimelineViewport({ children }: TimelineViewportProps) {
  const pixelsPerSecond = useGanttStore((s) => s.pixelsPerSecond);
  const setPixelsPerSecond = useGanttStore((s) => s.setPixelsPerSecond);
  const currentTime = useGanttStore((s) => s.currentTime);
  const setScrollLeft = useGanttStore((s) => s.setScrollLeft);
  const setCurrentTime = useGanttStore((s) => s.setCurrentTime);
  const getTimelineDuration = useGanttStore((s) => s.getTimelineDuration);
  const trackHeight = useGanttStore((s) => s.trackHeight);
  const setTrackHeight = useGanttStore((s) => s.setTrackHeight);

  const isPlaying = useGanttStore((s) => s.isPlaying);
  const followPlayhead = useGanttStore((s) => s.followPlayhead);

  const scrollRef = useRef<HTMLDivElement>(null);

  const duration = getTimelineDuration();
  const totalWidth = duration * pixelsPerSecond;
  const viewportHeight = Math.round(120 * trackHeight);

  // Auto-scroll to keep playhead visible when follow is enabled
  useEffect(() => {
    if (!followPlayhead || !isPlaying) return;

    const el = scrollRef.current;
    if (!el) return;

    const playheadX = currentTime * pixelsPerSecond;
    const viewportWidth = el.clientWidth;
    const margin = viewportWidth * 0.2; // keep 20% margin from the right edge

    if (playheadX < el.scrollLeft || playheadX > el.scrollLeft + viewportWidth - margin) {
      el.scrollLeft = playheadX - margin;
    }
  }, [currentTime, pixelsPerSecond, followPlayhead, isPlaying]);

  // Use refs to read latest values without re-attaching the wheel listener.
  const ppsRef = useRef(pixelsPerSecond);
  ppsRef.current = pixelsPerSecond;
  const trackHeightRef = useRef(trackHeight);
  trackHeightRef.current = trackHeight;

  // Shift+wheel = horizontal zoom, Ctrl+wheel = vertical zoom
  // Attached once — reads mutable refs to avoid listener churn during zoom.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.shiftKey) {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 1 / 1.15 : 1.15;
        setPixelsPerSecond(ppsRef.current * factor);
      } else if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 1 / 1.15 : 1.15;
        setTrackHeight(trackHeightRef.current * factor);
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [setPixelsPerSecond, setTrackHeight]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      setScrollLeft(el.scrollLeft);
    }
  }, [setScrollLeft]);

  // Click on empty area to seek
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      // Only seek when clicking on the viewport background, not on blocks
      if (target !== e.currentTarget && !target.hasAttribute("data-timeline-bg")) return;
      const el = scrollRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left + el.scrollLeft;
      const time = Math.max(0, x / pixelsPerSecond);
      setCurrentTime(time);
    },
    [pixelsPerSecond, setCurrentTime],
  );

  return (
    <div
      ref={scrollRef}
      className="relative flex-1 overflow-x-auto overflow-y-auto"
      onScroll={handleScroll}
      onClick={handleClick}
    >
      <div data-timeline-bg className="relative" style={{ width: totalWidth, minHeight: viewportHeight }}>
        <TimeGrid
          duration={duration}
          pixelsPerSecond={pixelsPerSecond}
          height={viewportHeight}
        />

        {/* Layer content */}
        <div className="relative z-10">{children}</div>

        <Playhead
          currentTime={currentTime}
          pixelsPerSecond={pixelsPerSecond}
          height={viewportHeight}
        />
      </div>
    </div>
  );
}
