import { useCallback, useRef, useState } from "react";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up.js";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down.js";
import { useGanttStore } from "@/store/useGanttStore.ts";
import { GanttToolbar } from "./GanttToolbar.tsx";
import { TimelineRuler } from "./TimelineRuler.tsx";
import { TimelineViewport } from "./TimelineViewport.tsx";
import { SceneLayer } from "./layers/SceneLayer.tsx";
import { AudioLayer } from "./layers/AudioLayer.tsx";
import { TrackLabelsPanel } from "./shared/TrackLabelsPanel.tsx";

const LABEL_PANEL_WIDTH = 80;

interface GanttTimelineProps {
  onLoadAudioFile?: (file: File, trackIndex?: number) => Promise<void>;
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

  const labelsScrollRef = useRef<HTMLDivElement>(null);

  const handleLoadAudioFile = useCallback(
    (file: File, trackIndex?: number) => {
      void onLoadAudioFile?.(file, trackIndex);
    },
    [onLoadAudioFile],
  );

  /** Sync vertical scroll between left labels and right viewport */
  const handleViewportScroll = useCallback((scrollTop: number) => {
    if (labelsScrollRef.current) {
      labelsScrollRef.current.scrollTop = scrollTop;
    }
  }, []);

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

      {/* Ruler row: empty left cell + scrollable ruler */}
      <div className="flex shrink-0">
        <div className="shrink-0 border-b border-r border-zinc-800 bg-zinc-900/80" style={{ width: LABEL_PANEL_WIDTH }} />
        <div className="min-w-0 flex-1 overflow-hidden">
          <TimelineRuler
            duration={duration}
            pixelsPerSecond={pixelsPerSecond}
            currentTime={currentTime}
            onSeek={setCurrentTime}
          />
        </div>
      </div>

      {/* Main area: fixed labels | scrollable viewport */}
      <div className="flex min-h-0 flex-1">
        {/* Fixed left labels */}
        <div
          ref={labelsScrollRef}
          className="shrink-0 overflow-hidden border-r border-zinc-800 bg-zinc-900/80"
          style={{ width: LABEL_PANEL_WIDTH }}
        >
          <TrackLabelsPanel
            onLoadAudioFile={handleLoadAudioFile}
          />
        </div>

        {/* Scrollable right viewport */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <TimelineViewport onVerticalScroll={handleViewportScroll}>
            <SceneLayer pixelsPerSecond={pixelsPerSecond} />
            <div className="border-t border-zinc-700/50" />
            <AudioLayer
              pixelsPerSecond={pixelsPerSecond}
              getAudioBuffer={getAudioBuffer}
            />
          </TimelineViewport>
        </div>
      </div>
    </div>
  );
}
