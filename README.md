# Alice

Alice 是一个极简的 SEO 友好的 Astro 博客主题

## 文档

文档提供两种格式阅读：_Markdown_ 和 _博客文章_。

- 配置 - [Markdown](src/content/posts/how-to-configure-astropaper-theme.mdx) | [博客文章](https://astro-paper.pages.dev/posts/how-to-configure-astropaper-theme/)
- 添加文章 - [Markdown](src/content/posts/adding-new-post.mdx) | [博客文章](https://astro-paper.pages.dev/posts/adding-new-posts-in-astropaper-theme/)
- 自定义配色方案 - [Markdown](src/content/posts/customizing-astropaper-theme-color-schemes.mdx) | [博客文章](https://astro-paper.pages.dev/posts/customizing-astropaper-theme-color-schemes/)
- 预定义配色方案 - [Markdown](src/content/posts/_color-schemes/predefined-color-schemes.mdx) | [博客文章](https://astro-paper.pages.dev/posts/predefined-color-schemes/)

## 部署与运维

部署、构建和运维文档（已移除 Docker）位于 [`docs/`](docs/README.md) 文件夹：

- [本地开发与构建](docs/local-development.md)
- [部署](docs/deployment.md)

## 本地运行
运行以下命令启动项目：

```bash
# 安装相关依赖
pnpm install

# 如果上一步尚未安装依赖，请先安装
pnpm install

# 启动项目
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
| `pnpm astro ...` | 运行 CLI 命令，如 `astro add`、`astro check` |
