export function formatTimestamp(
  timestamp: number,
  t: (key: string, vars?: Record<string, string | number>) => string
): string {
  const date = new Date(timestamp);
  const now = Date.now();
  const diffInSeconds = Math.max(0, Math.floor((now - date.getTime()) / 1000));

  if (diffInSeconds < 45) {
    return t('history.justNow');
  }
  if (diffInSeconds < 3600) {
    const minutes = Math.max(1, Math.floor(diffInSeconds / 60));
    return t('history.minutesAgo', { n: minutes });
  }
  if (diffInSeconds < 86_400) {
    const hours = Math.max(1, Math.floor(diffInSeconds / 3600));
    return t('history.hoursAgo', { n: hours });
  }
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatClock(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
