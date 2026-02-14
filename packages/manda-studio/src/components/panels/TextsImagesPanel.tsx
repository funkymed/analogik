import { useCallback, useState } from "react";
import ImageIcon from "lucide-react/dist/esm/icons/image.js";
import type { TextType, ImageType } from "@mandafunk/config/types";
import { useStudioStore } from "@/store/useStudioStore";
import { useGanttStore } from "@/store/useGanttStore";
import { createAssetEntry } from "@/services/assetRegistry";
import { LabeledSlider } from "@/components/ui/LabeledSlider";
import { LabeledToggle } from "@/components/ui/LabeledToggle";
import { ColorInput } from "@/components/ui/ColorInput";
import { BlendingControl } from "@/components/ui/BlendingControl";

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_TEXT: TextType = {
  show: true,
  text: "New Text",
  order: 1,
  color: "#ffffff",
  font: "Kdam Thmor Pro",
  size: 24,
  opacity: 1,
  x: 0,
  y: 0,
  z: -500,
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
};

export const DEFAULT_IMAGE: ImageType = {
  show: true,
  path: "",
  order: 1,
  opacity: 1,
  x: 0,
  y: 0,
  z: -3,
  zoom: 1,
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
};

const AVAILABLE_FONTS = [
  "Kdam Thmor Pro",
  "Lobster",
  "Pacifico",
  "Permanent Marker",
  "Alfa Slab One",
  "East Sea Dokdo",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalises texts/images from either Record or Array form into a Record.
 * Returns an empty record when the value is undefined.
 */
function toRecord<T>(data: Record<string, T> | T[] | undefined): Record<string, T> {
  if (!data) return {};
  if (Array.isArray(data)) {
    const record: Record<string, T> = {};
    data.forEach((item, index) => {
      record[String(index)] = item;
    });
    return record;
  }
  return data;
}

// ---------------------------------------------------------------------------
// Reusable slider groups
// ---------------------------------------------------------------------------

interface PositionSlidersProps {
  basePath: string;
  x: number;
  y: number;
  z: number;
  zMin: number;
  zMax: number;
  onUpdate: (path: string, value: unknown) => void;
  onPointerDown: () => void;
}

function PositionSliders({
  basePath,
  x,
  y,
  z,
  zMin,
  zMax,
  onUpdate,
  onPointerDown,
}: PositionSlidersProps) {
  return (
    <>
      <LabeledSlider
        label="X"
        value={x}
        min={-650}
        max={650}
        step={0.01}
        onChange={(v) => onUpdate(`${basePath}.x`, v)}
        onPointerDown={onPointerDown}
      />
      <LabeledSlider
        label="Y"
        value={y}
        min={-650}
        max={650}
        step={0.01}
        onChange={(v) => onUpdate(`${basePath}.y`, v)}
        onPointerDown={onPointerDown}
      />
      <LabeledSlider
        label="Z"
        value={z}
        min={zMin}
        max={zMax}
        step={0.01}
        onChange={(v) => onUpdate(`${basePath}.z`, v)}
        onPointerDown={onPointerDown}
      />
    </>
  );
}

interface RotationSlidersProps {
  basePath: string;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  onUpdate: (path: string, value: unknown) => void;
  onPointerDown: () => void;
}

function RotationSliders({
  basePath,
  rotationX,
  rotationY,
  rotationZ,
  onUpdate,
  onPointerDown,
}: RotationSlidersProps) {
  return (
    <>
      <LabeledSlider
        label="Rotation X"
        value={rotationX}
        min={-2}
        max={2}
        step={0.01}
        onChange={(v) => onUpdate(`${basePath}.rotationX`, v)}
        onPointerDown={onPointerDown}
      />
      <LabeledSlider
        label="Rotation Y"
        value={rotationY}
        min={-2}
        max={2}
        step={0.01}
        onChange={(v) => onUpdate(`${basePath}.rotationY`, v)}
        onPointerDown={onPointerDown}
      />
      <LabeledSlider
        label="Rotation Z"
        value={rotationZ}
        min={-2}
        max={2}
        step={0.01}
        onChange={(v) => onUpdate(`${basePath}.rotationZ`, v)}
        onPointerDown={onPointerDown}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Text item editor
// ---------------------------------------------------------------------------

interface TextItemEditorProps {
  itemKey: string;
  item: TextType;
}

export function TextItemEditor({ itemKey, item }: TextItemEditorProps) {
  const updateConfig = useStudioStore((s) => s.updateConfig);
  const pushHistory = useStudioStore((s) => s.pushHistory);
  const basePath = `texts.${itemKey}`;

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateConfig(`${basePath}.text`, e.target.value);
    },
    [updateConfig, basePath],
  );

  const handleFontChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateConfig(`${basePath}.font`, e.target.value);
    },
    [updateConfig, basePath],
  );

  return (
    <div className="space-y-3">
      <LabeledToggle
        label="Visible"
        checked={item.show}
        onChange={(v) => updateConfig(`${basePath}.show`, v)}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-zinc-400">Text</label>
        <input
          type="text"
          value={item.text}
          onChange={handleTextChange}
          className="h-7 w-full rounded border border-zinc-700 bg-zinc-800 px-2 text-xs text-zinc-300 focus:border-indigo-500 focus:outline-none"
          placeholder="Enter text..."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-zinc-400">Font</label>
        <select
          value={item.font}
          onChange={handleFontChange}
          className="h-7 w-full rounded border border-zinc-700 bg-zinc-800 px-2 text-xs text-zinc-300 focus:border-indigo-500 focus:outline-none"
        >
          {AVAILABLE_FONTS.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>
              {f}
            </option>
          ))}
        </select>
      </div>

      <LabeledSlider
        label="Size"
        value={item.size}
        min={0}
        max={256}
        step={1}
        suffix="px"
        onChange={(v) => updateConfig(`${basePath}.size`, v)}
        onPointerDown={pushHistory}
      />

      <ColorInput
        label="Color"
        value={item.color}
        onChange={(v) => updateConfig(`${basePath}.color`, v)}
      />

      <LabeledSlider
        label="Opacity"
        value={item.opacity}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => updateConfig(`${basePath}.opacity`, v)}
        onPointerDown={pushHistory}
      />

      <BlendingControl
        path={`${basePath}.blending`}
        value={item.blending}
      />

      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        Position
      </p>
      <PositionSliders
        basePath={basePath}
        x={item.x}
        y={item.y}
        z={item.z}
        zMin={-650}
        zMax={-1}
        onUpdate={updateConfig}
        onPointerDown={pushHistory}
      />

      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        Rotation
      </p>
      <RotationSliders
        basePath={basePath}
        rotationX={item.rotationX}
        rotationY={item.rotationY}
        rotationZ={item.rotationZ}
        onUpdate={updateConfig}
        onPointerDown={pushHistory}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Image item editor
