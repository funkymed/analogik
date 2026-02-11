import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import X from "lucide-react/dist/esm/icons/x.js";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left.js";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right.js";
import Diamond from "lucide-react/dist/esm/icons/diamond.js";
import ZoomIn from "lucide-react/dist/esm/icons/zoom-in.js";
import ZoomOut from "lucide-react/dist/esm/icons/zoom-out.js";
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
const GRAPH_PADDING_BOTTOM = 20;
const GRAPH_PADDING_LEFT = 40;
const GRAPH_PADDING_RIGHT = 16;
const SAMPLES_PER_SEGMENT = 20;
const DIAMOND_SIZE = 5;

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 8;
const ZOOM_STEP = 1.15;

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

interface SelectedKeyframe {
  kfCtx: KeyframeWithContext;
  paramPath: string;
  paramColor: string;
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

function easingPreviewPath(type: EasingType): string {
  const w = 80, h = 48;
  const pts: string[] = [];
  for (let i = 0; i <= 50; i++) {
    const t = i / 50;
    const v = applyEasing({ type }, t);
    pts.push(`${(t * w).toFixed(1)},${(h - v * h).toFixed(1)}`);
  }
  return pts.join(" ");
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
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

  const [selectedParamPath, setSelectedParamPath] = useState<string | null>(null);
  const [selectedKf, setSelectedKf] = useState<SelectedKeyframe | null>(null);

  // Zoom state
  const [zoomX, setZoomX] = useState(1);
  const [zoomY, setZoomY] = useState(1);
  const [panX, setPanX] = useState(0); // in seconds — left edge offset

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

  useEffect(() => {
    if (selectedParamPath === null && parameters.length > 0) {
      setSelectedParamPath(parameters[0].path);
    }
  }, [parameters, selectedParamPath]);

  useEffect(() => {
    if (!selectedKf) return;
    const stillExists = parameters.some((p) =>
      p.keyframes.some((k) => k.keyframe.id === selectedKf.kfCtx.keyframe.id),
    );
    if (!stillExists) setSelectedKf(null);
  }, [parameters, selectedKf]);

  const seekToKeyframe = useCallback(
    (absoluteTime: number) => setCurrentTime(scene.startTime + absoluteTime),
    [scene.startTime, setCurrentTime],
  );

  const handleEasingChange = useCallback(
    (easing: EasingConfig) => {
      if (!selectedKf) return;
      const { kfCtx } = selectedKf;
      updateKeyframe(scene.id, kfCtx.sequenceId, kfCtx.keyframe.id, { easing });
    },
    [scene.id, selectedKf, updateKeyframe],
  );

  const handleValueEdit = useCallback(
    (sceneId: string, seqId: string, kfId: string, patch: Partial<Omit<Keyframe, "id">>) => {
      updateKeyframe(sceneId, seqId, kfId, patch);
    },
    [updateKeyframe],
  );

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

  // Visible time window
  const visibleDuration = scene.duration / zoomX;
  const maxPan = Math.max(0, scene.duration - visibleDuration);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div ref={panelRef} className="flex w-[860px] h-[460px] flex-col rounded-lg border border-zinc-700 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-700 px-4 py-2">
          {headerContent}
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 mr-2">
              <button
                onClick={() => setZoomX((z) => clamp(z / ZOOM_STEP, ZOOM_MIN, ZOOM_MAX))}
                className="rounded p-0.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                title="Zoom out H"
              >
                <ZoomOut size={13} />
              </button>
              <span className="text-[9px] text-zinc-500 font-mono w-8 text-center">
                H{zoomX.toFixed(1)}x
              </span>
              <button
                onClick={() => setZoomX((z) => clamp(z * ZOOM_STEP, ZOOM_MIN, ZOOM_MAX))}
                className="rounded p-0.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                title="Zoom in H"
              >
                <ZoomIn size={13} />
              </button>
              <span className="mx-0.5 text-zinc-700">|</span>
              <button
                onClick={() => setZoomY((z) => clamp(z / ZOOM_STEP, ZOOM_MIN, ZOOM_MAX))}
                className="rounded p-0.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                title="Zoom out V"
              >
                <ZoomOut size={13} />
              </button>
              <span className="text-[9px] text-zinc-500 font-mono w-8 text-center">
                V{zoomY.toFixed(1)}x
              </span>
              <button
                onClick={() => setZoomY((z) => clamp(z * ZOOM_STEP, ZOOM_MIN, ZOOM_MAX))}
                className="rounded p-0.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                title="Zoom in V"
              >
                <ZoomIn size={13} />
              </button>
            </div>
            <button onClick={onClose} className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Left: parameter list */}
          <div className="w-[180px] border-r border-zinc-700 overflow-y-auto shrink-0">
            {parameters.map((param) => (
              <ParameterListItem
                key={param.path}
                param={param}
                sceneLocalTime={sceneLocalTime}
                isSelected={selectedParamPath === param.path}
                onSelect={() => setSelectedParamPath(param.path)}
                onSeek={seekToKeyframe}
              />
            ))}
          </div>

