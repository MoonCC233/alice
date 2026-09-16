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

### Fixed

- TOC scrollspy not initializing when the article page is loaded directly
- TOC anchor jump misalignment caused by a doubled scroll offset

### Changed

- Redesigned footer into a multi-column layout: brand with site description and socials, site info column with post/tag counts, running days, RSS link and a live clock; theme credit moved to a dedicated bottom bar
