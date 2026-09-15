const THEME_KEY = "theme";
const LIGHT = "light";
const DARK = "dark";

function getPreferredTheme(): string {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored) return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? DARK
    : LIGHT;
}

// Reuse the value already set by the inline FOUC-prevention script if available.
let themeValue: string =
  (window as unknown as { __theme?: { value: string } }).__theme?.value ??
  getPreferredTheme();

function persist(): void {
  localStorage.setItem(THEME_KEY, themeValue);
  reflect();
}

function reflect(): void {
  const root = document.firstElementChild;
  root?.setAttribute("data-theme", themeValue);
  root?.classList.toggle("dark", themeValue === DARK);
  document.querySelector("#theme-btn")?.setAttribute("aria-label", themeValue);

  // Fill <meta name="theme-color"> with the computed background colour so
  // Android's browser chrome matches the page background.
  const bg = window.getComputedStyle(document.body).backgroundColor;
  document
    .querySelector("meta[name='theme-color']")
    ?.setAttribute("content", bg);
}

function applyTheme(next: string): void {
  themeValue = next;
  persist();
}

// Theme switch with a circular reveal: the new theme colour expands
// outwards from the toggle button until it covers the whole page.
function toggleThemeWithReveal(event: Event, btn: HTMLElement): void {
  const next = themeValue === LIGHT ? DARK : LIGHT;

  // Origin: the click point, or the button centre for keyboard activation.
  let x: number;
  let y: number;
  if (event instanceof MouseEvent && (event.clientX !== 0 || event.clientY !== 0)) {
    x = event.clientX;
    y = event.clientY;
  } else {
    const rect = btn.getBoundingClientRect();
    x = rect.left + rect.width / 2;
    y = rect.top + rect.height / 2;
  }

  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const doc = document as Document & {
    startViewTransition?: (callback: () => void) => {
      ready: Promise<void>;
    };
  };

  // Fallback: no View Transitions API or reduced motion → instant switch.
  if (typeof doc.startViewTransition !== "function" || reduceMotion) {
    applyTheme(next);
    return;
  }

  const transition = doc.startViewTransition(() => applyTheme(next));

  transition.ready
    .then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];
      document.documentElement.animate(
        { clipPath },
        {
          duration: 500,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    })
    .catch(() => {
      // Transition skipped/interrupted — theme has already been applied.
    });
}

function setup(): void {
  reflect();
  const btn = document.querySelector("#theme-btn");
  if (!btn) return;
  // The theme button lives in the persisted header (transition:persist),
  // so it is NOT replaced across View Transitions — guard against
  // re-adding the click listener on every astro:after-swap.
  if ((btn as HTMLElement).dataset.themeBound === "true") return;
  (btn as HTMLElement).dataset.themeBound = "true";
  btn.addEventListener("click", e => {
    toggleThemeWithReveal(e, btn as HTMLElement);
  });
}

setup();

// Re-run after View Transitions navigation.
document.addEventListener("astro:after-swap", setup);

// Carry the theme-color value across View Transitions to prevent the
// Android navigation bar from flashing during page transitions.
document.addEventListener("astro:before-swap", event => {
  const color = document
    .querySelector("meta[name='theme-color']")
    ?.getAttribute("content");
  if (color) {
    (event as { newDocument: Document }).newDocument
      .querySelector("meta[name='theme-color']")
      ?.setAttribute("content", color);
  }
});

// Sync with OS-level dark/light preference changes.
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", ({ matches }) => {
    themeValue = matches ? DARK : LIGHT;
    persist();
  });
