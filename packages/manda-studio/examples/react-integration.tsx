/**
 * React integration example for @mandarine/mandafunk
 *
 * Drop-in <Visualizer /> component that renders an audio-reactive
 * WebGL canvas. Accepts an optional partial config override as a prop
 * and cleans up all resources on unmount.
 *
 * Usage:
 *   <Visualizer
 *     config={{ scene: { shader: "PlasmaShader" } }}
 *     className="w-full h-[400px]"
 *   />
 */

import { useEffect, useRef, useState } from "react";
import {
  MandaRenderer,
  configDefault,
  mergeConfig,
} from "@mandarine/mandafunk";
import type { ConfigType } from "@mandarine/mandafunk/config/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VisualizerProps {
  /** Partial config override merged on top of configDefault. */
  config?: Partial<ConfigType>;
  /** CSS class name applied to the wrapping canvas element. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Visualizer({
  config: configOverride,
  className,
}: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<MandaRenderer | null>(null);
  const [ready, setReady] = useState(false);

  // -------------------------------------------------------------------------
  // Initialize renderer, audio context, and animation loop
  // -------------------------------------------------------------------------

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.connect(audioCtx.destination);

    const renderer = new MandaRenderer(canvas, audioCtx, analyser);
    rendererRef.current = renderer;

    let rafId: number;
    let disposed = false;

    const init = async () => {
      await renderer.init();

      const cfg = configOverride
        ? mergeConfig(configDefault, configOverride as ConfigType)
        : configDefault;

      await renderer.loadConfig(structuredClone(cfg));

      if (disposed) return;
      setReady(true);

      const tick = () => {
        if (disposed) return;
        renderer.render();
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    };

    void init();

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      renderer.dispose();
      void audioCtx.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // React to config prop changes after initialization
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!ready || !rendererRef.current || !configOverride) return;

    rendererRef.current.updateConfig(
      mergeConfig(configDefault, configOverride as ConfigType),
    );
  }, [configOverride, ready]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
