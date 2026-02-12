import { useState, useCallback, useEffect } from "react";
import X from "lucide-react/dist/esm/icons/x.js";
import ImageIcon from "lucide-react/dist/esm/icons/image.js";
import { useStudioStore } from "@/store/useStudioStore";
import { useGanttStore } from "@/store/useGanttStore";
import { createAssetEntry } from "@/services/assetRegistry";
import { LabeledSlider } from "@/components/ui/LabeledSlider";
import { ColorInput } from "@/components/ui/ColorInput";
import { BlendingControl } from "@/components/ui/BlendingControl";

type BgMode = "transparent" | "color" | "image";

export function BackgroundPanel() {
  const config = useStudioStore((s) => s.config);
  const updateConfig = useStudioStore((s) => s.updateConfig);
  const pushHistory = useStudioStore((s) => s.pushHistory);
  const setLibraryOpen = useStudioStore((s) => s.setLibraryOpen);

  const scene = config.scene;

  const [bgModeOverride, setBgModeOverride] = useState<BgMode | null>(null);
  const [bgDropOver, setBgDropOver] = useState(false);

  const detectedMode: BgMode = scene.background
    ? "image"
    : scene.bgColor
      ? "color"
      : "transparent";

  const bgMode: BgMode = bgModeOverride ?? detectedMode;

  // Clear override once config catches up (moved out of render to avoid setState-in-render)
  useEffect(() => {
    if (bgModeOverride && detectedMode === bgModeOverride) {
      setBgModeOverride(null);
    }
  }, [bgModeOverride, detectedMode]);

  const handleSliderPointerDown = useCallback(() => {
    pushHistory();
  }, [pushHistory]);

  const handleSceneUpdate = useCallback(
    (path: string, value: unknown) => {
      updateConfig(`scene.${path}`, value);
    },
    [updateConfig],
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

  const handleBgModeSwitch = useCallback(
    (mode: BgMode) => {
      if (mode === bgMode) return;
      pushHistory();
      setBgModeOverride(mode);
      if (mode === "transparent") {
        updateConfig("scene.bgColor", "");
        updateConfig("scene.background", "");
        updateConfig("scene.bgLibraryId", undefined);
        updateConfig("scene.bgAssetId", undefined);
      } else if (mode === "color") {
        updateConfig("scene.background", "");
        updateConfig("scene.bgLibraryId", undefined);
        updateConfig("scene.bgAssetId", undefined);
        if (!scene.bgColor) {
          updateConfig("scene.bgColor", "#000000");
        }
      }
    },
    [bgMode, scene.bgColor, pushHistory, updateConfig],
  );

  const handleRemoveBackground = useCallback(() => {
    pushHistory();
    updateConfig("scene.background", "");
    updateConfig("scene.bgLibraryId", undefined);
    updateConfig("scene.bgAssetId", undefined);
    setBgModeOverride("image");
  }, [pushHistory, updateConfig]);

  const handleChooseImage = useCallback(() => {
    setLibraryOpen(true);
  }, [setLibraryOpen]);

  const handleBgImageDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setBgDropOver(false);
      const raw = e.dataTransfer.getData("application/x-manda-library");
      if (!raw) return;
      let data: { type: string; id: number };
      try { data = JSON.parse(raw); } catch { return; }
      if (data.type !== "images") return;
      const entry = await createAssetEntry(data.id, "image");
      if (!entry || !entry.runtimeUrl) return;
      useGanttStore.getState().registerAsset(entry);
      pushHistory();
      updateConfig("scene.background", entry.runtimeUrl);
      updateConfig("scene.bgAssetId", entry.id);
      updateConfig("scene.bgLibraryId", data.id);
    },
    [pushHistory, updateConfig],
  );

  const handleBgDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("application/x-manda-library")) {
      e.preventDefault();
      setBgDropOver(true);
    }
  }, []);

  const handleBgDragLeave = useCallback(() => {
    setBgDropOver(false);
  }, []);

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-1">
        {(["transparent", "color", "image"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => handleBgModeSwitch(mode)}
            className={`flex-1 rounded py-1.5 text-xs font-medium capitalize transition-colors ${
              bgMode === mode
                ? "bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500"
                : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {bgMode === "color" && (
        <div className="space-y-3">
          <div onPointerDown={handleColorPointerDown}>
            <ColorInput
              label="Background Color"
              value={scene.bgColor}
              onChange={(v) => handleColorChange("bgColor", v)}
            />
          </div>
          <LabeledSlider
            label="Opacity"
            value={scene.bgColor_opacity ?? 1}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => handleSceneUpdate("bgColor_opacity", v)}
            onPointerDown={handleSliderPointerDown}
          />
          <BlendingControl
            path="scene.bgColor_blending"
            value={scene.bgColor_blending}
          />
        </div>
      )}

      {bgMode === "image" && (
        <div
          className={`rounded-md border border-dashed p-2 transition-colors ${
            bgDropOver ? "border-indigo-500 bg-indigo-500/10" : "border-zinc-700"
          }`}
          onDrop={(e) => void handleBgImageDrop(e)}
          onDragOver={handleBgDragOver}
          onDragLeave={handleBgDragLeave}
        >
          {scene.background ? (
            <div className="flex items-center gap-2">
              <div className="h-12 w-20 overflow-hidden rounded border border-zinc-700 bg-zinc-800">
                <img
                  src={scene.background}
                  alt="Background"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <p className="truncate text-[10px] text-zinc-400">
                  {scene.background.split("/").pop()}
                </p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={handleChooseImage}
                    className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300 transition-colors hover:bg-zinc-700"
                  >
                    Choose
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveBackground}
                    className="rounded bg-zinc-800 p-0.5 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-red-400"
                    title="Remove background"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleChooseImage}
              className="flex w-full items-center justify-center gap-2 py-3 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
            >
              <ImageIcon size={14} />
              Drop image or choose from Library
            </button>
          )}
        </div>
      )}

      {bgMode === "image" && (
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">Sizing</span>
          <div className="flex gap-0.5">
            {(["cover", "contain", "fit"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  pushHistory();
                  updateConfig("scene.bgFit", mode);
                }}
                className={`rounded px-2 py-0.5 text-[10px] capitalize transition-colors ${
                  (scene.bgFit ?? "cover") === mode
                    ? "bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500"
                    : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      )}

      {bgMode === "image" && (
        <div className="space-y-3">
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
          <LabeledSlider
            label="Opacity"
            value={scene.bg_opacity ?? 1}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => handleSceneUpdate("bg_opacity", v)}
            onPointerDown={handleSliderPointerDown}
          />
          <BlendingControl
            path="scene.bg_blending"
            value={scene.bg_blending}
          />
        </div>
      )}
    </div>
  );
}
