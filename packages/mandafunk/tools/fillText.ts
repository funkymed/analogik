/**
 * Renders text onto a canvas element for use as a texture.
 *
 * @param text - The text string to render
 * @param font - Font family name
 * @param size - Font size in pixels
 * @param color - Text color as a CSS color string
 * @param align - Text alignment ("center" or "left")
 * @returns Canvas element with rendered text
 */
export function fillText(
  text: string,
  font: string,
  size: number,
  color: string,
  align: string
): HTMLCanvasElement {
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = 1024;
  canvas.height = 256;

  if (!ctx) return canvas;

  ctx.font = ` ${size}px ${font}`;
  const metrics = ctx.measureText(text);

  let posX = 20;
  let posY = size;
  if (align === "center") {
    posX = canvas.width / 2 - metrics.width / 2;
    posY = size;
  }

  ctx.strokeText(text, posX, posY);
  ctx.fillStyle = color || "black";
  ctx.fillText(text, posX, posY);

  ctx.lineWidth = 1;
  ctx.strokeStyle = color || "black";
  ctx.strokeText(text, posX, posY);

  return canvas;
}
