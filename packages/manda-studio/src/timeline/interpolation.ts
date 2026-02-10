import type { EasingConfig, EasingType } from "./ganttTypes.ts";

// ---------------------------------------------------------------------------
// Easing functions: t ∈ [0,1] → [0,1]
// ---------------------------------------------------------------------------

function easeLinear(t: number): number {
  return t;
}

function easeIn(t: number): number {
  return t * t;
}

function easeOut(t: number): number {
  return t * (2 - t);
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/**
 * Attempt cubic bezier with 2 control points (x1,y1) and (x2,y2).
 * Uses Newton-Raphson to solve for t given x, then evaluates y.
 */
function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): (t: number) => number {
  // Pre-compute coefficients for the x(t) curve
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;

  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  function sampleX(t: number): number {
    return ((ax * t + bx) * t + cx) * t;
  }

  function sampleY(t: number): number {
    return ((ay * t + by) * t + cy) * t;
  }

  function sampleDerivX(t: number): number {
    return (3 * ax * t + 2 * bx) * t + cx;
  }

  /** Solve x(t) = x for t using Newton-Raphson. */
  function solveT(x: number): number {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sampleX(t) - x;
      if (Math.abs(err) < 1e-6) return t;
      const d = sampleDerivX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    // Fallback: bisect
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 20; i++) {
      t = (lo + hi) / 2;
      if (sampleX(t) < x) lo = t;
      else hi = t;
    }
    return t;
  }

  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    return sampleY(solveT(x));
  };
}

const EASING_FNS: Record<EasingType, (t: number) => number> = {
  linear: easeLinear,
  easeIn,
  easeOut,
  easeInOut,
  // cubicBezier placeholder - overridden per-call when bezierPoints exist
  cubicBezier: easeInOut,
};

/**
 * Returns the eased value for a given progress `t` (0-1) and easing config.
 */
export function applyEasing(easing: EasingConfig, t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  if (easing.type === "cubicBezier" && easing.bezierPoints) {
    const [x1, y1, x2, y2] = easing.bezierPoints;
    return cubicBezier(x1, y1, x2, y2)(clamped);
  }
  return EASING_FNS[easing.type](clamped);
}

// ---------------------------------------------------------------------------
// Type-aware interpolation
// ---------------------------------------------------------------------------

/**
 * Interpolate between two values based on progress `t` (0–1, already eased).
 * - numbers → lerp
 * - hex colors (#rgb or #rrggbb) → channel lerp
 * - strings / booleans → snap at t >= 0.5
 */
export function interpolateValue(
  a: number | string | boolean,
  b: number | string | boolean,
  t: number,
): number | string | boolean {
  // Numbers: simple lerp
  if (typeof a === "number" && typeof b === "number") {
    return a + (b - a) * t;
  }

  // Hex colors
  if (typeof a === "string" && typeof b === "string" && isHexColor(a) && isHexColor(b)) {
    return lerpHexColor(a, b, t);
  }

  // Snap: booleans and strings switch at 50%
  return t < 0.5 ? a : b;
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

function isHexColor(s: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s);
}

function parseHex(hex: string): [number, number, number] {
  let h = hex.slice(1);
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  const n = parseInt(h, 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function toHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    "#" +
    clamp(r).toString(16).padStart(2, "0") +
    clamp(g).toString(16).padStart(2, "0") +
    clamp(b).toString(16).padStart(2, "0")
  );
}

function lerpHexColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseHex(a);
  const [br, bg, bb] = parseHex(b);
  return toHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}
