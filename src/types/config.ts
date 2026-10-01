interface SiteConfig {
  /** Deployed URL of the site, e.g. "https://example.com" */
  url: string;
  /** Blog title shown in header and meta tags */
  title: string;
  /** Short description used in SEO meta and RSS feed */
  description: string;
  /** Default post author name */
  author: string;
  /** Author profile URL (used in structured data) */
  profile?: string;
  /** Location shown in the home hero meta row, e.g. "China" */
  location?: string;
  /** HTML lang attribute, defaults to "en" */
  lang?: string;
  /** IANA timezone for post dates, e.g. "Asia/Bangkok" */
  timezone?: string;
  /** Text direction */
  dir?: "ltr" | "rtl" | "auto";
  /** Google Search Console verification meta tag value */
  googleVerification?: string;
}

interface PostsConfig {
  /** Posts per page on paginated listing pages */
  perPage?: number;
  /** Posts shown on the index/home page */
  perIndex?: number;
  /**
   * Scheduled posts within this window (ms) of their pubDatetime
   * are shown as published. Defaults to 15 minutes.
   */
  scheduledPostMargin?: number;
}

interface FeaturesConfig {
  /** Enable light/dark mode toggle. Defaults to true. */
  lightAndDarkMode?: boolean;
  /** Show the /archives page and link it in nav. Defaults to true. */
  showArchives?: boolean;
  /** Show back button on post detail pages. Defaults to true. */
  showBackButton?: boolean;
  /** "Edit page" link shown on post detail pages. */
  editPost?:
    | {
        enabled: true;
        /** Base URL for the edit link, e.g. GitHub edit URL */
        url: string;
      }
    | { enabled: false };
  /**
   * Search provider. "pagefind" ships in the base template.
   * Set to false to disable search entirely.
   */
  search?: "pagefind" | false;
}

interface SocialLinkFields {
  /**
   * Must match an SVG filename in src/assets/icons/socials/.
   * e.g. "github" → src/assets/icons/socials/github.svg
   */
  name: string;
  /**
   * Accessible label for the icon (aria-label, title attribute).
   * Auto-generated if omitted: "{site.title} on GitHub", "Send an email to {site.title}", "Copy Wechat: tal…", etc.
   * Override when the default wording doesn't fit.
   */
  linkTitle?: string;
}

/**
 * Either a profile to open, or a value to copy on click. Some platforms
 * (WeChat) expose no URL that adds a contact by ID, so those entries copy
 * their ID instead and show it in the tooltip.
 */
type SocialLink = SocialLinkFields &
  (
    | {
        url: string;
      }
    | {
        /** Copied to the clipboard on click; also shown in the tooltip. */
        copy: string;
      }
  );

/** A notable day shown with a countdown bar in the home hero. */
interface HeroEventConfig {
  /** Event display name, e.g. "中秋节" */
  name: string;
  /** Event date in "YYYY-MM-DD" format (interpreted as a local date) */
  date: string;
}

/** Home hero sidebar (personal info + post contribution heatmap). */
interface HeroConfig {
  /** Show the hero section on the home page. Defaults to true. */
  enabled?: boolean;
  /** Identity line under the author name. Falls back to the i18n role string. */
  role?: string;
  /**
   * Avatar image: a path relative to the public directory, e.g. "avatar.png",
   * or an absolute http(s) URL.
   */
  avatar?: string;
  /** Site founding date "YYYY-MM-DD" used for the site-age progress bar. */
  since?: string;
  /** Next notable day with a countdown bar (e.g. a festival). */
  event?: HeroEventConfig;
}

interface DonationItem {
  /** Display name for the donation method, e.g. "支付宝". */
  name: string;
  /** Image path under public/ or an absolute URL. */
  image: string;
  /** Optional supporting copy shown below the image. */
  description?: string;
}

interface DonationConfig {
  /** Show the donation section on the about page. Defaults to true. */
  enabled?: boolean;
  /** Donation images displayed as reveal-on-click cards. */
  items?: DonationItem[];
}

interface MomentsConfig {
  /**
   * Base URL of the moments (动态) API, e.g. "https://moment.teanli.top".
   * Leave empty to hide the nav entry and show an "unconfigured" notice on
   * the page. The public list is read from `${apiBase}/api/moments`.
   */
  apiBase?: string;
  /** Moments fetched per page. Defaults to 20; the API caps this at 50. */
  limit?: number;
}

interface AstroPaperConfig {
  site: SiteConfig;
  posts?: PostsConfig;
  features?: FeaturesConfig;
  /** Home hero sidebar (personal info + heatmap + countdowns) */
  hero?: HeroConfig;
  /** Donation methods shown on the about page. */
  donation?: DonationConfig;
  /** Moments (动态) feed backed by an external HTTP API */
  moments?: MomentsConfig;
  /** Social profile links shown in header/footer */
  socials?: SocialLink[];
}

type ResolvedSiteConfig = Required<
  Pick<
    SiteConfig,
    "url" | "title" | "description" | "author" | "lang" | "timezone" | "dir"
  >
> &
  Pick<SiteConfig, "profile" | "googleVerification" | "location">;

export interface ResolvedAstroPaperConfig {
  site: ResolvedSiteConfig;
  posts: Required<PostsConfig>;
  features: Required<FeaturesConfig>;
  hero: {
    enabled: boolean;
    role: string;
    avatar: string;
    since: string;
    event?: HeroEventConfig;
  };
  donation: {
    enabled: boolean;
    items: DonationItem[];
  };
  moments: {
    apiBase: string;
    limit: number;
  };
  socials: SocialLink[];
}

/**
 * Type helper for astro-paper.config.ts.
 * Provides full IntelliSense without any runtime overhead.
 */
export function defineAstroPaperConfig(
  config: AstroPaperConfig
): AstroPaperConfig {
  return config;
}
