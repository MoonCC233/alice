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
    name: "MoonCC",
    url: "https://blog.mooncc.cn",
    desc: "MoonCC 的博客，记录技术与生活的点滴。",
    avatar: "https://blog.mooncc.cn/_astro/avatar.V3QQoo0u_17eoc9.webp",
  },
];
