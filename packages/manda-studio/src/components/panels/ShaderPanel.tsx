import { useState, useCallback } from "react";
import X from "lucide-react/dist/esm/icons/x.js";
import BookOpen from "lucide-react/dist/esm/icons/book-open.js";
import { useStudioStore } from "@/store/useStudioStore";
import { LabeledSlider } from "@/components/ui/LabeledSlider";
import { LabeledToggle } from "@/components/ui/LabeledToggle";

function displayShaderName(name: string): string {
  return name.replace(/Shader$/, "");
}

export function ShaderPanel() {
  const config = useStudioStore((s) => s.config);
  const updateConfig = useStudioStore((s) => s.updateConfig);
  const pushHistory = useStudioStore((s) => s.pushHistory);
  const setLibraryOpen = useStudioStore((s) => s.setLibraryOpen);

  const scene = config.scene;

  const [dropOver, setDropOver] = useState(false);

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
    <div className="space-y-4">
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
      <div className="space-y-3">
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
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">Blending</span>
          <div className="flex gap-0.5">
            {(["additive", "normal", "subtractive"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  pushHistory();
                  handleSceneUpdate("shader_blending", mode);
                }}
                className={`rounded px-2 py-0.5 text-[10px] capitalize transition-colors ${
                  (scene.shader_blending ?? "additive") === mode
                    ? "bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500"
                    : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {mode === "subtractive" ? "sub" : mode === "additive" ? "add" : mode}
              </button>
            ))}
          </div>
        </div>
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
      </div>
    </div>
  );
}
