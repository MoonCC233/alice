import type { CollectionEntry } from "astro:content";

/**
 * Builds heatmap/statistics data for the home hero from post frontmatter.
 *
 * A "blog update event" is either a `pubDatetime` or a `modDatetime`, so the
 * heatmap reflects both new posts and edits to existing ones.
 */

export interface ActivityDay {
  /** Local date key, e.g. "2026-09-12" */
  date: string;
  /** Number of update events on this day */
  count: number;
  /** 0 (none) … 4 (busiest) intensity level used for heatmap colouring */
  level: 0 | 1 | 2 | 3 | 4;
  /** Days after "today" at the end of the window (rendered invisible) */
  future?: boolean;
}

export interface MonthLabel {
  /** Zero-based grid column index (one column per week) */
  col: number;
  /** First day of that week, for locale-aware month formatting */
  date: Date;
}

export interface PostActivity {
  /** Week columns (oldest → newest), each holding 7 days Mon → Sun */
  weeks: ActivityDay[][];
  /** Month labels aligned to week columns */
  months: MonthLabel[];
  /** Update events inside the heatmap window */
  windowEvents: number;
  stats: {
    /** Total non-draft posts, all time */
    totalPosts: number;
    /** Days with at least one update inside the window */
    activeDays: number;
    /** Update events in the current calendar month */
    thisMonth: number;
    /** Longest run of consecutive days with at least one update, all time */
    longestStreak: number;
  };
}

export interface YearHeatmap {
  /** Calendar year the heatmap covers */
  year: number;
  /** counts[month][week] — month 0–11, week 0–3 (days 1–7 / 8–14 / 15–21 / 22+) */
  months: number[][];
  /** Update events inside the year */
  yearEvents: number;
}

/**
 * Year-view heatmap data (12 month columns × 4 week rows), matching the
 * calendar-widget style: each column is a month, each row a week of that month.
 */
export function getYearHeatmap(
  posts: CollectionEntry<"posts">[]
): YearHeatmap {
  const now = Date.now();
  const year = new Date().getFullYear();
  const months: number[][] = Array.from({ length: 12 }, () => [0, 0, 0, 0]);
  let yearEvents = 0;

  for (const post of posts) {
    if (post.data.draft) continue;
    for (const iso of [post.data.pubDatetime, post.data.modDatetime]) {
      if (!iso) continue;
      const d = new Date(iso);
      if (Number.isNaN(d.getTime()) || d.getTime() > now) continue;
      if (d.getFullYear() !== year) continue;
      const week = Math.min(Math.floor((d.getDate() - 1) / 7), 3);
      months[d.getMonth()][week] += 1;
      yearEvents += 1;
    }
  }

  return { year, months, yearEvents };
}

const DAY_MS = 86_400_000;

function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Parse a "YYYY-MM-DD" key as a *local* date (new Date(str) would be UTC). */
function fromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

/**
 * @param posts All entries of the "posts" collection (drafts are skipped here)
 * @param windowWeeks Width of the heatmap in week columns (default 26 ≈ half a year)
 */
export function getPostActivity(
  posts: CollectionEntry<"posts">[],
  windowWeeks = 26
): PostActivity {
  const now = Date.now();

  // Bucket every update event into local calendar days.
  const counts = new Map<string, number>();
  let totalPosts = 0;
  for (const post of posts) {
    if (post.data.draft) continue;
    totalPosts += 1;
    for (const iso of [post.data.pubDatetime, post.data.modDatetime]) {
      if (!iso) continue;
      const d = new Date(iso);
      // Ignore future-dated (scheduled) events so stats stay honest.
      if (Number.isNaN(d.getTime()) || d.getTime() > now) continue;
      const key = dayKey(d);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  // Window: the current (Mon-based) week plus the previous windowWeeks - 1.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const mondayOffset = (today.getDay() + 6) % 7; // days since Monday
  const start = new Date(today);
  start.setDate(today.getDate() - mondayOffset - (windowWeeks - 1) * 7);

  const weeks: ActivityDay[][] = [];
  const months: MonthLabel[] = [];
  let prevMonth = -1;
  let windowEvents = 0;
  let activeDays = 0;

  for (let w = 0; w < windowWeeks; w++) {
    const col: ActivityDay[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + w * 7 + i);
      const future = d.getTime() > today.getTime();
      const count = future ? 0 : (counts.get(dayKey(d)) ?? 0);
      if (!future) {
        windowEvents += count;
        if (count > 0) activeDays += 1;
      }
      col.push({ date: dayKey(d), count, level: toLevel(count), future });
    }

    // Month label where a new month starts (skip the tail so labels don't clip).
    const firstDate = fromKey(col[0].date);
    if (firstDate.getMonth() !== prevMonth && w <= windowWeeks - 3) {
      months.push({ col: w, date: firstDate });
    }
    prevMonth = firstDate.getMonth();

    weeks.push(col);
  }

  // Current-calendar-month events.
  const monthPrefix = dayKey(today).slice(0, 7); // "YYYY-MM"
  let thisMonth = 0;
  for (const [key, count] of counts) {
    if (key.startsWith(monthPrefix)) thisMonth += count;
  }

  // Longest streak of consecutive active days, all time.
  const activeKeys = [...counts.keys()].filter(k => (counts.get(k) ?? 0) > 0).sort();
  let longestStreak = 0;
  let streak = 0;
  let prev: Date | null = null;
  for (const key of activeKeys) {
    const date = fromKey(key);
    streak = prev && date.getTime() - prev.getTime() === DAY_MS ? streak + 1 : 1;
    longestStreak = Math.max(longestStreak, streak);
    prev = date;
  }

  return {
    weeks,
    months,
    windowEvents,
    stats: { totalPosts, activeDays, thisMonth, longestStreak },
  };
}
