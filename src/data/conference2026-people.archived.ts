import type { Conference2026PersonSourceRecord } from './conference2026-people.generated.ts';

// Public 2025 profiles reused at the organizer's request on 2026-09-17.
// Current attendee and organizer-confirmed profiles take precedence over this fallback.
// Source: public/2025/schedule.html, the Hu Tianyang Chair block.
export const conference2026ArchivedPeople: readonly Conference2026PersonSourceRecord[] = [
  {
    id: 'hu-tianyang',
    name: '胡天阳',
    aliases: [],
    roles: ['chair'],
    affiliation: '香港中文大学（深圳）',
    department: '数据科学学院',
    bio: '胡天阳现为香港中文大学（深圳）数据科学学院的助理教授。他的主要研究方向为人工智能与统计的交叉领域，包括统计机器学习、可信 AI、特征表示学习、深度生成模型等，旨在通过揭示 AI 模型的深层机制，为设计更有效的新算法提供理论指导。',
    hasSubmittedPortrait: false,
    sourceOrder: -1,
  },
];

// Named portraits from the 2025 schedule, copied to the 2026 asset namespace.
export const conference2026ArchivedPortraits = new Map([
  ['liu-jun', '/2026/people/liu-jun-portrait.webp'],
  ['ma-ziye', '/2026/people/ma-ziye-portrait.webp'],
]);
