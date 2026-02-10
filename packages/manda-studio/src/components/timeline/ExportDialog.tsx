import { useState, useCallback, useEffect, useRef } from "react";
import X from "lucide-react/dist/esm/icons/x.js";
import Download from "lucide-react/dist/esm/icons/download.js";
import FileJson from "lucide-react/dist/esm/icons/file-json.js";
import FileCode from "lucide-react/dist/esm/icons/file-code.js";
import FileType from "lucide-react/dist/esm/icons/file-type.js";
import { useTimelineStore } from "@/store/useTimelineStore.ts";
import { useTimelineExport } from "@/hooks/useTimelineExport.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ExportFormat = "json" | "js" | "ts";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Format option metadata
// ---------------------------------------------------------------------------

const FORMAT_OPTIONS: Array<{
  value: ExportFormat;
  label: string;
  description: string;
  icon: typeof FileJson;
}> = [
  {
    value: "json",
    label: "JSON",
    description: "Standard JSON format, importable in MandaStudio",
    icon: FileJson,
  },
  {
    value: "js",
    label: "ConfigVariations.js",
    description: "JavaScript format compatible with Analogik",
    icon: FileCode,
  },
  {
    value: "ts",
    label: "TypeScript",
    description: "Type-safe export as Record<string, ConfigType>",
    icon: FileType,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ExportDialog({ open, onClose }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("json");
  const [isExporting, setIsExporting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const assignedCount = useTimelineStore((s) => s.getAssignedCount());
  const unassignedCount = useTimelineStore((s) => s.getUnassignedCount());

  const { exportAsJson, exportAsJs, exportAsTs } = useTimelineExport();

  // Reset format when opening
  useEffect(() => {
    if (open) {
      setFormat("json");
      setIsExporting(false);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      switch (format) {
        case "json":
          exportAsJson();
          break;
        case "js":
          await exportAsJs();
          break;
        case "ts":
          await exportAsTs();
          break;
      }
      onClose();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }, [format, exportAsJson, exportAsJs, exportAsTs, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-dialog-title"
        className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2
            id="export-dialog-title"
            className="text-base font-semibold text-zinc-100"
          >
            Export Timeline
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-5 py-5">
          {/* Format options */}
          <fieldset>
            <legend className="mb-3 text-sm font-medium text-zinc-300">
              Export format
            </legend>
            <div className="space-y-2">
              {FORMAT_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = format === option.value;

                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors ${
                      isSelected
                        ? "border-indigo-500/50 bg-indigo-500/10"
                        : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="export-format"
                      value={option.value}
                      checked={isSelected}
                      onChange={() => setFormat(option.value)}
                      className="mt-0.5 accent-indigo-500"
                    />
                    <Icon
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        isSelected ? "text-indigo-400" : "text-zinc-500"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-zinc-200">
                        {option.label}
                      </div>
                      <div className="mt-0.5 text-xs text-zinc-500">
                        {option.description}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Stats */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3">
            <p className="text-xs text-zinc-400">
              <span className="font-medium text-zinc-300">
                {assignedCount}
              </span>{" "}
              tracks assigned
              {unassignedCount > 0 && (
                <>
                  ,{" "}
                  <span className="font-medium text-amber-400">
                    {unassignedCount}
                  </span>{" "}
                  unassigned
                </>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-800 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>
    </div>
  );
}
