/**
 * Calendar-day arithmetic in the configured site timezone.
 *
 * Every "N days" readout — the hero and footer "已运行 N 天" lines, the header's
 * dynamic island, the festival countdown — resolves "today" through here rather
 * than through `new Date()` in whatever timezone the build machine (or the
 * visitor's browser) happens to be in. That keeps them all in agreement, and it
 * means the server-rendered number already equals the one the client recomputes,
 * so nothing flickers on load.
 *
 * Deliberately pure and dependency-free: the island's client script imports it.
 */

const DAY_MS = 86_400_000;

/** "YYYY-MM-DD" → whole days since the epoch, as a calendar date. */
function keyToDay(key: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key.trim());
  if (!m) return null;
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(t) ? null : Math.floor(t / DAY_MS);
}

/** The "YYYY-MM-DD" that `date` falls on in `timeZone` (or the host's zone). */
export function dayKeyIn(timeZone?: string, date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Whole calendar days from `fromKey` to `toKey`; null if either is malformed. */
export function daysBetween(fromKey: string, toKey: string): number | null {
  const a = keyToDay(fromKey);
  const b = keyToDay(toKey);
  return a === null || b === null ? null : b - a;
}

/** Days elapsed since a "YYYY-MM-DD" key. Never negative. */
export function daysSince(
  sinceKey: string,
  timeZone?: string,
  now: Date = new Date()
): number | null {
  const days = daysBetween(sinceKey, dayKeyIn(timeZone, now));
  return days === null ? null : Math.max(0, days);
}

/** Days remaining until a "YYYY-MM-DD" key. Negative once it has passed. */
export function daysUntil(
  targetKey: string,
  timeZone?: string,
  now: Date = new Date()
): number | null {
  return daysBetween(dayKeyIn(timeZone, now), targetKey);
}
