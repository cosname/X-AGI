# 2026 专题宣传海报

交接日期：2026-09-16。
本次为官方日程的 14 个 session 各制作一张宣传海报，并在首页 lower page 提供入口。
首页以独立的“演讲嘉宾 / SPEAKERS”板块承载这 14 个专题，图片下方直接列出对应嘉宾姓名。
随后为独立的“Poster 论文 / RISING STARS”板块，再衔接既有历届影像与组织信息。
本文记录实现、来源与本地验收，实际发布状态以提交合并、CI 和生产校验凭据为准。

## 数据与排版

`src/data/session-posters.ts` 组合官方日程和已公开的人物资料，不维护第二份独立嘉宾名单。
专题顺序、半天时段、主席、讲者、单位和已确认报告题目来自 `src/data/conference2026-program.generated.ts`。
该文件由腾讯文档 [X-AGI 2026 嘉宾信息](https://docs.qq.com/sheet/DUnZzaE5Ia2pVRHRj?tab=BB08J2) 的 `BB08J2` 标签页、`工作表1` 同步生成。
人物公开资料来自 `src/data/conference2026-people.generated.ts`，通过 `src/data/conference2026-people.ts` 按姓名及明确别名关联本地头像和日程角色。
报告题目优先采用日程的已确认题目，缺失时使用对应人物的公开提交题目。
参会原表和私密字段不进入海报、源码或公开 provenance。
上述生成数据必须通过对应同步脚本更新，不得手工改写。

每个 session 的底图使用内置 `image_gen` 单独生成，原始字节独立归档。
底图只有象牙纸、靛紫和淡紫的抽象主题线刻，不包含文字、Logo 或人物。
标题、时间、姓名、学校或单位以及真实头像通过 `scripts/lib/session-poster-template.mjs` 的 HTML 模板确定性排版。
文字和头像不会交给图像模型重画。
缺失题目与头像保留明确占位，不猜测题目、不合成人脸，也不从集体照识别人像。

截至本次数据快照，孙茂松、姚金哥、张辉帅、张华清、丁鹏、陆一平、刘子寅和张耀宇尚无可用报告题目。
姚金哥的单位也尚缺，部分主席与讲者尚无本地头像。
专题 07 的“扩散模型的理论基础以及推理测算法”按源议程原文保留，其中“推理测算法”的表述需要内容负责人确认。
补齐官方数据后重新生成海报，不直接修改导出的图片或生成清单。

## 素材与追溯

| 产物 | 位置或职责 | 尺寸 |
| --- | --- | --- |
| 14 张原始 AI 底图 | `assets/source-archive/2026/session-posters/session-NN-background.png`，保留原始字节 | 1086×1448 |
| 排版后的打印母版 | 源素材归档中的合成母版，不作为网页预览加载 | 1080×1440 |
| 完整 WebP | 网站展示与下载导出 | 1080×1440 |
| 预览 WebP | 首页列表加载 | 540×720 |

底图的实际输出保持精确 3:4 比例，原件不为适配运行时尺寸而覆盖或重采样。
[`session-poster-backgrounds-2026.json`](./session-poster-backgrounds-2026.json) 保存全部 14 条完整 prompt、`native image_gen` 来源、归档相对路径、尺寸、字节数和 SHA256。
公开 provenance 不包含本机绝对路径、个人目录或工具临时输出路径。
`src/data/session-posters.generated.json` 是导出清单，记录内容、模板、嵌入的英文字体、头像、底图、完整图、预览图和 PNG 母版的哈希。
当前验证的导出环境为 macOS Chrome、系统 PingFang SC 和仓库内的 IBM Plex Sans Condensed，环境说明保存在清单中。
内容或任一渲染输入变化后，应重新生成并校验该清单，避免继续使用过期图片。

## 操作

先通过现有同步入口更新经确认的来源，再重新导出海报。
导出使用本机的 `chrome-devtools-axi`，每次启用独立浏览器会话，并在结束时关闭该会话和临时 HTTP 服务。

```bash
npm run schedule:sync -- --csv /absolute/path/to/X-AGI-2026-program.csv
npm run people:sync -- --workbook /absolute/path/to/attendee-list.xls
npm run posters:render
npm run posters:verify
npm test
```

`npm run posters:render` 调用 `scripts/render-session-posters.mjs`。
该命令还运行 `scripts/register-session-poster-archive.mjs`，更新源素材登记与校验清单。
`npm run posters:verify` 调用 `scripts/verify-session-posters.mjs`。
仅在来源确有更新时运行相应同步命令，不为重新排版重复导入旧表。
发布前检查首页预览、完整图和下载结果，以及实际文字、头像、占位和手机布局。
首页支持按日期筛选、横向浏览和键盘操作，放大框提供下载、日程入口及“放大阅读”。
页面展示沿用网站的玻璃材质变量、深蓝墨色与紫色强调色，采用玻璃胶囊日期切换、圆角海报外框和玻璃放大弹窗。
原始海报仍完整展示，网页材质调整不改动导出图片。
“放大阅读”按原始 1080 像素宽度显示图片，允许在手机屏幕内横向和纵向滚动。
生产发布沿用 README 的 OSS 流程，并记录实际提交、远端状态与线上校验结果。

## 本地验证记录

2026-09-16 已通过现有 92 项单元测试、Astro 类型检查、源素材校验、海报一致性校验和静态构建校验。
14 张导出图均为 1080×1440，排版检查未发现卡片文字越界或标题覆盖主持人区域。
逐项内容核对覆盖 16 次主持人和 51 次讲者安排、43 个已提供的报告题目、8 个题目占位和 36 个实际头像。
桌面 1440×1000 与手机 390×844 的本地浏览器检查覆盖日期筛选、14 张图片打开及下载链接、原图尺寸缩放、Escape 关闭和焦点恢复。
按日期筛选分别显示 7 个专题，海报文件均返回成功响应，放大框在两种屏幕下均未越出视口。
浏览器原生键盘 Enter 和 End 已验证筛选及横向浏览；直接指针自动化因工具反复报告过期引用而改用 DOM 点击检查，尚未覆盖真实手机的手势体验。
数启寰宇的新简介已在本地构建的会议简介页面核对。
相关截图、浏览器检查记录和 14 张 PNG 的打包文件保存在忽略的 `output/session-posters-20260916/`。
上述记录不代表生产发布。

## 同批文案更新

`src/data/conference2026.ts` 中数启寰宇（QuantVerse）的简介已替换为用户提供的 2026-09-15 文案。
简介保留上海数启寰宇人工智能科技有限公司全称、2025 年落地徐汇西岸、11 项软件著作权、年度研发投入超亿元和 AI+金融定位等原文信息。
这些信息属于用户提供的公司简介，不表示本次另行核验了公司经营或投入数据。
