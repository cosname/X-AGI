export type PartnerLogo = {
  src: string;
  compactSrc?: string;
  className?: string;
};

const logos = {
  清华大学统计与数据科学系: {
    src: '/2026/logos/tsinghua-stat.png',
    compactSrc: '/2026/logos/tsinghua-stat-on-dark.webp',
    className: 'organizer-tsinghua',
  },
  中国人民大学应用统计科学研究中心: {
    src: '/2026/logos/ruc-cas.png',
    compactSrc: '/2026/logos/ruc-cas-on-dark.webp',
  },
  中国人民大学统计学院: {
    src: '/2026/logos/ruc-stat.png',
    compactSrc: '/2026/logos/ruc-stat-on-dark.webp',
  },
  统计之都: {
    src: '/2026/logos/cos.png',
    compactSrc: '/2026/logos/cos-on-dark.webp',
  },
  中国商业统计学会人工智能分会: {
    src: '/2026/logos/cssc-ai.png',
    compactSrc: '/2026/logos/cssc-ai-on-dark.webp',
  },
  'FAI 人工智能基础': {
    src: '/2026/logos/fai.png',
    compactSrc: '/2026/logos/fai-on-dark.webp',
  },
  OScholar: {
    src: '/2026/logos/oscholar.png',
    compactSrc: '/2026/logos/oscholar-on-dark.webp',
  },
  'AI TIME': {
    src: '/2026/logos/ai-time.png',
    compactSrc: '/2026/logos/ai-time-on-dark.webp',
  },
  明汯投资: {
    src: '/2026/logos/minghong.png',
    compactSrc: '/2026/logos/minghong-on-dark.webp',
  },
  宽德投资: {
    src: '/2026/logos/kuande.png',
    compactSrc: '/2026/logos/kuande-on-dark.webp',
    className: 'sponsor-kuande',
  },
  Will: {
    src: '/2025/assets/images/logo_will.png',
    compactSrc: '/2025/assets/images/logos_t/optimized/logo_will.webp',
    className: 'sponsor-will',
  },
  QuantVerse: {
    src: '/2025/assets/images/logo_QuantVerse.png',
    compactSrc: '/2025/assets/images/logos_t/optimized/logo_QuantVerse.webp',
    className: 'sponsor-quantverse',
  },
  智统数合: {
    src: '/2026/logos/zhitong-shuhe.webp',
    compactSrc: '/2026/logos/zhitong-shuhe.webp',
    className: 'sponsor-zhitong-shuhe',
  },
} as const satisfies Record<string, PartnerLogo>;

export const partnerLogoByName: Record<string, PartnerLogo> = logos;

export const partnerCompactLogoByName: Record<string, PartnerLogo> = Object.fromEntries(
  (Object.entries(logos) as [string, PartnerLogo][]).map(([name, logo]) => [
    name,
    {
      ...logo,
      src: logo.compactSrc ?? logo.src,
    },
  ]),
);
