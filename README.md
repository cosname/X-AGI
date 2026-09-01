# X-AGI Conference Website

X-AGI 大会官网及年度归档的 Astro 静态站。

- 正式网站：https://www.x-agi.cc
- 代码仓库：https://github.com/cosname/X-AGI
- 生产托管：阿里云 OSS `x-agi` 桶，地域 `cn-beijing`
- 运行环境：Node.js 24、Astro 7、npm 11

## 站点版本

仓库明确区分当前 2026 正式站、冻结的 2025 静态归档和兼容跳转。

| 路径 | 用途 | 状态 |
| --- | --- | --- |
| `/`、`/about/`、`/schedule/` 等 | 2026 X-AGI 正式站 | 对外发布 |
| `/2025/` 及其静态文件 | 2025 X-AGI 与第 18 届中国 R 会议归档 | 冻结发布 |
| `/2026/`、`/2026/<page>/` | 旧书签兼容入口 | 跳转至当前正式路由 |
| 根目录 `about.html`、`schedule.html` 等 | 2025 上线时期的旧链接 | 跳转至对应 2025 归档页 |

`/goal/**` 和 `/next/**` 已从源码与本地构建中删除。
`robots.txt` 暂时继续禁止抓取这两个路径，避免远端遗留对象被索引。
移除远端遗留对象需要单独授权，不能通过全站同步的删除选项处理。

## 2026 正式路由

| 路径 | 页面 |
| --- | --- |
| `/` | 首页、17 场历届影像、组织单位和备案信息 |
| `/about/` | 会议简介 |
| `/schedule/` | 日程安排 |
| `/poster/` | Rising Stars Poster |
| `/guide/` | 参会指南 |
| `/register/` | 报名、票价和百格活动表单 |
| `/speakers/` | 跳转至 `/schedule/` |

兼容跳转集中配置在 `astro.config.mjs`。

## 目录结构

```text
assets/
  brand-kit/2026/               不发布的 2026 品牌矢量母版
  source-archive/2026/          不发布的完整源素材、来源映射和哈希清单
public/
  2025/                         冻结的 2025 静态归档
  2026/
    brand/                      站点实际使用的品牌图片和纸面纹理
    legal/                      2026 自有备案图标
    logos/                      每个组织单位唯一选定的正式 Logo
    people/                     主席与演讲嘉宾的方形 WebP 头像
src/
  assets/2026/
    goal-history/               17 场历届影像的 51 张本地源图
    venue/                      2026 会场平面图和酒店预订素材
  components/
    2026/home/                  2026 正式首页组合与内容区
    2026/inner/                 2026 五个正式内页的内容与外壳
    *.astro                     跨页面共享的导航、Meta 和像素场组件
  config/
    site.ts                     届次、路径、状态和正式视觉皮肤
    navigation.ts               导航和正式页面集合
    edition-status.ts           页面标题、状态和下一步操作
  data/
    conference2026.ts           除专题嘉宾外的 2026 官方业务内容
    conference2026-program.generated.ts 腾讯文档生成的专题、主席和嘉宾快照
    conference2026-people.generated.ts 参会表生成的公开人物资料快照
    conference2026-people.ts   人物资料、日程角色与本地头像的公开组合
    goal-history.ts             17 场历届影像、说明和内部来源记录
    partner-logo-assets-2026.ts 2026 正式组织单位 Logo 对照
  layouts/
    PublishedHome2026Layout.astro  2026 正式首页外壳
    PublishedInner2026Layout.astro 2026 正式内页外壳
    BaseLayout.astro              共享 HTML、Meta 和全局样式外壳
  pages/                        Astro 正式路由和文本端点
  styles/
    published-inner-2026.css    2026 内页自有结构样式
    goal-2026.css               2026 内页连接视觉和玻璃皮肤
    goal-home-lower.css         正式首页长页纸面外壳
    goal-history.css            历届影像和波峰目录
    goal-partner-footer.css     组织单位和备案收束区
    global.css                  正式首屏、导航和共享组件
scripts/
  sync-tencent-program.mjs      校验腾讯文档 CSV 并生成公开日程数据
  sync-attendee-people.mjs      白名单读取参会表并生成公开人物资料
  manifests/public-2025.sha256  冻结归档的哈希与字节清单
  validate-build.mjs            构建产物和跨年份边界校验
  configure-oss.mjs             本机 ossutil 配置
  sync-oss.mjs                  不删除远端对象的生产同步
```