// ---------------------------------------------------------------------------

interface ImageItemEditorProps {
  itemKey: string;
  item: ImageType;
  zMin?: number;
  zMax?: number;
}

export function ImageItemEditor({ itemKey, item, zMin = -650, zMax = -1 }: ImageItemEditorProps) {
  const updateConfig = useStudioStore((s) => s.updateConfig);
  const pushHistory = useStudioStore((s) => s.pushHistory);
  const basePath = `images.${itemKey}`;
  const [dropOver, setDropOver] = useState(false);

  const handlePathChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateConfig(`${basePath}.path`, e.target.value);
    },
    [updateConfig, basePath],
  );

  const handleImageDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDropOver(false);
      const raw = e.dataTransfer.getData("application/x-manda-library");
      if (!raw) return;
      let data: { type: string; id: number };
      try { data = JSON.parse(raw); } catch { return; }
      if (data.type !== "images") return;
      const entry = await createAssetEntry(data.id, "image");
      if (!entry || !entry.runtimeUrl) return;
      useGanttStore.getState().registerAsset(entry);
      pushHistory();
      updateConfig(`${basePath}.path`, entry.runtimeUrl);
      updateConfig(`${basePath}.assetId`, entry.id);
      updateConfig(`${basePath}.libraryId`, data.id);
    },
    [updateConfig, pushHistory, basePath],
  );

  const handleImageDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("application/x-manda-library")) {
      e.preventDefault();
      setDropOver(true);
    }
  }, []);

  const handleImageDragLeave = useCallback(() => {
    setDropOver(false);
  }, []);

  return (
    <div className="space-y-3">
      <LabeledToggle
        label="Visible"
        checked={item.show}
        onChange={(v) => updateConfig(`${basePath}.show`, v)}
      />

      {/* Image drop zone */}
      <div
        className={`flex flex-col gap-1.5 rounded-md border border-dashed p-2 transition-colors ${
          dropOver ? "border-indigo-500 bg-indigo-500/10" : "border-zinc-700"
        }`}
        onDrop={(e) => void handleImageDrop(e)}
        onDragOver={handleImageDragOver}
        onDragLeave={handleImageDragLeave}
      >
        {item.path ? (
          <div className="flex items-center gap-2">
            <div className="h-10 w-16 overflow-hidden rounded border border-zinc-700 bg-zinc-800">
              <img src={item.path} alt="Preview" className="h-full w-full object-cover" />
            </div>
            <p className="flex-1 truncate text-[10px] text-zinc-400">{item.path.split("/").pop()}</p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-2 text-zinc-500">
            <ImageIcon size={14} />
            <span className="text-[10px]">Drop image from Library</span>
          </div>
        )}
        <label className="text-xs text-zinc-400">Image Path</label>
        <input
          type="text"
          value={item.path}
          onChange={handlePathChange}
          className="h-7 w-full rounded border border-zinc-700 bg-zinc-800 px-2 text-xs text-zinc-300 focus:border-indigo-500 focus:outline-none"
          placeholder="URL or path..."
        />
      </div>

      <LabeledSlider
        label="Opacity"
        value={item.opacity}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => updateConfig(`${basePath}.opacity`, v)}
        onPointerDown={pushHistory}
      />

      <LabeledSlider
        label="Zoom"
        value={item.zoom}
        min={0.1}
        max={10}
        step={0.1}
        onChange={(v) => updateConfig(`${basePath}.zoom`, v)}
        onPointerDown={pushHistory}
      />

      <BlendingControl
        path={`${basePath}.blending`}
        value={item.blending}
      />

      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        Position
      </p>
      <PositionSliders
        basePath={basePath}
        x={item.x}
        y={item.y}
        z={item.z}
        zMin={zMin}
        zMax={zMax}
        onUpdate={updateConfig}
        onPointerDown={pushHistory}
      />

      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        Rotation
      </p>
      <RotationSliders
        basePath={basePath}
        rotationX={item.rotationX}
        rotationY={item.rotationY}
        rotationZ={item.rotationZ}
        onUpdate={updateConfig}
        onPointerDown={pushHistory}
      />
    </div>
  );
}

