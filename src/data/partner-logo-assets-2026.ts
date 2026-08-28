export type PartnerLogo = {
  src: string;
  className?: string;
};

const logos = {
  清华大学统计与数据科学系: {
    src: '/2026/logos/tsinghua-stat.png',
    className: 'organizer-tsinghua',
  },
  中国人民大学应用统计科学研究中心: {
    src: '/2026/logos/ruc-cas.png',
  },
  中国人民大学统计学院: {
    src: '/2026/logos/ruc-stat.png',
  },
  统计之都: {
    src: '/2026/logos/cos.png',
  },
  中国商业统计学会人工智能分会: {
    src: '/2026/logos/cssc-ai.png',
  },
  'FAI 人工智能基础': {
    src: '/2026/logos/fai.png',
  },
  OScholar: {
    src: '/2026/logos/oscholar.png',
    className: 'co-organizer-oscholar',
  },
  'AI TIME': {
    src: '/2026/logos/ai-time.png',
    className: 'co-organizer-ai-time',
  },
  黄大年茶思屋科技网站: {
    src: '/2026/logos/chaspark.png',
    className: 'strategic-partner-chaspark',
  },
  明汯投资: {
    src: '/2026/logos/minghong.png',
  },
  宽德投资: {
    src: '/2026/logos/kuande.png',
    className: 'sponsor-kuande',
  },
  Will: {
    src: '/2026/logos/will.svg',
    className: 'sponsor-will',
  },
  QuantVerse: {
    src: '/2026/logos/quantverse.png',
    className: 'sponsor-quantverse',
  },
  智统数合: {
    src: '/2026/logos/zhitong-shuhe.png',
    className: 'sponsor-zhitong-shuhe',
  },
  '澎峰科技（PerfXLab）': {
    src: '/2026/logos/perfxlab.svg',
    className: 'sponsor-perfxlab',
  },
} as const satisfies Record<string, PartnerLogo>;

export const partnerLogoByName: Record<string, PartnerLogo> = logos;

export function partnerLogoForName(name: string): PartnerLogo | undefined {
  return partnerLogoByName[name];
}
