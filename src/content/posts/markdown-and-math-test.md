---
pubDatetime: 2026-09-16T13:40:00Z
title: Markdown 语法与数学公式测试
cover: "/covers/markdown-and-math-test.svg"
slug: markdown-and-math-test
featured: false
draft: false
tags:
  - test
  - markdown
  - katex
description: 覆盖本站支持的 Markdown 语法与 KaTeX 数学公式，用来检查排版、代码高亮、提示块和公式渲染是否正常。
---

这是一篇「体检报告」式的文章：把本站支持的 Markdown 语法和数学公式全部过一遍，方便在改动主题样式之后快速检查有没有渲染异常。

## Table of contents

## 文本格式

**粗体**、_斜体_、~~删除线~~、`行内代码`，以及几种混用：**_粗斜体_**、**带 `代码` 的粗体**。

链接：[Astro 官网](https://astrojs.org/ "Astro 官网")、[站内文章](/posts/) 。自动链接：https://astro.build 。

转义字符：\*这不是斜体\*、\`这不是代码\`。

## 标题层级

正文里会用到 h2 到 h4 三级标题。再往下不推荐使用，因为 h5、h6 的字号已经小于正文，反而更难读。

### 三级标题

#### 四级标题

##### 五级标题（不推荐）

###### 六级标题（不推荐）

## 列表

无序列表：

- 第一项
- 第二项，带一段补充说明。列表项里可以放多个段落，间距会自动处理。

  这是第二段。
- 第三项

有序列表：

1. 第一步
2. 第二步
3. 第三步

嵌套列表：

- 外层
  - 内层
    - 更深一层
- 回到外层

任务列表：

- [x] 已经做完的事
- [ ] 还没做的事
- [x] 又一件做完的事

## 引用与提示块

普通引用：

> 这是一段引用。
> 引用里也可以换行继续写。

引用里可以嵌套其他元素：

> **引用里的粗体**
>
> - 引用里的列表
> - 第二项
>
> ```
> 引用里的代码块
> ```

提示块（GitHub 风格，由 rehype-callouts 渲染）：

> [!NOTE]
> 普通提示，用来补充说明。

> [!TIP]
> 小技巧。

> [!IMPORTANT]
> 重要信息。

> [!WARNING]
> 需要注意的风险。

> [!CAUTION]
> 可能造成损失的操作。

## 表格

| 语言       | 类型系统 | 首次发布 |
| ---------- | -------- | -------- |
| TypeScript | 静态     | 2012     |
| JavaScript | 动态     | 1995     |
| Rust       | 静态     | 2010     |

对齐方式：

| 左对齐     | 居中       | 右对齐     |
| :--------- | :--------: | ---------: |
| left       | center     | right      |
| 短         | 中等长度   | 1234       |

## 代码

行内代码：`const x = 1`。

带语法高亮的代码块（右上角有复制按钮）：

```ts
type Post = {
  title: string;
  pubDatetime: Date;
  tags: string[];
};

export function sortedByDate(posts: Post[]): Post[] {
  return [...posts].sort(
    (a, b) => b.pubDatetime.getTime() - a.pubDatetime.getTime()
  );
}
```

没有语言标记的代码块：

```
$ pnpm build
$ pnpm preview
```

较长的行会横向滚动，不会撑破文章栏：

```js
const config = { perPage: 6, perIndex: 4, scheduledPostMargin: 15 * 60 * 1000, search: "pagefind", showArchives: true, showBackButton: true, lightAndDarkMode: true };
```

## 图片

![一个空的占位图](https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=1000&q=80 "图片描述")

正文里的图片可以点击放大，按 Esc 或点击遮罩关闭。

## 分隔线

上面是内容，下面是分隔线。

---

分隔线下面还有内容。

## 数学公式

### 行内公式

质能方程 $E = mc^2$ 是最著名的物理公式之一。欧拉公式 $e^{i\theta} = \cos\theta + i\sin\theta$ 将指数与三角函数联系在一起。

希腊字母也很方便：$\alpha$、$\beta$、$\gamma$、$\Delta$、$\pi$、$\Omega$。

### 块级公式

著名的欧拉恒等式：

$$
e^{i\pi} + 1 = 0
$$

高斯积分：

$$
\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}
$$

### 求和与极限

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}, \qquad \lim_{n \to \infty} \left(1 + \frac{1}{n}\right)^n = e
$$

行内求和：$\sum_{k=0}^{n} \binom{n}{k} = 2^n$。

### 矩阵

$$
A = \begin{pmatrix} a_{11} & a_{12} & a_{13} \\ a_{21} & a_{22} & a_{23} \\ a_{31} & a_{32} & a_{33} \end{pmatrix}
$$

### 多行推导

$$
\begin{aligned}
(a+b)^2 &= a^2 + 2ab + b^2 \\
(a-b)^2 &= a^2 - 2ab + b^2 \\
(a+b)(a-b) &= a^2 - b^2
\end{aligned}
$$

### 分式与根式

行内分式 $\frac{n(n+1)}{2}$，复杂分式：

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

### 统计学中的贝叶斯定理

$$
P(H \mid D) = \frac{P(D \mid H) \, P(H)}{P(D)}
$$

### 长公式横向滚动

下面这条超长公式在窄屏（移动端）会自动出现横向滚动条，不会撑破文章栏：

$$
f(x) = a_0 + a_1 x + a_2 x^2 + a_3 x^3 + a_4 x^4 + a_5 x^5 + a_6 x^6 + a_7 x^7 + a_8 x^8 + a_9 x^9 + a_{10} x^{10} + a_{11} x^{11} + a_{12} x^{12}
$$
