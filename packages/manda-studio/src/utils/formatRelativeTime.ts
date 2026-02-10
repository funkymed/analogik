const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;
const WEEK = 604800;

/**
 * Format an ISO date string into a human-readable relative time.
 *
 * Returns "just now", "2m ago", "1h ago", "3d ago", "2w ago",
 * or a short date like "Jan 15" for older dates.
 */
export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = Date.now();
  const diffSeconds = Math.floor((now - date.getTime()) / 1000);

  if (diffSeconds < MINUTE) {
    return "just now";
  }

  if (diffSeconds < HOUR) {
    const minutes = Math.floor(diffSeconds / MINUTE);
    return `${minutes}m ago`;
  }

  if (diffSeconds < DAY) {
    const hours = Math.floor(diffSeconds / HOUR);
    return `${hours}h ago`;
  }

  if (diffSeconds < WEEK) {
    const days = Math.floor(diffSeconds / DAY);
    return `${days}d ago`;
  }

  if (diffSeconds < WEEK * 8) {
    const weeks = Math.floor(diffSeconds / WEEK);
    return `${weeks}w ago`;
  }

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${monthNames[date.getMonth()]} ${date.getDate()}`;
}
