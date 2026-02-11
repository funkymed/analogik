import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type KeyboardEvent,
} from "react";
import X from "lucide-react/dist/esm/icons/x.js";
import Search from "lucide-react/dist/esm/icons/search.js";
import Save from "lucide-react/dist/esm/icons/save.js";
import Upload from "lucide-react/dist/esm/icons/upload.js";
import Download from "lucide-react/dist/esm/icons/download.js";
import Copy from "lucide-react/dist/esm/icons/copy.js";
import Trash2 from "lucide-react/dist/esm/icons/trash-2.js";
import Play from "lucide-react/dist/esm/icons/play.js";
import Loader2 from "lucide-react/dist/esm/icons/loader-2.js";
import { usePresets } from "@/hooks/usePresets";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import { MediaLibraryGrid } from "@/components/library/MediaLibraryGrid";
import type { ScenePreset } from "@/db/types";

type LibraryTab = "scenes" | "images" | "audio" | "videos";

interface LibraryDrawerProps {
  open: boolean;
  onClose: () => void;
  initialTab?: LibraryTab;
}

/* ------------------------------------------------------------------ */
/*  Preset Card                                                       */
/* ------------------------------------------------------------------ */

interface PresetCardProps {
  preset: ScenePreset;
  onLoad: (id: number) => void;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => void;
}

