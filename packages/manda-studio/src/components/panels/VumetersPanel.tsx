import { useCallback } from "react";
import { useStudioStore } from "@/store/useStudioStore.ts";
import { SectionHeader } from "@/components/ui/SectionHeader.tsx";
import { LabeledSlider } from "@/components/ui/LabeledSlider.tsx";
import { LabeledToggle } from "@/components/ui/LabeledToggle.tsx";
import { ColorInput } from "@/components/ui/ColorInput.tsx";

// ---------------------------------------------------------------------------
// Oscilloscope section
// ---------------------------------------------------------------------------

function OscilloscopeSection() {
  const oscilloscop = useStudioStore((s) => s.config.vumeters.oscilloscop);
  const updateConfig = useStudioStore((s) => s.updateConfig);
  const pushHistory = useStudioStore((s) => s.pushHistory);

  const path = "vumeters.oscilloscop";

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

  const handleToggleMotionBlur = useCallback(
    (v: boolean) => {
      pushHistory();
      updateConfig(`${path}.motionBlur`, v);
    },
    [pushHistory, updateConfig],
  );

  return (
    <SectionHeader
      title="Oscilloscope"
      enabled={oscilloscop.show}
      onToggle={handleToggleShow}
    >
      <ColorInput
        label="Color"
        value={oscilloscop.color}
        onChange={(v) => updateConfig(`${path}.color`, v)}
      />

      <LabeledToggle
        label="Show Background"
        checked={oscilloscop.bgColor}
        onChange={handleToggleBgColor}
      />

      <LabeledToggle
        label="Motion Blur"
        checked={oscilloscop.motionBlur}
        onChange={handleToggleMotionBlur}
      />

      <LabeledSlider
        label="Motion Blur Length"
        value={oscilloscop.motionBlurLength}
        min={0}
        max={1}
        step={0.01}
        disabled={!oscilloscop.motionBlur}
        onChange={(v) => updateConfig(`${path}.motionBlurLength`, v)}
        onPointerDown={pushHistory}
      />

      <LabeledSlider
        label="Opacity"
        value={oscilloscop.opacity}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => updateConfig(`${path}.opacity`, v)}
        onPointerDown={pushHistory}
      />

      <LabeledSlider
        label="Width"
        value={oscilloscop.width}
        min={0}
        max={1024}
        step={1}
        suffix="px"
        onChange={(v) => updateConfig(`${path}.width`, v)}
        onPointerDown={pushHistory}
      />

      <LabeledSlider
        label="Height"
        value={oscilloscop.height}
        min={0}
        max={1024}
        step={1}
        suffix="px"
        onChange={(v) => updateConfig(`${path}.height`, v)}
        onPointerDown={pushHistory}
      />

      {/* Position sub-section */}
      <SectionHeader title="Position" defaultOpen={false}>
        <LabeledSlider
          label="X"
          value={oscilloscop.x}
          min={-650}
          max={650}
          step={0.01}
          onChange={(v) => updateConfig(`${path}.x`, v)}
          onPointerDown={pushHistory}
        />

        <LabeledSlider
          label="Y"
          value={oscilloscop.y}
          min={-650}
          max={650}
          step={0.01}
          onChange={(v) => updateConfig(`${path}.y`, v)}
          onPointerDown={pushHistory}
        />

        <LabeledSlider
          label="Z"
          value={oscilloscop.z}
          min={-650}
          max={-1}
          step={0.01}
          onChange={(v) => updateConfig(`${path}.z`, v)}
          onPointerDown={pushHistory}
        />

        <LabeledSlider
          label="Rotation X"
          value={oscilloscop.rotationX}
          min={-2}
          max={2}
          step={0.01}
          onChange={(v) => updateConfig(`${path}.rotationX`, v)}
          onPointerDown={pushHistory}
        />

        <LabeledSlider
          label="Rotation Y"
          value={oscilloscop.rotationY}
          min={-2}
          max={2}
          step={0.01}
          onChange={(v) => updateConfig(`${path}.rotationY`, v)}
          onPointerDown={pushHistory}
        />

        <LabeledSlider
          label="Rotation Z"
          value={oscilloscop.rotationZ}
          min={-2}
          max={2}
          step={0.01}
          onChange={(v) => updateConfig(`${path}.rotationZ`, v)}
          onPointerDown={pushHistory}
        />
      </SectionHeader>
    </SectionHeader>
  );
}

// ---------------------------------------------------------------------------
// Spectrum section
// ---------------------------------------------------------------------------

