import { useEffect } from "react";
import { useStudioStore } from "@/store/useStudioStore.ts";
import type { PanelName } from "@/store/useStudioStore.ts";
import { createPreset } from "@/db/presetService.ts";
import { toast } from "@/utils/toast";

const panelByIndex: Record<string, PanelName> = {
  "1": "scene",
  "2": "vumeters",
  "3": "composer",
  "4": "texts",
  "5": "images",
};

/**
 * Global keyboard shortcuts for MandaStudio.
 *
 * - Ctrl/Cmd+Z        : Undo
 * - Ctrl/Cmd+Shift+Z  : Redo
 * - Ctrl/Cmd+S        : Save current config as preset
 * - Ctrl/Cmd+E        : Open export dialog
 * - Ctrl/Cmd+L        : Toggle library drawer
 * - Ctrl/Cmd+1-5      : Switch panel tabs
 * - Space             : Toggle play/pause (only when focus is not on an input)
 * - ?                 : Show keyboard shortcuts help
 */
export function useKeyboardShortcuts(): void {
  const undo = useStudioStore((s) => s.undo);
  const redo = useStudioStore((s) => s.redo);
  const togglePlay = useStudioStore((s) => s.setPlaying);
  const getIsPlaying = () => useStudioStore.getState().isPlaying;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      // Undo: Ctrl/Cmd + Z (without Shift)
      if (meta && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        undo();
        toast("Undo", "info");
        return;
      }

      // Redo: Ctrl/Cmd + Shift + Z
      if (meta && e.shiftKey && (e.key === "Z" || e.key === "z")) {
        e.preventDefault();
        redo();
        toast("Redo", "info");
        return;
      }

      // Save: Ctrl/Cmd + S
      if (meta && !e.shiftKey && e.key === "s") {
        e.preventDefault();
        const state = useStudioStore.getState();
        const thumbnail = state.captureThumbnail?.() ?? "";
        const now = new Date();
        const name = `Preset ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        void createPreset(name, state.config, thumbnail).then(() => {
          toast("Preset saved", "success");
        });
        return;
      }

      // Export: Ctrl/Cmd + E
      if (meta && !e.shiftKey && e.key === "e") {
        e.preventDefault();
        const state = useStudioStore.getState();
        state.setShowExportDialog(!state.showExportDialog);
        return;
      }

      // Library: Ctrl/Cmd + L
      if (meta && !e.shiftKey && e.key === "l") {
        e.preventDefault();
        const state = useStudioStore.getState();
        state.setLibraryOpen(!state.libraryOpen);
        return;
      }

      // Panel switch: Ctrl/Cmd + 1-5
      if (meta && !e.shiftKey && e.key in panelByIndex) {
        e.preventDefault();
        useStudioStore.getState().setActivePanel(panelByIndex[e.key]);
        return;
      }

      // Show shortcuts help: ? key (not in input fields) or Ctrl/Cmd + /
      if (
        (!isInput && !meta && e.key === "?") ||
        (meta && e.key === "/")
      ) {
        e.preventDefault();
        const state = useStudioStore.getState();
        state.setShowShortcutsHelp(!state.showShortcutsHelp);
        return;
      }

      // Space: toggle play/pause (skip if focused on input elements)
      if (e.key === " " || e.code === "Space") {
        if (isInput) return;
        e.preventDefault();
        togglePlay(!getIsPlaying());
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, togglePlay]);
}