## 内容与素材所有权

2026 文案、票价、组织单位、基础日程和报名状态只在 `src/data/conference2026.ts` 中维护。
专题、主席和嘉宾由腾讯文档生成到 `src/data/conference2026-program.generated.ts`，不得手工编辑生成文件。
主席与演讲嘉宾的公开简介和报告摘要由参会表生成到 `src/data/conference2026-people.generated.ts`，并在日程卡片中原位展开，不得手工编辑生成文件。
参会表中的订单、审核、支付、邮箱、电话、微信和对接信息属于私密字段，禁止进入源码、日志、测试夹具、构建产物或公开页面。
页面组件负责表现，不应复制独立业务数据。
尚未确认的讲者、报告、赞助商、时间或数字不得自行补写。

历届影像的 17 场活动、51 张照片、说明、焦点和内部来源记录集中维护在 `src/data/goal-history.ts`。
照片源文件位于 `src/assets/2026/goal-history/`，由 Astro 优化后写入 `dist/_assets/`。
页面不得直接热链 Qpic。
`sourceUrl` 和 `sourceImageIndex` 只用于内部追溯。

当前网站请求的品牌资源位于 `public/2026/brand/`。
非发布用矢量母版位于 `assets/brand-kit/2026/`。
完整的供应方原件、可编辑母版、高清照片、历史候选图和 QA 证据位于 `assets/source-archive/2026/`。
该目录保留原始字节，但使用语义化规范文件名，并通过 `manifest.json` 记录迁移前名称。
任何源素材都不得只保存在 Desktop、Downloads、临时目录或其他仓库外路径中。
需要新尺寸或格式时，应从母版生成一个明确用途的运行时导出，再放入 `public/2026/`。
不要把整个品牌导出集合复制到公开目录。

2026 自有素材统一使用 ASCII 小写 kebab-case。
文件名格式为 `<subject>-<role>[-<variant>][-<meaningful-sequence>].<extension>`。
禁止纯数字文件名、空格、下划线、括号、中文文件名，以及 `backup`、`copy`、`draft`、`final`、`tmp`、`untitled` 等临时词。
也禁止单独使用 `logo`、`image`、`photo`、`mobile`、`banner` 等只有素材类别、没有具体对象的名称。
序号只允许表达真实顺序，并必须放在文件名末尾且补零。
冻结的 `public/2025/` 不适用这条重命名规则，因为其公开 URL 和哈希必须保持不变。

每个组织单位在 `public/2026/logos/` 中只保留一个选定文件。
选择关系由 `src/data/partner-logo-assets-2026.ts` 管理。
2026 页面不得借用 `public/2025/` 中的 Logo、图标、样式或脚本。
相同素材需要跨届使用时，应复制为 2026 自有文件并使用清楚的当前路径。

