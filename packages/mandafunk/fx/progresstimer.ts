import { convertHMS } from "../tools/convertHMS";

/**
 * Renders a progress timer display onto a 2D canvas context.
 * Shows the current playback position and total duration as text (MM:SS / MM:SS).
 *
 * @param ctx - The 2D canvas rendering context to draw on
 * @param color - Text color as a comma-separated RGB string (e.g., "255,255,255")
 * @param bgColor - Background color, or false for transparent
 * @param opacity - Opacity value (0 to 1)
 * @param size - Font size in pixels
 * @param font - Font family name
 * @param currentTime - Current playback position in seconds
 * @param audioDuration - Total track duration in seconds
 * @param align - Text alignment ("center" or "left")
 */
export const progresstimer = function (
  ctx: CanvasRenderingContext2D | null,
  color: string,
  bgColor: string | boolean,
  opacity: number,
  size: number,
  font: string,
  currentTime: number,
  audioDuration: number,
  align: string
) {
  if (!ctx) {
    return;
  }
  var text = `${convertHMS(currentTime)} / ${convertHMS(audioDuration)}`;
  var cW = ctx.canvas.width;
  var cH = ctx.canvas.height;

  ctx.clearRect(0, 0, cW, cH);

  ctx.font = ` ${size}px ${font}`;
  const metrics = ctx.measureText(text);

  let posX = 20;
  let posY = size;

  if (align === "center") {
    posX = cW / 2 - metrics.width / 2;
  }

  ctx.fillStyle = `rgba(${color},${opacity ?? 1})`;
  ctx.fillText(text, posX, posY);
};
