import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Force,
  type Simulation,
  type SimulationNodeDatum,
} from "d3-force";
import { select, type Selection } from "d3-selection";
import { drag } from "d3-drag";

const PALETTE_KEY = "tag-graph-palette";
const VIEW_KEY = "tag-graph-view";
/** Keep in sync with the `40rem` breakpoint used in TagGraph.astro. */
const NARROW_QUERY = "(max-width: 40rem)";

type View = "graph" | "list";

/**
 * Low-saturation hues that sit inside the theme's monochrome system; the
 * "vivid" palette reuses them at a much higher saturation.
 */
const HUES = [172, 45, 285, 205, 340, 100, 20, 250];

// Fixed layout tuning: the drawer only deals in colour, so these are not
// user-facing. Values are chosen for a handful of tags through a few dozen, and
// are scaled to the container by `fitScale` so a phone gets the same shape as a
// desktop rather than an overflowing one.
const CHARGE = -300;
const LINK_BASE = 62;
const LINK_SPREAD = 34;
const CENTER_PULL = 0.05;
/** Node radius = base + growth × √(count / busiest tag). */
const NODE_BASE = 5;
const NODE_GROWTH = 9;
/** Space kept between a node's centre and the edge, for its label. */
const COLLIDE_PAD = 18;
const EDGE_PAD_SIDE = 46;
const EDGE_PAD_TOP = 26;
const EDGE_PAD_BOTTOM = 48;
const REFERENCE_WIDTH = 720;
const REFERENCE_HEIGHT = 420;

type Palette = "mono" | "muted" | "vivid";

const DEFAULT_PALETTE: Palette = "muted";

interface GraphNode extends SimulationNodeDatum {
  id: string;
  name: string;
  count: number;
  cluster: number;
  url: string;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  weight: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  maxCount: number;
  maxWeight: number;
  clusterCount: number;
}

function readStored<T extends string>(key: string, allowed: readonly T[]): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw && (allowed as readonly string[]).includes(raw)) return raw as T;
  } catch {
    // Private mode or blocked storage: fall through to the default.
  }
  return null;
}

function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The graph still works, it just forgets the choice.
  }
}

type NodeSel = Selection<SVGAElement, GraphNode, SVGGElement, unknown>;
type LinkSel = Selection<SVGLineElement, GraphLink, SVGGElement, unknown>;

/** Stops the layout on the page that is being swapped out. */
let teardown: (() => void) | null = null;
let swapBound = false;

export function initTagGraphs() {
  if (!swapBound) {
    swapBound = true;
    // Navigation replaces the DOM, which would otherwise leave the d3 timer
    // running against a detached SVG.
    document.addEventListener("astro:before-swap", () => {
      teardown?.();
      teardown = null;
    });
  }

  const panel = document.querySelector<HTMLElement>("[data-tag-settings]");
  document
    .querySelectorAll<HTMLElement>("[data-tag-graph]")
    .forEach(host => mount(host, panel));
  bindViews(document.querySelector<HTMLElement>("#tag-views"), panel);
}

/**
 * Graph / list switch. The stylesheet owns which view is on screen — it is
 * driven by `data-view` on the wrapper, which the inline bootstrap script sets
 * before first paint — so this only has to keep the buttons and the graph-only
 * controls in agreement with it.
 */
function bindViews(wrap: HTMLElement | null, panel: HTMLElement | null) {
  if (!wrap || wrap.dataset.bound === "true") return;
  wrap.dataset.bound = "true";

  const buttons = [
    ...wrap.querySelectorAll<HTMLButtonElement>("[data-tag-view]"),
  ];
  const openers = [
    ...wrap.querySelectorAll<HTMLButtonElement>("[data-tag-settings-open]"),
  ];
  const narrow = window.matchMedia(NARROW_QUERY);
  let stored = readStored<View>(VIEW_KEY, ["graph", "list"]);

  const sync = () => {
    const current = wrap.dataset.view;
    for (const button of buttons) {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.tagView === current)
      );
    }
    // Leaving the graph view also closes its settings panel, so returning to
    // the graph starts from a predictable state.
    if (panel && current !== "graph" && !panel.hidden) {
      panel.hidden = true;
      openers.forEach(opener => opener.setAttribute("aria-expanded", "false"));
    }
  };

  const setView = (view: View, persist: boolean) => {
    wrap.dataset.view = view;
    if (persist) {
      stored = view;
      writeStored(VIEW_KEY, view);
    }
    sync();
  };

  // Resolve the initial view here so the buttons agree with the CSS, which
  // carries the no-JS default: the list on narrow screens, the graph above.
  setView(stored ?? (narrow.matches ? "list" : "graph"), false);

  // Until an explicit choice is made, follow the breakpoint.
  narrow.addEventListener("change", event => {
    if (stored) return;
    setView(event.matches ? "list" : "graph", false);
  });

  for (const button of buttons) {
    button.addEventListener("click", () => {
      setView((button.dataset.tagView ?? "graph") as View, true);
    });
  }
}

