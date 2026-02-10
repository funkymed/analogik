/**
 * PreviewCanvas - WebGL visualization canvas for MandaStudio.
 *
 * Renders a full-parent-size canvas, initializes MandaRenderer on mount,
 * drives the animation loop with requestAnimationFrame, and auto-resizes
 * via ResizeObserver.
 *
 * Receives the AudioContext and AnalyserNode from the parent (useAudio)
 * so the renderer visualizes the actual playing audio.
 */

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { MandaRenderer } from "@mandafunk/core/MandaRenderer";
import type { ConfigType } from "@mandafunk/config/types";
import { useGanttStore } from "@/store/useGanttStore.ts";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface PreviewCanvasProps {
  /** AudioContext from the audio engine. */
  audioContext: AudioContext | null;
  /** AnalyserNode from the audio engine. */
  analyserNode: AnalyserNode | null;
  /** Live config - changes are synced to the renderer in real time. */
  config: ConfigType;
  /** Called once the MandaRenderer is fully initialized and ready. */
  onRendererReady?: (renderer: MandaRenderer) => void;
  /** Called once the canvas element is available and the renderer is initialized. */
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  /** Additional CSS class name for the wrapper div. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const wrapperStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  height: "100%",
  overflow: "hidden",
};

const canvasStyle: CSSProperties = {
  display: "block",
  width: "100%",
  height: "100%",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PreviewCanvas({
  audioContext,
  analyserNode,
  onRendererReady,
  onCanvasReady,
  config,
  className,
}: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const rendererRef = useRef<MandaRenderer | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const [initialized, setInitialized] = useState(false);

  // Stable ref for the callback so we don't re-run the init effect
  // when the consumer changes the callback identity.
  const onRendererReadyRef = useRef(onRendererReady);
  onRendererReadyRef.current = onRendererReady;

  const onCanvasReadyRef = useRef(onCanvasReady);
  onCanvasReadyRef.current = onCanvasReady;

  // ---------------------------------------------------------------------------
  // Initialize MandaRenderer when AudioContext + AnalyserNode are available
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioContext || !analyserNode) return;

    // Prevent double-init in StrictMode.
    if (rendererRef.current) return;

    let disposed = false;

    const initRenderer = async () => {
      // Resume AudioContext if suspended (browser autoplay policy).
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const renderer = new MandaRenderer(canvas, audioContext, analyserNode);
      rendererRef.current = renderer;

      await renderer.init();

      // loadConfig clones internally — no need to clone here.
      await renderer.loadConfig(config);

      if (disposed) {
        renderer.dispose();
        return;
      }

      setInitialized(true);
      onRendererReadyRef.current?.(renderer);
      onCanvasReadyRef.current?.(canvas);

      // Start animation loop.
      const tick = () => {
        if (disposed) return;
        renderer.render();
        rafIdRef.current = requestAnimationFrame(tick);
      };
      rafIdRef.current = requestAnimationFrame(tick);
    };

    void initRenderer();

    return () => {
      disposed = true;

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }

      setInitialized(false);
    };
    // config is intentionally omitted -- we only use it on first init.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioContext, analyserNode]);

  // ---------------------------------------------------------------------------
  // Sync live config changes to the renderer (only when user edits, NOT during
  // playback — PlaybackEngine already pushes config directly to the renderer).
  // ---------------------------------------------------------------------------

  const prevShaderRef = useRef<string | undefined>(config.scene?.shader);
  const isPlaying = useGanttStore((s) => s.isPlaying);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || !initialized) return;

    // During playback, PlaybackEngine drives the renderer directly at 60fps.
    // Skip this React-driven sync to avoid duplicate expensive GPU updates.
    if (isPlaying) return;

    const shaderChanged = config.scene?.shader !== prevShaderRef.current;
    prevShaderRef.current = config.scene?.shader;

    if (shaderChanged) {
      // Shader change requires full async loadConfig (clones internally).
      void renderer.loadConfig(config);
    } else {
      // Non-shader changes can use sync updateConfig (merges internally).
      renderer.updateConfig(config);
    }
  }, [config, initialized, isPlaying]);

  // ---------------------------------------------------------------------------
  // ResizeObserver
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      if (width === 0 || height === 0) return;

      const renderer = rendererRef.current;
      if (renderer && renderer.isInitialized() && !renderer.isDisposed()) {
        renderer.resize(width, height);
      }
    });

    observer.observe(wrapper);

    return () => {
      observer.disconnect();
    };
  }, [initialized]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div ref={wrapperRef} className={className} style={wrapperStyle}>
      <canvas ref={canvasRef} style={canvasStyle} />
    </div>
  );
}
