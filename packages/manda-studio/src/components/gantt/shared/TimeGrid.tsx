import { useMemo } from "react";

interface TimeGridProps {
  /** Total timeline duration in seconds. */
  duration: number;
  /** Pixels per second. */
  pixelsPerSecond: number;
  /** Total height of the grid area. */
  height: number;
}

export function TimeGrid({ duration, pixelsPerSecond, height }: TimeGridProps) {
  const lines = useMemo(() => {
    const result: { x: number; major: boolean }[] = [];
    // Choose grid interval based on zoom level
    let interval = 1;
    if (pixelsPerSecond < 20) interval = 10;
    else if (pixelsPerSecond < 40) interval = 5;
    else if (pixelsPerSecond < 80) interval = 2;
    else if (pixelsPerSecond >= 150) interval = 0.5;

    const majorEvery = interval < 1 ? 5 : interval <= 1 ? 5 : interval <= 2 ? 5 : 2;

    for (let t = 0; t <= duration; t += interval) {
      const idx = Math.round(t / interval);
      result.push({
        x: t * pixelsPerSecond,
        major: idx % majorEvery === 0,
      });
    }
    return result;
  }, [duration, pixelsPerSecond]);

  return (
    <div className="pointer-events-none absolute inset-0 z-0" style={{ height }}>
      {lines.map((line, i) => (
        <div
          key={i}
          className="absolute top-0"
          style={{
            left: line.x,
            height,
            width: 1,
            backgroundColor: line.major
              ? "rgba(113, 113, 122, 0.25)"
              : "rgba(113, 113, 122, 0.1)",
          }}
        />
      ))}
    </div>
  );
}
