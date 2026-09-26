# TeAnli小屋

一个极简、响应式、SEO 友好的个人博客，基于 [AstroPaper v6](https://github.com/satnaing/astro-paper) 二次开发。

站点信息、导航社交、首页 Hero 等内容都在 `astro-paper.config.ts` 中配置。

## 技术栈

| 分类 | 方案 |
| :--- | :--- |
| 框架 | [Astro](https://astro.build/) 7，全部路由预渲染为静态页面，Markdown / MDX 写作 |
| 样式 | Tailwind CSS 4（`@tailwindcss/vite`）+ `@tailwindcss/typography` |
| 语言 | TypeScript |
| 搜索 | [Pagefind](https://pagefind.app/) 本地全文索引 |
| 内容增强 | Shiki 代码高亮、KaTeX 数学公式、rehype-callouts 提示块、remark-toc 目录 |
| 动效 | GSAP + Lenis（`src/scripts/motion.ts`）、View Transitions 页面过渡 |
| 部署 | Cloudflare Workers 静态资源托管（`wrangler.jsonc`） |

## 环境要求

- Node.js >= 22.12.0
- pnpm（CI 中固定使用 11.3.0）

## 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器，访问 http://localhost:4321
pnpm dev
```

## 命令

所有命令都在项目根目录下通过终端运行：

| 命令 | 说明 |
| :--- | :--- |
| `pnpm install` | 安装依赖 |
| `pnpm dev` | 在 `localhost:4321` 启动本地开发服务器 |
| `pnpm build` | 类型检查、构建站点、运行 Pagefind 索引并将索引复制到 `public/pagefind/` |
| `pnpm preview` | 部署前在本地预览构建结果 |
| `pnpm sync` | 为所有 Astro 模块生成 TypeScript 类型。[了解更多](https://docs.astro.build/en/reference/cli-reference/#astro-sync) |
| `pnpm lint` | 运行 ESLint |
| `pnpm format` | 用 Prettier 格式化代码 |
| `pnpm format:check` | 检查格式是否符合 Prettier 规范 |
| `pnpm astro ...` | 运行 CLI 命令，如 `astro add`、`astro check` |

推送 PR 时 CI 会依次执行 `pnpm lint`、`pnpm format:check` 和 `pnpm build`，提交前先本地跑一遍可以少等一轮。

## 目录结构

```
├── astro-paper.config.ts   # 站点配置（唯一需要手动编辑的配置文件）
├── astro.config.ts         # Astro 集成、i18n、Markdown 与 Shiki 管线
├── wrangler.jsonc          # Cloudflare Workers 静态资源部署配置
├── docs/CHANGELOG.md       # 变更记录
├── public/                 # 静态资源：封面、favicon；pagefind/ 为构建产物
└── src/
    ├── components/         # Header、Footer、Hero、Card、PostList 等 UI 组件
    ├── content/
    │   ├── pages/          # 独立页面（about.md）
    │   └── posts/          # 博客文章，assets/ 存放文章配图
    ├── data/friends.ts     # 友链数据
    ├── i18n/lang/          # zh / en 界面文案
    ├── layouts/            # Layout（全站外壳）、PostLayout（文章页）
    ├── pages/              # 路由：/、/posts、/tags、/archives、/about、/links、/search、/rss.xml
    ├── scripts/            # 主题切换与 GSAP/Lenis 动效
    ├── styles/             # 全局样式与配色方案
    └── utils/              # 阅读时长、站点统计、排序、slug 等工具函数
```

## 站点配置

`astro-paper.config.ts` 集中管理站点信息（标题、作者、时区、语言）、分页数量、功能开关（明暗模式、归档页、搜索、编辑文章链接）、首页 Hero、社交链接和分享链接。

`src/config.ts` 会在此基础上补齐默认值，供代码内部读取，改配置请改前者。

导航项本身写在 `src/components/Header.astro`，对应文案在 `src/i18n/lang/*.ts`。当前生效的语言在 `astro.config.ts` 的 `i18n.locales` 中指定。

## 写文章

在 `src/content/posts/` 下新建 `.md` 或 `.mdx` 文件，文件名以下划线开头会被忽略。Frontmatter 字段定义见 `src/content.config.ts`：

| 字段 | 必填 | 说明 |
| :--- | :--- | :--- |
| `title` | 是 | 文章标题 |
| `description` | 是 | 文章摘要，用于列表和 SEO |
| `pubDatetime` | 是 | 发布时间 |
| `modDatetime` | 否 | 更新时间，填写后文章页会显示 |
| `author` | 否 | 作者，默认取站点配置 |
| `tags` | 否 | 标签数组，默认 `["others"]` |
| `cover` | 否 | 封面图，`public` 下的路径（如 `/covers/hello.svg`）或绝对 URL |
| `featured` | 否 | 是否在首页置顶 |
| `draft` | 否 | 草稿，不会出现在列表和 RSS 中 |
| `slug` | 否 | 自定义 URL 路径 |
| `canonicalURL` | 否 | 原文链接，用于转载 |
| `hideEditPost` | 否 | 隐藏文章页的「编辑此页」链接 |
| `timezone` | 否 | 单独指定该文章的时区 |

注意封面图不会做压缩和缩放，原图会被直接下载，建议控制在 640px 宽以内。

## 部署

站点以纯静态资源的方式部署在 Cloudflare Workers 上，每个路由都已预渲染，因此**没有**接入 `@astrojs/cloudflare` 适配器。

`wrangler.jsonc` 指定产物目录为 `./dist`，并将 404 交给 `404-page` 处理。Cloudflare 侧只需把构建命令设为 `pnpm build`、产物目录设为 `dist`；本地手动部署则在构建后执行 `npx wrangler deploy`。

## 文档

- [变更记录](docs/CHANGELOG.md)
- [AstroPaper 上游文档](https://astro-paper.pages.dev/posts/how-to-configure-astropaper-theme/)（配置项与字段命名基本通用）

## 许可证

基于 [AstroPaper](https://github.com/satnaing/astro-paper)（MIT，版权归 Sat Naing 所有）二次开发，本仓库同样以 [MIT](LICENSE) 许可发布。
