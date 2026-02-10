/**
 * Renders a progress bar visualization onto a 2D canvas context.
 * Displays a horizontal bar with a circular cursor indicating playback progress.
 *
 * @param ctx - The 2D canvas rendering context to draw on
 * @param color - Bar color as a comma-separated RGB string (e.g., "255,255,255")
 * @param cursorColor - Cursor color as a CSS color string
 * @param bgColor - Background color, or false for transparent
 * @param opacity - Opacity value (0 to 1)
 * @param progress - Playback progress percentage (0 to 100)
 */
export const progressbar = function (
  ctx: CanvasRenderingContext2D | null,
  color: string,
  cursorColor: string,
  bgColor: string | boolean,
  opacity: number,
  progress: number
) {
  if (!ctx) {
    return;
  }
  if (progress > 100) {
    progress = 100;
  }
  var cW = ctx.canvas.width - 2;
  var cH = ctx.canvas.height;
  ctx.clearRect(0, 0, cW + 2, cH);

  ctx.fillStyle = `rgba(${color},${opacity ?? 1})`;
  ctx.fillRect(0, cH / 2 - 1, cW, 4);

  var rect = ctx.canvas.getBoundingClientRect();
  var posx = Math.round((progress / 100) * cW);
  if (posx > cW - 2) {
    posx = cW - 2;
  }
  if (posx < 4) {
    posx = 4;
  }
  var posy = cH / 2 - rect.top + 1;

  ctx.fillStyle = cursorColor;
  ctx.beginPath();
  ctx.arc(posx, posy, 4, 0, 2 * Math.PI);
  ctx.fill();
};
