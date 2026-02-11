/**
 * Format a time value in seconds to MM:SS:CC display format (centiseconds).
 *
 * Handles edge cases: NaN, Infinity, and negative values all
 * return "00:00:00" to avoid broken UI display.
 */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "00:00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const centiseconds = Math.floor((seconds % 1) * 100);

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}:${String(centiseconds).padStart(2, "0")}`;
}
