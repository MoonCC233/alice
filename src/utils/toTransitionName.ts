import { slugifyStr } from "./slugify";

/**
 * Produce a valid CSS <custom-ident> for view-transition-name.
 * CSS idents only allow [a-zA-Z0-9_-] plus Unicode U+00A0+.
 * Non-ASCII chars are hex-encoded, ASCII special chars (:, /, etc.)
 * are replaced with hyphens to keep the browser from ignoring the name.
 */
export const toTransitionName = (str: string): string => {
  const base = slugifyStr(str.replaceAll(".", "-"));
  let result = base
    // encode non-ASCII chars (Chinese, Japanese, etc.)
    .replace(
      /[^\x00-\x7F]/gu,
      c => "u" + c.codePointAt(0)!.toString(16).padStart(6, "0")
    )
    // replace any remaining invalid chars (colons, slashes, etc.)
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    // collapse consecutive hyphens and trim
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  // CSS ident must not start with a digit
  if (/^\d/.test(result)) result = "p-" + result;
  if (!result) result = "post";
  return result;
};

/**
 * View-transition name for a post's cover, so the list thumbnail can morph
 * into the article hero alongside the title.
 *
 * The `--` separator is deliberate: toTransitionName collapses runs of `-`
 * into one, so a *title* name can never contain `--`. That keeps a post slugged
 * `foo-cover` from colliding with the cover of a post slugged `foo`, which
 * would make the browser drop both morphs as duplicates.
 */
export const toCoverTransitionName = (str: string): string =>
  `${toTransitionName(str)}--cover`;
