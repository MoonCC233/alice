/**
 * 友链数据 — 编辑此文件即可增删友链。
 *
 * 字段说明：
 * - avatar:     头像图片 URL（对方站点头像 / favicon / public 目录本地图片），留空则渲染站点名首字母
 * - screenshot: 首页截图 URL，留空则用 WordPress mShots 服务按站点 URL 自动生成
 */
export type FriendLink = {
  name: string;
  url: string;
  desc: string;
  avatar?: string;
  screenshot?: string;
};

export const friends: FriendLink[] = [
  {
    name: "AstroPaper",
    url: "https://astro-paper.pages.dev/",
    desc: "本站所使用的极简、响应式 Astro 博客主题。",
  },
  {
    name: "Sat Naing",
    url: "https://satnaing.dev/",
    desc: "AstroPaper 主题作者的个人站点。",
  },
  {
    name: "Astro",
    url: "https://astro.build/",
    desc: "内容驱动的现代 Web 框架。",
  },
];
