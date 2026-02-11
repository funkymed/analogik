import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import X from "lucide-react/dist/esm/icons/x.js";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left.js";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right.js";
import Diamond from "lucide-react/dist/esm/icons/diamond.js";
import type { TimelineScene, Keyframe, EasingType, EasingConfig } from "@/timeline/ganttTypes.ts";
import { applyEasing, interpolateValue } from "@/timeline/interpolation.ts";
import { useGanttStore } from "@/store/useGanttStore.ts";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PARAM_COLORS = [
  "#818cf8", "#22d3ee", "#f472b6", "#fbbf24", "#a78bfa",
  "#34d399", "#fb7185", "#38bdf8", "#fb923c", "#2dd4bf",
];

const GRAPH_PADDING_TOP = 24;
const GRAPH_PADDING_BOTTOM = 16;
const GRAPH_PADDING_LEFT = 32;
const GRAPH_PADDING_RIGHT = 16;
const SAMPLES_PER_SEGMENT = 20;
const DIAMOND_SIZE = 5;

const EASING_OPTIONS: { label: string; type: EasingType }[] = [
  { label: "Linear", type: "linear" },
  { label: "Ease In", type: "easeIn" },
  { label: "Ease Out", type: "easeOut" },
  { label: "Ease In Out", type: "easeInOut" },
  { label: "Elastic In", type: "elasticIn" },
  { label: "Elastic Out", type: "elasticOut" },
  { label: "Elastic InOut", type: "elasticInOut" },
  { label: "Bounce In", type: "bounceIn" },
  { label: "Bounce Out", type: "bounceOut" },
  { label: "Bounce InOut", type: "bounceInOut" },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SceneParametersPanelProps {
  scene: TimelineScene;
  onClose: () => void;
}

interface ParameterInfo {
  path: string;
  shortName: string;
  color: string;
  keyframes: KeyframeWithContext[];
}

interface KeyframeWithContext {
  keyframe: Keyframe;
  sequenceId: string;
  absoluteTime: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shortenPath(path: string): string {
  const idx = path.indexOf(".");
  return idx >= 0 ? path.slice(idx + 1) : path;
}

function formatValue(value: number | string | boolean): string {
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(3);
  }
  return String(value);
}

function interpolateAtTime(
  keyframes: KeyframeWithContext[],
  sceneLocalTime: number,
): number | string | boolean | null {
  if (keyframes.length === 0) return null;
  const sorted = [...keyframes].sort((a, b) => a.absoluteTime - b.absoluteTime);
  if (sceneLocalTime <= sorted[0].absoluteTime) return sorted[0].keyframe.value;
  if (sceneLocalTime >= sorted[sorted.length - 1].absoluteTime) return sorted[sorted.length - 1].keyframe.value;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (sceneLocalTime >= a.absoluteTime && sceneLocalTime <= b.absoluteTime) {
      const span = b.absoluteTime - a.absoluteTime;
      const rawT = span > 0 ? (sceneLocalTime - a.absoluteTime) / span : 0;
      const easedT = applyEasing(a.keyframe.easing, rawT);
      return interpolateValue(a.keyframe.value, b.keyframe.value, easedT);
    }
  }
  return sorted[sorted.length - 1].keyframe.value;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function SceneParametersPanel({ scene, onClose }: SceneParametersPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const currentTime = useGanttStore((s) => s.currentTime);
  const setCurrentTime = useGanttStore((s) => s.setCurrentTime);
  const updateScene = useGanttStore((s) => s.updateScene);
  const updateKeyframe = useGanttStore((s) => s.updateKeyframe);
  const removeKeyframe = useGanttStore((s) => s.removeKeyframe);
  const addKeyframe = useGanttStore((s) => s.addKeyframe);

  const sceneLocalTime = currentTime - scene.startTime;

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(scene.name);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (editingName) nameInputRef.current?.select();
  }, [editingName]);

  const commitName = useCallback(() => {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== scene.name) {
      updateScene(scene.id, { name: trimmed });
    } else {
      setNameValue(scene.name);
    }
    setEditingName(false);
  }, [nameValue, scene.id, scene.name, updateScene]);

  // Close on Escape (only if not editing name)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (editingName) {
          setEditingName(false);
          setNameValue(scene.name);
        } else {
          onClose();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, editingName, scene.name]);

  // Close on click outside
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    const id = setTimeout(() => {
      window.addEventListener("pointerdown", handlePointerDown);
    }, 100);
    return () => {
      clearTimeout(id);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [onClose]);

  // Collect parameters
  const parameters: ParameterInfo[] = useMemo(() => {
    const byPath = new Map<string, KeyframeWithContext[]>();
    for (const seq of scene.sequences) {
      for (const kf of seq.keyframes) {
        let list = byPath.get(kf.path);
        if (!list) { list = []; byPath.set(kf.path, list); }
        list.push({ keyframe: kf, sequenceId: seq.id, absoluteTime: seq.startOffset + kf.time });
      }
    }
    const sorted = [...byPath.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    return sorted.map(([path, keyframes], index) => ({
      path,
      shortName: shortenPath(path),
      color: PARAM_COLORS[index % PARAM_COLORS.length],
      keyframes: keyframes.sort((a, b) => a.absoluteTime - b.absoluteTime),
    }));
  }, [scene.sequences]);

  const seekToKeyframe = useCallback(
    (absoluteTime: number) => setCurrentTime(scene.startTime + absoluteTime),
    [scene.startTime, setCurrentTime],
  );

  // Header with editable name
  const headerContent = editingName ? (
    <input
      ref={nameInputRef}
      value={nameValue}
      onChange={(e) => setNameValue(e.target.value)}
      onBlur={commitName}
      onKeyDown={(e) => { if (e.key === "Enter") commitName(); }}
      className="bg-zinc-800 border border-zinc-600 rounded px-2 py-0.5 text-sm text-zinc-200 outline-none focus:border-indigo-500 w-48"
    />
  ) : (
    <h2
      className="text-sm font-semibold text-zinc-200 truncate cursor-pointer hover:text-indigo-400"
      onDoubleClick={() => setEditingName(true)}
      title="Double-click to rename"
    >
      {scene.name} — Parameters
    </h2>
  );

  if (parameters.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div ref={panelRef} className="w-[700px] rounded-lg border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            {headerContent}
            <button onClick={onClose} className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-zinc-500">No animated parameters in this scene.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div ref={panelRef} className="flex w-[700px] h-[400px] flex-col rounded-lg border border-zinc-700 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-700 px-4 py-2">
          {headerContent}
          <button onClick={onClose} className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Left: parameter list */}
          <div className="w-[220px] border-r border-zinc-700 overflow-y-auto">
            {parameters.map((param) => (
              <ParameterListItem
                key={param.path}
                param={param}
                sceneLocalTime={sceneLocalTime}
                onSeek={seekToKeyframe}
              />
            ))}
          </div>

          {/* Right: curve graph */}
          <div className="flex-1 min-w-0">
            <CurveGraph
              sceneId={scene.id}
              parameters={parameters}
              sceneDuration={scene.duration}
              sceneLocalTime={sceneLocalTime}
              onSeek={seekToKeyframe}
              updateKeyframe={updateKeyframe}
              removeKeyframe={removeKeyframe}
              addKeyframe={addKeyframe}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Parameter List Item
// ---------------------------------------------------------------------------

interface ParameterListItemProps {
  param: ParameterInfo;
  sceneLocalTime: number;
  onSeek: (absoluteTime: number) => void;
}

function ParameterListItem({ param, sceneLocalTime, onSeek }: ParameterListItemProps) {
  const currentValue = interpolateAtTime(param.keyframes, sceneLocalTime);

  const prevKeyframe = useMemo(() => {
    for (let i = param.keyframes.length - 1; i >= 0; i--) {
      if (param.keyframes[i].absoluteTime < sceneLocalTime - 0.001) return param.keyframes[i];
    }
    return null;
  }, [param.keyframes, sceneLocalTime]);

  const nextKeyframe = useMemo(() => {
    for (const kf of param.keyframes) {
      if (kf.absoluteTime > sceneLocalTime + 0.001) return kf;
    }
    return null;
  }, [param.keyframes, sceneLocalTime]);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-800 hover:bg-zinc-800/50">
      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: param.color }} />
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-zinc-300 truncate">{param.shortName}</div>
        <div className="text-[10px] text-zinc-500 font-mono truncate">
          {currentValue !== null ? formatValue(currentValue) : "--"}
        </div>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={() => prevKeyframe && onSeek(prevKeyframe.absoluteTime)}
          disabled={!prevKeyframe}
          className="rounded p-0.5 text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-default"
          title="Previous keyframe"
        >
          <ChevronLeft size={12} />
        </button>
        <Diamond size={10} className="text-zinc-500" />
        <button
          onClick={() => nextKeyframe && onSeek(nextKeyframe.absoluteTime)}
          disabled={!nextKeyframe}
          className="rounded p-0.5 text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-default"
          title="Next keyframe"
        >
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Easing Context Menu
// ---------------------------------------------------------------------------

