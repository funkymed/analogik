import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useGanttStore } from "@/store/useGanttStore.ts";
import { useTrackHeights } from "@/hooks/useTrackHeights.ts";
import { getPreset } from "@/db/presetService.ts";
import { getAudioItem } from "@/db/libraryService.ts";
import { TimeGrid } from "./shared/TimeGrid.tsx";
import { Playhead } from "./shared/Playhead.tsx";

interface TimelineViewportProps {
  children: ReactNode;
  onVerticalScroll?: (scrollTop: number) => void;
  onLoadAudioFile?: (file: File, trackIndex?: number, startTime?: number) => Promise<void>;
}

export function TimelineViewport({ children, onVerticalScroll, onLoadAudioFile }: TimelineViewportProps) {
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

  const { totalHeight: viewportHeight } = useTrackHeights();

  const duration = getTimelineDuration();
  const totalWidth = duration * pixelsPerSecond;

  // Center-locked follow: playhead stays at viewport center,
  // except at the very start (scroll=0) and very end (scroll=max).
  useEffect(() => {
    if (!followPlayhead || !isPlaying) return;

    const el = scrollRef.current;
    if (!el) return;

    const playheadX = currentTime * pixelsPerSecond;
    const viewportWidth = el.clientWidth;
    const halfView = viewportWidth / 2;
    const maxScroll = el.scrollWidth - viewportWidth;

    // Desired scroll = playhead at center
    const idealScroll = playheadX - halfView;
    // Clamp to [0, maxScroll] — handles start & end phases naturally
    el.scrollLeft = Math.max(0, Math.min(maxScroll, idealScroll));
  }, [currentTime, pixelsPerSecond, followPlayhead, isPlaying]);

  // Use refs to read latest values without re-attaching the wheel listener.
  const ppsRef = useRef(pixelsPerSecond);
  ppsRef.current = pixelsPerSecond;
  const trackHeightRef = useRef(trackHeight);
  trackHeightRef.current = trackHeight;

  // Ctrl+wheel = horizontal zoom, Shift+wheel = vertical zoom
  // Attached once — reads mutable refs to avoid listener churn during zoom.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 1 / 1.15 : 1.15;
        setPixelsPerSecond(ppsRef.current * factor);
      } else if (e.shiftKey) {
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
      onVerticalScroll?.(el.scrollTop);
    }
  }, [setScrollLeft, onVerticalScroll]);

  // Click on empty area to seek
  // --- Drop handling for library items ---
  const [dropOver, setDropOver] = useState(false);
  const { sceneTrackHeights, audioTrackHeights } = useTrackHeights();
  const addScene = useGanttStore((s) => s.addScene);
  const getDropTarget = useCallback(
    (e: React.DragEvent) => {
      const el = scrollRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left + el.scrollLeft;
      const y = e.clientY - rect.top + el.scrollTop;
      const time = Math.max(0, x / pixelsPerSecond);

      // Determine if drop is on scene tracks or audio tracks
      let cumY = 0;
      for (let i = 0; i < sceneTrackHeights.length; i++) {
        cumY += sceneTrackHeights[i];
        if (y < cumY) {
          return { zone: "scene" as const, trackIndex: i, time };
        }
      }
      // +1 px for separator
      cumY += 1;
      for (let i = 0; i < audioTrackHeights.length; i++) {
        cumY += audioTrackHeights[i];
        if (y < cumY) {
          return { zone: "audio" as const, trackIndex: i, time };
        }
      }
      return { zone: "audio" as const, trackIndex: audioTrackHeights.length - 1, time };
    },
    [pixelsPerSecond, sceneTrackHeights, audioTrackHeights],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (e.dataTransfer.types.includes("application/x-manda-library")) {
        e.preventDefault();
        setDropOver(true);
      }
    },
    [],
  );

  const handleDragLeave = useCallback(() => {
    setDropOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDropOver(false);

      const raw = e.dataTransfer.getData("application/x-manda-library");
      if (!raw) return;

      let data: { type: string; id: number };
      try {
        data = JSON.parse(raw);
      } catch {
        return;
      }

      const target = getDropTarget(e);
      if (!target) return;

      if (data.type === "scenes" && target.zone === "scene") {
        // Load preset config and create a scene at the drop position
        const preset = await getPreset(data.id);
        if (!preset) return;
        const sceneConfig = preset.config;
        const id = addScene(sceneConfig, preset.name, target.trackIndex);
        // Update the scene start time to the drop position
        const { updateScene } = useGanttStore.getState();
        updateScene(id, { startTime: useGanttStore.getState().snapTime(target.time) });
      } else if (data.type === "audio" && target.zone === "audio") {
        // Load audio blob via the playback engine so buffer is decoded (waveform + playback)
        const audioItem = await getAudioItem(data.id);
        if (!audioItem) return;
        const file = new File([audioItem.blob], audioItem.name, { type: audioItem.mimeType });
        const dropTime = useGanttStore.getState().snapTime(target.time);
        await onLoadAudioFile?.(file, target.trackIndex, dropTime);
      } else if (data.type === "scenes" && target.zone === "audio") {
        // Can't drop scenes on audio tracks - ignore
      } else if (data.type === "audio" && target.zone === "scene") {
        // Can't drop audio on scene tracks - ignore
      }
    },
    [getDropTarget, addScene, onLoadAudioFile],
  );

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
      className={`relative flex-1 overflow-x-auto overflow-y-auto ${dropOver ? "ring-2 ring-inset ring-indigo-500/50" : ""}`}
      onScroll={handleScroll}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={(e) => void handleDrop(e)}
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
