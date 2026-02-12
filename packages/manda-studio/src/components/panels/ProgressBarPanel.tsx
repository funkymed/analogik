import { useCallback } from "react";
import { useStudioStore } from "@/store/useStudioStore.ts";
import { SectionHeader } from "@/components/ui/SectionHeader.tsx";
import { LabeledSlider } from "@/components/ui/LabeledSlider.tsx";
import { LabeledToggle } from "@/components/ui/LabeledToggle.tsx";
import { ColorInput } from "@/components/ui/ColorInput.tsx";
import { BlendingControl } from "@/components/ui/BlendingControl.tsx";

export function ProgressBarPanel() {
  const progressbar = useStudioStore((s) => s.config.progressbar);
  const updateConfig = useStudioStore((s) => s.updateConfig);
  const pushHistory = useStudioStore((s) => s.pushHistory);

  const path = "progressbar";

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
      <LabeledToggle
        label="Visible"
        checked={progressbar.show}
        onChange={handleToggleShow}
      />

      <div className="space-y-3 pt-2">
        <ColorInput
          label="Bar Color"
          value={progressbar.color}
          onChange={(v) => updateConfig(`${path}.color`, v)}
        />

        <ColorInput
          label="Cursor Color"
          value={progressbar.cursorColor}
          onChange={(v) => updateConfig(`${path}.cursorColor`, v)}
        />

        <LabeledToggle
          label="Show Background"
          checked={progressbar.bgColor}
          onChange={handleToggleBgColor}
        />

        <LabeledSlider
          label="Opacity"
          value={progressbar.opacity}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => updateConfig(`${path}.opacity`, v)}
          onPointerDown={pushHistory}
        />

        <BlendingControl
          path={`${path}.blending`}
          value={progressbar.blending}
        />

        <LabeledSlider
          label="Width"
          value={progressbar.width}
          min={0}
          max={1024}
          step={1}
          suffix="px"
          onChange={(v) => updateConfig(`${path}.width`, v)}
          onPointerDown={pushHistory}
        />

        <LabeledSlider
          label="Height"
          value={progressbar.height}
          min={0}
          max={1024}
          step={1}
          suffix="px"
          onChange={(v) => updateConfig(`${path}.height`, v)}
          onPointerDown={pushHistory}
        />

        {/* Position sub-section */}
        <SectionHeader title="Position" defaultOpen={false}>
          <LabeledSlider label="X" value={progressbar.x} min={-650} max={650} step={0.01} onChange={(v) => updateConfig(`${path}.x`, v)} onPointerDown={pushHistory} />
          <LabeledSlider label="Y" value={progressbar.y} min={-650} max={650} step={0.01} onChange={(v) => updateConfig(`${path}.y`, v)} onPointerDown={pushHistory} />
          <LabeledSlider label="Z" value={progressbar.z} min={-650} max={-1} step={0.01} onChange={(v) => updateConfig(`${path}.z`, v)} onPointerDown={pushHistory} />
          <LabeledSlider label="Rotation X" value={progressbar.rotationX} min={-2} max={2} step={0.01} onChange={(v) => updateConfig(`${path}.rotationX`, v)} onPointerDown={pushHistory} />
          <LabeledSlider label="Rotation Y" value={progressbar.rotationY} min={-2} max={2} step={0.01} onChange={(v) => updateConfig(`${path}.rotationY`, v)} onPointerDown={pushHistory} />
          <LabeledSlider label="Rotation Z" value={progressbar.rotationZ} min={-2} max={2} step={0.01} onChange={(v) => updateConfig(`${path}.rotationZ`, v)} onPointerDown={pushHistory} />
        </SectionHeader>
      </div>
    </div>
  );
}
