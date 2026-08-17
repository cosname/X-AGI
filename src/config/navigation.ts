import type { EditionConfig } from './site';

export type EditionPage =
  | ''
  | 'about'
  | 'speakers'
  | 'schedule'
  | 'poster'
  | 'courses'
  | 'guide'
  | 'register';

interface NavigationItem {
  page: EditionPage;
  label: string;
}

const navigationByEdition: Record<EditionConfig['year'], readonly NavigationItem[]> = {
  '2025': [
    { page: '', label: '首页' },
    { page: 'about', label: '会议简介' },
    { page: 'schedule', label: '日程安排' },
    { page: 'courses', label: '短期课程' },
    { page: 'guide', label: '参会指南' },
  ],
  '2026': [
    { page: '', label: '首页' },
    { page: 'about', label: '会议简介' },
    { page: 'schedule', label: '日程安排' },
    { page: 'poster', label: 'Rising Stars Poster' },
    { page: 'guide', label: '参会指南' },
  ],
};

export function editionNavigation(edition: EditionConfig): readonly NavigationItem[] {
  return navigationByEdition[edition.year];
}

export function editionPages(edition: EditionConfig): readonly EditionPage[] {
  return [...navigationByEdition[edition.year].map(({ page }) => page), 'register'];
}
