interface PlayheadProps {
  /** Current time in seconds. */
  currentTime: number;
  /** Pixels per second for time-to-pixel conversion. */
  pixelsPerSecond: number;
  /** Total height of the timeline viewport in pixels. */
  height: number;
}

export function Playhead({ currentTime, pixelsPerSecond, height }: PlayheadProps) {
  const x = currentTime * pixelsPerSecond;

  return (
    <div
      className="pointer-events-none absolute top-0 z-10"
      style={{ left: x, height }}
    >
      {/* Triangle head */}
      <div
        className="absolute -left-1.5 -top-1 h-0 w-0"
        style={{
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: "8px solid #ef4444",
        }}
      />
      {/* Vertical line */}
      <div
        className="absolute left-0 top-0 w-px"
        style={{ height, backgroundColor: "#ef4444" }}
      />
    </div>
  );
}
