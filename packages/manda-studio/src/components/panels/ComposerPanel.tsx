import { useCallback } from "react";
import { useStudioStore } from "@/store/useStudioStore.ts";
import { SectionHeader } from "@/components/ui/SectionHeader.tsx";
import { LabeledSlider } from "@/components/ui/LabeledSlider.tsx";
import { LabeledToggle } from "@/components/ui/LabeledToggle.tsx";

// ---------------------------------------------------------------------------
// Bloom
// ---------------------------------------------------------------------------

function BloomSection() {
  const bloom = useStudioStore((s) => s.config.composer.bloom);
  const updateConfig = useStudioStore((s) => s.updateConfig);
  const pushHistory = useStudioStore((s) => s.pushHistory);

  const handleToggle = useCallback(
    (v: boolean) => {
      pushHistory();
      updateConfig("composer.bloom.show", v);
    },
    [pushHistory, updateConfig],
  );

  return (
    <SectionHeader title="Bloom" enabled={bloom.show} onToggle={handleToggle} defaultOpen={false}>
      <LabeledSlider
        label="Strength"
        value={bloom.strength}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => updateConfig("composer.bloom.strength", v)}
        onPointerDown={pushHistory}
      />

      <LabeledSlider
        label="Threshold"
        value={bloom.threshold}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => updateConfig("composer.bloom.threshold", v)}
        onPointerDown={pushHistory}
      />

      <LabeledSlider
        label="Radius"
        value={bloom.radius}
        min={0}
        max={10}
        step={0.1}
        onChange={(v) => updateConfig("composer.bloom.radius", v)}
        onPointerDown={pushHistory}
      />
    </SectionHeader>
  );
}

// ---------------------------------------------------------------------------
// RGB Shift
// ---------------------------------------------------------------------------

function RgbSection() {
  const rgb = useStudioStore((s) => s.config.composer.rgb);
  const updateConfig = useStudioStore((s) => s.updateConfig);
  const pushHistory = useStudioStore((s) => s.pushHistory);

  const handleToggle = useCallback(
    (v: boolean) => {
      pushHistory();
      updateConfig("composer.rgb.show", v);
    },
    [pushHistory, updateConfig],
  );

  return (
    <SectionHeader
      title="RGB Shift"
      enabled={rgb.show}
      onToggle={handleToggle}
      defaultOpen={false}
    >
      <LabeledSlider
        label="Amount"
        value={rgb.amount}
        min={0}
        max={1}
        step={0.001}
        onChange={(v) => updateConfig("composer.rgb.amount", v)}
        onPointerDown={pushHistory}
      />

      <LabeledSlider
        label="Angle"
        value={rgb.angle}
        min={0}
        max={2}
        step={0.01}
        onChange={(v) => updateConfig("composer.rgb.angle", v)}
        onPointerDown={pushHistory}
      />
    </SectionHeader>
  );
}

// ---------------------------------------------------------------------------
// Film Grain
// ---------------------------------------------------------------------------

function FilmSection() {
  const film = useStudioStore((s) => s.config.composer.film);
  const updateConfig = useStudioStore((s) => s.updateConfig);
  const pushHistory = useStudioStore((s) => s.pushHistory);

  const handleToggle = useCallback(
    (v: boolean) => {
      pushHistory();
      updateConfig("composer.film.show", v);
    },
    [pushHistory, updateConfig],
  );

  const handleToggleGrayscale = useCallback(
    (v: boolean) => {
      pushHistory();
      updateConfig("composer.film.grayscale", v);
    },
    [pushHistory, updateConfig],
  );

  return (
    <SectionHeader
      title="Film Grain"
      enabled={film.show}
      onToggle={handleToggle}
      defaultOpen={false}
    >
      <LabeledSlider
        label="Scanline Count"
        value={film.count}
        min={0}
        max={1000}
        step={1}
        onChange={(v) => updateConfig("composer.film.count", v)}
        onPointerDown={pushHistory}
      />

      <LabeledSlider
        label="Scanline Intensity"
        value={film.sIntensity}
        min={0}
        max={3}
        step={0.01}
        onChange={(v) => updateConfig("composer.film.sIntensity", v)}
        onPointerDown={pushHistory}
      />

      <LabeledSlider
        label="Noise Intensity"
        value={film.nIntensity}
        min={0}
        max={3}
        step={0.01}
        onChange={(v) => updateConfig("composer.film.nIntensity", v)}
        onPointerDown={pushHistory}
      />

      <LabeledToggle
        label="Grayscale"
        checked={film.grayscale}
        onChange={handleToggleGrayscale}
      />
    </SectionHeader>
  );
}

// ---------------------------------------------------------------------------
// Static
// ---------------------------------------------------------------------------

function StaticSection() {
  const staticEffect = useStudioStore((s) => s.config.composer.static);
  const updateConfig = useStudioStore((s) => s.updateConfig);
  const pushHistory = useStudioStore((s) => s.pushHistory);

  const handleToggle = useCallback(
    (v: boolean) => {
      pushHistory();
      updateConfig("composer.static.show", v);
    },
    [pushHistory, updateConfig],
  );

  return (
    <SectionHeader
      title="Static"
      enabled={staticEffect.show}
      onToggle={handleToggle}
      defaultOpen={false}
    >
      <LabeledSlider
        label="Amount"
        value={staticEffect.amount}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => updateConfig("composer.static.amount", v)}
        onPointerDown={pushHistory}
      />

      <LabeledSlider
        label="Size"
        value={staticEffect.size}
        min={0}
        max={256}
        step={1}
        onChange={(v) => updateConfig("composer.static.size", v)}
        onPointerDown={pushHistory}
      />
    </SectionHeader>
  );
}

// ---------------------------------------------------------------------------
// Hue / Saturation
// ---------------------------------------------------------------------------

function HueSection() {
  const hue = useStudioStore((s) => s.config.composer.hue);
  const updateConfig = useStudioStore((s) => s.updateConfig);
  const pushHistory = useStudioStore((s) => s.pushHistory);

  const handleToggle = useCallback(
    (v: boolean) => {
      pushHistory();
      updateConfig("composer.hue.show", v);
    },
    [pushHistory, updateConfig],
  );

  return (
    <SectionHeader
      title="Hue / Saturation"
      enabled={hue.show}
      onToggle={handleToggle}
      defaultOpen={false}
    >
      <LabeledSlider
        label="Hue"
        value={hue.hue}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => updateConfig("composer.hue.hue", v)}
        onPointerDown={pushHistory}
      />

      <LabeledSlider
        label="Saturation"
        value={hue.saturation}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => updateConfig("composer.hue.saturation", v)}
        onPointerDown={pushHistory}
      />
    </SectionHeader>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

export function ComposerPanel() {
  return (
    <div className="flex flex-col">
      <BloomSection />
      <RgbSection />
      <FilmSection />
      <StaticSection />
      <HueSection />
    </div>
  );
}
