# 2026 正式视觉与完整验收预览

“连接与树”方案已经用于 2026 正式站。
`/goal/` 保留为完整长页验收预览，用于在不改变公开 `/` 首页的前提下检查候选首页叙事、交互和响应式表现。
预览以正式站的一视口首屏开场，并在首屏后继续呈现大会历史、档案图集、紧凑日程、参与路径、组织单位和备案信息。

## 路由契约

| 路径 | 内容 | 状态 |
| --- | --- | --- |
| `/` | 正式首屏、专题嘉宾、组织单位和报名内容 | 对外发布 |
| `/goal/` | 正式首屏加完整候选长页 | 仅本地验收 |
| `/goal/about/` | Goal 视觉下的会议简介 | 仅本地验收 |
| `/goal/schedule/` | 2025 风格的可填充日程模板与 TBD 报告位 | 仅本地验收 |
| `/goal/poster/` | Goal 视觉下的 Rising Stars Poster 页面 | 仅本地验收 |
| `/goal/guide/` | Goal 视觉下的参会指南 | 仅本地验收 |
| `/goal/register/` | Goal 视觉下的报名与票价页面 | 仅本地验收 |

公开 `/` 首页不得渲染 `data-goal-home-lower`、历史图集、紧凑日程或 Goal 组织单位页脚。
`/goal/` 根节点通过 `data-goal-home-contract="full-preview"` 明确声明长页契约，构建校验不依赖偶然的视觉类名判断预览状态。

## 长页叙事顺序

1. 一视口像素树首屏保留大会标题、日期、地点、报名入口和 Goal 日程入口。
2. 三步旅程导航分别跳转到大会历史、紧凑日程和参与方式。
3. 历史区呈现大会传承数据与五张带来源链接的档案照片。
4. 紧凑日程按日期和场次类型筛选当前已确认的日程框架。
5. 参与区分别提供 Rising Stars Poster 路径、普通报名入口和参会指南入口。
6. 组织单位区按发起单位、主办单位、协办单位和赞助单位四类渲染。
7. Goal 专用备案页脚收束长页，不复用公开站点的通用页脚视觉。

## 设计原则

- 首屏采用左侧编辑式标题、右侧单棵 DOM 像素连接树与底部概率地形。
- 背景使用可平铺纸面纹理，以靛蓝、蓝紫与少量青色复现 badge 的非对称视觉重心。
- 树的整体结构保持稳定，像素色片以确定性的自下而上波次表达生长。
- 指针接近树时，当前波次完成后暂停整棵树的生长脉冲，离开后继续。
- 指针接近标题时只增强标题表面的连续光泽，不移动标题几何位置。
- 竖屏移动端隐藏树，并用 DOM 连接网络填补标题周围的负空间。
- 全站导航顶部透明，滚动超过 50px 后获得当前色系的纯色承托层。
- 移动菜单打开时强制显示纯色承托层，保证导航内容在动态首屏和正文上都清晰可读。
- 桌面导航和首屏操作使用共享胶囊反馈，键盘聚焦与精细指针使用同一几何状态。
- 内页头部复用连接粒子场，正文继续沿用成熟内容结构和唯一业务数据源。
- 长页下半部延续纸面、档案黑场和紫色功能标记，不引入与首屏无关的新视觉语言。

## 交互与无障碍契约

- 历史图集的上一张和下一张操作只滚动图集视口，不得改变文档的垂直滚动位置。
- 图集首尾导航稳定循环，手动横向滚动后状态文字同步到最近的幻灯片。
- 只有当前幻灯片的来源链接进入顺序键盘导航，每个来源链接都有唯一的可访问名称。
- 五张档案图片全部延迟加载，并保留明确宽高以避免布局跳动。
- 日程日期筛选与场次类型筛选使用 AND 组合，按钮通过 `aria-pressed` 暴露状态。
- 日程结果数量和空状态通过礼貌的 live region 对辅助技术播报。
- 所有焦点轮廓在纸面和深色区域上保持足够对比。
- `prefers-reduced-motion` 会停用非必要的树脉冲、滚动动画和装饰性过渡。
- Astro 页面切换、BFCache 返回和 `pagehide` 都必须清理或恢复页面级监听器。

## 数据与日程语义

`src/data/conference2026.ts` 是 2026 文案、历史记录、日程、专题嘉宾、票价和组织单位的唯一数据源。
每个日程场次都使用 `arrival`、`keynote`、`parallel` 或 `poster` 显式分类，界面不得通过标题文字推断类别。
尚未确认日期的专题和嘉宾保留在专题嘉宾列表中，具体日期以最终日程为准。
详细日程保留空报告对象和 `Time TBD`、`Talk title TBD`、`Speaker TBD` 占位行，便于后续持续填充 speaker 与报告信息。
AI Infra 在没有确认嘉宾前保持空嘉宾列表。
Rising Stars Poster 的赠票文案必须保留完整品牌名称。

## 实现结构

- `src/pages/goal/index.astro` 组合正式首屏和 `GoalHomeLower.astro`，并关闭通用页脚。
- `src/components/GoalHomeLower.astro` 只负责长页分区编排和完整预览契约标记。
- `src/components/goal/GoalHistorySection.astro` 和 `GoalHistoryGallery.astro` 负责历史数据与档案轮播。
- `src/components/goal/GoalCompactSchedule.astro` 负责类型化筛选和紧凑日程展示。
- `src/components/goal/GoalParticipationRoutes.astro` 负责 Poster 与普通报名两条参与路径。
- `src/components/GoalPartnerFooter.astro` 负责四类组织单位和 Goal 专用备案页脚。
- `src/components/ConferenceOrganizationMark.astro` 统一公开站与 Goal 预览的 Logo、链接、回退文本和卡片语义。
- `src/components/legacy/LegacySchedule.astro` 同时承载公开日程和 Goal 日程，保留日期切换、场次卡片与可填充报告位。
- `src/components/ConferenceProgramPreview.astro` 负责公开首页的专题嘉宾预览。
- `src/scripts/goal-home-lower-state.ts` 提供图集与筛选的纯状态函数。
- `src/scripts/goal-home-lower.ts` 负责浏览器交互、播报、生命周期和清理。
- `src/styles/goal-home-lower.css`、`goal-history.css`、`goal-compact-schedule.css`、`goal-participation.css` 和 `goal-partner-footer.css` 共同构成长页视觉。
- `src/components/HeroPixelField.astro` 和 `src/scripts/hero-pixel-field.ts` 继续提供 Goal 单树首屏与 `/next/` 双树构图。

## 本地验收

```bash
npm run dev
```

打开 http://localhost:4321/goal/ 检查完整长页。
至少同时回归 http://localhost:4321/ 和 http://localhost:4321/goal/schedule/，确认公开首页隔离和日程渲染隔离。

完成页面修改后运行：

```bash
npm run test:unit
npm run check
npm run build
npm run validate
```

`scripts/validate-build.mjs` 会检查完整长页标记顺序、组织单位角色、备案信息、Goal 子页 noindex、公开首页隔离、两种日程结构、资源引用和独立体积预算。

## 发布保护

所有 `/goal/` 页面都带有 `noindex, nofollow`。
`robots.txt` 禁止抓取 `/goal/`，sitemap 不包含 Goal 路径，生产同步脚本也排除 `goal/**` 和 `goal/*`。
正式根路径不带这些保护条件，并继续由 `scripts/sync-oss.mjs` 同步到生产环境。
在没有明确上线决定前，不得把 `/goal/` 提升为公开 `/`，也不得改变生产同步排除策略。
历史图集保留公开来源链接，但图片正式发布前仍需单独完成使用权核验。
