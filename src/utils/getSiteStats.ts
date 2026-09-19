import { getCollection } from "astro:content";
import { getPostActivity, type PostActivity } from "./getPostActivity";

let cached: Promise<PostActivity["stats"]> | null = null;

/**
 * Build-time site stats for the header's dynamic island.
 *
 * Memoized because the header renders on every page — without this the 52-week
 * activity window would be recomputed once per page per build.
 *
 * The window is a full year so `activeDays` reads as "active days in the last
 * year"; its label carries no window qualifier. Note the mixed scopes: only
 * `activeDays` is window-scoped, while `totalPosts` and `longestStreak` are
 * all-time and `thisMonth` is the current calendar month.
 */
export function getSiteStats(): Promise<PostActivity["stats"]> {
  cached ??= getCollection("posts").then(
    posts => getPostActivity(posts, 52).stats
  );
  return cached;
}
