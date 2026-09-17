import type { Conference2026PersonSourceRecord } from './conference2026-people.generated.ts';

// Organizer-confirmed profile, 2026-09-17.
// Keep this supplied copy separate from the attendee workbook snapshot.
export const conference2026ConfirmedPeople: readonly Conference2026PersonSourceRecord[] = [
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
];

// Reused at the organizer's request from the named 2025 schedule portrait.
export const conference2026ArchivedPortraits = new Map([
  ['liu-jun', '/2026/people/liu-jun-portrait.webp'],
]);
