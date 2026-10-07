/* eslint-disable no-console */
// Build-time cover pipeline: turns the large PNGs in public/covers
// into right-sized WebP/AVIF variants that the <picture> srcsets in
// Card.astro and the post page pick from. Runs before `astro dev`
// and `astro build` (see package.json scripts).
//
// Keep COVER_WIDTHS in sync with COVER_VARIANT_WIDTHS in
// src/utils/getCoverImageSet.ts.
import { readdir, stat, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, extname, join } from "node:path";
import sharp from "sharp";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const COVERS_DIR = join(ROOT, "public", "covers");

// Card thumbnails render at 112–160px (w-28 / sm:w-40), the
// reading-page cover at up to 44rem (67rem in wide mode). All four
// widths are generated once and shared by both contexts.
const COVER_WIDTHS = [320, 480, 768, 1280];
const SOURCE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const VARIANT_RE = /-\d+w\.(?:webp|avif)$/i;

const run = async () => {
  const entries = await readdir(COVERS_DIR);
  const sources = entries.filter(
    file =>
      SOURCE_EXTS.has(extname(file).toLowerCase()) && !VARIANT_RE.test(file)
  );

  // Drop variants whose source was renamed or deleted, so a stale
  // crop never ships in dist.
  const sourceNames = new Set(
    sources.map(file => file.slice(0, -extname(file).length))
  );
  for (const file of entries) {
    if (!VARIANT_RE.test(file)) continue;
    if (sourceNames.has(file.replace(VARIANT_RE, ""))) continue;
    await unlink(join(COVERS_DIR, file));
    console.log(`Removed stale cover variant: ${file}`);
  }

  if (sources.length === 0) {
    console.log("No cover sources found in public/covers.");
    return;
  }

  let sourceBytes = 0;
  let variantBytes = 0;

  for (const file of sources) {
    const filePath = join(COVERS_DIR, file);
    const metadata = await sharp(filePath).metadata();
    sourceBytes += (await stat(filePath)).size;

    if (!metadata.width) continue;

    const name = file.slice(0, -extname(file).length);

    for (const width of COVER_WIDTHS) {
      // Never upscale: a variant wider than the source only adds bytes.
      if (width >= metadata.width) continue;

      for (const [format, options] of [
        ["webp", { quality: 80, effort: 6 }],
        ["avif", { quality: 58, effort: 6 }],
      ]) {
        const info = await sharp(filePath)
          .resize({ width, withoutEnlargement: true })
          [format](options)
          .toFile(join(COVERS_DIR, `${name}-${width}w.${format}`));
        variantBytes += info.size;
      }
    }
  }

  const kib = bytes => (bytes / 1024).toFixed(1);
  console.log(
    `Covers: ${sources.length} source(s) ${kib(sourceBytes)} KiB → ${kib(variantBytes)} KiB variants`
  );
};

run().catch(error => {
  console.error(error);
  process.exit(1);
});
