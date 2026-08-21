# 2026 正式视觉与历届影像负一页

“连接与树”方案已经用于 2026 正式站。
`/goal/` 保留为负一页验收预览，用于在不改变公开 `/` 首页的前提下检查首屏之后的历届影像、组织单位和响应式表现。
预览以正式站的一视口首屏开场，随后只呈现历届影像和组织单位两个实质部分，备案信息负责收束长页。

## 路由契约

| 路径 | 内容 | 状态 |
| --- | --- | --- |
| `/` | 正式首屏、专题嘉宾、组织单位和报名内容 | 对外发布 |
| `/goal/` | 正式首屏加 history-first 负一页 | 仅本地验收 |
| `/goal/about/` | Goal 视觉下的会议简介 | 仅本地验收 |
| `/goal/schedule/` | Goal 视觉下的独立日程页面 | 仅本地验收 |
| `/goal/poster/` | Goal 视觉下的 Rising Stars Poster 页面 | 仅本地验收 |
| `/goal/guide/` | Goal 视觉下的参会指南 | 仅本地验收 |
| `/goal/register/` | Goal 视觉下的报名与票价页面 | 仅本地验收 |

公开 `/` 首页不得渲染 `data-goal-home-lower`、历届画廊或 Goal 组织单位页脚。
`/goal/` 根节点通过 `data-goal-home-contract="history-first"` 声明负一页契约。
所有 Goal 页面继续保持 `noindex, nofollow`。

## 负一页顺序

1. 首屏保留大会标题、日期、地点、报名入口和 Goal 日程入口。
2. 首屏之后直接进入“从 R 会到 X-AGI 大会”。
3. 历届影像从第 18 届开始倒序呈现 2015 至 2025 年的 17 场城市会议和 51 张照片。
4. 组织单位按主办单位、协办单位和赞助单位三类紧凑渲染。
5. 主办单位合并两家发起单位与四家官方主办单位，并保持《会议简介》的六单位顺序。
6. Goal 专用备案信息收束长页，不复用公开站点的通用页脚视觉。

负一页不渲染会议概况、快速导航、紧凑日程或重复报名区。
当前日程继续保留在独立的 `/schedule/` 和 `/goal/schedule/` 路由中。
首屏和顶部导航继续提供报名入口。

## 内容与数据

当前画廊覆盖第八届至第十八届的 17 场官方会议纪要活动。
样本涉及北京、广州、上海、合肥和兰州，并记录 2020 年后的线上线下混合阶段。
数据以升序存储，组件渲染时反转为第 18 届、第 17 届、第 16 届直至第 8 届。
同一届包含多个城市活动时，反转后的展示顺序也按活动日期从晚到早排列。

`src/data/goal-history.ts` 维护画廊事件、日期、会场、形态、照片说明、焦点、内部来源和权利状态。
每场活动固定包含三张照片，共 51 张。
每张照片包含人工编写的中文 alt 和可见 caption，二者分别承担图像描述与历史语境说明。
2018 上海场保留纪要中的 2009 与 2018 上海会议对照照片。

原始照片来自用户提供的官方会议纪要 Markdown 导出。
远程 Qpic 图片已经下载到 `src/assets/2026/goal-history/`，并通过魔数、解码、尺寸和 SHA-256 去重检查。
页面不得直接热链 Qpic，也不得显示原始来源链接卡片。
`sourceUrl` 和 `sourceImageIndex` 仅用于内部追溯。

`conference2026.history` 与 `public/2026/history/` 中原有的五张档案图片继续保留。
这些旧档案不在当前画廊中渲染，也不与新 51 张照片混用。

## 历届影像视觉

画廊延续正式首屏的暖米色纸面、靛蓝文字、紫色节点和克制动效。
每场活动使用一张较大的主图和两张支持图，不使用独立卡片背景。
图片优先保持自然比例，不能为了统一外观放大早期 640px 照片。
历史对照、宽幅合影和线上会议截图不得被统一 16:9 裁切破坏。

桌面宽度约同时显示 2.2 场活动。
平板约显示 1.25 至 1.4 场活动。
手机单项约占 86vw，并露出下一项边缘以提示横向内容。
画廊不使用暗色 archive 区块、自动播放、无限循环、lightbox、Polaroid 旋转或胶带装饰。

事件标题上方不再渲染时间线、节点或当前项装饰。
viewport 使用 `scroll-snap-type: inline proximity`，仅在项目接近边缘时提供柔和对齐。
页面不提供上一场、下一场按钮或 live status。

## 波峰历届目录

一场一线的波峰现在是可点击的历届目录。
桌面目录位于“从 R 会到 X-AGI 大会”标题右侧，移动端自然堆叠在标题下方。
竖线数量直接来自反转后的 `events` 数组，因此当前为 17 根，并始终与画廊顺序一致。
目录保持透明、无底色轨道和无连续滑块，让波峰仍然是唯一视觉主体。

画廊滚动位置通过每个事件实际的起始 offset 映射为连续焦点。
波峰使用平滑距离衰减，让当前竖线最高、相邻竖线逐级降低、远端竖线保持短基线。
分数焦点允许峰值位于两根竖线之间，避免逐项跳动。

