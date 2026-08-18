# 2026 融合候选预览

`/goal/` 是当前正式站布局与 2026 树、连接视觉系统的融合候选。
它保留正式站首页的信息层级、单屏结构、单位顺序以及全部内页内容组件，只替换导航、首页背景、内页头图和视觉色系。

## 设计原则

- 首页沿用正式站的标题、时间地点、操作按钮和底部单位区，不加入 `/next/` 的长页面内容。
- 首页背景复用确定性的 DOM 像素双树和概率地形。
- 内页头部复用连接粒子场，内页正文结构和业务文案不重新排版。
- 首页单位顺序固定为主办单位、协办单位、赞助单位。
- 移动端单位区保持紧凑，并停靠在首页底部。

## 本地预览

```bash
npm run dev
```

打开 http://localhost:4321/goal/。

可用页面：

- `/goal/about/`
- `/goal/schedule/`
- `/goal/poster/`
- `/goal/guide/`
- `/goal/register/`

## 实现结构

- `src/pages/goal/` 提供全部预览路由。
- `src/layouts/Goal2026Layout.astro` 提供独立导航、元数据和页脚。
- `src/styles/goal-2026.css` 提供融合视觉皮肤和响应式规则。
- `src/components/legacy/` 继续承担正式站与融合预览共用的内容结构。
- `src/components/HeroPixelField.astro` 提供首页双树和概率地形。
- `src/components/MastheadPixelField.astro` 提供内页连接粒子头图。
- `src/data/conference2026.ts` 仍是唯一业务内容源。

## 发布保护

所有 `/goal/` 页面都带有 `noindex, nofollow`。
`robots.txt` 禁止抓取 `/goal/`，生产同步脚本也会排除 `goal/**`。
没有明确上线决定时，不要移除这些保护条件。
