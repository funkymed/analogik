import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Keyframe, EasingType } from "@/timeline/ganttTypes.ts";
import { KeyframeCurvePreview } from "./KeyframeCurvePreview.tsx";

interface KeyframeEditorProps {
  keyframe: Keyframe;
  /** Pixel position from left of container for popover placement. */
  anchorLeftPx: number;
  onUpdate: (patch: Partial<Omit<Keyframe, "id">>) => void;
  onRemove: () => void;
  onClose: () => void;
}

const EASING_OPTIONS: { value: EasingType; label: string }[] = [
  { value: "linear", label: "Linear" },
  { value: "easeIn", label: "Ease In" },
  { value: "easeOut", label: "Ease Out" },
  { value: "easeInOut", label: "Ease In-Out" },
  { value: "cubicBezier", label: "Bezier" },
];

/**
 * Popover for editing a keyframe's value and easing.
 */
export function KeyframeEditor({
  keyframe,
  anchorLeftPx,
  onUpdate,
  onRemove,
  onClose,
}: KeyframeEditorProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [localValue, setLocalValue] = useState(String(keyframe.value));

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const commitValue = useCallback(() => {
    const raw = localValue.trim();
    let parsed: number | string | boolean;

    if (raw === "true") parsed = true;
    else if (raw === "false") parsed = false;
    else if (!isNaN(Number(raw)) && raw !== "") parsed = Number(raw);
    else parsed = raw;

    if (parsed !== keyframe.value) {
      onUpdate({ value: parsed });
    }
  }, [localValue, keyframe.value, onUpdate]);

  const handleEasingChange = useCallback(
    (type: EasingType) => {
      const easing = { ...keyframe.easing, type };
      if (type === "cubicBezier" && !easing.bezierPoints) {
        easing.bezierPoints = [0.25, 0.1, 0.25, 1.0];
      }
      onUpdate({ easing });
    },
    [keyframe.easing, onUpdate],
  );

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 rounded-lg border border-zinc-700 bg-zinc-900 p-2 shadow-xl"
      style={{
        left: Math.max(0, anchorLeftPx - 80),
        bottom: "100%",
        marginBottom: 6,
        width: 180,
      }}
    >
      {/* Header */}
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[10px] font-medium text-zinc-400">
          {keyframe.path}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300"
        >
          <X size={10} />
        </button>
      </div>

      {/* Time */}
      <div className="mb-1.5">
        <label className="text-[9px] text-zinc-500">Time (s)</label>
        <input
          type="number"
          step={0.1}
          min={0}
          value={keyframe.time}
          onChange={(e) => onUpdate({ time: Math.max(0, Number(e.target.value)) })}
          className="mt-0.5 w-full rounded bg-zinc-800 px-1.5 py-0.5 text-[11px] text-zinc-200 outline-none focus:ring-1 focus:ring-indigo-500/50"
        />
      </div>

      {/* Value */}
      <div className="mb-1.5">
        <label className="text-[9px] text-zinc-500">Value</label>
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={commitValue}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitValue();
          }}
          className="mt-0.5 w-full rounded bg-zinc-800 px-1.5 py-0.5 text-[11px] text-zinc-200 outline-none focus:ring-1 focus:ring-indigo-500/50"
        />
      </div>

      {/* Easing */}
      <div className="mb-1.5">
        <label className="text-[9px] text-zinc-500">Easing</label>
        <div className="mt-0.5 flex flex-wrap gap-1">
          {EASING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleEasingChange(opt.value)}
              className={[
                "rounded px-1 py-0.5 text-[9px] transition-colors",
                keyframe.easing.type === opt.value
                  ? "bg-indigo-500/30 text-indigo-300"
                  : "bg-zinc-800 text-zinc-400 hover:text-zinc-200",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Curve preview */}
      <div className="mb-1.5 flex items-center justify-center text-indigo-400">
        <KeyframeCurvePreview easing={keyframe.easing} width={60} height={32} />
      </div>

      {/* Delete */}
      <button
        type="button"
        onClick={onRemove}
        className="w-full rounded bg-red-500/10 px-2 py-0.5 text-[10px] text-red-400 hover:bg-red-500/20"
      >
        Delete Keyframe
      </button>
    </div>
  );
}
