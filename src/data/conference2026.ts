export type Organization = {
  name: string;
  url?: string;
  intro?: readonly string[];
};

export type ScheduleTalk = {
  time?: string;
  title: string;
  speaker?: string;
  affiliation?: string;
  abstract?: string;
  bio?: string;
  slides?: string;
};

export type ScheduleCategory = 'arrival' | 'keynote' | 'parallel' | 'poster';

export type ScheduleSession = {
  id: string;
  category: ScheduleCategory;
  period: string;
  title?: string;
  venue?: string;
  chair?: {
    name: string;
    bio?: string;
  };
  notes?: readonly string[];
  talks?: readonly ScheduleTalk[];
};

export type ScheduleDay = {
  dateTime: string;
  date: string;
  weekday: string;
  sessions: readonly ScheduleSession[];
};

export type ProgramPerson = {
  name: string;
  affiliation?: string;
};

export type ProgramPreviewSession = {
  title: string;
  chair: ProgramPerson;
  speakers: readonly ProgramPerson[];
};

export type TicketRow = {
  name: string;
  student: number;
  general: number;
};

export type TicketBand = {
  id: string;
  label: string;
  until?: string;
  rows: readonly TicketRow[];
};

export const conference2026 = {
  sourceDate: '2026-08-18',
  sourceDateLabel: '大会专题与嘉宾信息已同步',
  name: '2026 X-AGI 大会',
  nameEn: '2026 X-AGI Conference',
  tagline: 'AI Conference for the neXt Generation',
  positioning: '下一代 AI 研究者',
  description:
    '本次会议特设Rising Stars Poster，旨在为AI领域产学研各界同仁，特别是青年学子，搭建展示研究成果、促进学术交流的优质平台，进一步激发创新活力，推动学术与产业协同发展。',
  introduction: [
    '2026 X-AGI 大会拟于2026年10月16日至18日在北京友谊宾馆举行。本届大会以“AI Conference for the neXt Generation” 为主题，邀请来自国内外高校、科研机构与产业界的优秀学者和专家，共同探讨下一代人工智能研究的前沿问题与发展方向。“X”代表未知、交叉与探索。本次会议设置多个专题论坛，涵盖AI4Math、AI4Science、脑机接口、预训练算法的新进展、AI Infra、Agent、Agentic后训练、LLM评测与基准、大语言模型基础、生成建模新范式与理论基础、扩散模型理论基础与推理算法、机器学习理论、AI+Finance等多个重要方向。',
    '本次会议特设Rising Stars Poster，旨在为AI领域产学研各界同仁，特别是青年学子，搭建展示研究成果、促进学术交流的优质平台，进一步激发创新活力，推动学术与产业协同发展。Poster投稿条件：2025年1月1日之后在列表内期刊/会议录用中稿，列表包括 ICLR, NeurIPS, ICML, JMLR, T-PAMI, JASA, JRSSB, AoS, Biometrika, COLT, FOCS, STOC, TMLR, COLM, ACL, CVPR等。',
    'X-AGI 大会起源于统计之都长期推动的中国 R 会议，本届已是第十九届。迄今，统计之都已联合全国20余所高校与科研机构，在全国14个城市成功举办近50次会议，呈现近2000场演讲，吸引线上线下参会者逾50万人次。',
    '2026 X-AGI 大会由统计之都和FAI（人工智能基础研究）发起，联合清华大学统计与数据科学系、中国人民大学应用统计科学研究中心、中国人民大学统计学院、中国商业统计学会人工智能分会共同主办，OScholar、AI Time共同协办，并获得明汯投资、宽德投资、Will、数启寰宇（QuantVerse）和智统数合的大力赞助。',
  ],
  conferenceOrganization: {
    committee: {
      title: '组织委员会',
      chair: '钟轶伦',
      members: [
        '常象宇',
        '陈思明',
        '从鑫',
        '邓柯',
        '冯凌秉',
        '胡天阳',
        '刘军',
        '刘方辉',
        '陆一平',
        '吕晓玲',
        '马梓业',
        '邱怡轩',
        '滕佳烨',
        '王健桥',
        '王小宁',
        '魏太云',
        '校一皓',
        '杨朋昆',
        '杨新宇',
        '谢天',
        '许成玮',
        '张辉帅',
        '张桐瑞轩',
        '周峰',
        '祝武',
      ],
      orderNote: '按姓名拼音排序',
    },
    secretariat: {
      title: '大会秘书处',
      secretaryGeneral: '邱潇锐',
      members: ['邓欣怡', '黄涵碧', '李芷汀', '田润泽', '王胤博'],
      orderNote: '按姓名拼音排序',
    },
  },
  history: {
    eyebrow: 'FROM CHINA-R TO X-AGI',
    title: '一条持续生长的学术连接',
    summary:
      'X-AGI 延续中国 R 会议自 2008 年开始的开放交流传统，让统计、数据科学与人工智能研究者在真实现场中交换方法、问题与新的合作可能。',
    stats: [
      { value: '19', label: '届学术传承' },
      { value: '14', label: '座城市' },
      { value: '近 50', label: '场会议' },
      { value: '50万+', label: '线上线下参与' },
    ],
    gallery: [
      {
        year: '2011',
        location: '北京 · 中国人民大学',
        title: '从一场会议开始连接',
        caption: '第四届中国 R 语言会议，与会者在会场外合影。',
        image: '/2026/history/china-r-2011-beijing-group.webp',
        width: 1600,
        height: 864,
        alt: '2011 年第四届中国 R 语言会议北京会场与会者合影',
        sourceUrl: 'https://cosx.org/2011/05/4th-china-r-beijing-summary/',
      },
      {
        year: '2014',
        location: '北京 · 中国人民大学',
        title: '讨论发生在同一个现场',
        caption: '第七届中国 R 语言会议圆桌讨论，观点在台上与台下持续交换。',
        image: '/2026/history/china-r-2014-beijing-discussion.webp',
        width: 1024,
        height: 680,
        alt: '2014 年第七届中国 R 语言会议圆桌讨论现场',
        sourceUrl: 'https://cosx.org/2014/06/7th-china-r-beijing-summary/',
      },
      {
        year: '2017',
        location: '合肥 · 中国科学技术大学',
        title: '把问题带到会场',
        caption: '第十届中国 R 会议，参会者在会场阅读会议手册。',
        image: '/2026/history/china-r-2017-hefei-audience.webp',
        width: 918,
        height: 574,
        alt: '2017 年第十届中国 R 会议参会者阅读会议手册',
        sourceUrl: 'https://cosx.org/2017/07/10th-china-r-hefei-summary/',
      },
      {
        year: '2017',
        location: '合肥 · 中国科学技术大学',
        title: '让交流继续发生',
        caption: '报告间隙的面对面交流，构成会议最重要的连接之一。',
        image: '/2026/history/china-r-2017-hefei-exchange.webp',
        width: 938,
        height: 610,
        alt: '2017 年第十届中国 R 会议参会老师在会场交流',
        sourceUrl: 'https://cosx.org/2017/07/10th-china-r-hefei-summary/',
      },
      {
        year: '2020',
        location: '北京 · 中国人民大学',
        title: '线上线下保持联结',
        caption: '第十三届中国 R 会议采用线上与线下结合的方式继续相聚。',
        image: '/2026/history/china-r-2020-beijing-hybrid.webp',
        width: 1080,
        height: 756,
        alt: '2020 年第十三届中国 R 会议北京线下会场合影',
        sourceUrl: 'https://cosx.org/2020/12/13th-china-r-beijing-summary/',
      },
    ],
  },
  dates: {
    display: '2026年10月16日至18日',
    compact: '2026.10.16-18',
    start: '2026-10-16',
    end: '2026-10-18',
  },
  venue: {
    name: '北京友谊宾馆',
    scheduleName: '北京市友谊宾馆',
    city: '北京',
    nameEn: 'Beijing Friendship Hotel',
    maps: [
      {
        key: 'campus',
        title: '北京友谊宾馆示意图',
        titleEn: 'Plan of Beijing Friendship Hotel',
        description: '宾馆园区总平面，标出主要楼宇、出入口、北三环西路与地铁4号线人民大学站。',
      },
      {
        key: 'palace-l2',
        title: '友谊宫二层导视平面图',
        titleEn: 'Friendship Palace 2nd Floor Guide Plan',
        description: '友谊宫二层会议厅、展示区、工作区与休息区分布。',
      },
    ],
  },
  scale: {
    attendees: '600+',
    posters: '50-100',
  },
  mechanisms: [
    {
      number: '01',
      title: '高水平学术报告',
      description: '大会将以高水平学术报告为主体。',
    },
    {
      number: '02',
      title: 'Rising Stars Poster',
      description: '为优秀本科生、硕士生和博士生提供正式展示研究成果、深入参与学术交流的平台。',
    },
    {
      number: '03',
      title: '青年交流',
      description: '让具有潜力的年轻研究者不仅能够聆听前沿工作，也能够展示自己的研究、参与讨论并建立真实的学术连接。',
    },
    {
      number: '04',
      title: '产业连接',
      description: '促进青年研究者与学术界、产业界之间的高质量连接。',
    },
  ],
  scheduleNotice: '具体日程即将发布',
  programPreview: {
    status: '持续更新中...',
    note: '专题与嘉宾名单持续更新，具体时段将随文字日程一并公布。',
    sessions: [
      {
        title: 'AI + Math & Theory',
        chair: { name: '刘方辉', affiliation: '上海交通大学' },
        speakers: [
          { name: '罗涛', affiliation: '上海交通大学' },
          { name: '邹荻凡', affiliation: '香港大学' },
          { name: '陆一平', affiliation: '北京大学' },
          { name: '刘方辉', affiliation: '上海交通大学' },
        ],
      },
      {
        title: 'ML Theory',
        chair: { name: '马梓业', affiliation: '香港城市大学' },
        speakers: [
          { name: '马鉴昊', affiliation: '清华大学' },
          { name: '赵鹏', affiliation: '南京大学' },
        ],
      },
      {
        title: '生成建模的新范式与理论基础',
        chair: { name: '周峰', affiliation: '中国人民大学' },
        speakers: [
          { name: '马俊杰', affiliation: '中国科学院数学与系统科学研究院' },
          { name: '许洪腾', affiliation: '中国人民大学' },
          { name: '毛小介', affiliation: '清华大学' },
          { name: '周帆', affiliation: '上海财经大学' },
        ],
      },
      {
        title: '预训练算法的新进展',
        chair: { name: '校一皓', affiliation: '上海财经大学' },
        speakers: [{ name: '谢天', affiliation: 'Qwen' }],
      },
      {
        title: 'Agentic 后训练',
        chair: { name: '杨新宇', affiliation: 'Kimi' },
        speakers: [],
      },
      {
        title: 'AI + 教育',
        chair: { name: '陈思明', affiliation: '复旦大学' },
        speakers: [],
      },
      {
        title: 'Agent',
        chair: { name: '从鑫', affiliation: '清华大学' },
        speakers: [
          { name: '王宏宁', affiliation: '清华大学' },
          { name: '李鹏', affiliation: '清华大学' },
        ],
      },
      {
        title: 'LLM 评测 & Benchmark',
        chair: { name: '张辉帅', affiliation: '北京大学' },
        speakers: [],
      },
      {
        title: 'AI + Finance',
        chair: { name: '祝武', affiliation: '清华大学' },
        speakers: [],
      },
      {
        title: '语言模型基础',
        chair: { name: '胡天阳', affiliation: '香港中文大学（深圳）' },
        speakers: [{ name: '刘威杨', affiliation: '香港中文大学' }],
      },
      {
        title: '扩散模型的理论基础与推理算法',
        chair: { name: '陆一平', affiliation: '北京大学' },
        speakers: [
          { name: '焦雨领', affiliation: '武汉大学' },
          { name: '周沛劼', affiliation: '北京大学' },
          { name: '史作强', affiliation: '清华大学' },
          { name: '陆一平', affiliation: '北京大学' },
        ],
      },
      {
        title: 'AI Infra',
        chair: { name: '杨朋昆', affiliation: '清华大学' },
        speakers: [],
      },
      {
        title: 'AI4Science',
        chair: { name: '待确认', affiliation: '' },
        speakers: [{ name: '许慧楠', affiliation: '之江实验室' }],
      },
    ],
  },
  // 日程是嘉宾、报告与分会场的唯一发布面。确认后的讲者、摘要、简介写进对应 session.talks。
  schedule: [
    {
      dateTime: '2026-10-16',
      date: '2026.10.16',
      weekday: '周五',
      sessions: [
        {
          id: 'oct16-pm',
          category: 'arrival',
          period: '下午',
          title: '报到日',
          notes: ['来场嘉宾报到注册', 'Poster 展会预交流'],
        },
      ],
    },
    {
      dateTime: '2026-10-17',
      date: '2026.10.17',
      weekday: '周六',
      sessions: [
        {
          id: 'oct17-am',
          category: 'keynote',
          period: '上午',
          title: 'Keynote 会场',
          notes: ['主持人致辞'],
          talks: [
            { time: '', title: '', speaker: '', affiliation: '' },
            { time: '', title: '', speaker: '', affiliation: '' },
          ],
        },
        {
          id: 'oct17-pm-sessions',
          category: 'parallel',
          period: '下午',
          title: '分会场报告',
          notes: ['各分会场开展报告'],
          talks: [
            { time: '', title: '', speaker: '', affiliation: '' },
            { time: '', title: '', speaker: '', affiliation: '' },
            { time: '', title: '', speaker: '', affiliation: '' },
          ],
        },
        {
          id: 'oct17-pm-poster',
          category: 'poster',
          period: '下午',
          title: 'Rising Stars Poster 展示',
          notes: ['Rising Stars Poster 展示'],
        },
      ],
    },
    {
      dateTime: '2026-10-18',
      date: '2026.10.18',
      weekday: '周日',
      sessions: [
        {
          id: 'oct18-sessions',
          category: 'parallel',
          period: '全天',
          title: '分会场报告',
          notes: ['各分会场开展报告'],
          talks: [
            { time: '', title: '', speaker: '', affiliation: '' },
            { time: '', title: '', speaker: '', affiliation: '' },
            { time: '', title: '', speaker: '', affiliation: '' },
            { time: '', title: '', speaker: '', affiliation: '' },
          ],
        },
      ],
    },
  ],
  poster: {
    title: 'Rising Stars Poster',
    headline: '本次会议特设Rising Stars Poster，旨在为AI领域产学研各界同仁，特别是青年学子，搭建展示研究成果、促进学术交流的优质平台。',
    description:
      'Poster投稿条件：2025年1月1日之后在列表内期刊/会议录用中稿，列表包括 ICLR, NeurIPS, ICML, JMLR, T-PAMI, JASA, JRSSB, AoS, Biometrika, COLT, FOCS, STOC, TMLR, COLM, ACL, CVPR等。',
    requirements: [
      '2025年1月1日之后在列表内期刊/会议录用中稿',
      '列表包括 ICLR, NeurIPS, ICML, JMLR, T-PAMI, JASA, JRSSB, AoS, Biometrika, COLT, FOCS, STOC, TMLR, COLM, ACL, CVPR等',
    ],
    ticket: {
      value: 2400,
      currency: '人民币',
      label: '价值 2400 人民币的 X-AGI 会议正式门票（含茶歇、餐食、伴手礼等）',
    },
    benefits: [
      '价值 2400 人民币的 X-AGI 会议正式门票（含茶歇、餐食、伴手礼等）',
      '优秀简历直达合作企业技术负责人',
      '京外本科生机酒支持',
    ],
    deadline: {
      date: '2026.09.16',
      time: '24:00',
      dateTime: '2026-09-17T00:00:00+08:00',
    },
  },
  registration: {
    status: '报名开放中',
    url: 'https://www.bagevent.com/event/9252233',
    description: '普通参会与 Rising Stars Poster 共用同一报名入口。',
    notes: [
      '完成基础参会信息后，可在报名系统中选择相应报名类型。',
      '在读本科生、硕士生、博士生优先。',
      '报名参加 Rising Stars Poster 即赠专业票。',
    ],
  },
  tickets: {
    currency: 'RMB',
    columns: ['学生票', '非学生票'],
    bands: [
      {
        id: 'early-bird',
        label: '早鸟票',
        until: '9.26之前',
        rows: [
          { name: '游客票', student: 50, general: 150 },
          { name: '专业票', student: 800, general: 1600 },
        ],
      },
      {
        id: 'regular',
        label: '普通票',
        rows: [
          { name: '游客票', student: 100, general: 300 },
          { name: '专业票', student: 1200, general: 2400 },
        ],
      },
    ],
    notes: [
      '游客票仅包含胸牌权益，专业票包含胸牌、餐券、会员纪念品等权益。',
      '报名参加 Rising Stars Poster 即赠专业票。',
    ],
  },
  audiences: ['在读本科生、硕士生、博士生', '青年研究者', '高校教师', '行业专家', '企业与产业伙伴'],
  initiators: [
    {
      name: '统计之都',
      url: 'https://cosx.org',
      intro: [
        '统计之都（Capital of Statistics，简称COS，官网：https://cosx.org）成立于2006年，是一个开放的统计学与人工智能社区。创立19年来，统计之都始终致力于推动数据科学与人工智能的知识传播、技术创新与跨领域应用。通过持续贡献开源软件，组织撰写技术文章与专业书籍，举办技术论坛、学术会议、主题沙龙与竞赛活动，累计惠及全球超过百万从业者，成为中国最具影响力的中文数据科学社区之一。',
        '自2008年起，统计之都发起并主办中国R会议（China R Conference），旨在促进数据科学在各学科与行业中的探索、实践与交流。迄今，统计之都已联合全国20余所高校与科研机构，在北京、上海、广州、杭州、西安等14座城市成功举办近50届会议，呈现近2000场演讲，累计吸引线上线下参会者逾50万人次。',
        '2023年，统计之都启动全新研究倡议——X-AGI项目。“X”代表未知、交叉与探索，X-AGI以“交叉智能，计算未来”为使命，旨在促进跨学科、开放协作的人工智能前沿研究和交流。未来，统计之都将继续秉持人本、专业、正直的社区精神，深耕技术社区建设，促进科研与产业交融。',
      ],
    },
    {
      name: 'FAI 人工智能基础',
      url: 'https://www.fai-seminar.ac.cn/',
      intro: [
        '人工智能基础研究（FAI-Seminar）是一个聚焦人工智能基础领域的线上中文研讨班，致力于搭建人工智能基础研究的高质量学术交流平台，帮助相关学习者和研究者降低学术探索成本、促进思想碰撞。',
        'FAI-Seminar 至今已经成功举办三年。三年间，FAI举办了80余场线上学术讲座，累计获得了超过38万人次观看，微信群已经超过3000人，吸引了一批国内外关注人工智能基础研究的专家学者。',
      ],
    },
  ],
  organizers: [
    {
      name: '清华大学统计与数据科学系',
      url: 'https://www.stat.tsinghua.edu.cn/',
      intro: [
        '清华大学在统计学相关领域具有深厚的积累。我国概率统计学科的奠基人许宝騄1930年转入清华大学改学数学，1933年从算学系毕业，他是中国早期从事概率论和数理统计学研究并达到世界先进水平的一位杰出学者。1979年，清华大学重建数学系，并布局概率统计等方向，培养出以林希虹院士为代表的一批杰出统计学家。自2000年来，数学系教授林元烈、杨瑛始终致力于推动统计学科建设，并于2008年促成以哈佛大学林希虹教授、刘军教授为领衔的“统计讲席教授团”设立，举办统计学讲座、开设统计学课程，极大地促进了统计学科的发展。2011年学校获批统计学一级学科博士学位授权点，2015年统计学研究中心成立仪式举行。经过各方数十年地不懈努力，清华大学统计学在学术研究、学科建设、人才培养、社会服务等方面取得了长足进步，在数理统计、生物健康统计、统计机器学习及应用、经济与金融统计、工业统计与运筹学、交叉数据科学等重点应用方向形成了特色优势。',
        '2024年7月，我校成立统计与数据科学系，这是清华大学优化学科布局、服务国家战略的重要举措。未来清华大学统计与数据科学系将紧密围绕国家大数据战略、人工智能行动以及《数字中国建设整体布局规划》，立足“四个面向”的战略导向，针对国家重大需求、重大战略、重要部门，培养国际一流的统计学与数据科学领域综合性、创新型高层次人才，以全球视野对标世界一流，努力将统计与数据科学系建设成为国内外知名的产学研一体化学术重镇。',
      ],
    },
    {
      name: '中国人民大学应用统计科学研究中心',
      intro: [
        '中国人民大学应用统计科学研究中心成立于2000年9月，是教育部所属百所人文社会科学重点研究基地之一，旨在面向新时代统计学和数据科学发展的机遇和挑战，实现统计理论、方法和应用研究的突破与创新。中心在全国统计学科顶尖学者指导下，立足中国人民大学统计学科的优势研究力量，聚焦经济与社会统计、风险管理与精算、数理统计、生物统计与流行病学、数据科学与大数据统计五大研究领域，结合数字化时代背景，研究与新型数字技术相适应的统计基础理论、新型方法与统计应用技术，运用新型统计学理论和方法交叉组合研究解决我国经济社会领域发展过程中的重大现实问题，推动中国统计学自主知识体系建构。作为开放型学术平台，中心积极开展国家重大科研项目攻关，主办国际学术会议，主办国际化学术期刊，举办学术讲座，开展统计科普，努力建设成为具有国际影响力的统计和数据科学研究高地和创新策源地，持续推动统计学科发展和服务国家战略需求。',
      ],
    },
    {
      name: '中国人民大学统计学院',
      intro: [
        '中国人民大学统计学科始建于1950年，1952年设立统计学系，2003年成立统计学院。经过几代人的奋斗，我校统计学科取得了令人瞩目的成绩，成为中国统计教育的一面旗帜。',
        '学院坚持“卓越、厚重、创新、开放、坚定”的人才培养目标，建立了全方位、多层次、顺应时代发展的人才培养模式。统计学科在2007年教育部统计学科评估和2012年教育部统计学一级学科评估中均排名全国第一，在2017年全国第四轮学科评估中获得A+，并于2017、2022年连续入选“双一流”建设学科，是全国拥有理学、经济学、医学三大学科门类统计学专业最齐全的统计学科。统计学、应用统计学和经济统计学、数据科学与大数据技术四个本科专业均入选国家级一流本科专业建设点，2025年入选教育部统计学拔尖学生培养基地。',
      ],
    },
    {
      name: '中国商业统计学会人工智能分会',
      intro: [
        '中国商业统计学会人工智能分会是中国商业统计学会下属的分支机构，旨在汇聚高校、科研机构及人工智能企业等多方力量，推动人工智能与商业统计的深度融合。分会涵盖众多知名高校与企业，拥有完善的组织架构，其主要业务包括组织学术活动、推广知识技术、制定规范标准、开展产学研合作等，致力于促进人工智能在商业领域的应用与发展，为我国人工智能产业的健康进步贡献力量。',
      ],
    },
  ],
  coOrganizers: [
    {
      name: 'OScholar',
      url: 'https://oscholar.net/',
      intro: [
        'Oscholar 是一个“AI原生”学术交流与科研协作平台，将 AI 贯穿论文写作、同行评审、内容修改与精准推荐等科研全流程，期望突破传统学术出版的效率瓶颈，让优质科研成果更快被发表、传播与验证，构建可追溯、可验证、可复现的新型学术社区。',
      ],
    },
    {
      name: 'AI TIME',
      url: 'https://www.aitime.cn',
      intro: [
        'AI TIME成立于2019年，由清华大学人工智能研究院院长张钹院士、唐杰教授和李涓子教授等人联合发起“AI TIME Science Debate”，旨在发扬科学思辨精神，希望用辩论的形式，探讨人工智能和人类未来之间的矛盾，探索人工智能领域的未来。邀请各界人士对人工智能理论、算法、场景、应用的本质问题进行探索，加强思想碰撞，打造AI领域的优质生态圈。六年来，AI TIME已经邀请了2000多位海内外讲者，举办了逾800场活动，超1000万人次观看，汇集了全球逾百位志愿者团队。',
      ],
    },
  ],
  sponsors: [
    {
      name: '明汯投资',
      intro: [
        '明汯投资于2014年在上海虹口对冲基金产业园成立，借助强大的数据挖掘、统计分析和技术开发能力，构建了覆盖全周期、多品种、多策略的资产管理平台。自成立以来，明汯一直致力于成为国际一流量化投资机构，作为国内最早一批将人工智能技术成功应用到金融市场的私募机构，公司管理规模位居行业前列。',
      ],
    },
    {
      name: '宽德投资',
      intro: [
        '宽德投资是一家国内领先、业务全面的量化对冲基金。基于先进的高频交易构架，以及完善的资产管理系统，宽德投资在国内期货、股票、期权等主流市场具有出色的盈利能力。',
      ],
    },
    {
      name: 'Will',
      intro: [
        '宽德智能学习实验室(Wizard Intelligence Learning Lab，WILL)是宽德投资独立孵化的创业型实验室，致力于实现超级科技助手(ASI for Sci-Tech)。WILL将汇聚顶尖AI人才，专注于研发通用性超级科技助手，追求技术复利与持续性领先。',
      ],
    },
    {
      name: 'QuantVerse',
      intro: [
        '上海数启寰宇人工智能科技有限公司（简称“数启寰宇”）是一家深耕“AI+金融场景”的前沿科技企业，专注于算法研发及语料智能处理领域。依托于母公司在金融投资垂类模型应用的深厚积累、算力基础设施的持续高投入，借助大数据、自然语言处理、机器学习、深度学习、强化学习等关键技术，将量化交易算法模型、自动化交易执行模块等研发成果运用到量化组合管理中。未来数启寰宇还将从资产管理延展到财富管理领域、孵化出更多金融科技应用成果服务更多类型金融机构，同时筹备拓展至生物科技、实验室数据分析等更多行业垂类模型应用。',
        '在算力提升受限的大背景下，数启寰宇还着力深化与金融数据供应商战略合作，精准输出语料应用场景需求，通过股权投资完善产业链布局，由此构建高效率的采集、更智能的清洗、更精准的标注、更科学的测试，更个性的应用，极大提升数据处理工作效率与质量，优化模型参数设置并大幅提升模型训练、推理效果。',
      ],
    },
    {
      name: '智统数合',
      intro: [
        '北京智统数合科技有限公司是一家统计与数据科学赋能人工智能的高科技公司，旨在以统计学与人工智能技术赋能千行百业的智能化跃迁。公司立足世界一流的统计学与数据科学根基，自主研发出独树一帜的 “统计 × AI” 技术范式，从统计学视角解构并重组人工智能技术要素，将统计推断基因植入人工智能系统，打通垂直领域AI落地应用最后一公里。',
      ],
    },
  ],
  contact: 'xagi2026@cosx.org',
  pending: ['详细 Session 安排', '交通与住宿说明'],
} as const;

export const conference2026OrganizerDisplayOrder = [
  '清华大学统计与数据科学系',
  '中国人民大学应用统计科学研究中心',
  '中国人民大学统计学院',
  '统计之都',
  'FAI 人工智能基础',
  '中国商业统计学会人工智能分会',
] as const;

const conference2026Organizations = [
  ...conference2026.initiators,
  ...conference2026.organizers,
  ...conference2026.coOrganizers,
  ...conference2026.sponsors,
];

function organizationForDisplay(name: string): Organization {
  const organization = conference2026Organizations.find((candidate) => candidate.name === name);
  if (!organization) throw new Error(`Unknown 2026 organization: ${name}`);
  return organization;
}

export const conference2026PartnerDisplayGroups: readonly {
  key: 'organizers' | 'co-organizers' | 'sponsors';
  label: string;
  organizations: readonly Organization[];
}[] = [
  {
    key: 'organizers',
    label: '主办单位',
    organizations: conference2026OrganizerDisplayOrder.map(organizationForDisplay),
  },
  {
    key: 'co-organizers',
    label: '协办单位',
    organizations: conference2026.coOrganizers,
  },
  {
    key: 'sponsors',
    label: '赞助单位',
    organizations: conference2026.sponsors,
  },
];
