import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://astro-paper.pages.dev/",
    title: "AstroPaper",
    description: "一个极简、响应式且 SEO 友好的 Astro 博客主题。",
    author: "Sat Naing",
    profile: "https://satna.ing",
    location: "中国",
    lang: "zh",
    timezone: "Asia/Shanghai",
    dir: "ltr",
  },
  posts: {
    perPage: 6,
    perIndex: 4,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: true,
      url: "https://github.com/satnaing/astro-paper/edit/main/",
    },
    search: "pagefind",
  },
  hero: {
    enabled: true,
    role: "[全干工程师 / 技术博主]",
    avatar: "avatar.png",
    since: "2025-05-07",
    event: { name: "中秋节", date: "2026-09-25" },
  },
  socials: [
    { name: "wechat",   url: "https://weixin.qq.com/" },
    { name: "github",   url: "https://github.com/satnaing/astro-paper" },
    { name: "bilibili", url: "https://space.bilibili.com/000000000" },
  ],
  shareLinks: [
    { name: "whatsapp", url: "https://wa.me/?text=" },
    { name: "facebook", url: "https://www.facebook.com/sharer.php?u=" },
    { name: "x",        url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "pinterest", url: "https://pinterest.com/pin/create/button/?url=" },
    { name: "mail",     url: "mailto:?subject=See%20this%20post&body=" },
  ],
});