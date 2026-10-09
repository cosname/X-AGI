import type { Conference2026PersonSourceRecord } from './conference2026-people.generated.ts';

// Organizer-confirmed profiles and biography updates through 2026-10-09.
// Keep this supplied copy separate from the attendee workbook snapshot.
export const conference2026ConfirmedPeople: readonly Conference2026PersonSourceRecord[] = [
  {
    id: 'wang-haonan',
    name: '王淏楠',
    aliases: [],
    roles: ['speaker'],
    affiliation: 'Sharpa',
    bio: '王淏楠，新加坡国立大学计算机科学博士，现任 Sharpa 具身智能预训练负责人，曾任腾讯混元 Principal Research Scientist。主要研究方向包括大模型训练与推理、强化学习后训练、多模态生成及世界模型，主导了统一多模态强化学习框架 UniRL 的设计与开发。相关研究发表于 NeurIPS、ICML、ICLR 等国际会议，参与的研究获 NeurIPS 2022 最佳论文奖，第一作者论文入选 ICML 2024 口头报告。近期关注 On-Policy Distillation 中的监督选择与梯度估计问题。',
    talkTitle: 'Signal and Noise in On-Policy Distillation: 1% of Tokens Can Be Enough',
    abstract: 'On-Policy Distillation（OPD）让学生在自身生成的轨迹上接受教师的逐 token 指导，但密集反馈是否都能转化为有效学习？本报告从 SFT、RL 与 OPD 的联系出发，讨论训练轨迹、监督信号与梯度估计之间的关系，并结合近期工作，分析教师反馈的有用性与采样梯度的可靠性为何需要分别考虑。通过信息几何下的信号与噪声分解，该工作提出信息效率比（IER），并将其与已有的 token 有用性指标结合，选择参与蒸馏的监督位置。数学与医学推理实验表明，在部分设置下，仅在 0.1%–1% 的 token 位置施加蒸馏损失，即可达到或超过全 token OPD 的表现。报告将据此讨论稀疏监督何以有效，以及梯度估计视角对后训练方法设计的启示。',
    hasSubmittedPortrait: true,
    sourceOrder: -1,
  },
  {
    id: 'liu-zequn',
    name: '刘泽群',
    aliases: [],
    roles: ['speaker'],
    affiliation: '中关村学院',
    department: 'AI4Science',
    bio: '刘泽群博士，现为北京中关村学院研究员，主要研究方向为大模型、AI4Science。分别于2019年和2024年在北京大学计算机学院获得学士和博士学位，在加入北京中关村学院前，曾在微软亚洲研究院担任研究员。刘泽群博士致力于科学大模型相关的研究，取得了一系列算法和应用上的突破，在Nature Machine Intelligence等顶级期刊和ACL、EMNLP、NAACL等人工智能顶级会议上发表论文十余篇，作为主要贡献者研发的MolXPT、NatureLM等科学大模型受到行业内广泛关注和认可。',
    talkTitle: '科学大模型的数据自动化：数据整理、推理合成与定制评测',
    abstract: '以大语言模型为代表的基础模型正在深刻重塑科学研究范式，在分子设计、医学诊断等领域展现出加速科学发现的巨大潜力。然而，科学大模型的发展在数据层面仍面临多重挑战：原始数据分散异构，推理过程缺乏显式记录，评测需求因任务而异。本报告围绕科学大模型“数据准备 - 推理学习 - 能力验证”的全生命周期，介绍我们在数据自动化方面的研究工作。在数据整理方面，我们提出多智能体协同框架 AIDE，实现科学数据检索、质量筛选与结构化组织的全流程自动化，将分散异构的原始数据转化为训练就绪的高质量资源。在推理合成方面，我们提出 DESRO，基于实验变量变化与结果差异反演潜在推理过程，并以分子优化为例实现可解释推理链的大规模合成。在定制评测方面，我们提出 SciCustom，以科学本体为语义骨架，将科学语料组织为可复用的细粒度知识单元，进而依据用户需求自动构建面向特定科研场景的评测基准。上述工作推动科学数据构建由依赖人工走向自动化，为科学大模型的持续进化提供数据支撑。',
    hasSubmittedPortrait: true,
    sourceOrder: -1,
  },
  {
    id: 'liu-ziyin',
    name: '刘子寅',
    aliases: [],
    roles: ['speaker'],
    affiliation: 'MIT',
    bio: '刘子寅现任麻省理工学院（MIT）研究科学家，即将加入清华大学人工智能学院担任助理教授。他于东京大学获得物理学博士学位。刘子寅的研究主要致力于探索人工神经网络学习机制背后的科学原理与数学规律。此外，他也对理论物理和计算神经科学感兴趣。',
    abstract: '人工智能已经成为一门经验科学。我们正在这些 AI 模型中发现越来越多有趣的现象，但现代人工智能背后的组织性原理至今仍不清晰。在这场报告中，我将介绍一个我称之为“对称性\u2014不可逆性框架”（Symmetry-Irreversibility Framework, SIF）的理论框架。该框架利用了“对称性”和“不可逆性”这两个在一般科学、尤其是物理学中极为核心的概念和工具，来分析并理解深度学习中的各种现象。我将讨论一些有趣的现象\u2014\u2014例如隐式稀疏性（implicit sparsity）、坍缩（collapse）、稳定性边缘（edge of stability），以及近年来提出的“柏拉图式表征假说”（Platonic representation hypothesis）\u2014\u2014如何可能是模型中隐藏的对称性以及训练动力学不可逆性的结果。',
    hasSubmittedPortrait: true,
    sourceOrder: -1,
  },
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
    talkTitle: '人工智能随想录',
    abstract: '本报告一方面从一名人工智能研究者的角度阐释了生成式人工智能亟待深入探究的若干基本问题，夹叙夹议地谈了他的一些学术困惑。另一方面，针对人工智能时代一流大学应如何做出适应性调整进行了初步讨论，强调指出从“企业主导的AI产学研用模式”拓展到“大学使能的初创企业主导的AI产学研用模式”的必要性和可能性。',
    hasSubmittedPortrait: true,
    sourceOrder: -1,
  },
];

