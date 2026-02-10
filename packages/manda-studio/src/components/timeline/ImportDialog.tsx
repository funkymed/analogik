import { useState, useCallback, useEffect, useRef } from "react";
import { X, Upload, FileJson, ClipboardPaste } from "lucide-react";
import { useTimelineExport } from "@/hooks/useTimelineExport.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ImportSource = "file" | "paste";

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ImportDialog({ open, onClose }: ImportDialogProps) {
  const [source, setSource] = useState<ImportSource>("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { importFromJson, importFromPaste } = useTimelineExport();

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setSource("file");
      setSelectedFile(null);
      setPasteText("");
      setPreview(null);
      setError(null);
      setIsImporting(false);
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

  // Parse file for preview
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      setPreview(null);

      const file = e.target.files?.[0] ?? null;
      setSelectedFile(file);

      if (!file) return;

      file
        .text()
        .then((text) => {
          try {
            const parsed: unknown = JSON.parse(text);

            if (Array.isArray(parsed)) {
              setPreview(`Found ${parsed.length} tracks`);
            } else if (
              typeof parsed === "object" &&
              parsed !== null &&
              "tracks" in (parsed as Record<string, unknown>)
            ) {
              const obj = parsed as Record<string, unknown>;
              const tracks = obj["tracks"];
              if (Array.isArray(tracks)) {
                setPreview(`Found ${tracks.length} tracks`);
              }
            } else {
              setPreview(null);
            }
          } catch {
            setError("Invalid JSON file");
          }
        })
        .catch(() => {
          setError("Failed to read file");
        });
    },
    [],
  );

  // Parse paste for preview
  const handlePasteChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      setPasteText(text);
      setError(null);
      setPreview(null);

      if (text.trim().length === 0) return;

      try {
        // Try to extract array from the text
        let cleaned = text.trim();
        cleaned = cleaned.replace(
          /^(?:export\s+)?(?:const|let|var)\s+\w+\s*=\s*/,
          "",
        );
        cleaned = cleaned.replace(/^module\.exports\s*=\s*/, "");
        cleaned = cleaned.replace(/;\s*$/, "");

        const parsed: unknown = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
          setPreview(`Found ${parsed.length} tracks`);
        }
      } catch {
        // Don't show error while typing; only on import attempt
      }
    },
    [],
  );

  const handleImport = useCallback(async () => {
    setError(null);
    setIsImporting(true);

    try {
      if (source === "file") {
        if (!selectedFile) {
          setError("Please select a file first.");
          setIsImporting(false);
          return;
        }
        await importFromJson(selectedFile);
      } else {
        if (pasteText.trim().length === 0) {
          setError("Please paste the tracks array first.");
          setIsImporting(false);
          return;
        }
        importFromPaste(pasteText);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsImporting(false);
    }
  }, [source, selectedFile, pasteText, importFromJson, importFromPaste, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose],
  );

  const canImport =
    source === "file"
      ? selectedFile !== null
      : pasteText.trim().length > 0;

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
        aria-labelledby="import-dialog-title"
        className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2
            id="import-dialog-title"
            className="text-base font-semibold text-zinc-100"
          >
            Import Tracks
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
          {/* Source tabs */}
          <div className="flex gap-1 rounded-lg bg-zinc-950 p-1">
            <button
              type="button"
              onClick={() => {
                setSource("file");
                setError(null);
                setPreview(null);
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                source === "file"
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <FileJson className="h-4 w-4" />
              From JSON file
            </button>
            <button
              type="button"
              onClick={() => {
                setSource("paste");
                setError(null);
                setPreview(null);
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                source === "paste"
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <ClipboardPaste className="h-4 w-4" />
              Paste tracks.js
            </button>
          </div>

          {/* File input */}
          {source === "file" && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Select JSON file"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-700 px-4 py-6 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300"
              >
                <Upload className="h-5 w-5" />
                {selectedFile ? selectedFile.name : "Choose a .json file"}
              </button>
            </div>
          )}

          {/* Paste textarea */}
          {source === "paste" && (
            <div>
              <textarea
                value={pasteText}
                onChange={handlePasteChange}
                placeholder={'Paste the tracks array from tracks.js here...\n\nExample:\nconst tracks = [\n  { url: "2000/file.xm", ... },\n  ...\n];'}
                rows={8}
                className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 font-mono text-xs text-zinc-300 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>
          )}

          {/* Preview / Error */}
          {preview && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3">
              <p className="text-xs font-medium text-emerald-400">{preview}</p>
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3">
              <p className="text-xs font-medium text-red-400">{error}</p>
            </div>
          )}
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
            onClick={handleImport}
            disabled={!canImport || isImporting}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {isImporting ? "Importing..." : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