function mount(host: HTMLElement, panel: HTMLElement | null) {
  if (host.dataset.mounted === "true") return;
  host.dataset.mounted = "true";

  const svgEl = host.querySelector("svg");
  if (!svgEl) return;

  let data: GraphData;
  try {
    data = JSON.parse(host.dataset.graph ?? "{}") as GraphData;
  } catch {
    return;
  }
  if (!data.nodes?.length) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const labelTemplate = host.dataset.label ?? "{{name}} · {{count}}";
  const fillLabel = (node: GraphNode) =>
    labelTemplate
      .replace(/\{\{name\}\}/g, node.name)
      .replace(/\{\{count\}\}/g, String(node.count));

  // d3-force mutates its inputs, so work on copies.
  const nodes: GraphNode[] = data.nodes.map(node => ({ ...node }));
  const links: GraphLink[] = data.links.map(link => ({ ...link }));
  const { maxCount, maxWeight } = data;

  let width = Math.max(240, host.clientWidth);
  let height = Math.max(240, host.clientHeight);

  const radiusOf = (node: GraphNode) =>
    NODE_BASE + NODE_GROWTH * Math.sqrt(node.count / Math.max(1, maxCount));

  const svg = select(svgEl);
  svg.selectAll("*").remove();

  const linkLayer = svg.append("g").attr("class", "tag-links");
  const nodeLayer = svg.append("g").attr("class", "tag-nodes");

  const linkSel: LinkSel = linkLayer
    .selectAll<SVGLineElement, GraphLink>("line")
    .data(links)
    .join("line")
    .attr("class", "tag-link")
    .attr("stroke-width", d => 1 + 1.6 * (d.weight / Math.max(1, maxWeight)));

  // Real anchors, not click handlers: that keeps middle-click, cmd-click and
  // keyboard activation working without re-implementing them.
  const nodeSel: NodeSel = nodeLayer
    .selectAll<SVGAElement, GraphNode>("a")
    .data(nodes)
    .join<SVGAElement>("a")
    .attr("class", "tag-node")
    .attr("href", d => d.url)
    .attr("aria-label", d => fillLabel(d))
    // The hue is inherited by the circle below, which paints from it.
    .style("--hue", d => HUES[d.cluster % HUES.length]);

  nodeSel
    .append("circle")
    .attr("class", "tag-node-dot")
    .attr("r", radiusOf);

  nodeSel
    .append("text")
    .attr("class", "tag-node-label")
    .attr("dy", d => radiusOf(d) + 14)
    .text(d => d.name);

  nodeSel
    .append("text")
    .attr("class", "tag-node-count")
    .attr("dy", d => radiusOf(d) + 26)
    .text(d => d.count);

  nodeSel.append("title").text(d => fillLabel(d));

  // forceLink resolves the string endpoints into node objects in place, so
  // read ids through `idOf` and keep the resolved pairs for hit-testing.
  const idOf = (end: string | GraphNode) =>
    typeof end === "string" ? end : end.id;

  const byId = new Map(nodes.map(node => [node.id, node]));
  const neighbors = new Map<string, Set<string>>(
    nodes.map(node => [node.id, new Set<string>()])
  );
  const linkEnds = new Map<GraphLink, [GraphNode, GraphNode]>();
  for (const link of links) {
    const source = byId.get(idOf(link.source));
    const target = byId.get(idOf(link.target));
    if (!source || !target) continue;
    linkEnds.set(link, [source, target]);
    neighbors.get(source.id)?.add(target.id);
    neighbors.get(target.id)?.add(source.id);
  }

  let hovered: string | null = null;
  const applyHighlight = () => {
    const near = hovered ? (neighbors.get(hovered) ?? new Set<string>()) : null;
    nodeSel
      .classed("is-active", d => d.id === hovered)
      .classed(
        "is-dim",
        d => Boolean(hovered) && d.id !== hovered && !near?.has(d.id)
      );
    linkSel
      .classed("is-active", d => {
        if (!hovered) return false;
        const [source, target] = linkEnds.get(d) ?? [];
        return source?.id === hovered || target?.id === hovered;
      })
      .classed("is-dim", d => {
        if (!hovered) return false;
        const [source, target] = linkEnds.get(d) ?? [];
        return source?.id !== hovered && target?.id !== hovered;
      });
  };

  // Hover and keyboard focus highlight a tag and its neighbours; touch users
  // get the highlight on tap, right before the anchor navigates.
  nodeSel
    .on("pointerenter", (_event, d) => {
      hovered = d.id;
      applyHighlight();
    })
    .on("pointerleave", () => {
      hovered = null;
      applyHighlight();
    })
    .on("focus", (_event, d) => {
      hovered = d.id;
      applyHighlight();
    })
    .on("blur", () => {
      hovered = null;
      applyHighlight();
    });

  /** How much of the nominal spread fits; a phone gets roughly half of it. */
  const fitScale = () =>
    Math.max(
      0.45,
      Math.min(1.15, Math.min(width / REFERENCE_WIDTH, height / REFERENCE_HEIGHT))
    );

  const linkForce = forceLink<GraphNode, GraphLink>(links)
    .id(d => (d as GraphNode).id)
    .strength(0.4);

  /**
   * Soft walls: a plain centre pull lets the outer nodes (and their labels)
   * spill past the panel, which is invisible on a wide desktop but obvious on a
   * phone. Positions are clamped and the outward velocity is partially
   * reflected so the node eases back in instead of sticking to the edge.
   */
  const bounds: Force<GraphNode, GraphLink> = (() => {
    let target: GraphNode[] = [];
    const force = (() => {
      const padX = Math.min(EDGE_PAD_SIDE, width / 3);
      const padTop = Math.min(EDGE_PAD_TOP, height / 4);
      const padBottom = Math.min(EDGE_PAD_BOTTOM, height / 3);
      for (const node of target) {
        const x = node.x ?? 0;
        if (x < padX) {
          node.x = padX;
          node.vx = Math.abs(node.vx ?? 0) * 0.4;
        } else if (x > width - padX) {
          node.x = width - padX;
          node.vx = -Math.abs(node.vx ?? 0) * 0.4;
        }
        const y = node.y ?? 0;
        if (y < padTop) {
          node.y = padTop;
          node.vy = Math.abs(node.vy ?? 0) * 0.4;
        } else if (y > height - padBottom) {
          node.y = height - padBottom;
          node.vy = -Math.abs(node.vy ?? 0) * 0.4;
        }
      }
    }) as Force<GraphNode, GraphLink>;
    force.initialize = (values: GraphNode[]) => {
      target = values;
    };
    return force;
  })();

  const simulation: Simulation<GraphNode, GraphLink> = forceSimulation(nodes)
    .force("link", linkForce)
    .force("bounds", bounds)
    .force("center", forceCenter(width / 2, height / 2));

  /** (Re)build the size-dependent forces; called at mount and on resize. */
  function applyLayoutForces() {
    const scale = fitScale();
    linkForce.distance(
      // Stronger ties sit closer together.
      d => (LINK_BASE + LINK_SPREAD * (1 - d.weight / Math.max(1, maxWeight))) * scale
    );
    simulation.force("charge", forceManyBody<GraphNode>().strength(CHARGE * scale));
    simulation.force(
      "collide",
      forceCollide<GraphNode>().radius(d => radiusOf(d) + COLLIDE_PAD)
    );
    simulation.force("x", forceX<GraphNode>(width / 2).strength(CENTER_PULL));
    simulation.force("y", forceY<GraphNode>(height / 2).strength(CENTER_PULL * 1.2));
  }

  applyLayoutForces();

  const draw = () => {
    linkSel
      .attr("x1", d => linkEnds.get(d)?.[0].x ?? 0)
      .attr("y1", d => linkEnds.get(d)?.[0].y ?? 0)
      .attr("x2", d => linkEnds.get(d)?.[1].x ?? 0)
      .attr("y2", d => linkEnds.get(d)?.[1].y ?? 0);
    nodeSel.attr("transform", d => `translate(${d.x ?? 0},${d.y ?? 0})`);
  };

  // Dragging must not add anything around the node — the dot stays solid — so
  // no drag state is reflected in the markup at all.
  let dragged = false;
  let suppressClick = false;
  let suppressTimer: number | undefined;

  // A drag ends with a click on the same anchor, so swallow that one click
  // without breaking later keyboard or mouse activation.
  nodeSel.on("click", event => {
    if (!suppressClick) return;
    suppressClick = false;
    event.preventDefault();
    event.stopPropagation();
  });

  nodeSel.call(
    drag<SVGAElement, GraphNode>()
      .on("start", (event, d) => {
        dragged = false;
        if (!event.active) simulation.alphaTarget(0.2).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        if (Math.abs(event.dx) > 1 || Math.abs(event.dy) > 1) dragged = true;
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        // Release so the node settles back into the layout.
        d.fx = null;
        d.fy = null;
        if (!dragged) return;
        suppressClick = true;
        window.clearTimeout(suppressTimer);
        suppressTimer = window.setTimeout(() => {
          suppressClick = false;
        }, 300);
      })
  );

  /**
   * Lay the graph out synchronously first: the nodes are positioned before the
   * first paint, so the panel is never empty and the layout survives
   * environments where requestAnimationFrame is throttled or absent
   * (screenshots, print). The animation only relaxes what is left.
   */
  simulation.stop();
  simulation.tick(reduced ? 300 : 150);
  draw();

  if (!reduced) {
    simulation.on("tick", draw);
    simulation.alpha(0.3).restart();
  }

  const observer = new ResizeObserver(() => {
    const nextW = Math.max(240, host.clientWidth);
    const nextH = Math.max(240, host.clientHeight);
    if (Math.abs(nextW - width) < 2 && Math.abs(nextH - height) < 2) return;
    width = nextW;
    height = nextH;
    // The host is sized from `vw` (not `vh`), so this only fires on real
    // layout changes — not when a mobile URL bar slides away.
    applyLayoutForces();
    simulation.force("center", forceCenter(width / 2, height / 2));
    // Re-settle synchronously: waiting on rAF would leave the nodes at the
    // previous viewport's coordinates in throttled or headless environments.
    simulation.stop();
    simulation.alpha(0.7);
    simulation.tick(180);
    draw();
    if (!reduced) simulation.alpha(0.25).restart();
  });
  observer.observe(host);

  bindSettings(panel, host);

  teardown = () => {
    observer.disconnect();
    simulation.stop();
    window.clearTimeout(suppressTimer);
  };
}

