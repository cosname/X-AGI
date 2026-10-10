# 作者海报与待核对名单

截至 2026-10-10，会务提供的全部 55 份单页 PDF 均已纳入网站展示。
2026-10-08 导入 52 份海报，2026-10-10 补入山东大学宋俊儒、张辰皓和陈星宇的 3 份海报。
原网站有 58 条报名记录，目前暂移除 5 条缺少海报的记录，替换张书宁的论文，并新增吴彦辰、熊耀中两条记录。
首页与 Poster 目录统一展示 55 份作者海报，不再展示论文首页占位。
海报题名与旧报名信息不同时，以最新海报为准。
以下“未找到”仅指本次已核对的材料，不表示作者没有在其他渠道提交。

## 暂移除的 5 条记录，供会务核对

| 报名人 | 原报名单位 | 原报名论文 |
| --- | --- | --- |
| 焦政博 | 上海财经大学 | Agentic Proposing: Enhancing Large Language Model Reasoning via Compositional Skill Synthesis |
| 林威 | 香港中文大学 | AGZO: Activation-Guided Zeroth-Order Optimization for LLM Fine-Tuning |
| 张家铭 | 中国人民大学 | Benign Overfitting in Adversarial Training for Vision Transformers |
| 郁昼亮 | 香港中文大学 | FormalMATH: Benchmarking Formal Mathematical Reasoning of Large Language Models |
| 赵子维 | Technical University of Munich | ScopeBench: Evaluating Cultural Norm Scope Awareness in LLMs |

宋俊儒需按单位与论文区分。
山东大学的 Delineating Knowledge Boundaries 与上海交通大学的 Model-Based Imaginative Planning for Embodied Agents 均已提交海报，两条记录分别展示。
张书宁已提交新论文海报，因此不列入待催交名单。

## 2026-10-10 补交海报

| 报名人 | 原报名单位 | 海报题名 |
| --- | --- | --- |
| 宋俊儒 | 山东大学 | Delineating Knowledge Boundaries for Honest Large Vision-Language Models |
| 张辰皓 | 华中科技大学/腾讯 | Can MLLMs Understand the Deep Implication Behind Chinese Images? |
| 陈星宇 | 上海交通大学 | On computing and the complexity of computing higher-order U-statistics, exactly |

三份海报均通过 PDF 文字提取与整页渲染核对，题名与原报名记录对应。
三条记录恢复原有稳定 ID、单位及已核对的公开论文链接。
原始海报按原字节归档，网页图片完整保留原始比例和内容。

## 2026-10-08 新增与替换

| 报名人 | 单位 | 最新海报题名 | 处理 |
| --- | --- | --- | --- |
| 吴彦辰 | 清华大学 | Adaptively Grouped Contextual Bandits for Heterogeneous Human-AI Decision Making with Conformal Prediction Sets | 新增，海报及 PMLR 论文集确认 ICML 2026 |
| 熊耀中 | 中国人民大学 | Why Latent Chain-of-Thought Helps Exploration but Hurts Precise Computation | 新增，完整展示海报；暂未确认公开论文链接和会议归属 |
| 张书宁 | 清华大学 | The Pervasive Blind Spot: Benchmarking VLM Inference Risks on Everyday Personal Videos | 替换原 CoVer，论文链接同步更新；不沿用旧论文的 EMNLP 标签 |

