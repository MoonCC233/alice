/**
 * Rewrites `:::collapse` containers into native `<details>` blocks:
 *
 *   :::collapse[标题]
 *   正文（完整 Markdown，可嵌套）
 *   :::
 *
 * Native <details>/<summary> gives nesting, keyboard support and a no-JS
 * fallback for free; src/styles/collapse.css does the styling.
 */

type Node = {
  type: string;
  value?: string;
  children?: Node[];
};

// A marker owns its whole line: `:::` or `:::name[title]{attrs}`, optionally
// preceded by the newline ending the previous line. The lookahead leaves that
// trailing newline in the stream so `:::` on consecutive lines still matches.
// `\r?` throughout because posts authored on Windows carry `\r\n`.
const MARKER_LINE =
  /(^|\r?\n)(:::(?:[a-zA-Z][\w-]*(?:\[[^\]]*\])?(?:\{[^}]*\})?)?)[ \t]*(?=\r?\n|$)/g;

const OPEN = /^:::([a-zA-Z][\w-]*)(?:\[([^\]]*)\])?(?:\{([^}]*)\})?$/;
const CLOSE = /^:::$/;

const NAME = "collapse";
const DEFAULT_TITLE = "展开";

type Marker =
  | { kind: "open"; name: string; title: string; isOpen: boolean }
  | { kind: "close" };

function markerOf(node: Node): Marker | null {
  if (node.type !== "paragraph" || node.children?.length !== 1) return null;
  const child = node.children[0];
  if (child.type !== "text" || child.value == null) return null;

  const open = OPEN.exec(child.value);
  if (open) {
    return {
      kind: "open",
      name: open[1],
      title: (open[2] ?? "").trim(),
      isOpen: /\bopen\b/.test(open[3] ?? ""),
    };
  }
  if (CLOSE.test(child.value)) return { kind: "close" };
  return null;
}

function markerParagraph(line: string): Node {
  return {
    type: "paragraph",
    children: [{ type: "text", value: line.trim() }],
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Markdown merges `:::` lines into the surrounding paragraph unless blank lines
 * separate them, so a marker can land mid-paragraph — even buried in a text node
 * beside inline markup. Cut every marker line out into a paragraph of its own;
 * whatever sits between markers stays a paragraph.
 */
function splitMarkers(paragraph: Node): Node[] {
  const children = paragraph.children;
  if (!children?.length) return [paragraph];

  const result: Node[] = [];
  let pending: Node[] = [];
  let found = false;

  const flush = () => {
    if (pending.length === 0) return;
    result.push({ type: "paragraph", children: pending });
    pending = [];
  };

  for (const child of children) {
    if (child.type !== "text" || child.value == null) {
      pending.push(child);
      continue;
    }

    const value = child.value;
    let cursor = 0;
    // The lookahead that detects the end of a marker line leaves its newline in
    // the text, so drop it from the first piece that follows a marker.
    let trimBreak = false;
    MARKER_LINE.lastIndex = 0;
    for (let m = MARKER_LINE.exec(value); m; m = MARKER_LINE.exec(value)) {
      found = true;
      let before = value.slice(cursor, m.index);
      if (trimBreak) {
        before = before.replace(/^\r?\n/, "");
        trimBreak = false;
      }
      if (before) pending.push({ type: "text", value: before });
      flush();
      result.push(markerParagraph(m[2]));
      cursor = m.index + m[0].length;
      trimBreak = true;
    }
    let rest = value.slice(cursor);
    if (trimBreak) rest = rest.replace(/^\r?\n/, "");
    if (rest) pending.push({ type: "text", value: rest });
  }

  // No markers anywhere: hand back the original node untouched.
  if (!found) return [paragraph];
  flush();
  return result;
}

function splitMarkersDeep(node: Node) {
  if (!Array.isArray(node.children)) return;
  const next = node.children.flatMap(child =>
    child.type === "paragraph" ? splitMarkers(child) : [child]
  );
  node.children = next;
  for (const child of next) splitMarkersDeep(child);
}

/**
 * A `:::` written directly under a blockquote or list line is absorbed into that
 * container by markdown's lazy continuation, so a box's closing marker can sit
 * one level below it. Look for one at the tail of the node's last descendant
 * chain, optionally removing it.
 */
function findTrailingClose(node: Node, remove: boolean): boolean {
  const children = node.children;
  if (!children?.length) return false;
  const last = children[children.length - 1];
  if (markerOf(last)?.kind === "close") {
    if (remove) children.pop();
    return true;
  }
  return findTrailingClose(last, remove);
}

function toDetails(marker: Extract<Marker, { kind: "open" }>, body: Node[]) {
  const title = escapeHtml(marker.title || DEFAULT_TITLE);
  return [
    {
      type: "html",
      value:
        `<details class="collapse-box"${marker.isOpen ? " open" : ""}>` +
        `<summary class="collapse-head">` +
        `<span class="collapse-icon" aria-hidden="true"></span>` +
        `<span class="collapse-title">${title}</span>` +
        `</summary>` +
        `<div class="collapse-body">`,
    },
    ...body,
    { type: "html", value: "</div></details>" },
  ];
}

function transform(children: Node[]): Node[] {
  const result: Node[] = [];

  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    const marker = markerOf(node);

    if (marker?.kind !== "open" || marker.name !== NAME) {
      if (!isEmpty(node)) result.push(node);
      continue;
    }

    let depth = 0;
    let end = -1;
    let nestedClose = false;

    for (let j = i + 1; j < children.length; j++) {
      const sibling = children[j];
      const found = markerOf(sibling);
      if (found?.kind === "open") {
        if (found.name === NAME) depth++;
        continue;
      }
      if (found?.kind === "close") {
        if (depth === 0) {
          end = j;
          break;
        }
        depth--;
        continue;
      }
      // An absorbed closer ends whichever box is innermost, so it has to move
      // the depth even when that box is a nested one — otherwise the scan never
      // balances and this box's own closer is never reached.
      if (depth === 0) {
        // Only claim a stray close while no nested box is open, so a nested
        // box's own closing marker is never stolen by the outer one.
        if (findTrailingClose(sibling, true)) {
          end = j;
          nestedClose = true;
          break;
        }
      } else if (findTrailingClose(sibling, false)) {
        depth--;
      }
    }

    // Unbalanced markers: leave the source untouched rather than swallow it.
    if (end === -1) {
      result.push(node);
      continue;
    }

    const body = transform(children.slice(i + 1, nestedClose ? end + 1 : end));
    result.push(...toDetails(marker, body));
    i = end;
  }

  return result;
}

function isEmpty(node: Node) {
  return Array.isArray(node.children) && node.children.length === 0;
}

function build(node: Node) {
  if (!Array.isArray(node.children)) return;
  node.children = transform(node.children);
  for (const child of node.children) build(child);
}

export default function remarkCollapseBox() {
  return (tree: Node) => {
    splitMarkersDeep(tree);
    build(tree);
  };
}
