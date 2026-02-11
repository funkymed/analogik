import { useCallback, useMemo } from "react";
import Plus from "lucide-react/dist/esm/icons/plus.js";
import Trash2 from "lucide-react/dist/esm/icons/trash-2.js";
import type { SparkEmitter, SparksConfig } from "@mandafunk/config/types";
import { useStudioStore } from "@/store/useStudioStore";
import { LabeledSlider } from "@/components/ui/LabeledSlider";
import { LabeledToggle } from "@/components/ui/LabeledToggle";
import { ColorInput } from "@/components/ui/ColorInput";
import { SectionHeader } from "@/components/ui/SectionHeader";

const DEFAULT_EMITTER: SparkEmitter = {
  id: "",
  name: "New Emitter",
  count: 100,
  color: "#ffffff",
  opacity: 0.8,
  size: 1,
  acceleration: 0.1,
  emissionOrigin: { x: 0, y: -50, z: -10 },
  emissionDirection: "up",
  perturbation: { enabled: false, amplitude: 0.2, frequency: 10 },
  sprite: "./images/spark1.png",
  blending: "additive",
  muted: false,
};

const DIRECTIONS: SparkEmitter["emissionDirection"][] = [
  "up", "down", "left", "right", "radial",
];

interface EmitterEditorProps {
  emitter: SparkEmitter;
  index: number;
}

function EmitterEditor({ emitter, index }: EmitterEditorProps) {
  const updateConfig = useStudioStore((s) => s.updateConfig);
  const pushHistory = useStudioStore((s) => s.pushHistory);
  const basePath = `sparks.emitters.${index}`;

  const handleUpdate = useCallback(
    (field: string, value: unknown) => {
      updateConfig(`${basePath}.${field}`, value);
    },
    [updateConfig, basePath],
  );

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateConfig(`${basePath}.name`, e.target.value);
    },
    [updateConfig, basePath],
  );

  const handleDirectionChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      pushHistory();
      updateConfig(`${basePath}.emissionDirection`, e.target.value);
    },
    [pushHistory, updateConfig, basePath],
  );

  const handleBlendingChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      pushHistory();
      updateConfig(`${basePath}.blending`, e.target.value);
    },
    [pushHistory, updateConfig, basePath],
  );

  return (
    <div className="space-y-3">
      <LabeledToggle
        label="Muted"
        checked={emitter.muted}
        onChange={(v) => {
          pushHistory();
          handleUpdate("muted", v);
        }}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-zinc-400">Name</label>
        <input
          type="text"
          value={emitter.name}
          onChange={handleNameChange}
          className="h-7 w-full rounded border border-zinc-700 bg-zinc-800 px-2 text-xs text-zinc-300 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <LabeledSlider
        label="Count"
        value={emitter.count}
        min={10}
        max={500}
        step={10}
        onChange={(v) => handleUpdate("count", v)}
        onPointerDown={pushHistory}
      />

      <ColorInput
        label="Color"
        value={emitter.color}
        onChange={(v) => handleUpdate("color", v)}
      />

      <LabeledSlider
        label="Opacity"
        value={emitter.opacity}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => handleUpdate("opacity", v)}
        onPointerDown={pushHistory}
      />

      <LabeledSlider
        label="Size"
        value={emitter.size}
        min={0.5}
        max={5}
        step={0.1}
        onChange={(v) => handleUpdate("size", v)}
        onPointerDown={pushHistory}
      />

      <LabeledSlider
        label="Acceleration"
        value={emitter.acceleration}
        min={0.05}
        max={0.5}
        step={0.01}
        onChange={(v) => handleUpdate("acceleration", v)}
        onPointerDown={pushHistory}
      />

      {/* Emission origin */}
      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        Emission Origin
      </p>
      <LabeledSlider
        label="X"
        value={emitter.emissionOrigin.x}
        min={-200}
        max={200}
        step={0.01}
        onChange={(v) => handleUpdate("emissionOrigin.x", v)}
        onPointerDown={pushHistory}
      />
      <LabeledSlider
        label="Y"
        value={emitter.emissionOrigin.y}
        min={-200}
        max={200}
        step={0.01}
        onChange={(v) => handleUpdate("emissionOrigin.y", v)}
        onPointerDown={pushHistory}
      />
      <LabeledSlider
        label="Z"
        value={emitter.emissionOrigin.z}
        min={-100}
        max={10}
        step={0.01}
        onChange={(v) => handleUpdate("emissionOrigin.z", v)}
        onPointerDown={pushHistory}
      />

      {/* Direction */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-zinc-400">Direction</label>
        <select
          value={emitter.emissionDirection}
          onChange={handleDirectionChange}
          className="h-7 w-full rounded border border-zinc-700 bg-zinc-800 px-2 text-xs text-zinc-300 focus:border-indigo-500 focus:outline-none"
        >
          {DIRECTIONS.map((dir) => (
            <option key={dir} value={dir}>
              {dir}
            </option>
          ))}
        </select>
      </div>

      {/* Blending */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-zinc-400">Blending</label>
        <select
          value={emitter.blending}
          onChange={handleBlendingChange}
          className="h-7 w-full rounded border border-zinc-700 bg-zinc-800 px-2 text-xs text-zinc-300 focus:border-indigo-500 focus:outline-none"
        >
          <option value="additive">Additive</option>
          <option value="normal">Normal</option>
        </select>
      </div>

      {/* Perturbation */}
      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        Perturbation
      </p>
      <LabeledToggle
        label="Enabled"
        checked={emitter.perturbation.enabled}
        onChange={(v) => {
          pushHistory();
          handleUpdate("perturbation.enabled", v);
        }}
      />
      {emitter.perturbation.enabled && (
        <>
          <LabeledSlider
            label="Amplitude"
            value={emitter.perturbation.amplitude}
            min={0}
            max={2}
            step={0.01}
            onChange={(v) => handleUpdate("perturbation.amplitude", v)}
            onPointerDown={pushHistory}
          />
          <LabeledSlider
            label="Frequency"
            value={emitter.perturbation.frequency}
            min={1}
            max={50}
            step={1}
            onChange={(v) => handleUpdate("perturbation.frequency", v)}
            onPointerDown={pushHistory}
          />
        </>
      )}
    </div>
  );
}

