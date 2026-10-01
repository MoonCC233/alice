import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://astro-paper.pages.dev/",
    title: "TeAnli小屋",
    description: "一个极简、响应式且 SEO 友好的 Astro 博客主题。",
    author: "TeAnli",
    profile: "https://github.com/TeAnli",
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
    role: "[游戏开发者 / 全栈开发者]",
    avatar:
      "https://q.qlogo.cn/headimg_dl?dst_uin=1721299119&spec=640&img_type=jpg",
    since: "2026-09-10",
    event: { name: "中秋节", date: "2026-09-25" },
  },
  donation: {
    enabled: true,
    items: [
      {
        name: "支付宝",
        image: "/sponsor/alipay.jpg",
        description: "感谢你的支持",
      },
      {
        name: "微信支付",
        image: "/sponsor/wechat.jpg",
        description: "感谢你的支持",
      },
    ],
  },
  // 动态服务：填上你自己的 API 地址后，「动态」入口会自动出现在导航里。
  // 留空则隐藏入口。公开列表读取 `${apiBase}/api/moments`。
  moments: {
    apiBase: "https://moment.teanli.top",
    limit: 20,
  },
  socials: [
    // 微信没有「按 ID 加好友」的跳转协议，这个图标点击时复制微信号
    {
      name: "wechat",
      copy: "tal15739848688",
      linkTitle: "复制微信号：tal15739848688",
    },
    { name: "github",   url: "https://github.com/satnaing/astro-paper" },
    { name: "bilibili", url: "https://space.bilibili.com/000000000" },
  ],
});