吴彦辰的论文链接已核对 [PMLR 正式条目](https://proceedings.mlr.press/v306/wu26aa.html)。
张书宁的论文链接已核对 [arXiv 条目](https://arxiv.org/abs/2511.02367)。
未确认论文链接的记录保留题名、报名人、单位与可放大的海报，不添加猜测链接。
海报上的会议与期刊信息优先采用；未提供的信息不推断。

## 题名与匹配说明

刘力夫、周韧平、余定之、杜云涛、邹思瑞和王晨瑞的展示题名已按海报更新。
孟宪喆、林中潭和苏铎的题名大小写也已与海报同步。
张德辰的文件名使用“张徳辰”，海报题名及英文署名 Dechen Zhang 与原记录一致。
郭立轩和校一皓提交的是图片型 PDF，题名通过渲染图核对。
校一皓的海报保留 Anonymous Author(s) 署名，报名人依据已有报名记录及提交文件名。
全部 55 份 PDF 均已完成整页视觉检查，原始海报内容保持原样。

## 网站与素材

首页和 Poster 目录共用 55 份海报缩略图及同一个查看器组件。
点击缩略图可放大、缩小、滚动查看、适应屏幕和查看原图，也可按 Escape 关闭。
缩略图按需加载，高分辨率图片仅在打开查看器后加载。
没有 JavaScript 时，海报链接仍可直接打开高分辨率图片。
原报名快照及旧论文首页素材保留，方便核对及后续恢复；它们不决定当前展示名单。

审核后的来源映射为 `src/data/research-poster-sources.json`。
`src/data/poster-research.ts` 仅导出 ID、题名、报名人、单位、会议和公开论文链接六个公开字段。
原始 PDF 按原字节归档到 `assets/source-archive/2026/research-posters/`，不直接发布到网站。
640px 宽的 WebP 缩略图和最长边 4000px 的 WebP 大图位于 `public/2026/research-posters/`，保持原始长宽比。
导入器先校验整批文件名、摘要及单页结构，确保每个 PDF 恰好对应一条展示记录。
未改变的 PDF 可复用通过摘要校验的图片；新海报重新渲染。
超长海报的缩略图按需降低 WebP 编码质量，以满足 180KB 上限；完整大图保持原有质量。
生成清单及全局归档清单由导入器维护，不手动修改。

```sh
npm run posters:import-research -- '/absolute/path/to/submitted-posters'
npm test
```

本记录保留素材与页面核对结果，发布状态以部署验证为准。

## 2026-10-10 补交验证

153 项单元测试通过，107 个文件的 Astro 检查为 0 errors、0 warnings、0 hints。
55 份海报素材校验、整站构建及构建结果校验均通过。
19 项本地浏览器检查通过，涵盖两处 55 条记录、同名论文区分、新海报搜索、论文链接、按需加载、放大及关闭后的焦点恢复。
桌面 1440px、手机模拟 390px 和 320px 已检查，未出现海报裁切或页面横向溢出。
本次同时核对秘书处新增成员程子懿及拼音排序。
原有 52 份海报图片和 282 条工作区归档记录保持不变。
验证日志及截图位于本地 `output/poster-supplement-20261010/`。

## 2026-10-08 本地验证

149 项单元测试通过，Astro 检查为 0 errors、0 warnings，另有 28 条既有提示。
素材校验、52 份海报导出校验、整站构建及构建结果校验均通过。
33 项浏览器检查通过，涵盖两处 52 条展示记录、52 张缩略图解码、新增与替换的海报、缺失记录移除、题名与姓名搜索、公开链接、按需加载、缩放和关闭后的焦点恢复。
桌面 1440px、手机模拟 390px 与 320px 已检查，无页面横向溢出，查看器控件高度至少 44px。
本次使用浏览器设备模拟，未使用实体手机。
原有 228 条归档记录、与本任务无关的 README 和 Logo 修改，以及全部 52 份输入 PDF 保持不变。
测试浏览器及其辅助进程已停止；按用户要求保留 4337 端口的本地预览。

## 同日筛选区简化

首页板块改为“海报展示”，预览高度上限为桌面 18rem、窄屏 16rem，原图完整缩放且不裁切。
首页与 Poster 目录共用搜索、会议或期刊筛选和清除筛选三个控件。
两处均去掉说明段落、可见字段标签、数量文字及控件外层底色。
筛选结果仍通过不可见的状态区域向辅助技术播报。
目录中的海报预览比例保持原有设置。

30 项浏览器检查通过，覆盖两页的组合筛选、无结果状态、清除、键盘菜单、海报缩放，以及 1440px、390px、320px 布局。
整站构建与素材校验通过。
使用临时配置排除 `output` 副本后，实际站点源码检查为 0 errors、0 warnings、0 hints。
默认全量检查遇到 8 条重复声明错误，来自 `output/profile-labels-20261008/release/src/scripts/home-speakers.ts` 与实际源码同时被扫描。
该副本与本次改动无关，未作修改。
验证日志、截图及临时配置保存在 `output/poster-tools-20261008/`。

## 同日全站文案与发布验证

首页、会议简介、日程、海报、差旅补助、参会指南、报名和 404 页的重复说明已精简。
2025 存档的会议简介、课程和报名页同步精简重复文案。
海报申请状态独立于普通参会报名，显示灰色“报名已结束”，并收起海报申请按钮。
普通参会报名保持开放。
海报、嘉宾资料、报告摘要、票价、申请条件和住宿办理信息均保留。

桌面 1440px 与手机模拟 390px 的 23 项浏览器检查通过，涵盖页面排版、组合筛选、海报放大、关闭后的焦点恢复及横向浏览。
从当前 main 基线和本次修改生成独立发布副本后，完整 `npm test` 通过。
该副本的 150 项单元测试全部通过，107 个文件的 Astro 检查为 0 errors、0 warnings、0 hints，素材校验与构建校验通过。
开发工作区中导致重复声明的 `output` 副本未进入发布副本。
发布日志与验证结果保存在本地 `output/release-posters-20261008/`。
