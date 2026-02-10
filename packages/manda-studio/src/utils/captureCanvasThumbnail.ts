/**
 * Captures a thumbnail from a WebGL canvas element.
 *
 * Creates an offscreen canvas at the target dimensions, draws the source
 * canvas onto it (downscaled), and returns a JPEG data URL.
 *
 * IMPORTANT: For WebGL canvases without `preserveDrawingBuffer`, this
 * function must be called in the same frame as the render call (before
 * the buffer is cleared). The caller is responsible for timing.
 */
export function captureCanvasThumbnail(
  canvas: HTMLCanvasElement,
  maxWidth: number = 320,
  maxHeight: number = 180,
): string {
  if (canvas.width === 0 || canvas.height === 0) {
    return "";
  }

  const offscreen = document.createElement("canvas");
  offscreen.width = maxWidth;
  offscreen.height = maxHeight;

  const ctx = offscreen.getContext("2d");
  if (!ctx) {
    return "";
  }

  ctx.drawImage(canvas, 0, 0, maxWidth, maxHeight);

  return offscreen.toDataURL("image/jpeg", 0.8);
}
