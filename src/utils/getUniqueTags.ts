import type { CollectionEntry } from "astro:content";
import { postFilter } from "./postFilter";
import { slugifyStr } from "./slugify";

type Tag = {
  tag: string;
  tagName: string;
  /** Published posts carrying this tag */
  count: number;
};

/**
 * Builds a de-duplicated, alphabetical tag list from posts.
 *
 * - Drafts and scheduled posts are excluded via `postFilter()`
 * - `tag` is the slug used in URLs; `tagName` is the original label for display
 * - Uniqueness is based on the slug (so differently-cased labels collapse)
 * - `count` is the number of posts carrying the tag; callers that want a
 *   popularity order sort the result themselves
 */
export function getUniqueTags(posts: CollectionEntry<"posts">[]) {
  const bySlug = new Map<string, Tag>();

  for (const post of posts) {
    if (!postFilter(post)) continue;
    for (const label of post.data.tags) {
      const tag = slugifyStr(label);
      const existing = bySlug.get(tag);
      if (existing) {
        existing.count += 1;
      } else {
        bySlug.set(tag, { tag, tagName: label, count: 1 });
      }
    }
  }

  const tags: Tag[] = [...bySlug.values()];
  tags.sort((tagA, tagB) => tagA.tag.localeCompare(tagB.tag));
  return tags;
}
