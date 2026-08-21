# X-AGI Conference Website

X-AGI 大会官网及年度归档的 Astro 静态站。

- 正式网站：https://www.x-agi.cc
- 代码仓库：https://github.com/cosname/X-AGI
- 生产托管：阿里云 OSS `x-agi` 桶，地域 `cn-beijing`
- 运行环境：Node.js 24、Astro 7、npm

## 站点版本

同一次构建会生成正式站、历史归档和两套本地设计预览。

| 路径 | 用途 | 发布状态 |
| --- | --- | --- |
| `/`、`/about/`、`/schedule/` 等 | 2026 正式站，使用“连接与树”视觉和 2026 官方内容 | 对外发布 |
| `/2025/` | 2025 X-AGI 与第 18 届中国 R 会议归档 | 冻结发布 |
| `/next/` | 米色纸面和像素树的新视觉方案 | 仅本地预览 |
| `/goal/` | 正式视觉的完整长页验收预览，包含首屏、历史、图集、紧凑日程、参与入口、合作单位与备案页脚 | 仅本地预览 |
| `/2026/`、`/2026/<page>/` | 旧书签兼容入口 | 跳转至根路径正式页 |

`/next/` 和 `/goal/` 会写入本地 `dist/`，但生产同步脚本会明确排除它们。
`robots.txt` 也会禁止抓取这两个预览路径。

根目录下的 `about.html`、`schedule.html` 等旧式 URL 会跳转到对应的 2025 归档页。
这些文件用于兼容 2025 网站上线时产生的旧链接，不是 2026 正式路由。

## 正式路由

| 路径 | 页面 |
| --- | --- |
| `/` | 首页 |
| `/about/` | 会议简介 |
| `/schedule/` | 日程安排 |
| `/poster/` | Rising Stars Poster |
| `/guide/` | 参会指南 |
| `/register/` | 报名、票价和百格活动表单 |
| `/speakers/` | 跳转至 `/schedule/` |

兼容跳转集中配置在 `astro.config.mjs`。

## 内容与代码结构

```text
src/
  config/
    site.ts                    届次、路径、状态和正式视觉皮肤
    navigation.ts              导航和页面集合
    edition-status.ts          页面标题、状态和下一步操作
  data/
    conference2026.ts          2026 官方内容的唯一数据源
    legacy-partner-assets.ts   正式站合作单位 Logo 对照
  layouts/
    Legacy2025Layout.astro     旧模板回退布局
    Goal2026Layout.astro       当前正式站内页布局
    BaseLayout.astro           新视觉预览布局
  components/legacy/           正式站沿用的成熟内容结构
  components/goal/             `/goal/` 长页和日程预览的分区组件
  components/                  正式视觉、导航、首页和共享组织单位组件
  pages/                       Astro 路由和文本端点
  styles/
    legacy-2025.css            成熟内容结构的兼容样式
    goal-2026.css              正式内页的连接视觉皮肤
    goal-home-lower.css        `/goal/` 长页外壳与共享区块样式
    global.css                 正式首页与共享组件样式
public/
  2025/                        冻结的 2025 静态归档
  2026/brand/                  2026 X-AGI 品牌资源
  2026/logos/                  2026 合作单位 Logo
scripts/
  validate-build.mjs           构建产物硬校验
  configure-oss.mjs            本机 ossutil 配置
  sync-oss.mjs                 生产同步
```

2026 文案、票价、组织单位、专题嘉宾、日程和报名状态只在 `src/data/conference2026.ts` 中维护。
页面组件负责表现，不应复制一份独立业务数据。

日程数据只保留已经确认的日期、场次和报告字段，尚未公布的报告不以空对象或虚构占位文案呈现。
不要自行补写讲者、报告、赞助商或数字。

2026 品牌标志不包含 2025 年标志中的 `R`。
正式赞助商名称是“智统数合”。
构建校验会拒绝旧标志和错误名称。

## 本地开发

项目要求 Node.js 24，版本记录在 `.nvmrc`。

