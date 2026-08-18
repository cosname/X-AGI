# 2026 融合候选预览

`/goal/` 是 badge 构图单屏首页与当前正式站内容内页的融合候选。
首页以既有大会 badge 为视觉母版重新组织标题、连接树与纸面色块，内页则保留正式站的信息结构，只替换导航、头图和视觉色系。

## 设计原则

- 首页采用左侧编辑式标题与右侧单棵动态 DOM 像素连接树，不再使用双树包围和概率地形。
- 首页背景使用适配桌面与移动端的真实纸面纹理资源，以靛蓝、桃橙和青绿色块复现 badge 的非对称视觉重心。
- 首页不渲染尚未成熟的下屏内容和页脚，并始终收束在一个视口内。
- 首页内部导航和大会日程按钮使用 `/goal/*` 路径，立即报名保留官方外部入口。
- 全站导航延续 2025 站点的成熟交互模型，顶部状态透明并融入视觉场，滚动超过 50px 后获得当前色系的纯色承托层。
- 移动菜单打开时强制显示纯色承托层，保证导航内容在树、连接粒子和正文上都保持清晰可读。
- 内页头部复用连接粒子场，内页正文结构和业务文案不重新排版。
- 桌面顶部栏目使用与“立即报名”一致的浅色 3D 胶囊反馈，通过轻微放大表达悬停，不在页面上叠加鼠标跟随透镜。
- 首页树采用宽范围感应，鼠标进入树周围的大区域时马赛克鳞片即可波动。
- 内页指针反馈只保留粒子自身的局部波动，不使用橙色光晕或液态玻璃，移动端和减少动态效果环境保留清晰的静态视觉层级。
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
- `src/components/HeroPixelField.astro` 同时提供 `/goal/` 的 badge 单树构图和 `/next/` 的双树概率地形构图。
- `src/components/MastheadPixelField.astro` 提供内页连接粒子头图。
- `src/scripts/hero-pixel-field.ts` 管理两种树木感应模式，并只在 `/next/` 构图中计算概率地形。
- `public/2026/brand/goal-hero-paper-field.webp`、`public/2026/brand/goal-hero-paper-field-tall.webp` 和 `public/2026/brand/goal-hero-paper-field-mobile.webp` 提供宽屏、高桌面和移动端纸面色块背景。
- `src/data/conference2026.ts` 仍是唯一业务内容源。

## 发布保护

所有 `/goal/` 页面都带有 `noindex, nofollow`。
`robots.txt` 禁止抓取 `/goal/`，生产同步脚本也会排除 `goal/**`。
没有明确上线决定时，不要移除这些保护条件。
