import { useState, useCallback } from "react";
import X from "lucide-react/dist/esm/icons/x.js";
import BookOpen from "lucide-react/dist/esm/icons/book-open.js";
import { useStudioStore } from "@/store/useStudioStore";
import { LabeledSlider } from "@/components/ui/LabeledSlider";
import { LabeledToggle } from "@/components/ui/LabeledToggle";
import { BlendingControl } from "@/components/ui/BlendingControl";
import { SectionHeader } from "@/components/ui/SectionHeader";

function displayShaderName(name: string): string {
  return name.replace(/Shader$/, "");
}

export function ShaderPanel() {
  const config = useStudioStore((s) => s.config);
  const updateConfig = useStudioStore((s) => s.updateConfig);
  const pushHistory = useStudioStore((s) => s.pushHistory);
  const setLibraryOpen = useStudioStore((s) => s.setLibraryOpen);

  const scene = config.scene;
  const hasShader = !!scene.shader && scene.shader_show !== false;

  const [dropOver, setDropOver] = useState(false);

  const handleToggleShader = useCallback(
    (enabled: boolean) => {
      pushHistory();
      updateConfig("scene.shader_show", enabled);
    },
    [pushHistory, updateConfig],
  );

  const handleClearShader = useCallback(() => {
    pushHistory();
    updateConfig("scene.shader", "");
    updateConfig("scene.shader_show", false);
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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDropOver(false);
      const raw = e.dataTransfer.getData("application/x-manda-library");
      if (!raw) return;
      let data: { type: string; name: string };
      try { data = JSON.parse(raw); } catch { return; }
      if (data.type !== "shaders") return;
      pushHistory();
      updateConfig("scene.shader", data.name);
      updateConfig("scene.shader_show", true);
    },
    [pushHistory, updateConfig],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("application/x-manda-library")) {
      e.preventDefault();
      setDropOver(true);
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropOver(false);
  }, []);

  return (
    <div className="flex flex-col">
      <SectionHeader
        title="Shader"
        enabled={hasShader}
        onToggle={handleToggleShader}
      >
        {/* Current shader / drop zone */}
        <div
          className={`rounded-md border border-dashed p-3 transition-colors ${
            dropOver ? "border-indigo-500 bg-indigo-500/10" : "border-zinc-700"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Current Shader</p>
              <p className="truncate text-xs font-medium text-zinc-200">
                {scene.shader ? displayShaderName(scene.shader) : "No shader"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {scene.shader && (
                <button
                  type="button"
                  onClick={handleClearShader}
                  className="rounded bg-zinc-800 p-1 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-red-400"
                  title="Clear shader"
                >
                  <X size={12} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setLibraryOpen(true)}
                className="rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
                title="Open Library"
              >
                <BookOpen size={12} />
              </button>
            </div>
          </div>
          {!scene.shader && (
            <p className="mt-1 text-[10px] text-zinc-600">
              Drag a shader from the Library or click to browse
            </p>
          )}
        </div>

        {/* Shader controls */}
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
        <BlendingControl
          path="scene.shader_blending"
          value={scene.shader_blending ?? "additive"}
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
      </SectionHeader>
    </div>
  );
}