// Apply only the revised public biography; retain all other attendee fields.
export const conference2026ConfirmedBios: ReadonlyMap<string, string> = new Map([
  ['xie-tian', '谢天，本科毕业于中国科学技术大学，现就职于 Qwen。专注于预训练模型架构及其训练优化算法研究，希望通过算法侧改进提升智能上限。'],
  ['liu-fanghui', '刘方辉，上海交通大学自然科学研究院与数学科学学院副教授，数学学院与人工智能学院博士生导师，之前在英国华威大学担任助理教授。研究方向为机器学习数学理论与大模型机理分析。其主要研究工作包括函数空间视角下的机器学习理论、尺度扩展下的泛化理论，并进一步推动理论指导实践的研究范式。2023年入选国家高层次人才青年项目，2024年获得AAAI新教师奖，2025年入选TUM全球访问教授计划，2026年获得美国数学与统计创新研究所（IMSI）长期访问学者资助项目。研究获得基金委面上项目、英国皇家学会、谷歌的资助。主办 NeurIPS‘24，’26研讨会，担任IJCV专刊客座编辑，在 ICASSP’23、CVPR’23、ISIT’24 等国际顶级会议上主讲tutorial。担任NeurIPS、ICLR、AISTATS等会议领域主席。'],
  ['wang-jianqiao', '王健桥，清华大学统计与数据科学系助理教授、博士生导师。2022年于宾夕法尼亚大学获得生物统计学博士学位，随后于2022年8月至2024年12月在美国哈佛大学生物统计系从事博士后研究。其研究聚焦于构建稳健且具可解释性的高维与超高维统计方法，并将其应用于复杂结构的大规模基因组数据分析，相关方法学成果发表于 Journal of the American Statistical Association、Biometrika 和 Annals of Applied Statistics。同时在医学健康领域，针对心血管疾病与慢性肾病与合作者开展深入的跨学科研究，综合利用大规模遗传、转录组和蛋白质组数据开展系统分析，成果发表在 New England Journal of Medicine、European Heart Journal 和 Nature Communications 等国际期刊上。'],
  ['chen-siming', '陈思明，复旦大学可视分析与智能决策研究组负责人。复旦大学大数据学院青年研究员，博士生导师，上海市高层次引进人才。2011年本科毕业于复旦大学，2017年获得北京大学博士学位，之后在德国波恩大学任博士后研究员，以及德国弗劳恩霍夫智能分析和信息系统研究所（Fraunhofer IAIS）任研究科学家（2017-2020）。其研究成果发表在IEEE TVCG, CGF, IEEE VIS和ACM CHI等顶级期刊和会议上，并担任多个国际会议的程序主席、组织委员会成员。其工作曾获得多次IEEE VAST Challenge数据挑战赛一等奖，以及多个会议最佳论文/海报（提名）奖，包括IEEE VIS最佳海报提名奖、EuroVA最佳论文奖、Agile最佳海报奖、ChinaVis最佳论文奖等。'],
  ['qiu-zihan', '邱子涵本科毕业于清华大学姚班，现就职于 Qwen 预训练团队，专注于大模型架构与训练策略研究，基于模型机制提高训练稳定性和性能上限。已发表十余篇论文，其中一作论文荣获 NeurIPS 2025 最佳论文奖和 NAACL 2024 杰出论文奖。作为核心成员参与 Qwen2.5、Qwen3、Qwen3-Next、Qwen3.5、Qwen3.8-Flash-Next 等系列模型的研发，Google Scholar 引用量逾 2 万次。'],
]);

