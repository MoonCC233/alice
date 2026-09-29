import type { CollectionEntry } from "astro:content";
import { countWords } from "./getReadingTime";

export interface ArchiveMonth {
  /** Local calendar month key, e.g. "2026-08" */
  key: string;
  year: number;
  /** 1–12 */
  month: number;
  /** Posts published in this month */
  count: number;
}

export interface ArchiveYearGroup {
  year: number;
  /** How many month columns this year spans on the trend axis */
  span: number;
  count: number;
}

export interface ArchiveOverview {
  /** Continuous month series (oldest → newest), zero-filled between posts */
  months: ArchiveMonth[];
  /** Year segments for the trend axis, in the same order as `months` */
  years: ArchiveYearGroup[];
  /** Largest month count, for bar scaling (never below 1) */
  maxCount: number;
  stats: {
    totalPosts: number;
    totalTags: number;
    totalWords: number;
    /** Years that contain at least one post */
    yearCount: number;
  };
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function firstOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Builds the archives page overview: a zero-filled month series for the trend
 * chart plus headline stats.
 *
 * Callers pass the same filtered collection the list below renders, so the
 * chart and the list can never disagree. Months without posts are kept so the
 * axis shows real gaps instead of collapsing quiet periods.
 */
export function getArchiveOverview(
  posts: CollectionEntry<"posts">[]
): ArchiveOverview {
  const counts = new Map<string, number>();
  const tags = new Set<string>();
  const postYears = new Set<number>();
  let totalWords = 0;
  let first: Date | null = null;
  let last: Date | null = null;

  for (const post of posts) {
    const pub = new Date(post.data.pubDatetime);
    if (Number.isNaN(pub.getTime())) continue;

    const year = pub.getFullYear();
    const month = pub.getMonth() + 1;
    const key = monthKey(year, month);
    counts.set(key, (counts.get(key) ?? 0) + 1);

    for (const tag of post.data.tags) tags.add(tag);
    postYears.add(year);
    totalWords += countWords(post.body);

    const bucket = firstOfMonth(pub);
    if (!first || bucket < first) first = bucket;
    if (!last || bucket > last) last = bucket;
  }

  const months: ArchiveMonth[] = [];
  const years: ArchiveYearGroup[] = [];

  if (first && last) {
    const cursor = firstOfMonth(first);
    while (cursor <= last) {
      const year = cursor.getFullYear();
      const month = cursor.getMonth() + 1;
      const count = counts.get(monthKey(year, month)) ?? 0;
      months.push({ key: monthKey(year, month), year, month, count });

      const current = years[years.length - 1];
      if (current?.year === year) {
        current.span += 1;
        current.count += count;
      } else {
        years.push({ year, span: 1, count });
      }

      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  return {
    months,
    years,
    maxCount: Math.max(1, ...months.map(m => m.count)),
    stats: {
      totalPosts: months.reduce((sum, m) => sum + m.count, 0),
      totalTags: tags.size,
      totalWords,
      yearCount: postYears.size,
    },
  };
}