          {/* Center: curve graph */}
          <div className="flex-1 min-w-0">
            <CurveGraph
              sceneId={scene.id}
              parameters={parameters}
              sceneDuration={scene.duration}
              sceneLocalTime={sceneLocalTime}
              selectedParamPath={selectedParamPath}
              zoomX={zoomX}
              zoomY={zoomY}
              panX={panX}
              onZoomX={(z) => setZoomX(clamp(z, ZOOM_MIN, ZOOM_MAX))}
              onZoomY={(z) => setZoomY(clamp(z, ZOOM_MIN, ZOOM_MAX))}
              onPanX={(p) => setPanX(clamp(p, 0, maxPan))}
              onSeek={seekToKeyframe}
              onSelectKeyframe={(kfCtx, paramPath, paramColor) =>
                setSelectedKf({ kfCtx, paramPath, paramColor })
              }
              selectedKeyframeId={selectedKf?.kfCtx.keyframe.id ?? null}
              updateKeyframe={updateKeyframe}
              removeKeyframe={removeKeyframe}
              addKeyframe={addKeyframe}
            />
          </div>

          {/* Right: easing sidebar */}
          {selectedKf && (
            <EasingSidebar
              sceneId={scene.id}
              selectedKf={selectedKf}
              parameters={parameters}
              onEasingChange={handleEasingChange}
              onValueEdit={handleValueEdit}
              onDelete={() => {
                const { kfCtx } = selectedKf;
                removeKeyframe(scene.id, kfCtx.sequenceId, kfCtx.keyframe.id);
                setSelectedKf(null);
              }}
            />
          )}
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
  isSelected: boolean;
  onSelect: () => void;
  onSeek: (absoluteTime: number) => void;
}

function ParameterListItem({ param, sceneLocalTime, isSelected, onSelect, onSeek }: ParameterListItemProps) {
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
    <div
      onClick={onSelect}
      className={[
        "flex items-center gap-2 px-3 py-1.5 border-b border-zinc-800 cursor-pointer transition-colors",
        isSelected
          ? "bg-zinc-800 border-l-2 border-l-indigo-500"
          : "hover:bg-zinc-800/50 border-l-2 border-l-transparent",
      ].join(" ")}
    >
      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: param.color }} />
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-zinc-300 truncate">{param.shortName}</div>
        <div className="text-[10px] text-zinc-500 font-mono truncate">
          {currentValue !== null ? formatValue(currentValue) : "--"}
        </div>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); prevKeyframe && onSeek(prevKeyframe.absoluteTime); }}
          disabled={!prevKeyframe}
          className="rounded p-0.5 text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-default"
          title="Previous keyframe"
        >
          <ChevronLeft size={12} />
        </button>
        <Diamond size={10} className="text-zinc-500" />
        <button
          onClick={(e) => { e.stopPropagation(); nextKeyframe && onSeek(nextKeyframe.absoluteTime); }}
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
// Easing Sidebar (right panel) with editable t/v inputs
// ---------------------------------------------------------------------------

interface EasingSidebarProps {
  sceneId: string;
  selectedKf: SelectedKeyframe;
  parameters: ParameterInfo[];
  onEasingChange: (easing: EasingConfig) => void;
  onValueEdit: (sceneId: string, seqId: string, kfId: string, patch: Partial<Omit<Keyframe, "id">>) => void;
  onDelete: () => void;
}

