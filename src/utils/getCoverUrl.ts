import { getAssetPath } from "./withBase";

/**
 * Resolve a post's `cover` frontmatter value to an <img> src.
 * Absolute http(s) URLs pass through; anything else is a path under /public
 * and gets the configured base prefix. Returns null when no cover is set, so
 * callers can skip rendering the image entirely.
 */
export const getCoverUrl = (cover?: string | null): string | null => {
  if (!cover) return null;
  return /^https?:\/\//.test(cover) ? cover : getAssetPath(cover);
};
