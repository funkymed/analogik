import { useState, useCallback, useMemo } from "react";
import { Search } from "lucide-react";
import { useStudioStore } from "@/store/useStudioStore";
import { availableShaders } from "@mandafunk/shaders";
import { LabeledSlider } from "@/components/ui/LabeledSlider";
import { LabeledToggle } from "@/components/ui/LabeledToggle";
import { ColorInput } from "@/components/ui/ColorInput";
import { SectionHeader } from "@/components/ui/SectionHeader";

function displayShaderName(name: string): string {
  return name.replace(/Shader$/, "");
}

export function ScenePanel() {
  const config = useStudioStore((s) => s.config);
  const updateConfig = useStudioStore((s) => s.updateConfig);
  const pushHistory = useStudioStore((s) => s.pushHistory);

  const [searchQuery, setSearchQuery] = useState("");

  const scene = config.scene;

  const filteredShaders = useMemo(() => {
    if (!searchQuery) return availableShaders;
    const lower = searchQuery.toLowerCase();
    return availableShaders.filter((name) =>
      name.toLowerCase().includes(lower),
    );
  }, [searchQuery]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [],
  );

  const handleSelectShader = useCallback(
    (shaderName: string) => {
      pushHistory();
      updateConfig("scene.shader", shaderName);
    },
    [pushHistory, updateConfig],
  );

  const handleClearShader = useCallback(() => {
    pushHistory();
    updateConfig("scene.shader", "");
  }, [pushHistory, updateConfig]);

  const handleSliderPointerDown = useCallback(() => {
    pushHistory();
  }, [pushHistory]);

  const handleSceneUpdate = useCallback(
    (path: string, value: unknown) => {
      updateConfig(`scene.${path}`, value);
    },
    [updateConfig],
  );

  const handleToggleChange = useCallback(
    (path: string, value: boolean) => {
      pushHistory();
      updateConfig(`scene.${path}`, value);
    },
    [pushHistory, updateConfig],
  );

  const handleColorChange = useCallback(
    (path: string, value: string) => {
      updateConfig(`scene.${path}`, value);
    },
    [updateConfig],
  );

  const handleColorPointerDown = useCallback(() => {
    pushHistory();
  }, [pushHistory]);

  return (
    <div className="space-y-0">
      <SectionHeader title="Shader Browser" defaultOpen>
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search shaders..."
            className="h-7 w-full rounded border border-zinc-700 bg-zinc-800 pl-7 pr-2 text-xs text-zinc-300 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Shader grid */}
        <div className="grid max-h-48 grid-cols-2 gap-1 overflow-y-auto">
          <button
            type="button"
            onClick={handleClearShader}
            className={`rounded px-2 py-1.5 text-left text-[11px] transition-colors ${
              !scene.shader
                ? "border border-indigo-500 bg-indigo-500/10 text-indigo-300"
                : "border border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400"
            }`}
          >
            None
          </button>
          {filteredShaders.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => handleSelectShader(name)}
              className={`truncate rounded px-2 py-1.5 text-left text-[11px] transition-colors ${
                scene.shader === name
                  ? "border border-indigo-500 bg-indigo-500/10 text-indigo-300"
                  : "border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
              }`}
              title={displayShaderName(name)}
            >
              {displayShaderName(name)}
            </button>
          ))}
        </div>

        {/* Shader controls */}
        <div className="space-y-3 pt-1">
          <LabeledSlider
            label="Speed"
            value={scene.shader_speed ?? 1}
            min={0}
            max={3}
            step={0.01}
            onChange={(v) => handleSceneUpdate("shader_speed", v)}
            onPointerDown={handleSliderPointerDown}
          />
          <LabeledSlider
            label="Opacity"
            value={scene.shader_opacity ?? 1}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => handleSceneUpdate("shader_opacity", v)}
            onPointerDown={handleSliderPointerDown}
          />
          <LabeledToggle
            label="Sin/Cos X"
            checked={scene.shader_sin_cos_x ?? false}
            onChange={(v) => handleToggleChange("shader_sin_cos_x", v)}
          />
          <LabeledToggle
            label="Sin/Cos Y"
            checked={scene.shader_sin_cos_y ?? false}
            onChange={(v) => handleToggleChange("shader_sin_cos_y", v)}
          />
          <LabeledSlider
            label="Sin/Cos Speed"
            value={scene.shader_sin_cos_speed ?? 0}
            min={0}
            max={5}
            step={0.1}
            onChange={(v) => handleSceneUpdate("shader_sin_cos_speed", v)}
            onPointerDown={handleSliderPointerDown}
          />
          <LabeledSlider
            label="Sin/Cos Space"
            value={scene.shader_sin_cos_space ?? 0}
            min={0}
            max={10}
            step={0.1}
            onChange={(v) => handleSceneUpdate("shader_sin_cos_space", v)}
            onPointerDown={handleSliderPointerDown}
          />
          <LabeledToggle
            label="Sparks"
            checked={scene.sparks ?? false}
            onChange={(v) => handleToggleChange("sparks", v)}
          />
        </div>
      </SectionHeader>

      <SectionHeader title="Background" defaultOpen>
        <div onPointerDown={handleColorPointerDown}>
          <ColorInput
            label="Background Color"
            value={scene.bgColor}
            onChange={(v) => handleColorChange("bgColor", v)}
          />
        </div>
        <LabeledSlider
          label="Brightness"
          value={scene.brightness}
          min={0}
          max={200}
          step={1}
          suffix="%"
          onChange={(v) => handleSceneUpdate("brightness", v)}
          onPointerDown={handleSliderPointerDown}
        />
        <LabeledSlider
          label="Blur"
          value={scene.blur}
          min={0}
          max={200}
          step={1}
          suffix="px"
          onChange={(v) => handleSceneUpdate("blur", v)}
          onPointerDown={handleSliderPointerDown}
        />
      </SectionHeader>
    </div>
  );
}
