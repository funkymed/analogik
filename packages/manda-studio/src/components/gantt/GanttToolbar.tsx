import { useCallback } from "react";
import {
  Play,
  Pause,
  Square,
  Repeat,
  ZoomIn,
  ZoomOut,
  Magnet,
  Plus,
  ScanLine,
  PanelBottomOpen,
  PanelBottomClose,
} from "lucide-react";
import { useGanttStore } from "@/store/useGanttStore.ts";
import { useStudioStore } from "@/store/useStudioStore.ts";
import { formatTime } from "@/utils/formatTime.ts";

export function GanttToolbar() {
  const isPlaying = useGanttStore((s) => s.isPlaying);
  const setPlaying = useGanttStore((s) => s.setPlaying);
  const currentTime = useGanttStore((s) => s.currentTime);
  const setCurrentTime = useGanttStore((s) => s.setCurrentTime);
  const loopEnabled = useGanttStore((s) => s.loopEnabled);
  const setLoopEnabled = useGanttStore((s) => s.setLoopEnabled);
  const pixelsPerSecond = useGanttStore((s) => s.pixelsPerSecond);
  const setPixelsPerSecond = useGanttStore((s) => s.setPixelsPerSecond);
  const snapEnabled = useGanttStore((s) => s.snapEnabled);
  const setSnapEnabled = useGanttStore((s) => s.setSnapEnabled);
  const followPlayhead = useGanttStore((s) => s.followPlayhead);
  const setFollowPlayhead = useGanttStore((s) => s.setFollowPlayhead);
  const timelineExpanded = useGanttStore((s) => s.timelineExpanded);
  const toggleTimelineExpanded = useGanttStore((s) => s.toggleTimelineExpanded);
  const addScene = useGanttStore((s) => s.addScene);
  const config = useStudioStore((s) => s.config);

  const handlePlayPause = useCallback(() => {
    setPlaying(!isPlaying);
  }, [isPlaying, setPlaying]);

  const handleStop = useCallback(() => {
    setPlaying(false);
    setCurrentTime(0);
  }, [setPlaying, setCurrentTime]);

  const handleZoomIn = useCallback(() => {
    setPixelsPerSecond(pixelsPerSecond * 1.5);
  }, [pixelsPerSecond, setPixelsPerSecond]);

  const handleZoomOut = useCallback(() => {
    setPixelsPerSecond(pixelsPerSecond / 1.5);
  }, [pixelsPerSecond, setPixelsPerSecond]);

  const handleAddScene = useCallback(() => {
    addScene(config);
  }, [addScene, config]);

  return (
    <div className="flex shrink-0 items-center gap-1 border-b border-zinc-800 px-2 py-1">
      {/* Transport controls */}
      <button
        type="button"
        onClick={handlePlayPause}
        className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
      </button>

      <button
        type="button"
        onClick={handleStop}
        className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        title="Stop"
      >
        <Square size={12} />
      </button>

      {/* Loop toggle */}
      <button
        type="button"
        onClick={() => setLoopEnabled(!loopEnabled)}
        className={[
          "rounded p-1 transition-colors",
          loopEnabled
            ? "bg-indigo-500/20 text-indigo-400"
            : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300",
        ].join(" ")}
        title={loopEnabled ? "Loop enabled" : "Loop disabled"}
      >
        <Repeat size={12} />
      </button>

      {/* Current time display */}
      <span className="min-w-[3rem] text-center font-mono text-[10px] text-zinc-400">
        {formatTime(currentTime)}
      </span>

      <div className="mx-1 h-4 w-px bg-zinc-800" />

      {/* Add scene */}
      <button
        type="button"
        onClick={handleAddScene}
        className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        title="Add scene from current config"
      >
        <Plus size={12} />
        Scene
      </button>

      <div className="flex-1" />

      {/* Snap toggle */}
      <button
        type="button"
        onClick={() => setSnapEnabled(!snapEnabled)}
        className={[
          "rounded p-1 transition-colors",
          snapEnabled
            ? "bg-indigo-500/20 text-indigo-400"
            : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300",
        ].join(" ")}
        title={snapEnabled ? "Snap enabled" : "Snap disabled"}
      >
        <Magnet size={12} />
      </button>

      {/* Follow playhead toggle */}
      <button
        type="button"
        onClick={() => setFollowPlayhead(!followPlayhead)}
        className={[
          "rounded p-1 transition-colors",
          followPlayhead
            ? "bg-indigo-500/20 text-indigo-400"
            : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300",
        ].join(" ")}
        title={followPlayhead ? "Follow playhead" : "Free scroll"}
      >
        <ScanLine size={12} />
      </button>

      {/* Expand timeline to half screen */}
      <button
        type="button"
        onClick={toggleTimelineExpanded}
        className={[
          "rounded p-1 transition-colors",
          timelineExpanded
            ? "bg-indigo-500/20 text-indigo-400"
            : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300",
        ].join(" ")}
        title={timelineExpanded ? "Collapse timeline" : "Expand timeline to half screen"}
      >
        {timelineExpanded ? <PanelBottomClose size={12} /> : <PanelBottomOpen size={12} />}
      </button>

      {/* Zoom */}
      <button
        type="button"
        onClick={handleZoomOut}
        className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        title="Zoom out"
      >
        <ZoomOut size={12} />
      </button>

      <span className="min-w-[3rem] text-center text-[10px] text-zinc-500">
        {Math.round(pixelsPerSecond)}px/s
      </span>

      <button
        type="button"
        onClick={handleZoomIn}
        className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        title="Zoom in"
      >
        <ZoomIn size={12} />
      </button>
    </div>
  );
}