export function SparksPanel() {
  const config = useStudioStore((s) => s.config);
  const updateConfig = useStudioStore((s) => s.updateConfig);
  const setConfig = useStudioStore((s) => s.setConfig);
  const pushHistory = useStudioStore((s) => s.pushHistory);

  const sparksConfig: SparksConfig = useMemo(
    () => config.sparks ?? { enabled: false, emitters: [] },
    [config.sparks],
  );

  const handleToggleEnabled = useCallback(
    (enabled: boolean) => {
      pushHistory();
      updateConfig("sparks.enabled", enabled);
    },
    [pushHistory, updateConfig],
  );

  const handleAddEmitter = useCallback(() => {
    pushHistory();
    const newEmitter: SparkEmitter = {
      ...structuredClone(DEFAULT_EMITTER),
      id: `emitter_${Date.now()}`,
    };
    const emitters = [...sparksConfig.emitters, newEmitter];
    updateConfig("sparks.emitters", emitters);
    if (!sparksConfig.enabled) {
      updateConfig("sparks.enabled", true);
    }
  }, [pushHistory, sparksConfig, updateConfig]);

  const handleDeleteEmitter = useCallback(
    (index: number) => {
      pushHistory();
      const newConfig = structuredClone(config);
      if (newConfig.sparks) {
        newConfig.sparks.emitters.splice(index, 1);
      }
      setConfig(newConfig);
    },
    [pushHistory, config, setConfig],
  );

  return (
    <div className="flex flex-col gap-1">
      {/* Header */}
      <div className="flex items-center justify-between px-1 py-2">
        <h2 className="text-xs font-medium text-zinc-300">Sparks</h2>
        <button
          type="button"
          onClick={handleAddEmitter}
          className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-300 transition-colors hover:bg-zinc-700"
        >
          <Plus className="h-3 w-3" />
          Add Emitter
        </button>
      </div>

      {/* Global toggle */}
      <div className="px-1">
        <LabeledToggle
          label="Sparks Enabled"
          checked={sparksConfig.enabled}
          onChange={handleToggleEnabled}
        />
      </div>

      {/* Empty state */}
      {sparksConfig.emitters.length === 0 && (
        <p className="px-1 py-4 text-center text-xs text-zinc-600">
          No emitters yet. Click the button above to add one.
        </p>
      )}

      {/* Emitter list */}
      {sparksConfig.emitters.map((emitter, index) => (
        <SectionHeader
          key={emitter.id}
          title={emitter.name || `Emitter ${index + 1}`}
          defaultOpen={false}
        >
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => handleDeleteEmitter(index)}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-red-400 transition-colors hover:bg-red-400/10"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </div>
          <EmitterEditor emitter={emitter} index={index} />
        </SectionHeader>
      ))}
    </div>
  );
}
