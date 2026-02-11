import { useState, useCallback, useRef, useEffect } from "react";
import Activity from "lucide-react/dist/esm/icons/activity.js";
import AlignHorizontalJustifyCenter from "lucide-react/dist/esm/icons/align-horizontal-justify-center.js";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down.js";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right.js";
import Clock from "lucide-react/dist/esm/icons/clock.js";
import Code from "lucide-react/dist/esm/icons/code.js";
import Flame from "lucide-react/dist/esm/icons/flame.js";
import ImageIcon from "lucide-react/dist/esm/icons/image.js";
import ImagePlus from "lucide-react/dist/esm/icons/image-plus.js";
import Plus from "lucide-react/dist/esm/icons/plus.js";
import Sparkles from "lucide-react/dist/esm/icons/sparkles.js";
import Type from "lucide-react/dist/esm/icons/type.js";
import XIcon from "lucide-react/dist/esm/icons/x.js";
import Zap from "lucide-react/dist/esm/icons/zap.js";
import { useGanttStore } from "@/store/useGanttStore.ts";
import { ShaderPanel } from "@/components/panels/ShaderPanel.tsx";
import { BackgroundPanel } from "@/components/panels/BackgroundPanel.tsx";
import { VumetersPanel } from "@/components/panels/VumetersPanel.tsx";
import { ComposerPanel } from "@/components/panels/ComposerPanel.tsx";
import { SparksPanel } from "@/components/panels/SparksPanel.tsx";
import { ProgressBarPanel } from "@/components/panels/ProgressBarPanel.tsx";
import { TimecodePanel } from "@/components/panels/TimecodePanel.tsx";
import { TextItemEditor, ImageItemEditor } from "@/components/panels/TextsImagesPanel.tsx";
import { useStudioStore } from "@/store/useStudioStore.ts";
import type { SidebarItemType, SidebarItem, TimelineScene } from "@/timeline/ganttTypes.ts";
import type { TextType, ImageType } from "@mandafunk/config/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ICON_MAP: Record<SidebarItemType, typeof Zap> = {
  shader: Zap,
  background: ImagePlus,
  vumeters: Activity,
  composer: Sparkles,
  text: Type,
  image: ImageIcon,
  sparks: Flame,
  progressbar: AlignHorizontalJustifyCenter,
  timecode: Clock,
};

const LABEL_MAP: Record<SidebarItemType, string> = {
  shader: "Shader",
  background: "Background",
  vumeters: "Vumeters",
  composer: "Composer",
  text: "Text",
  image: "Image",
  sparks: "Sparks",
  progressbar: "Progress Bar",
  timecode: "Timecode",
};

const SINGLE_TYPES: SidebarItemType[] = [
  "shader", "background", "vumeters", "composer", "sparks", "progressbar", "timecode",
];

const ALL_ADDABLE: SidebarItemType[] = [
  "shader", "vumeters", "composer", "text", "image", "sparks", "progressbar", "timecode",
];

// ---------------------------------------------------------------------------
// Scene JSON Detail Modal (Dracula theme)
// ---------------------------------------------------------------------------

interface SceneJsonModalProps {
  scene: TimelineScene;
  onClose: () => void;
}

function SceneJsonModal({ scene, onClose }: SceneJsonModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose],
  );

  const json = JSON.stringify(scene, null, 2);

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <div className="relative flex h-[90vh] w-[90vw] max-w-5xl flex-col overflow-hidden rounded-xl border border-[#6272a4] shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#6272a4] bg-[#282a36] px-4 py-3">
          <h3 className="text-sm font-semibold text-[#f8f8f2]">
            Scene: {scene.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[#6272a4] transition-colors hover:text-[#f8f8f2]"
          >
            <XIcon size={16} />
          </button>
        </div>
        {/* JSON content - Dracula theme */}
        <div className="flex-1 overflow-auto bg-[#282a36] p-4">
          <pre className="text-xs leading-relaxed">
            <DraculaJson json={json} />
          </pre>
        </div>
      </div>
    </div>
  );
}

/** Simple Dracula-themed JSON syntax highlighter */
function DraculaJson({ json }: { json: string }) {
  const lines = json.split("\n");
  return (
    <code>
      {lines.map((line, i) => (
        <div key={i}>{colorizeLine(line)}</div>
      ))}
    </code>
  );
}

