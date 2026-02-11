import { useEffect } from "react";
import { useStudioStore } from "@/store/useStudioStore.ts";
import type { PanelName } from "@/store/useStudioStore.ts";
import { createPreset } from "@/db/presetService.ts";
import { toast } from "@/utils/toast";

const panelByIndex: Record<string, PanelName> = {
  "1": "shader",
  "2": "background",
  "3": "vumeters",
  "4": "composer",
  "5": "texts",
  "6": "images",
  "7": "sparks",
  "8": "progressbar",
  "9": "timecode",
};

/**
 * Global keyboard shortcuts for MandaStudio.
 *
 * - Ctrl/Cmd+Z        : Undo
 * - Ctrl/Cmd+Shift+Z  : Redo
 * - Ctrl/Cmd+S        : Save current config as preset
 * - Ctrl/Cmd+E        : Open export dialog
 * - Ctrl/Cmd+L        : Toggle library drawer
 * - Ctrl/Cmd+1-9      : Switch panel tabs
 * - Space             : Toggle play/pause (only when focus is not on an input)
 * - ?                 : Show keyboard shortcuts help
 */
export function useKeyboardShortcuts(): void {
  // Read store actions inside the handler via getState() to avoid
  // re-attaching the listener every time a store reference changes.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      const state = useStudioStore.getState();

      // Undo: Ctrl/Cmd + Z (without Shift)
      if (meta && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        state.undo();
        toast("Undo", "info");
        return;
      }

      // Redo: Ctrl/Cmd + Shift + Z
      if (meta && e.shiftKey && (e.key === "Z" || e.key === "z")) {
        e.preventDefault();
        state.redo();
        toast("Redo", "info");
        return;
      }

      // Save: Ctrl/Cmd + S
      if (meta && !e.shiftKey && e.key === "s") {
        e.preventDefault();
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
        state.setShowExportDialog(!state.showExportDialog);
        return;
      }

      // Library: Ctrl/Cmd + L
      if (meta && !e.shiftKey && e.key === "l") {
        e.preventDefault();
        state.setLibraryOpen(!state.libraryOpen);
        return;
      }

      // Panel switch: Ctrl/Cmd + 1-9
      if (meta && !e.shiftKey && e.key in panelByIndex) {
        e.preventDefault();
        state.setActivePanel(panelByIndex[e.key]);
        return;
      }

      // Show shortcuts help: ? key (not in input fields) or Ctrl/Cmd + /
      if (
        (!isInput && !meta && e.key === "?") ||
        (meta && e.key === "/")
      ) {
        e.preventDefault();
        state.setShowShortcutsHelp(!state.showShortcutsHelp);
        return;
      }

      // Space: toggle play/pause (skip if focused on input elements)
      if (e.key === " " || e.code === "Space") {
        if (isInput) return;
        e.preventDefault();
        state.setPlaying(!state.isPlaying);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
