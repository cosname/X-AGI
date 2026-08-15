import { conference2026 } from '../data/conference2026.ts';
import type { EditionPage } from './navigation';
import { currentEdition, editionPath, type EditionConfig } from './site.ts';

export const CURRENT_EDITION_ACTION_PAGES = ['schedule', 'speakers', 'poster', 'register'] as const;

export type CurrentEditionActionPage = (typeof CURRENT_EDITION_ACTION_PAGES)[number];

export type CurrentEditionInnerPage = Exclude<EditionPage, '' | 'courses'>;

export interface EditionPageCopy {
  page: CurrentEditionInnerPage;
  label: string;
  description: string;
  status: string;
  next: {
    eyebrow: string;
    title: string;
    description: string;
    href: string;
    label: string;
  };
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
    speakers: editionPath(edition, 'speakers'),
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
  edition: EditionConfig = currentEdition,
): EditionPageCopy {
  const actions = currentEditionActionPaths(edition);
  const registrationOpen = isRegistrationOpen(conference);
  const registerNext = {
    eyebrow: 'REGISTRATION',
    title: '报名已开放，从这里继续',
    description: conference.registration.description,
    href: actions.register,
    label: '立即报名',
  } as const;

  switch (page) {
    case 'about':
      return {
        page,
        label: '会议简介',
        description: '会议定位、宗旨与组织信息。',
        status: conference.name,
        next: {
          eyebrow: 'NEXT',
          title: '了解会议如何展开',
          description: '查看三天会议结构、重点活动与当前已确认安排。',
          href: actions.schedule,
          label: '查看日程安排',
        },
      };
    case 'speakers':
      return {
        page,
        label: '嘉宾阵容',
        description: '嘉宾名单将在确认后发布。',
        status: '嘉宾确认中',
        next: {
          eyebrow: 'PROGRAM',
          title: '先了解会议结构',
          description: '在嘉宾信息公布前，可以先查看三天会议的重点安排。',
          href: actions.schedule,
          label: '查看日程安排',
        },
      };
    case 'schedule':
      return {
        page,
        label: '日程安排',
        description: '三天会议流程安排。',
        status: '流程安排',
        next: {
          eyebrow: 'NEXT',
          title: '进一步了解青年研究展示',
          description: '查看 Rising Stars Poster 的申请要求、入选权益与报名截止时间。',
          href: actions.poster,
          label: '了解 Rising Stars',
        },
      };
    case 'poster':
      return {
        page,
        label: 'Rising Stars',
        description: 'Rising Stars Poster 申请要求、入选权益与报名信息。',
        status: registrationOpen ? conference.registration.status : '申请通道确认中',
        next: registrationOpen
          ? {
              eyebrow: 'REGISTRATION',
              title: '通过统一入口提交 Poster',
              description: conference.registration.description,
              href: actions.register,
              label: '立即报名',
            }
          : {
              eyebrow: 'PROGRAM',
              title: '查看 Poster 所在的会议节奏',
              description: 'Rising Stars 的预交流与集中展示已经纳入三天会议结构。',
              href: actions.schedule,
              label: '查看日程安排',
            },
      };
    case 'guide':
      return {
        page,
        label: '参会指南',
        description: '会场、交通与住宿信息。',
        status: '会场示意图已发布',
        next: registrationOpen
          ? registerNext
          : {
              eyebrow: 'REGISTRATION',
              title: '报名入口确认后从这里继续',
              description: '报名入口与参会说明将在确认后统一发布。',
              href: actions.register,
              label: '查看报名状态',
            },
      };
    case 'register':
      return {
        page,
        label: '报名信息',
        description: registrationOpen
          ? conference.registration.description
          : '报名状态将在确认后更新。',
        status: conference.registration.status,
        next: {
          eyebrow: 'PROGRAM',
          title: '报名之前，先确认会议安排',
          description: '查看三天会议结构，了解报到、报告、Poster 与青年交流的时间分布。',
          href: actions.schedule,
          label: '查看日程安排',
        },
      };
  }
}