function colorizeLine(line: string): React.ReactNode {
  // Match key-value patterns in JSON
  const parts: React.ReactNode[] = [];
  let remaining = line;
  let idx = 0;

  // Leading whitespace
  const leadingMatch = remaining.match(/^(\s*)/);
  if (leadingMatch && leadingMatch[1]) {
    parts.push(<span key={idx++}>{leadingMatch[1]}</span>);
    remaining = remaining.slice(leadingMatch[1].length);
  }

  // Key: "keyName":
  const keyMatch = remaining.match(/^("(?:[^"\\]|\\.)*")\s*:/);
  if (keyMatch) {
    parts.push(<span key={idx++} className="text-[#8be9fd]">{keyMatch[1]}</span>);
    parts.push(<span key={idx++} className="text-[#f8f8f2]">: </span>);
    remaining = remaining.slice(keyMatch[0].length).trimStart();
  }

  // Value
  if (remaining) {
    parts.push(colorizeValue(remaining, idx));
  }

  return parts.length > 0 ? parts : <span className="text-[#f8f8f2]">{line}</span>;
}

function colorizeValue(val: string, key: number): React.ReactNode {
  const trimmed = val.replace(/,\s*$/, "");
  const trailing = val.slice(trimmed.length);

  // String
  if (trimmed.startsWith('"')) {
    return (
      <span key={key}>
        <span className="text-[#f1fa8c]">{trimmed}</span>
        <span className="text-[#f8f8f2]">{trailing}</span>
      </span>
    );
  }
  // Number
  if (/^-?\d/.test(trimmed)) {
    return (
      <span key={key}>
        <span className="text-[#bd93f9]">{trimmed}</span>
        <span className="text-[#f8f8f2]">{trailing}</span>
      </span>
    );
  }
  // Boolean
  if (trimmed === "true" || trimmed === "false") {
    return (
      <span key={key}>
        <span className="text-[#ff79c6]">{trimmed}</span>
        <span className="text-[#f8f8f2]">{trailing}</span>
      </span>
    );
  }
  // null
  if (trimmed === "null") {
    return (
      <span key={key}>
        <span className="text-[#ff79c6]">{trimmed}</span>
        <span className="text-[#f8f8f2]">{trailing}</span>
      </span>
    );
  }
  // Brackets / braces
  return <span key={key} className="text-[#f8f8f2]">{val}</span>;
}

// ---------------------------------------------------------------------------
// Add Component Popup
// ---------------------------------------------------------------------------

interface AddPopupProps {
  existingItems: SidebarItem[];
  onAdd: (type: SidebarItemType) => void;
  onClose: () => void;
}

