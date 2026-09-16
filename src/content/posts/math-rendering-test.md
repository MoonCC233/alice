---
pubDatetime: 2026-09-16T13:40:00Z
title: 数学公式渲染测试
slug: math-rendering-test
featured: false
draft: false
tags:
  - test
description: KaTeX 数学公式渲染效果测试，包含行内公式、块级公式与常见数学结构。
---

本站已支持 KaTeX 数学公式渲染。行内公式使用单个美元符号 `$...$`，块级公式使用双美元符号 `$$...$$`。本文展示各类常见数学结构的渲染效果。

## 行内公式

质能方程 $E = mc^2$ 是最著名的物理公式之一。欧拉公式 $e^{i\theta} = \cos\theta + i\sin\theta$ 将指数与三角函数联系在一起。

希腊字母也很方便：$\alpha$、$\beta$、$\gamma$、$\Delta$、$\pi$、$\Omega$。

## 块级公式

著名的欧拉恒等式：

$$
e^{i\pi} + 1 = 0
$$

高斯积分：

$$
\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}
$$

## 求和与极限

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}, \qquad \lim_{n \to \infty} \left(1 + \frac{1}{n}\right)^n = e
$$

行内求和：$\sum_{k=0}^{n} \binom{n}{k} = 2^n$。

## 矩阵

$$
A = \begin{pmatrix} a_{11} & a_{12} & a_{13} \\ a_{21} & a_{22} & a_{23} \\ a_{31} & a_{32} & a_{33} \end{pmatrix}
$$

## 多行推导

$$
\begin{aligned}
(a+b)^2 &= a^2 + 2ab + b^2 \\
(a-b)^2 &= a^2 - 2ab + b^2 \\
(a+b)(a-b) &= a^2 - b^2
\end{aligned}
$$

## 分式与根式

行内分式 $\frac{n(n+1)}{2}$，复杂分式：

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

## 统计学中的贝叶斯定理

$$
P(H \mid D) = \frac{P(D \mid H) \, P(H)}{P(D)}
$$

## 长公式横向滚动

下面这条超长公式在窄屏（移动端）会自动出现横向滚动条，不会撑破文章栏：

$$
f(x) = a_0 + a_1 x + a_2 x^2 + a_3 x^3 + a_4 x^4 + a_5 x^5 + a_6 x^6 + a_7 x^7 + a_8 x^8 + a_9 x^9 + a_{10} x^{10} + a_{11} x^{11} + a_{12} x^{12}
$$
