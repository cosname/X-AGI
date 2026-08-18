# 2026 融合候选预览

`/goal/` 是动态树单屏首页与当前正式站内容内页的融合候选。
首页直接复用 `/next/` 已完成的动态首屏，内页则保留正式站的信息结构，只替换导航、头图和视觉色系。

## 设计原则

- 首页只保留 `/next/` 的标题、动态 DOM 像素双树、概率地形和核心操作。
- 首页不渲染尚未成熟的下屏内容和页脚，并始终收束在一个视口内。
- 首页内部导航和大会日程按钮使用 `/goal/*` 路径，立即报名保留官方外部入口。
- 内页头部复用连接粒子场，内页正文结构和业务文案不重新排版。
- 组织单位等完整信息继续保留在会议简介内页。
- 移动端将动态首屏延伸到视口底部，不再露出下一屏内容。

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
- `src/components/EditionShell.astro` 和 `src/components/ConferenceHome.astro` 提供无页脚的动态单屏首页。
- `src/layouts/Goal2026Layout.astro` 提供内页导航、元数据和页脚。
- `src/styles/goal-2026.css` 仅提供融合内页的视觉皮肤和响应式规则。
- `src/components/legacy/` 继续承担正式站与融合预览共用的内容结构。
- `src/components/HeroPixelField.astro` 提供首页双树和概率地形。
- `src/components/MastheadPixelField.astro` 提供内页连接粒子头图。
- `src/data/conference2026.ts` 仍是唯一业务内容源。

## 发布保护

所有 `/goal/` 页面都带有 `noindex, nofollow`。
`robots.txt` 禁止抓取 `/goal/`，生产同步脚本也会排除 `goal/**`。
没有明确上线决定时，不要移除这些保护条件。
