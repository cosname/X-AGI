export type EditionStatus = 'archived' | 'planning' | 'published';

export interface EditionConfig {
  year: '2025' | '2026';
  status: EditionStatus;
  path: '' | `/${string}`;
  routeStyle: 'html' | 'directory';
  skin?: 'legacy-2025' | 'next';
  title: string;
  titleZh: string;
  description: string;
  date?: string;
  venue?: string;
  contact?: string;
}

export const site = {
  name: 'X-AGI Conference',
  origin: 'https://www.x-agi.cc',
  currentEdition: '2026',
  upcomingEdition: '2026',
} as const;

export const editions: Record<EditionConfig['year'], EditionConfig> = {
  '2025': {
    year: '2025',
    status: 'archived',
    path: '/2025',
    routeStyle: 'html',
    title: '2025 X-AGI & The 18th China-R Conference',
    titleZh: '2025 X智能大会 & 第18届中国R会议',
    description: '2025 X-AGI 与第18届中国R会议的官方归档网站。',
    date: '2025.10.17-10.19',
    venue: '北京会议中心',
    contact: 'xagi-2025@cosx.org',
  },
  '2026': {
    year: '2026',
    status: 'published',
    path: '',
    routeStyle: 'directory',
    skin: 'legacy-2025',
    title: '2026 X-AGI Conference',
    titleZh: '2026 X-AGI 大会',
    description: '2026 X-AGI 大会将于2026年10月16日至18日在北京友谊宾馆举行，连接统计、数据科学与人工智能的下一代研究者。',
    date: '2026.10.16-18',
    venue: '北京友谊宾馆',
    contact: 'xagi2026@cosx.org',
  },
};

export const currentEdition = editions[site.currentEdition];
export const upcomingEdition = editions[site.upcomingEdition];

/** Parked cream / pixel 2026 design. Public site stays on the 2025 template. */
export const nextDesignEdition: EditionConfig = {
  ...editions['2026'],
  path: '/next',
  skin: 'next',
};

export function editionPath(edition: EditionConfig, page = ''): string {
  const base = edition.path;
  if (!page) return base ? `${base}/` : '/';
  return edition.routeStyle === 'html'
    ? `${base}/${page}.html`
    : `${base}/${page}/`;
}