```bash
eval "$(fnm env)"
fnm use 24
npm ci
npm run dev
```

本地开发服务器默认位于 http://localhost:4321。

常用命令：

```bash
npm run dev
npm run check
npm run test:unit
npm test
npm run build
```

`npm test` 会依次运行单元测试、Astro 类型检查、静态构建和构建产物校验。

修改页面后至少检查以下路径的桌面和手机布局：

- `/`
- `/about/`
- `/schedule/`
- `/poster/`
- `/guide/`
- `/register/`
- `/goal/`
- `/goal/schedule/`
- `/2025/`

## 构建约束

`scripts/validate-build.mjs` 会检查：

- 重复 HTML `id`
- 无法解析的本地链接和资源
- 归档下载清单格式
- 2026 官方文案是否实际渲染
- 根首页是否为真实页面而不是跳转页
- 2026 页面是否误用 2025 的旧 `R` 标志
- `/goal/*` 是否全部保持 `noindex, nofollow`，并继续从 sitemap 和生产同步中排除
- `/goal/` 是否按既定顺序渲染完整长页契约，且该结构没有泄漏到正式 `/`
- 正式日程与 Goal 日程是否分别保留各自结构，并共用当前专题嘉宾数据
- DOM 首屏、完整首页 HTML 和初始本地资源是否保持在独立体积预算内

正式首页和 `/goal/` 验收预览都会执行 DOM 首屏结构与初始资源预算校验。
`/goal/` 还会额外校验长页分区、组织单位角色、备案信息和正式首页隔离。

## 生产发布

正式生产环境是阿里云 OSS 上的 https://www.x-agi.cc。
GitHub Actions 只负责验证构建并保存 `dist/` artifact，不负责生产发布。

发布前需要安装 ossutil 2.x，并为桶 `x-agi` 准备最小权限的 RAM AccessKey。
不要使用阿里云主账号密钥。
不要把 AccessKey 写进仓库、Issue、PR 或聊天记录。

首次配置：

```bash
export OSS_ACCESS_KEY_ID='your-access-key-id'
export OSS_ACCESS_KEY_SECRET='your-access-key-secret'
npm run oss:configure
unset OSS_ACCESS_KEY_ID OSS_ACCESS_KEY_SECRET
```

配置会保存在本机 `~/.ossutilconfig`。

日常发布：

```bash
npm ci
npm test
OSS_DRY_RUN=1 npm run oss:sync
npm run oss:sync
```

`npm run oss:sync` 只同步经过校验的 `dist/`，并排除 `next/**` 和 `goal/**`。
同步不会删除桶里只存在于远端的对象。
不要给全站同步添加 `--delete`，否则可能删除 2025 slides 和访问日志。

可以用 `OSS_BUCKET` 临时覆盖默认桶名。
只有明确准备发布到另一个桶时才应使用该变量。

## 2025 归档

`public/2025/` 是冻结归档。
除归档完整性、无障碍、安全或性能修补外，不应修改其中的会议事实、讲者、赞助商和文案。

历史源站还保存在 `archive/2025` 分支和 `x-agi-2025-final` 标签中。

大体积 slides 不存入 Git。
它们应继续位于 OSS 的 `/2025/assets/slides/`，并与 `public/2025/downloads-manifest.json` 中的路径、大小和 SHA-256 一致。

```bash
npm run downloads:verify
```

## 设计预览

新视觉的入口位于 `src/pages/next/`，设计说明位于 `src/design-next/README.md`。
正式视觉的完整长页验收预览位于 `src/pages/goal/`，设计说明位于 `src/design-goal/README.md`。
`/goal/` 保留正式首屏，并在其后编排历史图集、紧凑日程、参与入口、四类组织单位与独立备案页脚。
正式站与验收预览共用透明顶部、50px 后纯色承托的导航状态契约，同时不会影响完整 `/next/` 概念站。

```bash
npm run dev
```

打开 http://localhost:4321/next/ 查看。
打开 http://localhost:4321/goal/ 查看融合候选。
在没有明确上线决定前，不要把这两套页面同步到生产环境。
