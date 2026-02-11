import { useCallback, useRef, useState } from "react";
import * as Slider from "@radix-ui/react-slider";

interface LabeledSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  suffix?: string;
  onPointerDown?: () => void;
  defaultValue?: number;
}

export function LabeledSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  disabled = false,
  suffix = "",
  onPointerDown,
  defaultValue,
}: LabeledSliderProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleValueChange = useCallback(
    (values: number[]) => {
      onChange(values[0]);
    },
    [onChange],
  );

  const displayValue =
    step < 1 ? value.toFixed(2) : String(Math.round(value));

  const handleDoubleClickValue = useCallback(() => {
    setEditText(step < 1 ? value.toFixed(2) : String(Math.round(value)));
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.select());
  }, [value, step]);

  const applyEdit = useCallback(() => {
    const parsed = parseFloat(editText);
    if (!isNaN(parsed)) {
      const clamped = Math.min(max, Math.max(min, parsed));
      onPointerDown?.();
      onChange(clamped);
    }
    setEditing(false);
  }, [editText, min, max, onChange, onPointerDown]);

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyEdit();
      } else if (e.key === "Escape") {
        setEditing(false);
      }
    },
    [applyEdit],
  );

  const handleThumbDoubleClick = useCallback(() => {
    if (defaultValue !== undefined) {
      onPointerDown?.();
      onChange(defaultValue);
    }
  }, [defaultValue, onChange, onPointerDown]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs text-zinc-400">{label}</label>
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleEditKeyDown}
            onBlur={applyEdit}
            className="h-5 w-16 rounded border border-indigo-500 bg-zinc-800 px-1 text-right text-xs tabular-nums text-zinc-300 outline-none"
          />
        ) : (
          <span
            className="cursor-text text-xs tabular-nums text-zinc-500 hover:text-zinc-300"
            onDoubleClick={handleDoubleClickValue}
          >
            {displayValue}
            {suffix}
          </span>
        )}
      </div>
      <Slider.Root
        className="relative flex h-4 w-full touch-none select-none items-center"
        min={min}
        max={max}
        step={step}
        value={[value]}
        disabled={disabled}
        onValueChange={handleValueChange}
        onPointerDown={onPointerDown}
      >
        <Slider.Track className="relative h-1 w-full grow rounded-full bg-zinc-800">
          <Slider.Range className="absolute h-full rounded-full bg-indigo-500" />
        </Slider.Track>
        <Slider.Thumb
          className="block h-3 w-3 rounded-full bg-zinc-100 shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
          onDoubleClick={handleThumbDoubleClick}
        />
      </Slider.Root>
    </div>
  );
}