每根竖线位于一个完整网格单元大小的原生按钮内，视觉 transform 不会缩小点击区域。
点击按钮只调用 viewport 的水平 `scrollTo`，不得使用可能移动页面纵向位置的 `scrollIntoView`。
当前最接近起始对齐位置的会议使用 `aria-current="location"`，悬停波峰不会改变该语义状态。
Toolbar 使用 roving tabindex，ArrowLeft、ArrowRight、Home 和 End 移动按钮焦点，Enter 和 Space 使用原生按钮激活。

细指针在目录上移动时临时控制波峰位置。
指针离开、取消、窗口失焦或页面隐藏后，波峰返回最新的画廊滚动位置。
悬停期间画廊滚动状态仍持续更新，因此返回位置不会过期。
触摸指针不会触发悬停状态，也不会阻止画廊的原生触摸滚动。

`prefers-reduced-motion` 下波峰直接切换到目标位置，目录点击也使用即时水平移动。

## 渐进增强与生命周期

画廊 viewport 是带可访问名称的可聚焦横向 region。
轨道使用有序列表，每场活动使用语义组，每张照片使用 `figure`、响应式 `Image` 和可见 `figcaption`。
目录中的每场会议都是带可访问名称并通过 `aria-controls` 指向 viewport 的原生按钮。

画廊在首屏阶段使用 `content-visibility` 暂缓图片发现，并在标题进入可视区域时通过 `IntersectionObserver` 初始化。
这样可以保证首屏不发起历届照片请求，同时继续为全部图片保留原生 `loading="lazy"`。
`<noscript>` 样式会取消可见性门槛、隐藏目录并恢复原生横向滚动条。

浏览器控制器使用 `AbortController`、`ResizeObserver` 和 `requestAnimationFrame`。
Astro 页面切换、普通卸载、BFCache 返回、窗口失焦和可见性变化都必须正确清理或恢复状态。
JavaScript 成功初始化后才隐藏原生横向滚动条并显示可交互目录。

## 实现结构

- `src/pages/goal/index.astro` 组合正式首屏和 `GoalHomeLower.astro`，并关闭通用页脚。
- `src/components/GoalHomeLower.astro` 只组合历届影像与组织单位，并声明 history-first 契约。
- `src/components/goal/GoalHistoryGallery.astro` 负责 17 场活动的语义结构、响应式图片和标题波峰目录。
- `src/components/GoalPartnerFooter.astro` 负责三类组织单位和 Goal 专用备案信息。
- `src/data/goal-history.ts` 负责历届影像元数据和内部 provenance。
- `src/scripts/goal-history-gallery.ts` 负责双向目录交互、延迟初始化和生命周期。
- `src/scripts/goal-history-gallery-state.ts` 提供可测试的位置映射、Toolbar 焦点、波形和阻尼纯函数。
- `src/styles/goal-home-lower.css` 负责长页外壳和共享纸面。
- `src/styles/goal-history.css` 负责影像编排、proximity 吸附和响应式波峰目录。
- `src/styles/goal-partner-footer.css` 保持已经批准的组织单位布局。

## 本地验收

```bash
npm run dev
```

打开 http://localhost:4321/goal/ 检查完整负一页。
至少同时回归 http://localhost:4321/、http://localhost:4321/about/、http://localhost:4321/schedule/、http://localhost:4321/register/ 和 http://localhost:4321/goal/schedule/。

完成页面修改后运行：

```bash
npm run test:unit
npm run check
npm run build
npm run validate
```

重点检查 17 场活动与 51 张照片是否完整，且前三场为第 18 届、第 17 届和第 16 届。
检查桌面与手机密度、图片 caption、alt、自然比例、200% 缩放、reduced motion、BFCache、控制台错误和页面级水平溢出。
用鼠标在波峰目录上连续移动，并点击首项、中间项和末项验证双向导航。
用键盘 Tab 进入 Toolbar，通过方向键、Home 和 End 移动焦点，再用 Enter 或 Space 激活按钮。
确认波峰平滑跟随、离开后回到当前滚动位置，并且目录点击和画廊操作都不会改变页面纵向位置。
组织单位应继续保持桌面主办单位 3+3、手机两列和最窄单列。

## 发布保护

所有 `/goal/` 页面都带有 `noindex, nofollow`。
`robots.txt` 禁止抓取 `/goal/`，sitemap 不包含 Goal 路径，生产同步脚本排除 `goal/**` 和 `goal/*`。
Astro 生成的历届影像位于共享 `dist/_assets/`，因此生产同步还必须排除 `_assets/goal-history-*`。
构建校验会拒绝移除这项共享资源保护。

全部照片当前标记为 `official-recap-review-before-publication`。
在确认照片使用权并获得明确公开上线决定之前，不得提交、推送、同步或发布这些影像。
正式根路径继续由 `scripts/sync-oss.mjs` 同步到生产环境，但不得引用 Goal 历届影像。
只有在独立发布步骤中完成权利确认和页面提升后，才可以调整生产排除策略。
