import { useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { TextType, ImageType } from "@mandafunk/config/types";
import { useStudioStore } from "@/store/useStudioStore";
import { LabeledSlider } from "@/components/ui/LabeledSlider";
import { LabeledToggle } from "@/components/ui/LabeledToggle";
import { ColorInput } from "@/components/ui/ColorInput";
import { SectionHeader } from "@/components/ui/SectionHeader";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TextsImagesPanelProps {
  panelType: "texts" | "images";
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_TEXT: TextType = {
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

const DEFAULT_IMAGE: ImageType = {
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
        step={1}
        onChange={(v) => onUpdate(`${basePath}.x`, v)}
        onPointerDown={onPointerDown}
      />
      <LabeledSlider
        label="Y"
        value={y}
        min={-650}
        max={650}
        step={1}
        onChange={(v) => onUpdate(`${basePath}.y`, v)}
        onPointerDown={onPointerDown}
      />
      <LabeledSlider
        label="Z"
        value={z}
        min={zMin}
        max={zMax}
        step={1}
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

function TextItemEditor({ itemKey, item }: TextItemEditorProps) {
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
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
        <input
          type="text"
          value={item.font}
          onChange={handleFontChange}
          className="h-7 w-full rounded border border-zinc-700 bg-zinc-800 px-2 text-xs text-zinc-300 focus:border-indigo-500 focus:outline-none"
          placeholder="Font family..."
        />
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
}

function ImageItemEditor({ itemKey, item }: ImageItemEditorProps) {
  const updateConfig = useStudioStore((s) => s.updateConfig);
  const pushHistory = useStudioStore((s) => s.pushHistory);
  const basePath = `images.${itemKey}`;

  const handlePathChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateConfig(`${basePath}.path`, e.target.value);
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

      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        Position
      </p>
      <PositionSliders
        basePath={basePath}
        x={item.x}
        y={item.y}
        z={item.z}
        zMin={-5}
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
// Main panel component
// ---------------------------------------------------------------------------

export function TextsImagesPanel({ panelType }: TextsImagesPanelProps) {
  const config = useStudioStore((s) => s.config);
  const updateConfig = useStudioStore((s) => s.updateConfig);
  const setConfig = useStudioStore((s) => s.setConfig);
  const pushHistory = useStudioStore((s) => s.pushHistory);

  const isTexts = panelType === "texts";
  const items = isTexts
    ? toRecord<TextType>(config.texts as Record<string, TextType> | TextType[] | undefined)
    : toRecord<ImageType>(config.images as Record<string, ImageType> | ImageType[] | undefined);
  const entries = Object.entries(items);

  const handleAdd = useCallback(() => {
    pushHistory();
    const key = isTexts ? `text_${Date.now()}` : `image_${Date.now()}`;
    const newItem = isTexts
      ? structuredClone(DEFAULT_TEXT)
      : structuredClone(DEFAULT_IMAGE);

    const currentItems = isTexts
      ? toRecord<TextType>(config.texts as Record<string, TextType> | TextType[] | undefined)
      : toRecord<ImageType>(config.images as Record<string, ImageType> | ImageType[] | undefined);

    updateConfig(panelType, { ...currentItems, [key]: newItem });
  }, [isTexts, config.texts, config.images, updateConfig, pushHistory, panelType]);

  const handleDelete = useCallback(
    (key: string) => {
      pushHistory();
      const currentItems = isTexts
        ? toRecord<TextType>(config.texts as Record<string, TextType> | TextType[] | undefined)
        : toRecord<ImageType>(config.images as Record<string, ImageType> | ImageType[] | undefined);

      const updated = { ...currentItems };
      delete updated[key];

      const newConfig = structuredClone(config);
      if (isTexts) {
        (newConfig as Record<string, unknown>).texts = updated;
      } else {
        (newConfig as Record<string, unknown>).images = updated;
      }
      setConfig(newConfig);
    },
    [isTexts, config, setConfig, pushHistory],
  );

  return (
    <div className="flex flex-col gap-1">
      {/* Header with Add button */}
      <div className="flex items-center justify-between px-1 py-2">
        <h2 className="text-xs font-medium text-zinc-300">
          {isTexts ? "Texts" : "Images"}
        </h2>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-300 transition-colors hover:bg-zinc-700"
          aria-label={isTexts ? "Add text" : "Add image"}
        >
          <Plus className="h-3 w-3" />
          {isTexts ? "Add Text" : "Add Image"}
        </button>
      </div>

      {/* Empty state */}
      {entries.length === 0 && (
        <p className="px-1 py-4 text-center text-xs text-zinc-600">
          No {isTexts ? "texts" : "images"} yet. Click the button above to add
          one.
        </p>
      )}

      {/* Item list */}
      {entries.map(([key, item]) => (
        <SectionHeader
          key={key}
          title={isTexts ? (item as TextType).text || key : key}
          defaultOpen={false}
        >
          {/* Delete button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => handleDelete(key)}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-red-400 transition-colors hover:bg-red-400/10"
              aria-label={`Delete ${key}`}
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </div>

          {isTexts ? (
            <TextItemEditor itemKey={key} item={item as TextType} />
          ) : (
            <ImageItemEditor itemKey={key} item={item as ImageType} />
          )}
        </SectionHeader>
      ))}
    </div>
  );
}
