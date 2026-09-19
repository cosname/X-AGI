import { conference2026ProgramSessions } from './conference2026-program.ts';
import { conference2026PersonForName } from './conference2026-people.ts';

// Short display labels taken from the existing public biographies.
// English roles are translated for the Chinese homepage; evidence stays verbatim.
const positions: Record<string, { label: string; evidence: string }> = {
  'liu-jun': { label: '兴华卓越讲席教授', evidence: '清华大学兴华卓越讲席教授' },
  'sun-maosong': { label: '教授', evidence: '清华大学计算机科学与技术系教授' },
  'feng-jianfeng': { label: '浩清教授', evidence: '复旦大学浩清教授' },
  'qiu-zihan': { label: 'Qwen 预训练团队', evidence: '现就职于 Qwen 预训练团队' },
  'luo-tao': { label: '副教授', evidence: '数学科学学院/自然科学研究院副教授' },
  'zhang-huaqing': { label: '博士研究生', evidence: 'a first-year PhD at IIIS, Tsinghua University' },
  'hu-yiwen': { label: '博士研究生', evidence: '中国人民大学博士研究生' },
  'chen-huanran': { label: '博士研究生', evidence: 'a PhD student at Tsinghua SAIL' },
  'zhang-huafeng': { label: 'CTO', evidence: '现任为沃科技（南京）技术有限公司 CTO' },
  'zhang-xianyi': { label: '创始人', evidence: '澎峰科技创始人' },
  'han-jiale': { label: '研究助理教授', evidence: '社会科学智能中心研究助理教授' },
  'luyao-zhang': { label: '经济学助理教授', evidence: 'Assistant Professor of Economics' },
  'yuan-zhang': { label: '金融学副教授', evidence: 'Associate Professor of Finance' },
  'huang-ruizhao': { label: '博士候选人', evidence: 'a PhD candidate at The Hong Kong University of Science and Technology' },
  'shi-zuoqiang': { label: '长聘教授', evidence: '丘成桐数学科学中心长聘教授' },
  'lu-yiping': { label: '助理教授', evidence: '北京国际数学研究中心助理教授' },
  'jiao-yuling': { label: '教授、副院长', evidence: '教授博导，副院长' },
  'chen-qing': { label: '副教授', evidence: '设计创意学院副教授' },
  'tu-shangqing': { label: '博士研究生', evidence: '清华大学计算机系博士生' },
  'huang-pei': { label: '副总裁', evidence: '成都华栖云科技有限公司副总裁' },
  'wu-tailin': { label: '助理教授', evidence: '特聘研究员、助理教授' },
  'xie-chao': { label: '助理教授', evidence: '心理与认知科学系助理教授' },
  'li-qiuyi': { label: 'AI for Science 研究员', evidence: 'AI for Science研究员' },
  'ma-jianhao': { label: '助理教授', evidence: '工业工程系助理教授' },
  'zhao-peng': { label: '准聘副教授', evidence: '人工智能学院准聘副教授' },
  'chang-heng': { label: '首席 AI 科学家', evidence: '现任Unity China首席AI科学家' },
  'liu-ziming': { label: '助理教授', evidence: '人工智能学院助理教授' },
  'zhang-yaoyu': { label: '长聘教轨副教授', evidence: '上海交通大学长聘教轨副教授' },
  'liu-weiyang': { label: '助理教授', evidence: '计算机科学与工程系助理教授' },
  'cao-yuan': { label: '助理教授', evidence: 'an assistant professor in the School of Computing and Data Science' },
  'li-gen': { label: '助理教授', evidence: 'an assistant professor in the Department of Statistics and Data Science' },
  'luo-weijian': { label: '多模态大模型研究员', evidence: '多模态大模型研究员' },
  'zhou-fan': { label: '常任教授', evidence: '统计与数据科学学院常任教授' },
  'ma-junjie': { label: '长聘副研究员', evidence: '中国科学院数学与系统科学研究院长聘副研究员' },
  'xu-hongteng': { label: '副教授', evidence: '高瓴人工智能学院副教授' },
  'mao-xiaojie': { label: '副教授', evidence: '管理科学与工程系副教授' },
  'wang-hongning': { label: '长聘副教授', evidence: '清华大学计算机系长聘副教授' },
  'li-peng': { label: '副研究员', evidence: '清华大学智能产业研究院副研究员' },
  'yan-yukun': { label: '副研究员', evidence: '大模型中心副研究员' },
  'cong-xin': { label: '助理教授', evidence: '统计与数据科学系助理教授' },
  'zhou-mo': { label: '助理教授', evidence: '北京大学数学科学学院助理教授' },
  'ma-ziye': { label: '助理教授', evidence: '香港城市大学计算机系助理教授' },
  'hu-tianyang': { label: '助理教授', evidence: '数据科学学院的助理教授' },
  'zhou-feng': { label: '副教授', evidence: '中国人民大学统计学院副教授' },
};

export type HomeSpeaker = {
  readonly id: string;
  readonly name: string;
  readonly position?: string;
  readonly affiliation: string;
  readonly portraitSrc?: string;
  readonly href: string;
};

function buildHomeSpeakers(): readonly HomeSpeaker[] {
  const seen = new Set<string>();
  const speakers: HomeSpeaker[] = [];
  // Preserve the speaker order and biography links, then append Chair-only guests.
  for (const role of ['speaker', 'chair'] as const) {
    for (const [sessionIndex, session] of conference2026ProgramSessions.entries()) {
      const scheduledPeople = role === 'speaker' ? session.speakers : session.chairs;
      for (const [personIndex, scheduledPerson] of scheduledPeople.entries()) {
        if (scheduledPerson.name === '待确认') continue;
        const person = conference2026PersonForName(scheduledPerson.name);
        const key = person ? `person:${person.id}` : `name:${scheduledPerson.name}`;
        if (seen.has(key)) continue;
        const position = person ? positions[person.id] : undefined;
        if (position && !person?.bio?.includes(position.evidence)) {
          throw new Error(`Recheck the homepage position against the updated biography for ${scheduledPerson.name}.`);
        }
        seen.add(key);
        const sessionLabel = String(sessionIndex + 1).padStart(2, '0');
        speakers.push({
          id: person?.id ?? `schedule-${role}-${sessionLabel}-${personIndex + 1}`,
          name: scheduledPerson.name,
          ...(position ? { position: position.label } : {}),
          affiliation: person?.affiliation ?? scheduledPerson.affiliation ?? '',
          portraitSrc: person?.portraitSrc,
          href: person
            ? `/schedule/#schedule-person-${sessionLabel}-${role}-${person.id}-${personIndex + 1}`
            : `/schedule/#schedule-session-${sessionLabel}`,
        });
      }
    }
  }
  // Keep each group's order until all portraits are ready for the final lineup.
  return [
    ...speakers.filter((speaker) => speaker.portraitSrc),
    ...speakers.filter((speaker) => !speaker.portraitSrc),
  ];
}

export const homeSpeakers = buildHomeSpeakers();
