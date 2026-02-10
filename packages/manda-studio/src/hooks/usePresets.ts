import { useState, useEffect, useCallback, useRef } from "react";
import type { ScenePreset, PresetExport } from "@/db/types";
import {
  getAllPresets,
  createPreset,
  updatePreset as updatePresetService,
  duplicatePreset as duplicatePresetService,
  deletePreset as deletePresetService,
  searchPresets,
  exportAllPresets,
  exportPresets,
  importPresets,
  getPreset,
} from "@/db/presetService";
import { useStudioStore } from "@/store/useStudioStore";

export interface UsePresetsReturn {
  presets: ScenePreset[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  createFromCurrent: (name: string) => Promise<number>;
  loadPreset: (id: number) => Promise<void>;
  updatePreset: (
    id: number,
    changes: Partial<
      Pick<ScenePreset, "name" | "description" | "tags" | "config" | "thumbnail">
    >,
  ) => Promise<void>;
  duplicatePreset: (id: number) => Promise<void>;
  deletePreset: (id: number) => Promise<void>;
  exportAll: () => Promise<void>;
  exportSelected: (ids: number[]) => Promise<void>;
  importFromFile: (file: File) => Promise<number>;
  refresh: () => Promise<void>;
}

const SEARCH_DEBOUNCE_MS = 300;

function triggerDownload(data: PresetExport, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function usePresets(): UsePresetsReturn {
  const [presets, setPresets] = useState<ScenePreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQueryState] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const config = useStudioStore((s) => s.config);
  const setConfig = useStudioStore((s) => s.setConfig);
  const pushHistory = useStudioStore((s) => s.pushHistory);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllPresets();
      setPresets(result);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all presets on mount
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setSearchQuery = useCallback(
    (q: string) => {
      setSearchQueryState(q);

      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }

      if (q.trim() === "") {
        void refresh();
        return;
      }

      debounceRef.current = setTimeout(() => {
        void (async () => {
          setLoading(true);
          try {
            const result = await searchPresets(q);
            setPresets(result);
          } finally {
            setLoading(false);
          }
        })();
      }, SEARCH_DEBOUNCE_MS);
    },
    [refresh],
  );

  const createFromCurrent = useCallback(
    async (name: string): Promise<number> => {
      const id = await createPreset(name, config);
      await refresh();
      return id;
    },
    [config, refresh],
  );

  const loadPreset = useCallback(
    async (id: number): Promise<void> => {
      const preset = await getPreset(id);
      if (!preset) {
        throw new Error(`Preset with id ${id} not found`);
      }
      pushHistory();
      setConfig(preset.config);
    },
    [pushHistory, setConfig],
  );

  const updatePreset = useCallback(
    async (
      id: number,
      changes: Partial<
        Pick<ScenePreset, "name" | "description" | "tags" | "config" | "thumbnail">
      >,
    ): Promise<void> => {
      await updatePresetService(id, changes);
      await refresh();
    },
    [refresh],
  );

  const duplicatePreset = useCallback(
    async (id: number): Promise<void> => {
      await duplicatePresetService(id);
      await refresh();
    },
    [refresh],
  );

  const deletePreset = useCallback(
    async (id: number): Promise<void> => {
      await deletePresetService(id);
      await refresh();
    },
    [refresh],
  );

  const exportAll = useCallback(async (): Promise<void> => {
    const data = await exportAllPresets();
    triggerDownload(data, "mandastudio-presets.json");
  }, []);

  const exportSelected = useCallback(
    async (ids: number[]): Promise<void> => {
      const data = await exportPresets(ids);
      triggerDownload(data, "mandastudio-presets.json");
    },
    [],
  );

  const importFromFile = useCallback(
    async (file: File): Promise<number> => {
      const text = await file.text();
      const data = JSON.parse(text) as PresetExport;
      if (data.version !== "1.0") {
        throw new Error(`Unsupported export version: ${data.version}`);
      }
      const count = await importPresets(data);
      await refresh();
      return count;
    },
    [refresh],
  );

  return {
    presets,
    loading,
    searchQuery,
    setSearchQuery,
    createFromCurrent,
    loadPreset,
    updatePreset,
    duplicatePreset,
    deletePreset,
    exportAll,
    exportSelected,
    importFromFile,
    refresh,
  };
}
