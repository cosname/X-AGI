export type PartnerLogo = {
  src: string;
  className?: string;
};

const logos = {
  清华大学统计与数据科学系: {
    src: '/2026/logos/tsinghua-stat.svg',
    className: 'organizer-tsinghua',
  },
  中国人民大学应用统计科学研究中心: {
    src: '/2026/logos/ruc-cas.svg',
  },
  中国人民大学统计学院: {
    src: '/2026/logos/ruc-stat.svg',
  },
  统计之都: {
    src: '/2026/logos/cos.svg',
  },
  中国商业统计学会人工智能分会: {
    src: '/2026/logos/cssc-ai.svg',
  },
  'FAI 人工智能基础': {
    src: '/2026/logos/fai.svg',
  },
  OScholar: {
    src: '/2026/logos/oscholar.svg',
    className: 'co-organizer-oscholar',
  },
  'AI TIME': {
    src: '/2026/logos/ai-time.svg',
    className: 'co-organizer-ai-time',
  },
  清华大学经济管理学院研究生分会: {
    src: '/2026/logos/tsinghua-sem-graduate.svg',
    className: 'co-organizer-tsinghua-sem-graduate',
  },
  黄大年茶思屋科技网站: {
    src: '/2026/logos/chaspark.svg',
    className: 'strategic-partner-chaspark',
  },
  明汯投资: {
    src: '/2026/logos/minghong.svg',
  },
  宽德投资: {
    src: '/2026/logos/kuande.svg',
    className: 'sponsor-kuande',
  },
  Will: {
    src: '/2026/logos/will.svg',
    className: 'sponsor-will',
  },
  QuantVerse: {
    src: '/2026/logos/quantverse.svg',
    className: 'sponsor-quantverse',
  },
  智统数合: {
    src: '/2026/logos/zhitong-shuhe.svg',
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
