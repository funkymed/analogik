import { useEffect, useRef } from "react";
import type { MandaRenderer } from "@mandafunk/core/MandaRenderer";
import { useStudioStore } from "@/store/useStudioStore";

/**
 * Watches store config changes and pushes them to the MandaRenderer
 * for real-time preview updates. When the config reference in the
 * Zustand store changes, the full config is forwarded to the renderer
 * so that the 3D scene stays in sync with the editor panels.
 */
export function useConfigBridge(renderer: MandaRenderer | null): void {
  const config = useStudioStore((s) => s.config);
  const prevConfigRef = useRef(config);

  useEffect(() => {
    if (!renderer) return;
    if (config === prevConfigRef.current) return;

    prevConfigRef.current = config;
    renderer.updateConfig(config);
  }, [config, renderer]);
}
