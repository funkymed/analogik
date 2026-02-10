import { useCallback, useEffect, useRef } from "react";
import { useStudioStore } from "@/store/useStudioStore.ts";
import X from "lucide-react/dist/esm/icons/x.js";

const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

const mod = isMac ? "Cmd" : "Ctrl";

const shortcuts: { keys: string; description: string }[] = [
  { keys: "Space", description: "Play / Pause" },
  { keys: `${mod}+Z`, description: "Undo" },
  { keys: `${mod}+Shift+Z`, description: "Redo" },
  { keys: `${mod}+S`, description: "Save preset" },
  { keys: `${mod}+E`, description: "Export timeline" },
  { keys: `${mod}+L`, description: "Toggle library" },
  { keys: `${mod}+1-5`, description: "Switch panels (Scene, Vumeters, Composer, Texts, Images)" },
  { keys: "?", description: "Show keyboard shortcuts" },
];

export function KeyboardShortcutsHelp() {
  const show = useStudioStore((s) => s.showShortcutsHelp);
  const setShow = useStudioStore((s) => s.setShowShortcutsHelp);
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setShow(false);
  }, [setShow]);

  // Close on Escape
  useEffect(() => {
    if (!show) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [show, handleClose]);

  if (!show) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === backdropRef.current) handleClose();
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
          <h2 className="text-sm font-semibold text-zinc-200">
            Keyboard Shortcuts
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* Table */}
        <div className="px-5 py-4">
          <table className="w-full">
            <tbody>
              {shortcuts.map((s) => (
                <tr key={s.keys} className="border-b border-zinc-800/50 last:border-0">
                  <td className="py-2 pr-4">
                    <kbd className="inline-block rounded bg-zinc-800 px-2 py-0.5 font-mono text-xs text-zinc-300">
                      {s.keys}
                    </kbd>
                  </td>
                  <td className="py-2 text-xs text-zinc-400">
                    {s.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