// Organizer-supplied public websites; retain all other attendee fields.
export const conference2026ConfirmedProfileUrls: ReadonlyMap<string, string> = new Map([
  ['xie-tian', 'https://github.com/Unakar'],
]);

// Portraits supplied directly by the organizer through 2026-10-06.
// Hu Tianyang's runtime image now uses his September 29 Speaker resubmission.
export const conference2026ConfirmedPortraits: ReadonlyMap<string, string> = new Map([
  ['liu-zequn', '/2026/people/liu-zequn-portrait.webp'],
  ['liu-ziyin', '/2026/people/liu-ziyin-portrait.webp'],
  ['hu-tianyang', '/2026/people/hu-tianyang-portrait.webp'],
  ['chen-siming', '/2026/people/chen-siming-portrait.webp'],
  ['zhou-mo', '/2026/people/zhou-mo-portrait.webp'],
]);

// Organizer-supplied abstracts through 2026-10-08.
// Apply only the revised abstracts; retain the confirmed titles and other fields.
export const conference2026ConfirmedAbstracts: ReadonlyMap<string, string> = new Map([
  ['hu-yiwen', 'Scaling large models requires optimization strategies that ensure rapid convergence grounded in stability. Maximal Update Parametrization (μP) provides a theoretical safeguard for width-invariant Θ(1) activation control, whereas emerging optimizers like Muon are only half-aligned with these constraints: they control updates but allow weights to drift. To address this limitation, we introduce the Spectral Sphere Optimizer (SSO), which enforces strict module-wise spectral constraints on both weights and their updates. By deriving the steepest descent direction on the spectral sphere, SSO realizes a fully μP-aligned optimization process. To enable large-scale training, we implement SSO as an efficient parallel algorithm within Megatron. Through extensive pretraining on diverse architectures, including Dense 1.7B, MoE 8B-A1B, and 200-layer DeepNet models, SSO consistently outperforms AdamW and Muon. Furthermore, we observe significant practical stability benefits, including improved MoE router load balancing, suppressed outliers, and strictly bounded activations.'],
  ['zhou-peijie', 'The Wasserstein-Fisher-Rao (WFR) metric extends dynamic optimal transport (OT) by coupling displacement with change of mass, providing a principled geometry for modeling unbalanced snapshot dynamics. Existing WFR solvers, however, are often unstable, computationally expensive, and difficult to scale. Here we introduce WFR Flow Matching (WFR-FM), a simulation-free training algorithm that unifies flow matching with dynamic unbalanced OT. Unlike classical flow matching which regresses only a transport vector field, WFR-FM simultaneously regresses a vector field for displacement and a scalar growth rate function for birth-death dynamics, yielding continuous flows under the WFR geometry. Theoretically, we show that minimizing the WFR-FM loss exactly recovers WFR geodesics. Empirically, WFR-FM yields more accurate and robust trajectory inference in single-cell biology, reconstructing consistent dynamics with proliferation and apoptosis, estimating time-varying growth fields, and applying to generative dynamics under imbalanced data. It outperforms state-of-the-art baselines in efficiency, stability, and reconstruction accuracy. Overall, WFR-FM establishes a unified and efficient paradigm for learning dynamical systems from unbalanced snapshots, where not only states but also mass evolve over time.'],
  ['chen-huanran', '大语言模型的能力主要源于互联网级别数据上的预训练。在本工作中，我们提出了一个非常有趣的问题：“相同的预训练损失，一定意味着相同的模型能力吗？” 我们猜想，特定任务极小值点之间的几何“接近性”（Closeness）与下游泛化能力有着内在的必然联系。然而，标准的优化器（如 AdamW）往往会收敛到各任务特定极小值点彼此疏远的区域。为了打破这一局限，我们提出了 Nexus 优化器，通过在优化过程中最大化梯度相似度，显式促进这些极小值点的几何接近。在 130M 到 3B 参数规模的模型、多种数据配比和超参数下的广泛实验表明：尽管预训练损失完全相同，Nexus 却大幅度提升了下游任务的性能。 例如，Nexus 将分布外（OOD）损失降低了 0.012，并在复杂推理任务（如 GSM8k）上实现了高达 15.0% 的准确率提升。这一发现挑战了“将预训练损失作为评估模型能力唯一指标”的传统范式，有力证明了隐式偏置（Implicit Biases）在解锁下游泛化能力中的重要性。'],
  ['lu-yiping', '传统大模型主要依赖“训练时扩展”（Training-time Scaling），但在处理复杂推理和前沿数学科学问题时，单纯堆参数已遭遇边际效应瓶颈。“推理时扩展”（Inference-time Scaling）打破了这一限制，它在推理阶段注入动态计算资源，实现“算力越多、效果越好”。然而，当前生成式 AI 缺乏普适的原则性设计框架，科学机器学习（SciML）领域也亟待类似的推理时扩展体系。为此，本报告借鉴科学计算中的缺陷校正（Defect Correction）思想，在推理时将数据驱动方法与底层机理有机融合，首次为推理时扩展提供了一个具备理论保障的统一Bellman Error Correction的原则性框架。具体包含两大核心应用：\n面向科学机器学习（SciML）：针对高维半线性抛物型方程，我们将代理模型的误差严谨地表示为另一个抛物型方程的解，并利用基于蒙特卡洛的随机模拟算法对其高效修正。该方法在推理时模拟未来规划误差并动态校正当前解，实现了计算资源与精度的协同提升。我们进一步展现了离线数据驱动训练与在线机理修正的“两阶段结合”才能真正达到统计最优。\n面向生成式人工智能：我们将规划过程与缺陷校正相结合，利用顺序蒙特卡洛（SMC）方法动态修正生成规划中的累积的Belmman误差。我们在理论上首次给出了该方法在大语言模型推理中的样本复杂度分析；针对扩散模型，我们构造了顺序蒙特卡洛方法失效的不收敛反例，并进一步设计了首个基于二点格式的扩散模型推理算法，有效确保了其方差不随离散步长缩小而恶化（或增大）。\n本工作表明，通过深化数据与机理结合，将底层物理与数学规律转化为动态矫正算子来纠偏数据驱动模型在复杂推理中的累积漂移，能够让推理时算力的投入真正转化为兼具严格理论保障与高精度的智能决策。'],
]);
