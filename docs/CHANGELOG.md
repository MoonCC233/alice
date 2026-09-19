# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- Hero section on the home page: avatar, intro and meta on the left, blog activity heatmap card on the right
- Year-view update heatmap (12 month columns × 4 week rows) with fluid full-width layout, uniform gaps, hover ring and a gliding tooltip
- Hover highlight on the home post list: a shared background that glides from card to card as the cursor moves
- Heatmap data utilities and hero/i18n configuration strings (zh/en)
- Article page post info sidebar: published/updated dates, word count and reading time
- Article page reading progress: floating pill with a progress ring and percentage
- Reading time and word count utilities with CJK-aware counting (zh/en strings)
- TOC improvements: click-to-highlight, active heading auto-scrolled into view and collapsible on mobile
- KaTeX math rendering in posts: inline (`$...$`) and display (`$$...$$`) formulas via remark-math + rehype-katex, with horizontally scrollable display math on narrow screens
- Friends/links page (`/links`): card list driven by a new `src/data/friends.ts` data file, with an apply link and zh/en strings
- Links entry in the header navigation (desktop and mobile) with a new link icon and active-state highlighting
- Copy-on-click social links: a social entry configured with `copy` instead of `url` renders as a button that puts the value on the clipboard (with a ring + "已复制"/"Copied" confirmation) and shows it in the tooltip. Used for the WeChat ID, which has no add-by-ID URL
- Hero avatar accepts an absolute `http(s)` URL in `hero.avatar`, used as-is instead of being resolved against the public directory. Local filenames still work and still fall back to the theme logo when the file is missing
- Blog list page (`/posts`) gets the gliding hover highlight previously only on the home page. The list markup, styles and script now live in a shared `PostList.astro` component used by both pages, so the two can no longer drift apart
- Mobile nav drawer: the hamburger opens a drawer sliding in from the inline-start edge, holding the full nav plus the light/dark toggle as a full-width labelled row. It is a `role="dialog"` with a Tab trap, Escape and backdrop dismissal, and a scroll lock set on the root element; it closes itself on a breakpoint change and before each View Transition so it never rides along to the next page. The theme toggle is now two elements — the desktop island button and the drawer row — bound through a shared `data-theme-toggle` hook
- Post covers: a new optional `cover` frontmatter field, either a path under `/public` (e.g. `/covers/hello.jpg`) or an absolute `http(s)` URL. It renders as a left thumbnail on every post card (home, post list, tag and archive pages — all via `Card.astro`, so no call-site changes) and as a full-width hero on the article page. A post without a cover renders exactly as before. Covers are not optimised — the full-size file is downloaded — so keep them around ≤640px wide
- The cover morphs into place on navigation, the same way the post title already does: both ends carry an identical `view-transition-name` (`toCoverTransitionName`), the same `16/10` aspect ratio and the same corner radius, so the browser performs a pure uniform scale plus a translate rather than stretching the image. The name goes on the aspect-ratio wrapper rather than the `<img>`, because ClientRouter takes the new snapshot without waiting for images — a named `<img>` can capture empty, whereas the wrapper's `bg-muted` degrades gracefully and its crop and radius are baked into the snapshot
- Dynamic island in the header's centre (`xl` and up): collapsed it is a 152×36 pill showing a live clock and the festival countdown; clicking grows it **in place** into a 320×64 capsule showing the clock plus four site stats. There is no separate panel — the button's own width and height transition, with the two content layers cross-fading. Its top edge is the anchor, so it only grows downward and never shifts vertically, and the size change uses the same back curve as the nav icons so it springs past its target and settles. It stays put while the page scrolls
- The island is fed by `getPostActivity()` (previously implemented and entirely unused) through a memoized `getSiteStats()`, and by the long-unused `hero.statPosts / statActiveDays / statThisMonth / statLongestStreak / unitDay / eventCountdown` strings — so it adds no new i18n keys and no new config: it is gated on the existing `hero.enabled`, and the countdown steps aside entirely when `hero.event` is unset or already past
- The header's scroll-converge animation is now capped so it stops short of the island instead of pulling the side islands into it. The cap is `min(clamp(4rem, 12vw, 10rem), (100vw - islandWidth) / 2 - 27rem)`, where `27rem` is the measured width of the left island — re-measure it if the nav changes

### Fixed

- TOC scrollspy not initializing when the article page is loaded directly
- TOC anchor jump misalignment caused by a doubled scroll offset
- Reduced-motion users still got the post title's View Transition morph. `prefers-reduced-motion` now also cancels `::view-transition-group`/`-old`/`-new`, which lands the morphed element at its destination immediately. The theme-switch circular reveal is unaffected — it drives its clip-path through the Web Animations API, which a CSS `animation: none` does not touch
- The hero and footer could disagree on "已运行 N 天". `Hero.astro` parsed `hero.since` as local midnight while `Footer.astro` parsed it as UTC midnight, so in Asia/Shanghai they differed by a day for the first eight hours of every day — and the hero's result also depended on the build machine's timezone. Both now go through a new `src/utils/siteAge.ts`, which does calendar-day arithmetic in `site.timezone` (a config value that was previously unused)

### Changed

- Site personalisation: author set to TeAnli, `site.profile` pointing at the author's GitHub, site title changed to TeAnli小屋, and the WeChat contact configured in `socials`
- Redesigned footer into a multi-column layout: brand with site description and socials, site info column with post/tag counts, running days, RSS link and a live clock; theme credit moved to a dedicated bottom bar
- Header nav items keep their hover glide, click bounce and focusability, but the item for the page you are already on no longer navigates (clicking it used to reload the same page). It is marked `aria-current="page"` so assistive tech announces it as the current page rather than a link
- Centralised the shared site chrome in `Layout.astro`: pages no longer import and render `Header`/`Footer` themselves, and the breadcrumb is now opt-in via a `breadcrumb` prop. `Footer` loses its `noMarginTop` prop — the layout's content region grows to fill the viewport, so `Pagination`'s own `mt-auto` keeps it directly above the footer
- The header logo is hidden on mobile, leaving the hamburger alone in the island. The drawer's own top bar carries the brand, and the utilities island is hidden there too now that its only control moved into the drawer
- Removed the upstream AstroPaper demo content: 15 posts (release notes, theme how-tos, colour-scheme docs, the example draft) plus the 8 images only those posts referenced. Four posts remain as fixtures for the theme's own features — the KaTeX test post and three long-form example posts, which between them cover prose styles, TOC, reading time and adjacent-post navigation

### Fixed

- RSS 404: the footer link and the `<link rel="alternate">` autodiscovery tag were built with `getRelativeLocaleUrl`, which appends a trailing slash (`/rss.xml/`) and misses the file route. Both now use `getAssetPath`, which keeps `/rss.xml` intact while still honouring `base`
- Missing footer on the friends/links page: `links.astro` imported `Footer` but never rendered it
- Dark mode prose (including display math) rendering too dark: `.app-prose` now applies `dark:prose-invert` so unstyled children switch to inverted colors
