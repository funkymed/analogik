import type { EasingConfig } from "@/timeline/ganttTypes.ts";

interface KeyframeCurvePreviewProps {
  easing: EasingConfig;
  width?: number;
  height?: number;
}

/**
 * Small SVG preview of an easing curve.
 */
export function KeyframeCurvePreview({
  easing,
  width = 40,
  height = 24,
}: KeyframeCurvePreviewProps) {
  const d = buildCurvePath(easing, width, height);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
    >
      {/* Baseline */}
      <line
        x1={0}
        y1={height}
        x2={width}
        y2={0}
        stroke="currentColor"
        strokeOpacity={0.15}
        strokeWidth={1}
        strokeDasharray="2 2"
      />
      {/* Curve */}
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

function buildCurvePath(easing: EasingConfig, w: number, h: number): string {
  if (easing.type === "cubicBezier" && easing.bezierPoints) {
    const [x1, y1, x2, y2] = easing.bezierPoints;
    return `M 0 ${h} C ${x1 * w} ${(1 - y1) * h} ${x2 * w} ${(1 - y2) * h} ${w} 0`;
  }

  // For standard easing types, use pre-defined cubic bezier approximations
  const presets: Record<string, [number, number, number, number]> = {
    linear: [0, 0, 1, 1],
    easeIn: [0.42, 0, 1, 1],
    easeOut: [0, 0, 0.58, 1],
    easeInOut: [0.42, 0, 0.58, 1],
  };

  const [x1, y1, x2, y2] = presets[easing.type] ?? presets.linear;
  return `M 0 ${h} C ${x1 * w} ${(1 - y1) * h} ${x2 * w} ${(1 - y2) * h} ${w} 0`;
}