function EasingSidebar({ sceneId, selectedKf, parameters, onEasingChange, onValueEdit, onDelete }: EasingSidebarProps) {
  const { kfCtx, paramPath, paramColor } = selectedKf;
  const kf = kfCtx.keyframe;

  const freshKf = useMemo(() => {
    for (const p of parameters) {
      if (p.path !== paramPath) continue;
      for (const k of p.keyframes) {
        if (k.keyframe.id === kf.id) return k.keyframe;
      }
    }
    return kf;
  }, [parameters, paramPath, kf]);

  // Local input state for time
  const [timeInput, setTimeInput] = useState(freshKf.time.toFixed(2));
  useEffect(() => { setTimeInput(freshKf.time.toFixed(2)); }, [freshKf.time]);

  // Local input state for value
  const [valueInput, setValueInput] = useState(formatValue(freshKf.value));
  useEffect(() => { setValueInput(formatValue(freshKf.value)); }, [freshKf.value]);

  const commitTime = useCallback(() => {
    const parsed = parseFloat(timeInput);
    if (!isNaN(parsed) && parsed >= 0) {
      onValueEdit(sceneId, kfCtx.sequenceId, kf.id, { time: parsed });
    } else {
      setTimeInput(freshKf.time.toFixed(2));
    }
  }, [timeInput, sceneId, kfCtx.sequenceId, kf.id, freshKf.time, onValueEdit]);

  const commitValue = useCallback(() => {
    const parsed = parseFloat(valueInput);
    if (!isNaN(parsed)) {
      onValueEdit(sceneId, kfCtx.sequenceId, kf.id, { value: parsed });
    } else {
      // Non-numeric value — commit as string
      onValueEdit(sceneId, kfCtx.sequenceId, kf.id, { value: valueInput });
    }
  }, [valueInput, sceneId, kfCtx.sequenceId, kf.id, onValueEdit]);

  return (
    <div className="w-[160px] border-l border-zinc-700 overflow-y-auto shrink-0 p-3">
      {/* Keyframe info */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: paramColor }} />
          <span className="text-[10px] text-zinc-400 truncate">{shortenPath(paramPath)}</span>
        </div>

        {/* Editable time */}
        <label className="flex items-center gap-1.5 mb-1">
          <span className="text-[10px] text-zinc-500 font-mono w-4 shrink-0">t:</span>
          <input
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
            onBlur={commitTime}
            onKeyDown={(e) => { if (e.key === "Enter") commitTime(); }}
            className="flex-1 min-w-0 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-[10px] text-zinc-200 font-mono outline-none focus:border-indigo-500"
          />
          <span className="text-[9px] text-zinc-600">s</span>
        </label>

        {/* Editable value */}
        <label className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-500 font-mono w-4 shrink-0">v:</span>
          <input
            value={valueInput}
            onChange={(e) => setValueInput(e.target.value)}
            onBlur={commitValue}
            onKeyDown={(e) => { if (e.key === "Enter") commitValue(); }}
            className="flex-1 min-w-0 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-[10px] text-zinc-200 font-mono outline-none focus:border-indigo-500"
          />
        </label>
      </div>

      {/* Easing selection */}
      <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1.5">Easing</div>
      <div className="flex flex-col gap-0.5">
        {EASING_OPTIONS.map((opt) => {
          const isActive = freshKf.easing.type === opt.type;
          return (
            <button
              key={opt.type}
              onClick={() => onEasingChange({ type: opt.type })}
              className={[
                "flex items-center gap-2 rounded px-2 py-1 text-left text-[10px] transition-colors",
                isActive
                  ? "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300",
              ].join(" ")}
            >
              <svg width={24} height={14} viewBox="0 0 80 48" className="shrink-0 opacity-70">
                <polyline
                  points={easingPreviewPath(opt.type)}
                  fill="none"
                  stroke={isActive ? "#818cf8" : "#71717a"}
                  strokeWidth={3}
                />
              </svg>
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Delete keyframe */}
      <button
        onClick={onDelete}
        className="mt-3 w-full rounded px-2 py-1 text-[10px] text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors border border-red-500/20"
      >
        Delete keyframe
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Curve Graph — with zoom/pan and fixed 0%-100% vertical axis
// ---------------------------------------------------------------------------

interface CurveGraphProps {
  sceneId: string;
  parameters: ParameterInfo[];
  sceneDuration: number;
  sceneLocalTime: number;
  selectedParamPath: string | null;
  zoomX: number;
  zoomY: number;
  panX: number;
  onZoomX: (z: number) => void;
  onZoomY: (z: number) => void;
  onPanX: (p: number) => void;
  onSeek: (absoluteTime: number) => void;
  onSelectKeyframe: (kfCtx: KeyframeWithContext, paramPath: string, paramColor: string) => void;
  selectedKeyframeId: string | null;
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
  paramPath: string;
  paramColor: string;
  min: number;
  max: number;
}

function CurveGraph({
  sceneId,
  parameters,
  sceneDuration,
  sceneLocalTime,
  selectedParamPath,
  zoomX,
  zoomY,
  panX,
  onZoomX,
  onZoomY,
  onPanX,
  onSeek,
  onSelectKeyframe,
  selectedKeyframeId,
  updateKeyframe,
  removeKeyframe,
  addKeyframe,
}: CurveGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const viewWidth = 600;
  const viewHeight = 380;
  const graphLeft = GRAPH_PADDING_LEFT;
  const graphRight = viewWidth - GRAPH_PADDING_RIGHT;
  const graphTop = GRAPH_PADDING_TOP;
  const graphBottom = viewHeight - GRAPH_PADDING_BOTTOM;
  const graphWidth = graphRight - graphLeft;
  const graphHeight = graphBottom - graphTop;

  // The visible time window
  const visibleDuration = sceneDuration / zoomX;
  const timeStart = panX;
  const timeEnd = panX + visibleDuration;

  // Vertical: fixed 0% (bottom) to 100% (top), stretched by zoomY
  // zoomY=1 → 0%-100% visible; zoomY=2 → only 25%-75% visible (centered)
  const vCenter = 0.5;
  const vHalfRange = 0.5 / zoomY;
  const vMin = vCenter - vHalfRange; // normalized min visible (can be < 0)
  const vMax = vCenter + vHalfRange; // normalized max visible (can be > 1)

  // Time to SVG X
  const timeToX = useCallback(
    (t: number) => graphLeft + ((t - timeStart) / visibleDuration) * graphWidth,
    [timeStart, visibleDuration, graphLeft, graphWidth],
  );

  const xToTime = useCallback(
    (x: number) => timeStart + ((x - graphLeft) / graphWidth) * visibleDuration,
    [timeStart, visibleDuration, graphLeft, graphWidth],
  );

  // Normalized value (0-1) to SVG Y
  const normToY = useCallback(
    (norm: number) => graphTop + ((vMax - norm) / (vMax - vMin)) * graphHeight,
    [graphTop, graphHeight, vMin, vMax],
  );

  // SVG Y to normalized value (0-1)
  const yToNorm = useCallback(
    (y: number) => vMax - ((y - graphTop) / graphHeight) * (vMax - vMin),
    [graphTop, graphHeight, vMin, vMax],
  );

  // Wheel zoom + pan
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        // Ctrl+wheel = zoom horizontal
        const factor = e.deltaY > 0 ? 1 / ZOOM_STEP : ZOOM_STEP;
        onZoomX(zoomX * factor);
      } else if (e.shiftKey) {
        // Shift+wheel = zoom vertical
        const factor = e.deltaY > 0 ? 1 / ZOOM_STEP : ZOOM_STEP;
        onZoomY(zoomY * factor);
      } else {
        // Plain wheel = pan horizontal
        const panDelta = (e.deltaY / 300) * visibleDuration;
        onPanX(panX + panDelta);
      }
    }

    svg.addEventListener("wheel", handleWheel, { passive: false });
    return () => svg.removeEventListener("wheel", handleWheel);
  }, [zoomX, zoomY, panX, visibleDuration, onZoomX, onZoomY, onPanX]);

  // Time ticks
  const ticks = useMemo(() => {
    const result: number[] = [];
    let interval = 1;
    const dur = visibleDuration;
    if (dur > 60) interval = 10;
    else if (dur > 20) interval = 5;
    else if (dur > 10) interval = 2;
    else if (dur > 4) interval = 1;
    else if (dur > 1) interval = 0.5;
    else interval = 0.1;
    const start = Math.floor(timeStart / interval) * interval;
    for (let t = start; t <= timeEnd + interval; t += interval) {
      if (t >= timeStart - interval && t <= timeEnd + interval) {
        result.push(t);
      }
    }
    return result;
  }, [timeStart, timeEnd, visibleDuration]);

  // Percentage labels on the left
  const percentLabels = useMemo(() => {
    const labels: { pct: number; y: number }[] = [];
    const step = zoomY >= 3 ? 5 : zoomY >= 1.5 ? 10 : 25;
    for (let pct = 0; pct <= 100; pct += step) {
      const norm = pct / 100;
      if (norm >= vMin - 0.01 && norm <= vMax + 0.01) {
        labels.push({ pct, y: normToY(norm) });
      }
    }
    return labels;
  }, [vMin, vMax, zoomY, normToY]);

  // Build curves
  const { curves } = useMemo(() => {
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
      // Map raw value → 0-1 normalized
      const toNorm = (v: number) => (v - min) / (max - min);

      if (!isNumeric) {
        const diamonds = keyframes.map((kf) => {
          const d: DiamondData = {
            x: timeToX(kf.absoluteTime), y: normToY(0.5),
            time: kf.absoluteTime, kfCtx: kf, paramIndex, min, max,
            paramPath: param.path, paramColor: param.color,
          };
          return d;
        });
        return {
          param, isNumeric: false as const, points: diamonds.map(d => ({ x: d.x, y: d.y })), diamonds,
        };
      }

      // Numeric — sample the eased curve
      const points: { x: number; y: number }[] = [];

      if (keyframes.length === 1) {
        const ny = toNorm(keyframes[0].keyframe.value as number);
        points.push({ x: timeToX(0), y: normToY(ny) });
        points.push({ x: timeToX(sceneDuration), y: normToY(ny) });
      } else {
        if (keyframes[0].absoluteTime > 0) {
          const ny = toNorm(keyframes[0].keyframe.value as number);
          points.push({ x: timeToX(0), y: normToY(ny) });
        }
        const ny0 = toNorm(keyframes[0].keyframe.value as number);
        points.push({ x: timeToX(keyframes[0].absoluteTime), y: normToY(ny0) });

        for (let i = 0; i < keyframes.length - 1; i++) {
          const a = keyframes[i], b = keyframes[i + 1];
          const span = b.absoluteTime - a.absoluteTime;
          for (let s = 1; s <= SAMPLES_PER_SEGMENT; s++) {
            const rawT = s / SAMPLES_PER_SEGMENT;
            const easedT = applyEasing(a.keyframe.easing, rawT);
            const value = interpolateValue(a.keyframe.value, b.keyframe.value, easedT) as number;
            const ny = toNorm(value);
            points.push({ x: timeToX(a.absoluteTime + rawT * span), y: normToY(ny) });
          }
        }

        const lastKf = keyframes[keyframes.length - 1];
        if (lastKf.absoluteTime < sceneDuration) {
          const ny = toNorm(lastKf.keyframe.value as number);
          points.push({ x: timeToX(sceneDuration), y: normToY(ny) });
        }
      }

      const diamonds = keyframes.map((kf) => {
        const ny = toNorm(kf.keyframe.value as number);
        const d: DiamondData = {
          x: timeToX(kf.absoluteTime), y: normToY(ny),
          time: kf.absoluteTime, kfCtx: kf, paramIndex, min, max,
          paramPath: param.path, paramColor: param.color,
        };
        return d;
      });

      return { param, isNumeric: true as const, points, diamonds };
    });

    return { curves: curveList };
  }, [parameters, sceneDuration, timeToX, normToY]);

  // --- Drag state ---
  const dragRef = useRef<{
    diamond: DiamondData;
    startClientX: number;
    startClientY: number;
    hasMoved: boolean;
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

  const handleDiamondPointerDown = useCallback(
    (e: React.PointerEvent, diamond: DiamondData) => {
      e.stopPropagation();
      dragRef.current = {
        diamond, startClientX: e.clientX, startClientY: e.clientY, hasMoved: false,
      };

      const handleMove = (ev: PointerEvent) => {
        if (!dragRef.current) return;
        const dx = Math.abs(ev.clientX - dragRef.current.startClientX);
        const dy = Math.abs(ev.clientY - dragRef.current.startClientY);
        if (!dragRef.current.hasMoved && dx < 3 && dy < 3) return;
        dragRef.current.hasMoved = true;

        const { svgX, svgY } = clientToSvg(ev.clientX, ev.clientY);

        const newTime = Math.max(0, Math.min(sceneDuration, xToTime(svgX)));
        const { kfCtx } = dragRef.current.diamond;
        const relativeTime = newTime - (kfCtx.absoluteTime - kfCtx.keyframe.time);

        const isNumeric = typeof kfCtx.keyframe.value === "number";
        const patch: Partial<Omit<Keyframe, "id">> = { time: Math.max(0, relativeTime) };

        if (isNumeric) {
          const { min, max } = dragRef.current.diamond;
          const normVal = clamp(yToNorm(svgY), 0, 1);
          patch.value = min + normVal * (max - min);
        }

        updateKeyframe(sceneId, kfCtx.sequenceId, kfCtx.keyframe.id, patch);
      };

      const handleUp = () => {
        const wasDrag = dragRef.current?.hasMoved ?? false;
        const d = dragRef.current?.diamond;
        dragRef.current = null;
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);

        if (!wasDrag && d) {
          onSelectKeyframe(d.kfCtx, d.paramPath, d.paramColor);
        }
      };

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
    },
    [sceneId, sceneDuration, xToTime, yToNorm, clientToSvg, updateKeyframe, onSelectKeyframe],
  );

  const handleDiamondDoubleClick = useCallback(
    (e: React.MouseEvent, diamond: DiamondData) => {
      e.stopPropagation();
      const { kfCtx } = diamond;
      removeKeyframe(sceneId, kfCtx.sequenceId, kfCtx.keyframe.id);
    },
    [sceneId, removeKeyframe],
  );

  const handleSvgDoubleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if ((e.target as Element).closest("[data-kf-diamond]")) return;
      if (!selectedParamPath) return;

      const selectedCurve = curves.find((c) => c.param.path === selectedParamPath);
      if (!selectedCurve || !selectedCurve.isNumeric) return;

      const { svgX, svgY } = clientToSvg(e.clientX, e.clientY);
      const newTime = Math.max(0, Math.min(sceneDuration, xToTime(svgX)));

      const kfs = selectedCurve.param.keyframes;
      const { min, max } = selectedCurve.diamonds[0] ?? { min: 0, max: 1 };
      const normVal = clamp(yToNorm(svgY), 0, 1);
      const value = min + normVal * (max - min);

      const seqId = kfs[0].sequenceId;
      addKeyframe(sceneId, seqId, {
        time: newTime,
        path: selectedCurve.param.path,
        value,
        easing: { type: "linear" },
      });
    },
    [sceneId, sceneDuration, selectedParamPath, curves, xToTime, yToNorm, clientToSvg, addKeyframe],
  );

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
    <svg
      ref={svgRef}
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      preserveAspectRatio="none"
      className="w-full h-full cursor-crosshair"
      onClick={handleSvgClick}
      onDoubleClick={handleSvgDoubleClick}
    >
      {/* Clip the graph area */}
      <defs>
        <clipPath id="graph-clip">
          <rect x={graphLeft} y={graphTop} width={graphWidth} height={graphHeight} />
        </clipPath>
      </defs>

      {/* Background */}
      <rect x={graphLeft} y={graphTop} width={graphWidth} height={graphHeight} fill="#18181b" rx={2} />

      {/* Percentage labels on left */}
      {percentLabels.map(({ pct, y }) => (
        <g key={pct}>
          <line x1={graphLeft} y1={y} x2={graphRight} y2={y} stroke="#27272a" strokeWidth={0.5} />
          <text x={graphLeft - 4} y={y + 3} textAnchor="end" fill="#52525b" fontSize={8} fontFamily="monospace">
            {pct}%
          </text>
        </g>
      ))}

      {/* Time ruler ticks */}
      {ticks.map((t) => {
        const x = timeToX(t);
        if (x < graphLeft - 10 || x > graphRight + 10) return null;
        return (
          <g key={t}>
            <line x1={x} y1={graphTop} x2={x} y2={graphBottom} stroke="#27272a" strokeWidth={0.5} />
            <text x={x} y={graphBottom + 12} textAnchor="middle" fill="#71717a" fontSize={8}>
              {t % 1 === 0 ? `${t}s` : `${t.toFixed(1)}s`}
            </text>
          </g>
        );
      })}

      {/* Curves — clipped to graph area */}
      <g clipPath="url(#graph-clip)">
        {curves.map((curve) => {
          const isSelectedParam = curve.param.path === selectedParamPath;
          const curveOpacity = isSelectedParam ? 1 : 0.35;

          const polylinePoints = curve.points.map((p) => `${p.x},${p.y}`).join(" ");
          return (
            <g key={curve.param.path}>
              {curve.isNumeric ? (
                <polyline
                  points={polylinePoints}
                  fill="none"
                  stroke={curve.param.color}
                  strokeWidth={isSelectedParam ? 2 : 1}
                  strokeLinejoin="round"
                  opacity={curveOpacity}
                />
              ) : (
                curve.diamonds.map((d, i, arr) => {
                  const nextX = i < arr.length - 1 ? arr[i + 1].x : timeToX(sceneDuration);
                  return (
                    <line key={i} x1={d.x} y1={d.y} x2={nextX} y2={d.y}
                      stroke={curve.param.color} strokeWidth={isSelectedParam ? 2 : 1} opacity={curveOpacity} />
                  );
                })
              )}

              {/* Diamond keyframe markers */}
              {curve.diamonds.map((d) => {
                const isSelectedDiamond = d.kfCtx.keyframe.id === selectedKeyframeId;
                return (
                  <g
                    key={d.kfCtx.keyframe.id}
                    data-kf-diamond
                    className="cursor-grab"
                    onPointerDown={(e) => handleDiamondPointerDown(e, d)}
                    onDoubleClick={(e) => handleDiamondDoubleClick(e, d)}
                  >
                    <rect
                      x={d.x - DIAMOND_SIZE - 3}
                      y={d.y - DIAMOND_SIZE - 3}
                      width={(DIAMOND_SIZE + 3) * 2}
                      height={(DIAMOND_SIZE + 3) * 2}
                      fill="transparent"
                    />
                    {isSelectedDiamond && (
                      <rect
                        x={d.x - DIAMOND_SIZE - 2}
                        y={d.y - DIAMOND_SIZE - 2}
                        width={(DIAMOND_SIZE + 2) * 2}
                        height={(DIAMOND_SIZE + 2) * 2}
                        fill="none"
                        stroke="#818cf8"
                        strokeWidth={1.5}
                        transform={`rotate(45 ${d.x} ${d.y})`}
                        rx={0.5}
                      />
                    )}
                    <rect
                      x={d.x - DIAMOND_SIZE}
                      y={d.y - DIAMOND_SIZE}
                      width={DIAMOND_SIZE * 2}
                      height={DIAMOND_SIZE * 2}
                      fill={curve.param.color}
                      stroke={isSelectedDiamond ? "#fff" : "#aaa"}
                      strokeWidth={isSelectedDiamond ? 1 : 0.5}
                      transform={`rotate(45 ${d.x} ${d.y})`}
                      rx={0.5}
                      opacity={isSelectedParam ? 1 : 0.5}
                    />
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
                );
              })}
            </g>
          );
        })}
      </g>

      {/* Playhead */}
      {playheadX >= graphLeft && playheadX <= graphRight && (
        <>
          <line x1={playheadX} y1={graphTop - 2} x2={playheadX} y2={graphBottom + 2} stroke="#ef4444" strokeWidth={1} />
          <polygon points={`${playheadX - 4},${graphTop - 2} ${playheadX + 4},${graphTop - 2} ${playheadX},${graphTop + 4}`} fill="#ef4444" />
        </>
      )}
    </svg>
  );
}
