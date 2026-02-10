import { useCallback } from "react";
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
}: LabeledSliderProps) {
  const handleValueChange = useCallback(
    (values: number[]) => {
      onChange(values[0]);
    },
    [onChange],
  );

  const displayValue =
    step < 1 ? value.toFixed(2) : String(Math.round(value));

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs text-zinc-400">{label}</label>
        <span className="text-xs tabular-nums text-zinc-500">
          {displayValue}
          {suffix}
        </span>
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
        <Slider.Thumb className="block h-3 w-3 rounded-full bg-zinc-100 shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50" />
      </Slider.Root>
    </div>
  );
}
