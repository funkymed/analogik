import { useCallback, useRef } from "react";
import { captureCanvasThumbnail } from "@/utils/captureCanvasThumbnail.ts";

export interface UseThumbnailCaptureReturn {
  /** Set the canvas element to capture from. */
  setCanvas: (canvas: HTMLCanvasElement | null) => void;
  /** Capture a thumbnail right now. Returns the data URL, or empty string if unavailable. */
  capture: () => string;
}

/**
 * Hook that provides thumbnail capture functionality for a WebGL canvas.
 *
 * Call `setCanvas` with the canvas element once it is ready, then call
 * `capture()` at any time to grab a downscaled JPEG thumbnail.
 */
export function useThumbnailCapture(): UseThumbnailCaptureReturn {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const setCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
  }, []);

  const capture = useCallback((): string => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return "";
    }
    return captureCanvasThumbnail(canvas);
  }, []);

  return { setCanvas, capture };
}