完整视觉、动效、历史画廊和无障碍约束见 `docs/2026-design-system.md`。

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
npm run assets:verify
npm run build
npm test
```

`npm test` 会依次运行单元测试、Astro 类型检查、源素材归档校验、静态构建和构建产物校验。
修改页面后至少检查 `/`、`/about/`、`/schedule/`、`/poster/`、`/guide/` 和 `/register/` 的桌面与手机布局。
归档相关改动还需要检查 `/2025/`、`/2025/schedule.html` 和 `/2025/register.html`。

## 腾讯文档专题同步

专题来源固定为腾讯文档 `X-AGI 2026 嘉宾信息` 的 `BB08J2` 标签页和 `工作表1`。
下载当前工作表的 UTF-8 CSV 后，用绝对路径运行：

```bash
npm run schedule:sync -- --csv /absolute/path/to/X-AGI-2026-program.csv
npm test
```

同步器严格校验 `时间、主题、计划人数、演讲题目完成度、chair（单位）、Speaker1：Title、Speaker2、Speaker3、Speaker4` 九列标题，以及半天时段、空主题、重复主题、嘉宾格式、重复嘉宾和最大行数。
内部使用的 `计划人数` 与 `演讲题目完成度` 会被明确丢弃，不能写入生成文件或公开页面。
自动运行一次删除超过两个专题时会失败并保留现状。
确认大范围删除确属预期后，人工复核 CSV，并在受监督的本地运行中加入 `--allow-large-change`。

当前 `/schedule/` 公开专题、主席和嘉宾。
生成数据同时公开来源中已确认的报告题目，并按 `时间` 字段展示上午、下午分组；具体钟点确认后再进一步细化。

## 主席与演讲嘉宾资料同步

人物资料来源是会务导出的 Chair 与 Speaker 参会表。
同步器只允许读取 `门票类型、姓名、学校/单位、院系/部门、个人介绍、头像照片、演讲标题、演讲摘要` 八列，并明确丢弃其余列。
原始 XLS、转换出的 CSV 和带有远程头像地址的中间文件都不得提交到仓库。

```bash
npm run people:sync -- --workbook /absolute/path/to/attendee-list.xls
npm test
```

同步 `.xls` 或 `.xlsx` 需要本机安装 LibreOffice，并可通过 `soffice` 命令调用。
同步器把同名 Chair 与 Speaker 合并成一个人物资料，并为中英文日程别名保留显式映射。
头像必须下载为 2026 站点本地素材，原始字节归档到 `assets/source-archive/2026/people/`，运行时方形 WebP 放在 `public/2026/people/`。
无法无歧义确认身份的照片必须使用统一占位，不能从集体照猜测或裁人。

## 构建约束

`scripts/validate-build.mjs` 负责保护以下契约：

- 正式 2026 路由、冻结 2025 文件和兼容跳转的准确清单
- 重复 HTML `id` 和无法解析的本地链接或资源
- 2026 正式文案、17 场活动、51 张本地历届影像和组织单位顺序
- 当前 HTML 与 CSS 不得请求 `/2025/**`
- 冻结归档不得请求当前 `/2026/**` 或 Astro `/_assets/**`
- `public/2025/` 必须与 `scripts/manifests/public-2025.sha256` 的哈希和字节数一致
- 历届影像、会场素材、伙伴 Logo 和公开品牌文件必须有明确且互相对应的消费者
- 日程内人物详情只能使用本地 2026 头像，必须保持原生展开语义，并不得泄露参会表私密字段
- `dist/` 不得包含 `/goal/**`、`/next/**` 或品牌母版
- OSS 同步脚本不得包含 `--delete`

构建前删除旧 `dist/`，避免过期预览产物掩盖路由错误。

## 2025 冻结归档

`public/2025/` 是不可重组的静态归档。
不要格式化、重命名、移动或替换其中的文件。
归档完整性由 `scripts/manifests/public-2025.sha256` 记录并在构建时校验。

历史源站还保存在 `archive/2025` 分支和 `x-agi-2025-final` 标签中。
大体积 slides 不存入 Git。
它们应继续位于 OSS 的 `/2025/assets/slides/`，并与 `public/2025/downloads-manifest.json` 中的路径、大小和 SHA-256 一致。

```bash
npm run downloads:verify
```

## 生产发布

正式生产环境是阿里云 OSS 上的 https://www.x-agi.cc。
GitHub Actions 只负责验证构建并保存 `dist/` artifact，不负责生产发布。

发布需要 ossutil 2.x 和针对 `x-agi` 桶的最小权限 RAM AccessKey。
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

生产同步必须先执行 dry run 并检查对象数量、字节数和目录范围。
`npm run oss:sync` 只把本地 `dist/` 覆盖到对应 OSS 路径，不删除远端独有对象。
不要给全站同步添加 `--delete`。
全站删除可能误删单独管理的 2025 slides、访问日志或仍待人工确认的远端对象。

可以用 `OSS_BUCKET` 临时覆盖默认桶名。
只有明确准备发布到另一个桶时才应使用该变量。
