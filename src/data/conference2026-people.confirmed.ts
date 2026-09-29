import type { Conference2026PersonSourceRecord } from './conference2026-people.generated.ts';

// Organizer-confirmed profiles and biography updates, 2026-09-18.
// Keep this supplied copy separate from the attendee workbook snapshot.
export const conference2026ConfirmedPeople: readonly Conference2026PersonSourceRecord[] = [
  {
    id: 'liu-jun',
    name: '刘军',
    aliases: [],
    roles: ['speaker'],
    affiliation: '清华大学',
    department: '统计与数据科学系',
    bio: '刘军，美国科学院院士、清华大学兴华卓越讲席教授、清华统计与数据科学系主任。于1991-2025年间，他曾任哈佛大学和斯坦福大学统计系助理教授、副教授、终身教授；还曾任美国统计协会会刊(JASA)联席主编及多个国际一流统计杂志副主编等职。曾获统计领域最高荣誉考普斯会长奖（2002）、华人数学家大会晨兴应用数学金奖（2010）、泛华统计协会许宝騄奖（2016）。于2004、2005和2022年分别成为数理统计学会（IMS）、美国统计学会（ASA）和国际计算生物学会（ISCB）选举会士。于2025年当选美国国家科学院院士。他指导了40多位博士生、30多位博士后；在国际权威期刊发表300余学术论文篇和一本专著，被引用10万余次 (GoogleScholar)。',
    hasSubmittedPortrait: false,
    sourceOrder: -1,
  },
  {
    id: 'sun-maosong',
    name: '孙茂松',
    aliases: [],
    roles: ['speaker'],
    affiliation: '清华大学',
    department: '计算机科学与技术系',
    bio: '孙茂松，清华大学计算机科学与技术系教授、博士生导师，清华大学人工智能研究院常务副院长，清华大学计算机学位评定分委员会主席，欧洲科学院外籍院士。2007-2018年任该系系主任、党委书记。主要研究领域为自然语言处理、人工智能、社会人文计算和计算教育学。国家重点基础研究发展计划（973计划）项目首席科学家，国家社会科学基金重大项目首席专家。北京智源人工智能研究院自然语言处理重大研究方向首席科学家，中央音乐学院、青海师范大学兼职教授、博士生导师，新加坡国立大学访问教授。在重要国际刊物、国际会议、国内核心刊物上发表论文200余篇，Google Scholar论文引用约9万次。',
    hasSubmittedPortrait: true,
    sourceOrder: -1,
  },
];

// Apply only the revised public biography; retain all other attendee fields.
export const conference2026ConfirmedBios: ReadonlyMap<string, string> = new Map([
  ['qiu-zihan', '邱子涵本科毕业于清华大学姚班，现就职于 Qwen 预训练团队，专注于大模型架构与训练策略研究，基于模型机制提高训练稳定性和性能上限。已发表十余篇论文，其中一作论文荣获 NeurIPS 2025 最佳论文奖和 NAACL 2024 杰出论文奖。作为核心成员参与 Qwen2.5、Qwen3、Qwen3-Next、Qwen3.5、Qwen3.8-Flash-Next 等系列模型的研发，Google Scholar 引用量逾 2 万次。'],
]);

// Portraits supplied directly by the organizer on 2026-09-19 and 2026-09-29.
// Hu Tianyang's runtime image now uses his September 29 Speaker resubmission.
export const conference2026ConfirmedPortraits: ReadonlyMap<string, string> = new Map([
  ['hu-tianyang', '/2026/people/hu-tianyang-portrait.webp'],
  ['chen-siming', '/2026/people/chen-siming-portrait.webp'],
  ['zhou-mo', '/2026/people/zhou-mo-portrait.webp'],
]);

// Organizer-supplied abstract, 2026-09-28. Title and biography already match the source.
export const conference2026ConfirmedAbstracts: ReadonlyMap<string, string> = new Map([
  ['lu-yiping', '传统大模型主要依赖“训练时扩展”（Training-time Scaling），但在处理复杂推理和前沿数学科学问题时，单纯堆参数已遭遇边际效应瓶颈。“推理时扩展”（Inference-time Scaling）打破了这一限制，它在推理阶段注入动态计算资源，实现“算力越多、效果越好”。然而，当前生成式 AI 缺乏普适的原则性设计框架，科学机器学习（SciML）领域也亟待类似的推理时扩展体系。为此，本报告借鉴科学计算中的缺陷校正（Defect Correction）思想，在推理时将数据驱动方法与底层机理有机融合，首次为推理时扩展提供了一个具备理论保障的统一Bellman Error Correction的原则性框架。具体包含两大核心应用：\n面向科学机器学习（SciML）：针对高维半线性抛物型方程，我们将代理模型的误差严谨地表示为另一个抛物型方程的解，并利用基于蒙特卡洛的随机模拟算法对其高效修正。该方法在推理时模拟未来规划误差并动态校正当前解，实现了计算资源与精度的协同提升。我们进一步展现了离线数据驱动训练与在线机理修正的“两阶段结合”才能真正达到统计最优。\n面向生成式人工智能：我们将规划过程与缺陷校正相结合，利用顺序蒙特卡洛（SMC）方法动态修正生成规划中的累积的Belmman误差。我们在理论上首次给出了该方法在大语言模型推理中的样本复杂度分析；针对扩散模型，我们构造了顺序蒙特卡洛方法失效的不收敛反例，并进一步设计了首个基于二点格式的扩散模型推理算法，有效确保了其方差不随离散步长缩小而恶化（或增大）。\n本工作表明，通过深化数据与机理结合，将底层物理与数学规律转化为动态矫正算子来纠偏数据驱动模型在复杂推理中的累积漂移，能够让推理时算力的投入真正转化为兼具严格理论保障与高精度的智能决策。'],
]);
