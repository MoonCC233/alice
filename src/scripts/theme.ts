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
  if (
    event instanceof MouseEvent &&
    (event.clientX !== 0 || event.clientY !== 0)
  ) {
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
  const compactViewport = window.matchMedia("(max-width: 1023px)").matches;

  const doc = document as Document & {
    startViewTransition?: (callback: () => void) => {
      ready: Promise<void>;
    };
  };

  // Fallback: no View Transitions API or reduced motion → instant switch.
  // Root View Transitions can leave the new-document layer above the page on
  // narrow mobile browsers. The theme still changes immediately and the
  // button icons continue to update through the normal CSS state selectors.
  if (
    typeof doc.startViewTransition !== "function" ||
    reduceMotion ||
    compactViewport
  ) {
    applyTheme(next);
    return;
  }

  // Fold any other named transition back into the root for the duration of the
  // switch (the [data-theme-switching] rule in global.css). Set before the
  // transition starts so the outgoing snapshot is folded in as well; both
  // captures land before `ready` resolves, so dropping it there is safe.
  const rootEl = document.documentElement;
  rootEl.setAttribute("data-theme-switching", "");
  const unfold = () => rootEl.removeAttribute("data-theme-switching");

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
      unfold();
    })
    .catch(() => {
      // Transition skipped/interrupted — theme has already been applied.
      unfold();
    });
}

function setup(): void {
  reflect();
  // There are two toggles: the icon button in the header's right island
  // (desktop) and the labelled row inside the mobile drawer.
  //
  // Both live inside the persisted header (transition:persist), so they are
  // NOT replaced across View Transitions — guard per element against
  // re-adding the click listener on every astro:after-swap. Binding both is
  // safe precisely because the guard is per element: without it, a shared
  // marker would leave the second button dead.
  document.querySelectorAll<HTMLElement>("[data-theme-toggle]").forEach(btn => {
    if (btn.dataset.themeBound === "true") return;
    btn.dataset.themeBound = "true";
    btn.addEventListener("click", e => {
      toggleThemeWithReveal(e, btn);
    });
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