function PresetCard({ preset, onLoad, onDuplicate, onDelete }: PresetCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleDeleteClick = useCallback(() => {
    setConfirmingDelete(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (preset.id !== undefined) {
      onDelete(preset.id);
    }
    setConfirmingDelete(false);
  }, [onDelete, preset.id]);

  const handleCancelDelete = useCallback(() => {
    setConfirmingDelete(false);
  }, []);

  const handleLoad = useCallback(() => {
    if (preset.id !== undefined) {
      onLoad(preset.id);
    }
  }, [onLoad, preset.id]);

  const handleDuplicate = useCallback(() => {
    if (preset.id !== undefined) {
      onDuplicate(preset.id);
    }
  }, [onDuplicate, preset.id]);

  return (
    <div className="group relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-800/50 transition-colors hover:border-zinc-600">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-zinc-700 to-zinc-900">
        {preset.thumbnail ? (
          <img
            src={preset.thumbnail}
            alt={preset.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
            No preview
          </div>
        )}

        {/* Hover overlay with actions */}
        {!confirmingDelete && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={handleLoad}
              className="rounded-md bg-blue-600 p-2 text-white transition-colors hover:bg-blue-500"
              title="Load preset"
            >
              <Play size={14} />
            </button>
            <button
              type="button"
              onClick={handleDuplicate}
              className="rounded-md bg-zinc-600 p-2 text-white transition-colors hover:bg-zinc-500"
              title="Duplicate preset"
            >
              <Copy size={14} />
            </button>
            <button
              type="button"
              onClick={handleDeleteClick}
              className="rounded-md bg-red-700 p-2 text-white transition-colors hover:bg-red-600"
              title="Delete preset"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}

        {/* Delete confirmation overlay */}
        {confirmingDelete && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80">
            <span className="text-xs font-medium text-zinc-300">Delete?</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded bg-red-600 px-3 py-1 text-xs text-white transition-colors hover:bg-red-500"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={handleCancelDelete}
                className="rounded bg-zinc-600 px-3 py-1 text-xs text-white transition-colors hover:bg-zinc-500"
              >
                No
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="truncate text-xs font-medium text-zinc-200" title={preset.name}>
          {preset.name}
        </p>
        <div className="mt-1 flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {preset.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </div>
          <span className="text-[10px] text-zinc-500">
            {formatRelativeTime(preset.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab bar                                                           */
/* ------------------------------------------------------------------ */

const TABS: { key: LibraryTab; label: string }[] = [
  { key: "scenes", label: "Scenes" },
  { key: "images", label: "Images" },
  { key: "audio", label: "Audio" },
  { key: "videos", label: "Videos" },
];

/* ------------------------------------------------------------------ */
/*  Library Drawer                                                    */
/* ------------------------------------------------------------------ */

export function LibraryDrawer({ open, onClose, initialTab }: LibraryDrawerProps) {
  const {
    presets,
    loading,
    searchQuery,
    setSearchQuery,
    createFromCurrent,
    loadPreset,
    duplicatePreset,
    deletePreset,
    exportAll,
    importFromFile,
  } = usePresets();

  const [activeTab, setActiveTab] = useState<LibraryTab>(initialTab ?? "scenes");
  const [savingName, setSavingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mediaSearchQuery, setMediaSearchQuery] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Sync initialTab prop
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Focus the name input when save mode activates
  useEffect(() => {
    if (savingName && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [savingName]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage === null) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  const handleSaveClick = useCallback(() => {
    setSavingName(true);
    setNameInput("");
  }, []);

  const handleSaveConfirm = useCallback(async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    await createFromCurrent(trimmed);
    setSavingName(false);
    setNameInput("");
    showToast(`Saved "${trimmed}"`);
  }, [nameInput, createFromCurrent, showToast]);

  const handleSaveCancel = useCallback(() => {
    setSavingName(false);
    setNameInput("");
  }, []);

  const handleSaveKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        void handleSaveConfirm();
      } else if (e.key === "Escape") {
        handleSaveCancel();
      }
    },
    [handleSaveConfirm, handleSaveCancel],
  );

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const count = await importFromFile(file);
        showToast(`Imported ${count} preset${count === 1 ? "" : "s"}`);
      } catch {
        showToast("Import failed: invalid file");
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [importFromFile, showToast],
  );

  const handleExportAll = useCallback(async () => {
    await exportAll();
    showToast("Exported all presets");
  }, [exportAll, showToast]);

  const handleLoad = useCallback(
    async (id: number) => {
      await loadPreset(id);
      showToast("Preset loaded");
    },
    [loadPreset, showToast],
  );

  const handleDuplicate = useCallback(
    async (id: number) => {
      await duplicatePreset(id);
      showToast("Preset duplicated");
    },
    [duplicatePreset, showToast],
  );

  const handleDelete = useCallback(
    async (id: number) => {
      await deletePreset(id);
      showToast("Preset deleted");
    },
    [deletePreset, showToast],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      if (activeTab === "scenes") {
        setSearchQuery(value);
      } else {
        setMediaSearchQuery(value);
      }
    },
    [activeTab, setSearchQuery],
  );

  const currentSearch = activeTab === "scenes" ? searchQuery : mediaSearchQuery;

  return (
    <div
      className={`fixed right-0 top-0 z-50 flex h-full w-[400px] flex-col border-l border-zinc-800 bg-zinc-900 shadow-2xl transition-transform duration-300 ease-in-out ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-200">Library</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        >
          <X size={16} />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex shrink-0 border-b border-zinc-800">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-indigo-500 text-indigo-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="shrink-0 border-b border-zinc-800 px-4 py-2">
        <div className="flex items-center gap-2 rounded-md bg-zinc-800 px-3 py-1.5">
          <Search size={14} className="shrink-0 text-zinc-500" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={currentSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-transparent text-xs text-zinc-200 placeholder-zinc-500 outline-none"
          />
        </div>
      </div>

      {/* Scenes tab content */}
      {activeTab === "scenes" && (
        <>
          {/* Action bar */}
          <div className="flex shrink-0 items-center gap-2 border-b border-zinc-800 px-4 py-2">
            {savingName ? (
              <input
                ref={nameInputRef}
                type="text"
                placeholder="Preset name..."
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={handleSaveKeyDown}
                onBlur={handleSaveCancel}
                className="flex-1 rounded-md bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 outline-none ring-1 ring-blue-500"
              />
            ) : (
              <button
                type="button"
                onClick={handleSaveClick}
                className="flex items-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-500"
              >
                <Save size={12} />
                Save Current
              </button>
            )}

            <div className="flex-1" />

            <button
              type="button"
              onClick={handleImportClick}
              className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
              title="Import presets"
            >
              <Upload size={14} />
            </button>
            <button
              type="button"
              onClick={() => void handleExportAll()}
              className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
              title="Export all presets"
            >
              <Download size={14} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => void handleFileChange(e)}
            />
          </div>

          {/* Preset grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-zinc-500" />
              </div>
            ) : presets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-xs text-zinc-500">
                  {searchQuery
                    ? "No presets match your search."
                    : "No presets yet. Save your first scene!"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {presets.map((preset) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    onLoad={(id) => void handleLoad(id)}
                    onDuplicate={(id) => void handleDuplicate(id)}
                    onDelete={(id) => void handleDelete(id)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Media tabs content */}
      {activeTab !== "scenes" && (
        <MediaLibraryGrid type={activeTab} searchQuery={mediaSearchQuery} />
      )}

      {/* Toast notification */}
      <div
        className={`pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 transition-all duration-300 ${
          toastMessage !== null
            ? "translate-y-0 opacity-100"
            : "translate-y-2 opacity-0"
        }`}
      >
        <div className="rounded-md bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 shadow-lg">
          {toastMessage}
        </div>
      </div>
    </div>
  );
}
