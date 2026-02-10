import { useCallback, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useGanttStore } from "@/store/useGanttStore.ts";
import { GanttToolbar } from "./GanttToolbar.tsx";
import { TimelineRuler } from "./TimelineRuler.tsx";
import { TimelineViewport } from "./TimelineViewport.tsx";
import { SceneLayer } from "./layers/SceneLayer.tsx";
import { AudioLayer } from "./layers/AudioLayer.tsx";

interface GanttTimelineProps {
  onLoadAudioFile?: (file: File) => Promise<void>;
  getAudioBuffer?: (url: string) => AudioBuffer | null;
}

export function GanttTimeline({ onLoadAudioFile, getAudioBuffer }: GanttTimelineProps) {
  const [expanded, setExpanded] = useState(true);

  const pixelsPerSecond = useGanttStore((s) => s.pixelsPerSecond);
  const currentTime = useGanttStore((s) => s.currentTime);
  const setCurrentTime = useGanttStore((s) => s.setCurrentTime);
  const getTimelineDuration = useGanttStore((s) => s.getTimelineDuration);
  const sceneCount = useGanttStore((s) => s.timeline.scenes.length);
  const timelineHeight = useGanttStore((s) => s.timelineHeight);

  const duration = getTimelineDuration();

  const handleLoadAudioFile = useCallback(
    (file: File) => {
      void onLoadAudioFile?.(file);
    },
    [onLoadAudioFile],
  );

  // --- Compact view ---
  if (!expanded) {
    return (
      <div className="flex h-8 shrink-0 items-center gap-3 border-t border-zinc-800 bg-zinc-900/80 px-4">
        <span className="text-[10px] font-medium text-zinc-500">Timeline</span>
        <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-500">
          {sceneCount} scene{sceneCount !== 1 ? "s" : ""}
        </span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="shrink-0 rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          aria-label="Expand timeline"
        >
          <ChevronUp size={14} />
        </button>
      </div>
    );
  }

  // --- Expanded view ---
  return (
    <div className="flex shrink-0 flex-col border-t border-zinc-800 bg-zinc-900/80" style={{ height: timelineHeight }}>
      {/* Toolbar */}
      <div className="flex items-center">
        <div className="flex-1">
          <GanttToolbar />
        </div>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="shrink-0 rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          aria-label="Collapse timeline"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Ruler */}
      <TimelineRuler
        duration={duration}
        pixelsPerSecond={pixelsPerSecond}
        currentTime={currentTime}
        onSeek={setCurrentTime}
      />

      {/* Viewport with layers */}
      <TimelineViewport>
        <SceneLayer pixelsPerSecond={pixelsPerSecond} />
        <AudioLayer
          pixelsPerSecond={pixelsPerSecond}
          onLoadAudioFile={handleLoadAudioFile}
          getAudioBuffer={getAudioBuffer}
        />
      </TimelineViewport>
    </div>
  );
}