/**
 * The settings panel only switches the node palette. The choice lives on the
 * host element as `data-palette`, which the stylesheet keys off, so no
 * re-render is needed — a theme switch repaints from the same attribute.
 */
function bindSettings(panel: HTMLElement | null, host: HTMLElement) {
  host.dataset.palette =
    readStored<Palette>(PALETTE_KEY, ["mono", "muted", "vivid"]) ??
    DEFAULT_PALETTE;

  if (!panel || panel.dataset.bound === "true") return;
  panel.dataset.bound = "true";

  const buttons = [
    ...panel.querySelectorAll<HTMLButtonElement>("[data-palette-option]"),
  ];

  const sync = () => {
    for (const button of buttons) {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.paletteOption === host.dataset.palette)
      );
    }
  };
  sync();

  for (const button of buttons) {
    button.addEventListener("click", () => {
      const next = (button.dataset.paletteOption ?? DEFAULT_PALETTE) as Palette;
      host.dataset.palette = next;
      writeStored(PALETTE_KEY, next);
      sync();
    });
  }

  document
    .querySelectorAll<HTMLButtonElement>("[data-tag-settings-open]")
    .forEach(opener => {
      opener.addEventListener("click", () => {
        const opening = panel.hidden;
        panel.hidden = !opening;
        opener.setAttribute("aria-expanded", String(opening));
        if (opening) buttons[0]?.focus();
      });
    });
}
