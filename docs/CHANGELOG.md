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

### Fixed

- TOC scrollspy not initializing when the article page is loaded directly
- TOC anchor jump misalignment caused by a doubled scroll offset

### Changed

- Site personalisation: author set to TeAnli, `site.profile` pointing at the author's GitHub, site title changed to TeAnli小屋, and the WeChat contact configured in `socials`
- Redesigned footer into a multi-column layout: brand with site description and socials, site info column with post/tag counts, running days, RSS link and a live clock; theme credit moved to a dedicated bottom bar
- Header nav items keep their hover glide, click bounce and focusability, but the item for the page you are already on no longer navigates (clicking it used to reload the same page). It is marked `aria-current="page"` so assistive tech announces it as the current page rather than a link
- Centralised the shared site chrome in `Layout.astro`: pages no longer import and render `Header`/`Footer` themselves, and the breadcrumb is now opt-in via a `breadcrumb` prop. `Footer` loses its `noMarginTop` prop — the layout's content region grows to fill the viewport, so `Pagination`'s own `mt-auto` keeps it directly above the footer

### Fixed

- RSS 404: the footer link and the `<link rel="alternate">` autodiscovery tag were built with `getRelativeLocaleUrl`, which appends a trailing slash (`/rss.xml/`) and misses the file route. Both now use `getAssetPath`, which keeps `/rss.xml` intact while still honouring `base`
- Missing footer on the friends/links page: `links.astro` imported `Footer` but never rendered it
- Dark mode prose (including display math) rendering too dark: `.app-prose` now applies `dark:prose-invert` so unstyled children switch to inverted colors