function SpectrumSection() {
  const spectrum = useStudioStore((s) => s.config.vumeters.spectrum);
  const updateConfig = useStudioStore((s) => s.updateConfig);
  const pushHistory = useStudioStore((s) => s.pushHistory);

  const path = "vumeters.spectrum";

  const handleToggleShow = useCallback(
    (v: boolean) => {
      pushHistory();
      updateConfig(`${path}.show`, v);
    },
    [pushHistory, updateConfig],
  );

  const handleToggleMultiColor = useCallback(
    (v: boolean) => {
      pushHistory();
      updateConfig(`${path}.multiColor`, v);
    },
    [pushHistory, updateConfig],
  );

  const handleToggleCenterSpectrum = useCallback(
    (v: boolean) => {
      pushHistory();
      updateConfig(`${path}.centerSpectrum`, v);
    },
    [pushHistory, updateConfig],
  );

  const handleToggleMotionBlur = useCallback(
    (v: boolean) => {
      pushHistory();
      updateConfig(`${path}.motionBlur`, v);
    },
    [pushHistory, updateConfig],
  );

  const spectrumColorIsString = typeof spectrum.color === "string";

  return (
    <SectionHeader
      title="Spectrum"
      enabled={spectrum.show}
      onToggle={handleToggleShow}
    >
      {spectrumColorIsString && (
        <ColorInput
          label="Color"
          value={spectrum.color as string}
          onChange={(v) => updateConfig(`${path}.color`, v)}
        />
      )}

      <LabeledToggle
        label="Multi-color"
        checked={spectrum.multiColor}
        onChange={handleToggleMultiColor}
      />

      <LabeledToggle
        label="Center Spectrum"
        checked={spectrum.centerSpectrum}
        onChange={handleToggleCenterSpectrum}
      />

      <LabeledToggle
        label="Motion Blur"
        checked={spectrum.motionBlur}
        onChange={handleToggleMotionBlur}
      />

      <LabeledSlider
        label="Motion Blur Length"
        value={spectrum.motionBlurLength}
        min={0}
        max={1}
        step={0.01}
        disabled={!spectrum.motionBlur}
        onChange={(v) => updateConfig(`${path}.motionBlurLength`, v)}
        onPointerDown={pushHistory}
      />

      <LabeledSlider
        label="Opacity"
        value={spectrum.opacity}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => updateConfig(`${path}.opacity`, v)}
        onPointerDown={pushHistory}
      />

      <LabeledSlider
        label="Bars"
        value={spectrum.bars}
        min={1}
        max={256}
        step={1}
        onChange={(v) => updateConfig(`${path}.bars`, v)}
        onPointerDown={pushHistory}
      />

      <LabeledSlider
        label="Width"
        value={spectrum.width}
        min={0}
        max={1024}
        step={1}
        suffix="px"
        onChange={(v) => updateConfig(`${path}.width`, v)}
        onPointerDown={pushHistory}
      />

      <LabeledSlider
        label="Height"
        value={spectrum.height}
        min={0}
        max={1024}
        step={1}
        suffix="px"
        onChange={(v) => updateConfig(`${path}.height`, v)}
        onPointerDown={pushHistory}
      />

      <LabeledSlider
        label="Zoom"
        value={spectrum.zoom}
        min={0.1}
        max={5}
        step={0.1}
        onChange={(v) => updateConfig(`${path}.zoom`, v)}
        onPointerDown={pushHistory}
      />

      {/* Position sub-section */}
      <SectionHeader title="Position" defaultOpen={false}>
        <LabeledSlider
          label="X"
          value={spectrum.x}
          min={-650}
          max={650}
          step={0.01}
          onChange={(v) => updateConfig(`${path}.x`, v)}
          onPointerDown={pushHistory}
        />

        <LabeledSlider
          label="Y"
          value={spectrum.y}
          min={-650}
          max={650}
          step={0.01}
          onChange={(v) => updateConfig(`${path}.y`, v)}
          onPointerDown={pushHistory}
        />

        <LabeledSlider
          label="Z"
          value={spectrum.z}
          min={-500}
          max={-1}
          step={0.01}
          onChange={(v) => updateConfig(`${path}.z`, v)}
          onPointerDown={pushHistory}
        />

        <LabeledSlider
          label="Rotation X"
          value={spectrum.rotationX}
          min={-2}
          max={2}
          step={0.01}
          onChange={(v) => updateConfig(`${path}.rotationX`, v)}
          onPointerDown={pushHistory}
        />

        <LabeledSlider
          label="Rotation Y"
          value={spectrum.rotationY}
          min={-2}
          max={2}
          step={0.01}
          onChange={(v) => updateConfig(`${path}.rotationY`, v)}
          onPointerDown={pushHistory}
        />

        <LabeledSlider
          label="Rotation Z"
          value={spectrum.rotationZ}
          min={-2}
          max={2}
          step={0.01}
          onChange={(v) => updateConfig(`${path}.rotationZ`, v)}
          onPointerDown={pushHistory}
        />
      </SectionHeader>
    </SectionHeader>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

export function VumetersPanel() {
  return (
    <div className="flex flex-col">
      <OscilloscopeSection />
      <SpectrumSection />
    </div>
  );
}
