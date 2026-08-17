# 2026 新视觉预览

这是正式站切回 2025 模板前完成的米色纸面和像素树设计。
当前对外网站继续使用 `legacy-2025` 皮肤，这套方案停放在 `/next/`。

## 本地预览

```bash
npm run dev
```

打开 http://localhost:4321/next/。

可用页面：

- `/next/about/`
- `/next/schedule/`
- `/next/poster/`
- `/next/guide/`
- `/next/register/`

生产同步会排除 `next/**`，`robots.txt` 也会禁止抓取 `/next/`。
没有明确上线决定时，不要改变这两个保护条件。

## 实现结构

- `src/pages/next/` 提供预览路由。
- `src/components/` 中不带 `legacy/` 前缀的会议组件构成这套页面。
- `src/layouts/BaseLayout.astro` 和 `src/components/EditionShell.astro` 提供页面外壳。
- `src/styles/global.css` 包含视觉系统和响应式样式。
- `src/data/conference2026.ts` 仍是唯一业务内容源。

首页树形图不是运行时图片或 Canvas。
`src/components/HeroPixelField.astro` 会把 `src/data/hero-pixel-field.generated.json` 编译成确定性的 HTML 像素块。

只有参考图发生变化时才重新生成坐标：

```bash
node scripts/generate-hero-pixel-field.mjs /absolute/path/to/reference.png src/data/hero-pixel-field.generated.json --preview /tmp/xagi-hero-preview.png
```

构建校验会限制像素节点数量和压缩后 HTML 大小，并确认首页包含 9 层地形和 11 层回声。
它也会拒绝像素树区域中的运行时栅格图、SVG、Canvas 和 CSS 图片依赖。

## 切换为正式视觉

只有在组织方确认后才执行切换。

1. 将 `src/pages/index.astro` 和 `src/pages/[page].astro` 改为使用 `EditionShell` 及这套组件。
2. 将 `src/config/site.ts` 中 2026 届的 `skin` 设为 `next`。
3. 完整运行 `npm test`，并检查所有正式页面的桌面和移动布局。
4. 明确调整生产同步规则后再发布。
