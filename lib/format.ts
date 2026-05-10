// Format a timestamp as "3d ago", "5w ago", "Mar 2026"
export function relativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  const week = Math.floor(day / 7);

  if (sec < 60) return 'just now';
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 7) return `${day}d ago`;
  if (week < 8) return `${week}w ago`;
  // Older: show month and year, lowercased
  return d
    .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    .toLowerCase();
}

/** Sentence-cased pretty join for display purposes */
export function pretty(s?: string | null): string {
  return (s ?? '').trim();
}
