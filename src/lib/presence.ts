export const ONLINE_WINDOW_MS = 5 * 60 * 1000;
export const DEFAULT_ACTIVITY_WINDOW_MS = 24 * 60 * 60 * 1000;
export const MAX_ACTIVITY_WINDOW_MS = 36 * 60 * 60 * 1000;

export function resolvePresenceActivityStart(
  requested: string | null,
  now: Date
) {
  const fallback = new Date(now.getTime() - DEFAULT_ACTIVITY_WINDOW_MS);
  if (!requested) return fallback;

  const parsed = new Date(requested);
  if (Number.isNaN(parsed.getTime()) || parsed > now) return fallback;

  const earliest = new Date(now.getTime() - MAX_ACTIVITY_WINDOW_MS);
  return parsed < earliest ? earliest : parsed;
}

export function isPresenceOnline(lastActiveAt: Date | null, now: Date) {
  if (!lastActiveAt) return false;
  const elapsed = now.getTime() - lastActiveAt.getTime();
  return elapsed >= 0 && elapsed <= ONLINE_WINDOW_MS;
}
