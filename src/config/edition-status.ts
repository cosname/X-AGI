import { conference2026 } from '../data/conference2026.ts';
import type { EditionPage } from './navigation';
import { currentEdition, editionPath, type EditionConfig } from './site.ts';

export const CURRENT_EDITION_ACTION_PAGES = ['schedule', 'poster', 'register'] as const;

export type CurrentEditionActionPage = (typeof CURRENT_EDITION_ACTION_PAGES)[number];

export type CurrentEditionInnerPage = Exclude<EditionPage, '' | 'courses' | 'speakers'>;

export interface EditionPageCopy {
  page: CurrentEditionInnerPage;
  label: string;
  description: string;
  status: string;
}

const CLOSED_OFFERING_MARKERS = [
  '尚未开放',
  '申请信息即将发布',
  '报名已截止',
  '报名关闭',
] as const;

export function currentEditionActionPaths(edition: EditionConfig = currentEdition) {
  return {
    schedule: editionPath(edition, 'schedule'),
    poster: editionPath(edition, 'poster'),
    register: editionPath(edition, 'register'),
  } as const;
}

export function statusDescribesClosedOffering(text: string): boolean {
  return CLOSED_OFFERING_MARKERS.some((marker) => text.includes(marker));
}

export function isRegistrationOpen(
  conference: Pick<typeof conference2026, 'registration'> = conference2026,
): boolean {
  return Boolean(conference.registration.url) && !statusDescribesClosedOffering(conference.registration.status);
}

export function currentEditionPageCopy(
  page: CurrentEditionInnerPage,
  conference: typeof conference2026 = conference2026,
): EditionPageCopy {
  const registrationOpen = isRegistrationOpen(conference);

  switch (page) {
    case 'about':
      return {
        page,
        label: '会议简介',
        description: '会议定位、宗旨与组织信息。',
        status: conference.name,
      };
    case 'schedule':
      return {
        page,
        label: '日程安排与嘉宾',
        description: '三天会议流程、分会场与嘉宾报告。',
        status: conference.name,
      };
    case 'poster':
      return {
        page,
        label: 'Rising Stars Poster',
        description: 'Rising Stars Poster 申请要求、入选权益与报名信息。',
        status: registrationOpen ? conference.registration.status : '申请通道确认中',
      };
    case 'guide':
      return {
        page,
        label: '参会指南',
        description: '会场、交通与住宿信息。',
        status: '会场示意图已发布',
      };
    case 'register':
      return {
        page,
        label: '报名信息',
        description: registrationOpen
          ? conference.registration.description
          : '报名状态将在确认后更新。',
        status: conference.registration.status,
      };
  }
}