interface EasingMenuProps {
  x: number;
  y: number;
  currentEasing: EasingConfig;
  onSelect: (easing: EasingConfig) => void;
  onClose: () => void;
}

function EasingMenu({ x, y, currentEasing, onSelect, onClose }: EasingMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    }
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-[60] rounded border border-zinc-600 bg-zinc-800 py-1 shadow-xl"
      style={{ left: x, top: y }}
    >
      <div className="px-3 py-1 text-[9px] text-zinc-500 uppercase tracking-wider">Easing</div>
      {EASING_OPTIONS.map((opt) => (
        <button
          key={opt.type}
          onClick={() => { onSelect({ type: opt.type }); onClose(); }}
          className={[
            "block w-full text-left px-3 py-1 text-[11px] hover:bg-zinc-700",
            currentEasing.type === opt.type ? "text-indigo-400" : "text-zinc-300",
          ].join(" ")}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Curve Graph
// ---------------------------------------------------------------------------

interface CurveGraphProps {
  sceneId: string;
  parameters: ParameterInfo[];
  sceneDuration: number;
  sceneLocalTime: number;
  onSeek: (absoluteTime: number) => void;
  updateKeyframe: (sceneId: string, sequenceId: string, keyframeId: string, patch: Partial<Omit<Keyframe, "id">>) => void;
  removeKeyframe: (sceneId: string, sequenceId: string, keyframeId: string) => void;
  addKeyframe: (sceneId: string, sequenceId: string, keyframe: Omit<Keyframe, "id">) => string;
}

interface DiamondData {
  x: number;
  y: number;
  time: number;
  kfCtx: KeyframeWithContext;
  paramIndex: number;
  /** min/max for numeric params — used for vertical drag */
  min: number;
  max: number;
}

function CurveGraph({
  sceneId,
  parameters,
  sceneDuration,
  sceneLocalTime,
  onSeek,
  updateKeyframe,
  removeKeyframe,
  addKeyframe,
}: CurveGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const viewWidth = 600;
  const viewHeight = 340;
  const graphLeft = GRAPH_PADDING_LEFT;
  const graphRight = viewWidth - GRAPH_PADDING_RIGHT;
  const graphTop = GRAPH_PADDING_TOP;
  const graphBottom = viewHeight - GRAPH_PADDING_BOTTOM;
  const graphWidth = graphRight - graphLeft;
  const graphHeight = graphBottom - graphTop;

  const timeToX = useCallback(
    (t: number) => graphLeft + (t / sceneDuration) * graphWidth,
    [sceneDuration, graphLeft, graphWidth],
  );

  const xToTime = useCallback(
    (x: number) => ((x - graphLeft) / graphWidth) * sceneDuration,
    [sceneDuration, graphLeft, graphWidth],
  );

  const yToNorm = useCallback(
    (y: number) => 1 - (y - graphTop) / graphHeight,
    [graphTop, graphHeight],
  );

  // Ticks
  const ticks = useMemo(() => {
    const result: number[] = [];
    let interval = 1;
    if (sceneDuration > 60) interval = 10;
    else if (sceneDuration > 20) interval = 5;
    else if (sceneDuration > 10) interval = 2;
    for (let t = 0; t <= sceneDuration; t += interval) result.push(t);
    return result;
  }, [sceneDuration]);

  // Build curves + flat diamonds list for drag
  const { curves, allDiamonds } = useMemo(() => {
    const allDia: DiamondData[] = [];

    const curveList = parameters.map((param, paramIndex) => {
      const keyframes = param.keyframes;
      const isNumeric = keyframes.every((kf) => typeof kf.keyframe.value === "number");

      let min = 0, max = 1;
      if (isNumeric && keyframes.length > 0) {
        const values = keyframes.map((kf) => kf.keyframe.value as number);
        min = Math.min(...values);
        max = Math.max(...values);
        if (min === max) { min -= 0.5; max += 0.5; }
      }
      const normalize = (v: number) => 1 - (v - min) / (max - min);

      if (!isNumeric) {
        const diamonds = keyframes.map((kf) => {
          const d: DiamondData = {
            x: timeToX(kf.absoluteTime), y: graphTop + graphHeight * 0.5,
            time: kf.absoluteTime, kfCtx: kf, paramIndex, min, max,
          };
          allDia.push(d);
          return d;
        });
        return {
          param, isNumeric: false as const, points: diamonds.map(d => ({ x: d.x, y: d.y })), diamonds,
        };
      }

      // Numeric path
      const points: { x: number; y: number }[] = [];

      if (keyframes.length === 1) {
        const normY = normalize(keyframes[0].keyframe.value as number);
        points.push({ x: timeToX(0), y: graphTop + normY * graphHeight });
        points.push({ x: timeToX(sceneDuration), y: graphTop + normY * graphHeight });
      } else {
        if (keyframes[0].absoluteTime > 0) {
          const ny = normalize(keyframes[0].keyframe.value as number);
          points.push({ x: timeToX(0), y: graphTop + ny * graphHeight });
        }
        const ny0 = normalize(keyframes[0].keyframe.value as number);
        points.push({ x: timeToX(keyframes[0].absoluteTime), y: graphTop + ny0 * graphHeight });

        for (let i = 0; i < keyframes.length - 1; i++) {
          const a = keyframes[i], b = keyframes[i + 1];
          const span = b.absoluteTime - a.absoluteTime;
          for (let s = 1; s <= SAMPLES_PER_SEGMENT; s++) {
            const rawT = s / SAMPLES_PER_SEGMENT;
            const easedT = applyEasing(a.keyframe.easing, rawT);
            const value = interpolateValue(a.keyframe.value, b.keyframe.value, easedT) as number;
            const ny = normalize(value);
            points.push({ x: timeToX(a.absoluteTime + rawT * span), y: graphTop + ny * graphHeight });
          }
        }

        const lastKf = keyframes[keyframes.length - 1];
        if (lastKf.absoluteTime < sceneDuration) {
          const ny = normalize(lastKf.keyframe.value as number);
          points.push({ x: timeToX(sceneDuration), y: graphTop + ny * graphHeight });
        }
      }

      const diamonds = keyframes.map((kf) => {
        const ny = normalize(kf.keyframe.value as number);
        const d: DiamondData = {
          x: timeToX(kf.absoluteTime), y: graphTop + ny * graphHeight,
          time: kf.absoluteTime, kfCtx: kf, paramIndex, min, max,
        };
        allDia.push(d);
        return d;
      });

      return { param, isNumeric: true as const, points, diamonds };
    });

    return { curves: curveList, allDiamonds: allDia };
  }, [parameters, sceneDuration, timeToX, graphTop, graphHeight]);

  // --- Drag state ---
  const dragRef = useRef<{
    diamond: DiamondData;
    startClientX: number;
    startClientY: number;
    origTime: number;
    origValue: number;
  } | null>(null);

  // --- Easing menu state ---
  const [easingMenu, setEasingMenu] = useState<{
    x: number; y: number; kfCtx: KeyframeWithContext;
  } | null>(null);

  const clientToSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { svgX: 0, svgY: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      svgX: ((clientX - rect.left) / rect.width) * viewWidth,
      svgY: ((clientY - rect.top) / rect.height) * viewHeight,
    };
  }, [viewWidth, viewHeight]);

  // Diamond pointerdown → start drag
  const handleDiamondPointerDown = useCallback(
    (e: React.PointerEvent, diamond: DiamondData) => {
      e.stopPropagation();
      const origValue = typeof diamond.kfCtx.keyframe.value === "number" ? diamond.kfCtx.keyframe.value : 0;
      dragRef.current = {
        diamond, startClientX: e.clientX, startClientY: e.clientY,
        origTime: diamond.kfCtx.absoluteTime, origValue,
      };

      const handleMove = (ev: PointerEvent) => {
        if (!dragRef.current) return;
        const { svgX, svgY } = clientToSvg(ev.clientX, ev.clientY);

        // Horizontal: update time
        const newTime = Math.max(0, Math.min(sceneDuration, xToTime(svgX)));
        const { kfCtx } = dragRef.current.diamond;
        // Compute relative time within the sequence
        const seq = parameters[dragRef.current.diamond.paramIndex]?.keyframes
          .find(k => k.keyframe.id === kfCtx.keyframe.id);
        if (!seq) return;
        const relativeTime = newTime - (kfCtx.absoluteTime - kfCtx.keyframe.time);

        // Vertical: update value (only for numeric)
        const isNumeric = typeof kfCtx.keyframe.value === "number";
        const patch: Partial<Omit<Keyframe, "id">> = { time: Math.max(0, relativeTime) };

        if (isNumeric) {
          const { min, max } = dragRef.current.diamond;
          const normValue = yToNorm(svgY);
          const rawValue = min + normValue * (max - min);
          patch.value = rawValue;
        }

        updateKeyframe(sceneId, kfCtx.sequenceId, kfCtx.keyframe.id, patch);
      };

      const handleUp = () => {
        dragRef.current = null;
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
      };

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
    },
    [sceneId, sceneDuration, parameters, xToTime, yToNorm, clientToSvg, updateKeyframe],
  );

  // Diamond double-click → remove keyframe
  const handleDiamondDoubleClick = useCallback(
    (e: React.MouseEvent, diamond: DiamondData) => {
      e.stopPropagation();
      const { kfCtx } = diamond;
      removeKeyframe(sceneId, kfCtx.sequenceId, kfCtx.keyframe.id);
    },
    [sceneId, removeKeyframe],
  );

  // Diamond right-click → easing menu
  const handleDiamondContextMenu = useCallback(
    (e: React.MouseEvent, diamond: DiamondData) => {
      e.preventDefault();
      e.stopPropagation();
      setEasingMenu({ x: e.clientX, y: e.clientY, kfCtx: diamond.kfCtx });
    },
    [],
  );

  const handleEasingSelect = useCallback(
    (easing: EasingConfig) => {
      if (!easingMenu) return;
      const { kfCtx } = easingMenu;
      updateKeyframe(sceneId, kfCtx.sequenceId, kfCtx.keyframe.id, { easing });
    },
    [sceneId, easingMenu, updateKeyframe],
  );

  // SVG double-click on empty space → add keyframe on nearest param
  const handleSvgDoubleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      // If we double-clicked a diamond, that handler already ran
      if ((e.target as Element).closest("[data-kf-diamond]")) return;

      const { svgX, svgY } = clientToSvg(e.clientX, e.clientY);
      const newTime = Math.max(0, Math.min(sceneDuration, xToTime(svgX)));

      // Find the closest curve by Y distance
      let bestDist = Infinity;
      let bestParam: ParameterInfo | null = null;
      let bestValue: number = 0;

      for (const curve of curves) {
        if (!curve.isNumeric) continue;
        // Find the closest point on the curve
        for (const pt of curve.points) {
          const dist = Math.abs(pt.x - svgX) + Math.abs(pt.y - svgY) * 0.5;
          if (dist < bestDist) {
            bestDist = dist;
            bestParam = curve.param;
            // Compute value from Y position
            const kfs = curve.param.keyframes;
            const values = kfs.map(k => k.keyframe.value as number);
            let min = Math.min(...values), max = Math.max(...values);
            if (min === max) { min -= 0.5; max += 0.5; }
            bestValue = min + yToNorm(svgY) * (max - min);
          }
        }
      }

      if (!bestParam || !bestParam.keyframes[0]) return;

      const seqId = bestParam.keyframes[0].sequenceId;
      const relativeTime = newTime;

      addKeyframe(sceneId, seqId, {
        time: relativeTime,
        path: bestParam.path,
        value: bestValue,
        easing: { type: "linear" },
      });
    },
    [sceneId, sceneDuration, curves, xToTime, yToNorm, clientToSvg, addKeyframe],
  );

  // SVG click → seek playhead
  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if ((e.target as Element).closest("[data-kf-diamond]")) return;
      const { svgX } = clientToSvg(e.clientX, e.clientY);
      const t = xToTime(svgX);
      if (t >= 0 && t <= sceneDuration) onSeek(t);
    },
    [sceneDuration, xToTime, clientToSvg, onSeek],
  );

  const playheadX = timeToX(Math.max(0, Math.min(sceneLocalTime, sceneDuration)));

  return (
    <>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        preserveAspectRatio="none"
        className="w-full h-full cursor-crosshair"
        onClick={handleSvgClick}
        onDoubleClick={handleSvgDoubleClick}
      >
        {/* Background */}
        <rect x={graphLeft} y={graphTop} width={graphWidth} height={graphHeight} fill="#18181b" rx={2} />

        {/* Time ruler ticks */}
        {ticks.map((t) => {
          const x = timeToX(t);
          return (
            <g key={t}>
              <line x1={x} y1={graphTop} x2={x} y2={graphBottom} stroke="#27272a" strokeWidth={0.5} />
              <text x={x} y={graphTop - 4} textAnchor="middle" fill="#71717a" fontSize={9}>{t}s</text>
            </g>
          );
        })}

        {/* Horizontal grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = graphTop + frac * graphHeight;
          return <line key={frac} x1={graphLeft} y1={y} x2={graphRight} y2={y} stroke="#27272a" strokeWidth={0.5} />;
        })}

        {/* Curves */}
        {curves.map((curve) => {
          const polylinePoints = curve.points.map((p) => `${p.x},${p.y}`).join(" ");
          return (
            <g key={curve.param.path}>
              {curve.isNumeric ? (
                <polyline
                  points={polylinePoints}
                  fill="none"
                  stroke={curve.param.color}
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                  opacity={0.85}
                />
              ) : (
                curve.diamonds.map((d, i, arr) => {
                  const nextX = i < arr.length - 1 ? arr[i + 1].x : timeToX(sceneDuration);
                  return (
                    <line key={i} x1={d.x} y1={d.y} x2={nextX} y2={d.y}
                      stroke={curve.param.color} strokeWidth={1.5} opacity={0.85} />
                  );
                })
              )}

              {/* Diamond keyframe markers */}
              {curve.diamonds.map((d) => (
                <g
                  key={d.kfCtx.keyframe.id}
                  data-kf-diamond
                  className="cursor-grab"
                  onPointerDown={(e) => handleDiamondPointerDown(e, d)}
                  onDoubleClick={(e) => handleDiamondDoubleClick(e, d)}
                  onContextMenu={(e) => handleDiamondContextMenu(e, d)}
                >
                  {/* Larger invisible hit area */}
                  <rect
                    x={d.x - DIAMOND_SIZE - 3}
                    y={d.y - DIAMOND_SIZE - 3}
                    width={(DIAMOND_SIZE + 3) * 2}
                    height={(DIAMOND_SIZE + 3) * 2}
                    fill="transparent"
                  />
                  <rect
                    x={d.x - DIAMOND_SIZE}
                    y={d.y - DIAMOND_SIZE}
                    width={DIAMOND_SIZE * 2}
                    height={DIAMOND_SIZE * 2}
                    fill={curve.param.color}
                    stroke="#fff"
                    strokeWidth={0.5}
                    transform={`rotate(45 ${d.x} ${d.y})`}
                    rx={0.5}
                  />
                  {/* Easing indicator: small text below diamond */}
                  {d.kfCtx.keyframe.easing.type !== "linear" && (
                    <text
                      x={d.x}
                      y={d.y + DIAMOND_SIZE + 8}
                      textAnchor="middle"
                      fill={curve.param.color}
                      fontSize={6}
                      opacity={0.7}
                    >
                      {d.kfCtx.keyframe.easing.type}
                    </text>
                  )}
                </g>
              ))}
            </g>
          );
        })}

        {/* Playhead */}
        <line x1={playheadX} y1={graphTop - 2} x2={playheadX} y2={graphBottom + 2} stroke="#ef4444" strokeWidth={1} />
        <polygon points={`${playheadX - 4},${graphTop - 2} ${playheadX + 4},${graphTop - 2} ${playheadX},${graphTop + 4}`} fill="#ef4444" />
      </svg>

      {/* Easing context menu */}
      {easingMenu && (
        <EasingMenu
          x={easingMenu.x}
          y={easingMenu.y}
          currentEasing={easingMenu.kfCtx.keyframe.easing}
          onSelect={handleEasingSelect}
          onClose={() => setEasingMenu(null)}
        />
      )}
    </>
  );
}
