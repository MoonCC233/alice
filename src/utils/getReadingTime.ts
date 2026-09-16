/**
 * Text stats for a markdown post body.
 *
 * CJK text is counted per character; latin text per word. Code fences and
 * inline code are stripped first since they are skimmed rather than read.
 */

function cleanBody(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/~~~[\s\S]*?~~~/g, " ")
    .replace(/`[^`\n]*`/g, " ");
}

function countParts(body: string | undefined): { cjk: number; words: number } {
  if (!body) return { cjk: 0, words: 0 };

  const cleaned = cleanBody(body);
  const cjk =
    cleaned.match(/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g)?.length ?? 0;
  const words =
    cleaned
      .replace(/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g, " ")
      .match(/[A-Za-z0-9][A-Za-z0-9'’_-]*/g)?.length ?? 0;

  return { cjk, words };
}

/** Approximate total "word count" (CJK chars + latin words). */
export function countWords(body: string | undefined): number {
  const { cjk, words } = countParts(body);
  return cjk + words;
}

/** Estimated reading time in minutes (CJK ~350 chars/min, latin ~200 wpm). */
export function estimateReadingMinutes(body: string | undefined): number {
  const { cjk, words } = countParts(body);
  return Math.max(1, Math.round(cjk / 350 + words / 200));
}
