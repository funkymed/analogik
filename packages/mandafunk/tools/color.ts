/**
 * Strips the leading '#' from a hex color string.
 * @param h - Hex color string (e.g., "#ffffff" or "ffffff")
 * @returns The hex string without the '#' prefix
 */
export function cutHex(h: string): string {
  return h.charAt(0) === "#" ? h.substring(1, 7) : h;
}

/**
 * Extracts the red component from a hex color string.
 * @param h - Hex color string
 * @returns Red component value (0-255)
 */
export function hexToR(h: string): number {
  return parseInt(cutHex(h).substring(0, 2), 16);
}

/**
 * Extracts the green component from a hex color string.
 * @param h - Hex color string
 * @returns Green component value (0-255)
 */
export function hexToG(h: string): number {
  return parseInt(cutHex(h).substring(2, 4), 16);
}

/**
 * Extracts the blue component from a hex color string.
 * @param h - Hex color string
 * @returns Blue component value (0-255)
 */
export function hexToB(h: string): number {
  return parseInt(cutHex(h).substring(4, 6), 16);
}

/**
 * Converts a hex color string to a comma-separated RGB string.
 * @param h - Hex color string (e.g., "#ff0000")
 * @returns Comma-separated RGB string (e.g., "255,0,0")
 */
export function hextoRGB(h: string): string {
  return [hexToR(h), hexToG(h), hexToB(h)].join(",");
}