function AddPopup({ existingItems, onAdd, onClose }: AddPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const existingTypes = new Set(existingItems.map((i) => i.type));

  return (
    <div
      ref={popupRef}
      className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-zinc-700 bg-zinc-800 py-1 shadow-xl"
    >
      {ALL_ADDABLE.map((type) => {
        const isSingle = SINGLE_TYPES.includes(type);
        const alreadyExists = isSingle && existingTypes.has(type);
        if (alreadyExists) return null;

        const Icon = ICON_MAP[type];
        return (
          <button
            key={type}
            type="button"
            onClick={() => onAdd(type)}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-700"
          >
            <Icon size={14} className="shrink-0 text-zinc-400" />
            {LABEL_MAP[type]}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Accordion Item
// ---------------------------------------------------------------------------

interface AccordionItemProps {
  item: SidebarItem;
  isOpen: boolean;
  onToggle: () => void;
  onDelete?: () => void;
  label: string;
}

function AccordionItem({ item, isOpen, onToggle, onDelete, label }: AccordionItemProps) {
  const Icon = ICON_MAP[item.type];
  const config = useStudioStore((s) => s.config);

  return (
    <div className="border-b border-zinc-800">
      {/* Header */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800/50"
        >
          {isOpen ? <ChevronDown size={14} className="shrink-0 text-zinc-500" /> : <ChevronRight size={14} className="shrink-0 text-zinc-500" />}
          <Icon size={14} className="shrink-0 text-zinc-400" />
          <span className="truncate">{label}</span>
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="shrink-0 p-2 text-zinc-600 transition-colors hover:text-red-400"
            title="Remove component"
          >
            <XIcon size={12} />
          </button>
        )}
      </div>

      {/* Content */}
      {isOpen && (
        <div className="px-3 pb-3">
          {item.type === "shader" && <ShaderPanel />}
          {item.type === "background" && <BackgroundPanel />}
          {item.type === "vumeters" && <VumetersPanel />}
          {item.type === "composer" && <ComposerPanel />}
          {item.type === "sparks" && <SparksPanel />}
          {item.type === "progressbar" && <ProgressBarPanel />}
          {item.type === "timecode" && <TimecodePanel />}
          {item.type === "text" && item.configKey && (() => {
            const texts = (config.texts ?? {}) as Record<string, TextType>;
            const textItem = texts[item.configKey!];
            if (!textItem) return null;
            return <TextItemEditor itemKey={item.configKey!} item={textItem} />;
          })()}
          {item.type === "image" && item.configKey && (() => {
            const images = (config.images ?? {}) as Record<string, ImageType>;
            const imageItem = images[item.configKey!];
            if (!imageItem) return null;
            return <ImageItemEditor itemKey={item.configKey!} item={imageItem} zMin={-200} zMax={200} />;
          })()}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AccordionSidebar
// ---------------------------------------------------------------------------

export function AccordionSidebar() {
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);

  const selection = useGanttStore((s) => s.selection);
  const scenes = useGanttStore((s) => s.timeline.scenes);
  const addSidebarItem = useGanttStore((s) => s.addSidebarItem);
  const removeSidebarItem = useGanttStore((s) => s.removeSidebarItem);
  const config = useStudioStore((s) => s.config);

  const selectedScene = scenes.find((s) => s.id === selection.sceneId);
  const sidebarItems = selectedScene?.sidebarItems ?? [];

  const handleToggle = useCallback(
    (itemId: string) => {
      setOpenItemId((prev) => (prev === itemId ? null : itemId));
    },
    [],
  );

  const handleAdd = useCallback(
    (type: SidebarItemType) => {
      if (!selection.sceneId) return;
      const newId = addSidebarItem(selection.sceneId, type);
      setShowAddPopup(false);
      if (newId) setOpenItemId(newId);
    },
    [selection.sceneId, addSidebarItem],
  );

  const handleDelete = useCallback(
    (itemId: string) => {
      if (!selection.sceneId) return;
      removeSidebarItem(selection.sceneId, itemId);
      if (openItemId === itemId) setOpenItemId(null);
    },
    [selection.sceneId, removeSidebarItem, openItemId],
  );

  // Auto-open first item when scene changes
  useEffect(() => {
    if (sidebarItems.length > 0) {
      setOpenItemId(sidebarItems[0].id);
    } else {
      setOpenItemId(null);
    }
  }, [selection.sceneId]); // eslint-disable-line react-hooks/exhaustive-deps

  function getItemLabel(item: SidebarItem): string {
    if (item.type === "text" && item.configKey) {
      const texts = (config.texts ?? {}) as Record<string, TextType>;
      const t = texts[item.configKey];
      return t?.text ? `Text: ${t.text}` : "Text";
    }
    if (item.type === "image" && item.configKey) {
      const images = (config.images ?? {}) as Record<string, ImageType>;
      const img = images[item.configKey];
      const filename = img?.path?.split("/").pop();
      return filename ? `Image: ${filename}` : "Image";
    }
    return LABEL_MAP[item.type];
  }

  if (!selectedScene) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center">
        <p className="text-xs text-zinc-500">Select a scene to edit its components</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="relative flex shrink-0 items-center justify-between border-b border-zinc-800 px-3 py-2">
        <h2 className="text-xs font-semibold text-zinc-300">Components</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowJsonModal(true)}
            className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            title="View scene JSON"
          >
            <Code size={14} />
          </button>
          <button
            type="button"
            onClick={() => setShowAddPopup((prev) => !prev)}
            className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            title="Add component"
          >
            <Plus size={14} />
          </button>
        </div>
        {showAddPopup && (
          <AddPopup
            existingItems={sidebarItems}
            onAdd={handleAdd}
            onClose={() => setShowAddPopup(false)}
          />
        )}
      </div>

      {/* Accordion list */}
      <div className="flex-1 overflow-y-auto">
        {sidebarItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-xs text-zinc-500">No components yet.</p>
            <p className="mt-1 text-[10px] text-zinc-600">
              Click + to add a component.
            </p>
          </div>
        ) : (
          sidebarItems.map((item) => (
            <AccordionItem
              key={item.id}
              item={item}
              isOpen={openItemId === item.id}
              onToggle={() => handleToggle(item.id)}
              onDelete={item.type === "background" ? undefined : () => handleDelete(item.id)}
              label={getItemLabel(item)}
            />
          ))
        )}
      </div>

      {/* Scene JSON modal */}
      {showJsonModal && selectedScene && (
        <SceneJsonModal
          scene={selectedScene}
          onClose={() => setShowJsonModal(false)}
        />
      )}
    </div>
  );
}
