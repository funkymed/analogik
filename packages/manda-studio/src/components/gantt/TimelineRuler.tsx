import { useCallback, useMemo, useRef } from "react";
import { useGanttStore } from "@/store/useGanttStore.ts";

interface TimelineRulerProps {
  /** Total timeline duration in seconds. */
  duration: number;
  /** Pixels per second. */
  pixelsPerSecond: number;
  /** Current playback time in seconds. */
  currentTime: number;
  /** Called when user clicks on the ruler to seek. */
  onSeek: (time: number) => void;
}

function formatRulerTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function TimelineRuler({
  duration,
  pixelsPerSecond,
  currentTime,
  onSeek,
}: TimelineRulerProps) {
  const rulerRef = useRef<HTMLDivElement>(null);
  const scrollLeft = useGanttStore((s) => s.scrollLeft);

  const ticks = useMemo(() => {
    const result: { x: number; label: string; major: boolean }[] = [];
    let interval = 1;
    if (pixelsPerSecond < 20) interval = 10;
    else if (pixelsPerSecond < 40) interval = 5;
    else if (pixelsPerSecond < 80) interval = 2;
    else if (pixelsPerSecond >= 150) interval = 0.5;

    const majorEvery = interval < 1 ? 5 : interval <= 1 ? 5 : interval <= 2 ? 5 : 2;

    for (let t = 0; t <= duration; t += interval) {
      const idx = Math.round(t / interval);
      const major = idx % majorEvery === 0;
      result.push({
        x: t * pixelsPerSecond,
        label: major ? formatRulerTime(t) : "",
        major,
      });
    }
    return result;
  }, [duration, pixelsPerSecond]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const ruler = rulerRef.current;
      if (!ruler) return;
      const rect = ruler.getBoundingClientRect();
      const sl = useGanttStore.getState().scrollLeft;
      const x = e.clientX - rect.left + sl;
      const time = Math.max(0, x / pixelsPerSecond);
      onSeek(time);
    },
    [pixelsPerSecond, onSeek],
  );

  const totalWidth = duration * pixelsPerSecond;
  const playheadX = currentTime * pixelsPerSecond;

  return (
    <div
      ref={rulerRef}
      className="relative h-6 shrink-0 cursor-pointer select-none overflow-hidden border-b border-zinc-800 bg-zinc-900/60"
      onClick={handleClick}
    >
      <div
        className="relative h-full"
        style={{ width: totalWidth, transform: `translateX(-${scrollLeft}px)` }}
      >
        {ticks.map((tick, i) => (
          <div key={i} className="absolute top-0 h-full" style={{ left: tick.x }}>
            <div
              className="absolute bottom-0 w-px"
              style={{
                height: tick.major ? 12 : 6,
                backgroundColor: tick.major
                  ? "rgba(161, 161, 170, 0.5)"
                  : "rgba(161, 161, 170, 0.2)",
              }}
            />
            {tick.label && (
              <span className="absolute left-1 top-0 text-[9px] text-zinc-500">
                {tick.label}
              </span>
            )}
          </div>
        ))}

        {/* Playhead marker on ruler */}
        <div
          className="absolute top-0 h-full"
          style={{ left: playheadX }}
        >
          <div
            className="absolute bottom-0 h-3 w-px"
            style={{ backgroundColor: "#ef4444" }}
          />
        </div>
      </div>
    </div>
  );
}
