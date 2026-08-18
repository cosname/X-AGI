# 2026 融合候选预览

`/goal/` 是动态树单屏首页与当前正式站内容内页的融合候选。
首页直接复用 `/next/` 已完成的动态首屏，内页则保留正式站的信息结构，只替换导航、头图和视觉色系。

## 设计原则

- 首页只保留 `/next/` 的标题、动态 DOM 像素双树、概率地形和核心操作。
- 首页不渲染尚未成熟的下屏内容和页脚，并始终收束在一个视口内。
- 首页内部导航和大会日程按钮使用 `/goal/*` 路径，立即报名保留官方外部入口。
- 全站导航延续 2025 站点的成熟交互模型，顶部状态透明并融入视觉场，滚动超过 50px 后获得当前色系的纯色承托层。
- 移动菜单打开时强制显示纯色承托层，保证导航内容在树、连接粒子和正文上都保持清晰可读。
- 内页头部复用连接粒子场，内页正文结构和业务文案不重新排版。
- 首页树、内页粒子场和桌面顶部栏目使用同一套液态玻璃弯月面，透镜只做克制的局部放大与折射，不改变概率地形的持续运动。
- 内页指针反馈不再使用橙色光晕，移动端和减少动态效果环境保留清晰的静态视觉层级。
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
- `src/components/HeaderScrollState.astro` 和 `src/scripts/header-scroll-state.ts` 提供现代首页与旧模板内页共用的导航状态控制器。
- `src/layouts/Goal2026Layout.astro` 提供内页导航、元数据和页脚。
- `src/styles/goal-2026.css` 提供融合内页的视觉皮肤、导航状态和响应式规则。
- `src/components/legacy/` 继续承担正式站与融合预览共用的内容结构。
- `src/components/HeroPixelField.astro` 提供首页双树和概率地形。
- `src/components/MastheadPixelField.astro` 提供内页连接粒子头图。
- `src/scripts/liquid-glass.ts` 提供导航、树与内页头图共用的透镜几何和弹性运动模型。
- `src/data/conference2026.ts` 仍是唯一业务内容源。

## 发布保护

所有 `/goal/` 页面都带有 `noindex, nofollow`。
`robots.txt` 禁止抓取 `/goal/`，生产同步脚本也会排除 `goal/**`。
没有明确上线决定时，不要移除这些保护条件。
