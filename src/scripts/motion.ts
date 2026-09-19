import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import Lenis from "lenis";

/**
 * Motion tokens. These deliberately mirror the --ease-* / --dur-* custom
 * properties in global.css. CSS cannot read these values and JS cannot read
 * the custom properties at tween-creation time, so the two lists are kept in
 * sync by hand — change one, change the other.
 */
export const EASE = {
  /** out-expo — the theme's default for entrances and glides. */
  outExpo: "0.22,1,0.36,1",
  /** back-overshoot — for anything that should spring past its target. */
  back: "0.34,1.56,0.64,1",
} as const;

export const DUR = {
  fast: 0.2,
  base: 0.25,
  mid: 0.3,
  slow: 0.45,
  slowest: 0.5,
} as const;

gsap.registerPlugin(CustomEase);

export const easeOutExpo = CustomEase.create("outExpo", EASE.outExpo);
export const easeBack = CustomEase.create("back", EASE.back);

/** Read live rather than cached, so an OS change mid-session is honoured. */
export const reduceMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Every GSAP duration goes through this, so a single reduced-motion check
 * collapses all motion onto its end state instead of animating there.
 */
export const dur = (seconds: number): number =>
  reduceMotion() ? 0 : seconds;

/** Sticky-header offset: 6rem scroll-padding + 1rem scroll-margin in global.css. */
const ANCHOR_OFFSET = -112;

/**
 * Classes that live on <html>. The first two are Lenis' own — it adds them to
 * its root element and lenis.css keys off them — and the third is ours, used
 * to switch off native smooth scrolling while Lenis owns the scroll.
 */
const ROOT_CLASSES = ["lenis", "lenis-autoToggle", "motion-smooth"] as const;

const applyRootClasses = (root: HTMLElement): void => {
  root.classList.add(...ROOT_CLASSES);
};

let lenis: Lenis | null = null;

export const getLenis = (): Lenis | null => lenis;

/**
 * Smooth scrolling.
 *
 * Lenis runs in its default native mode: it animates real scrollTop values
 * rather than translating a wrapper, so window.scrollY, getBoundingClientRect
 * and position: fixed all keep behaving normally. The fixed TOC, post-info
 * sidebar, reading-progress pill and heatmap tooltip are all keyed to the
 * viewport and depend on that.
 */
function initSmoothScroll(): void {
  // With reduced motion, leave scrolling entirely to the browser.
  if (reduceMotion() || lenis) return;

  lenis = new Lenis({
    // Defaults to false; without it Lenis never advances.
    autoRaf: true,
    // Stops and starts Lenis from the wrapper's own overflow, which is exactly
    // how the drawer and the lightbox lock the page. No manual wiring needed.
    autoToggle: true,
    // Take over in-page anchor jumps (TOC, heading links, skip link) so the
    // sticky-header offset is applied by Lenis instead of scroll-behavior.
    anchors: { offset: ANCHOR_OFFSET },
  });

  applyRootClasses(document.documentElement);

  // Astro reconciles <html>'s attributes from the incoming document on every
  // View Transition, which strips everything added at runtime — Lenis' own
  // classes included, and with them the scroll-behavior override. Re-assert
  // them on the incoming document so the swap lands with them already applied.
  document.addEventListener("astro:before-swap", event => {
    const incoming = (event as unknown as { newDocument: Document })
      .newDocument;
    applyRootClasses(incoming.documentElement);
  });

  // A View Transition swap replaces the document, so Lenis' cached scroll
  // limit has to be recomputed. Its ResizeObserver usually catches this, but
  // an explicit resize is cheap and removes the race.
  document.addEventListener("astro:after-swap", () => {
    applyRootClasses(document.documentElement);
    lenis?.resize();
  });
}

initSmoothScroll();

/** Return to the top. `immediate` is for navigation resets, not for buttons. */
export function scrollToTop({ immediate = false } = {}): void {
  if (lenis) {
    lenis.scrollTo(0, { immediate });
    return;
  }
  window.scrollTo({
    top: 0,
    behavior: immediate || reduceMotion() ? "auto" : "smooth",
  });
}

/**
 * is:inline scripts cannot import modules, so the navigation scroll reset is
 * exposed globally — the same convention as window.__theme and
 * window.__lightboxSwapBound.
 */
(window as unknown as { __scrollToTop?: () => void }).__scrollToTop = () =>
  scrollToTop({ immediate: true });

export { gsap };
