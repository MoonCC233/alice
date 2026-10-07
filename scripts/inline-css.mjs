/* eslint-disable no-console */
// Post-build step: inline every <link rel="stylesheet"> into
// its page's <head> as a <style> block, then drop the
// now-unreferenced CSS files. This removes the render-blocking
// stylesheet request from the critical path — first paint (and
// therefore LCP) no longer waits on a network roundtrip. The
// whole stylesheet is only ~25 KiB, small enough to inline.
import { readdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = join(fileURLToPath(new URL("..", import.meta.url)), "dist");

const LINK_TAG_RE = /<link\b[^>]*>/g;
const REL_RE = /\brel="([^"]*)"/i;
const HREF_RE = /\bhref="([^"]*)"/i;
const MEDIA_RE = /\bmedia="([^"]*)"/i;

const collectHtmlFiles = async (dir, found = []) => {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectHtmlFiles(path, found);
    } else if (entry.name.endsWith(".html")) {
      found.push(path);
    }
  }
  return found;
};

const toFilePath = (href, htmlPath) => {
  const [pathname] = href.split("?");
  if (/^https?:\/\//i.test(pathname)) return null;
  const target =
    isAbsolute(pathname) || pathname.startsWith("/")
      ? join(DIST, pathname)
      : resolve(dirname(htmlPath), pathname);
  // Only inline files that live inside dist — never follow
  // a crafted href out of the build output.
  return target.startsWith(DIST) ? target : null;
};

const run = async () => {
  const htmlFiles = await collectHtmlFiles(DIST);
  const inlinedCss = new Set();
  let pages = 0;

  for (const htmlPath of htmlFiles) {
    const html = await readFile(htmlPath, "utf8");
    const links = [...html.matchAll(LINK_TAG_RE)]
      .map(match => match[0])
      .filter(
        tag =>
          (REL_RE.exec(tag)?.[1] ?? "")
            .split(/\s+/)
            .includes("stylesheet") && HREF_RE.test(tag)
      );

    if (links.length === 0) continue;

    let updated = html;
    for (const tag of links) {
      const href = HREF_RE.exec(tag)[1];
      const cssPath = toFilePath(href, htmlPath);
      if (!cssPath) continue;

      let css;
      try {
        css = await readFile(cssPath, "utf8");
      } catch {
        // Missing file: leave the link untouched rather than
        // shipping a page with broken styles.
        continue;
      }

      const media = MEDIA_RE.exec(tag)?.[1];
      const styleTag = `<style${media ? ` media="${media}"` : ""}>${css}</style>`;
      updated = updated.split(tag).join(styleTag);
      inlinedCss.add(cssPath);
    }

    if (updated !== html) {
      await writeFile(htmlPath, updated);
      pages += 1;
    }
  }

  // Every reference was inlined, so the files are dead weight.
  for (const cssPath of inlinedCss) {
    await unlink(cssPath).catch(() => {});
  }

  console.log(
    `Inlined ${inlinedCss.size} stylesheet(s) into ${pages} page(s)`
  );
};

run().catch(error => {
  console.error(error);
  process.exit(1);
});
