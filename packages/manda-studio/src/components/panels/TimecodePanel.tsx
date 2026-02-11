import { useCallback } from "react";
import { useStudioStore } from "@/store/useStudioStore.ts";
import { SectionHeader } from "@/components/ui/SectionHeader.tsx";
import { LabeledSlider } from "@/components/ui/LabeledSlider.tsx";
import { LabeledToggle } from "@/components/ui/LabeledToggle.tsx";
import { ColorInput } from "@/components/ui/ColorInput.tsx";
import { BlendingControl } from "@/components/ui/BlendingControl.tsx";

export function TimecodePanel() {
  const timer = useStudioStore((s) => s.config.timer);
  const updateConfig = useStudioStore((s) => s.updateConfig);
  const pushHistory = useStudioStore((s) => s.pushHistory);

  const path = "timer";

  const handleToggleShow = useCallback(
    (v: boolean) => {
      pushHistory();
      updateConfig(`${path}.show`, v);
    },
    [pushHistory, updateConfig],
  );

  const handleToggleBgColor = useCallback(
    (v: boolean) => {
      pushHistory();
      updateConfig(`${path}.bgColor`, v);
    },
    [pushHistory, updateConfig],
  );

  return (
    <div className="flex flex-col">
      <SectionHeader
        title="Timecode"
        enabled={timer.show}
        onToggle={handleToggleShow}
      >
        <ColorInput
          label="Color"
          value={timer.color}
          onChange={(v) => updateConfig(`${path}.color`, v)}
        />

        <LabeledToggle
          label="Show Background"
          checked={timer.bgColor}
          onChange={handleToggleBgColor}
        />

        <LabeledSlider
          label="Opacity"
          value={timer.opacity}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => updateConfig(`${path}.opacity`, v)}
          onPointerDown={pushHistory}
        />

        <BlendingControl
          path={`${path}.blending`}
          value={timer.blending}
        />

        <LabeledSlider
          label="Font Size"
          value={timer.size}
          min={0}
          max={256}
          step={1}
          suffix="px"
          onChange={(v) => updateConfig(`${path}.size`, v)}
          onPointerDown={pushHistory}
        />

        <LabeledSlider
          label="Width"
          value={timer.width}
          min={0}
          max={1024}
          step={1}
          suffix="px"
          onChange={(v) => updateConfig(`${path}.width`, v)}
          onPointerDown={pushHistory}
        />

        <LabeledSlider
          label="Height"
          value={timer.height}
          min={0}
          max={1024}
          step={1}
          suffix="px"
          onChange={(v) => updateConfig(`${path}.height`, v)}
          onPointerDown={pushHistory}
        />

        {/* Align */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">Align</span>
          <div className="flex gap-0.5">
            {(["left", "center"] as const).map((align) => (
              <button
                key={align}
                type="button"
                onClick={() => {
                  pushHistory();
                  updateConfig(`${path}.align`, align);
                }}
                className={`rounded px-2 py-0.5 text-[10px] capitalize transition-colors ${
                  timer.align === align
                    ? "bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500"
                    : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {align}
              </button>
            ))}
          </div>
        </div>

        {/* Position sub-section */}
        <SectionHeader title="Position" defaultOpen={false}>
          <LabeledSlider
            label="X"
            value={timer.x}
            min={-650}
            max={650}
            step={0.01}
            onChange={(v) => updateConfig(`${path}.x`, v)}
            onPointerDown={pushHistory}
          />

          <LabeledSlider
            label="Y"
            value={timer.y}
            min={-650}
            max={650}
            step={0.01}
            onChange={(v) => updateConfig(`${path}.y`, v)}
            onPointerDown={pushHistory}
          />

          <LabeledSlider
            label="Z"
            value={timer.z}
            min={-650}
            max={-1}
            step={0.01}
            onChange={(v) => updateConfig(`${path}.z`, v)}
            onPointerDown={pushHistory}
          />

          <LabeledSlider
            label="Rotation X"
            value={timer.rotationX}
            min={-2}
            max={2}
            step={0.01}
            onChange={(v) => updateConfig(`${path}.rotationX`, v)}
            onPointerDown={pushHistory}
          />

          <LabeledSlider
            label="Rotation Y"
            value={timer.rotationY}
            min={-2}
            max={2}
            step={0.01}
            onChange={(v) => updateConfig(`${path}.rotationY`, v)}
            onPointerDown={pushHistory}
          />

          <LabeledSlider
            label="Rotation Z"
            value={timer.rotationZ}
            min={-2}
            max={2}
            step={0.01}
            onChange={(v) => updateConfig(`${path}.rotationZ`, v)}
            onPointerDown={pushHistory}
          />
        </SectionHeader>
      </SectionHeader>
    </div>
  );
}
