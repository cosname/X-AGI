import { conference2026ProgramSessions } from './conference2026-program.ts';
import { conference2026PersonForName } from './conference2026-people.ts';

// Short display labels taken from the existing public biographies.
// English roles are translated for the Chinese homepage; evidence stays verbatim.
const positions: Record<string, { label: string; evidence: string }> = {
  'liu-jun': { label: '兴华卓越讲席教授', evidence: '清华大学兴华卓越讲席教授' },
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
};

export type HomeSpeaker = {
  readonly id: string;
  readonly name: string;
  readonly position?: string;
  readonly affiliation: string;
  readonly portraitSrc: string;
  readonly href: string;
};

function buildHomeSpeakers(): readonly HomeSpeaker[] {
  const seen = new Set<string>();
  const speakers: HomeSpeaker[] = [];
  for (const [sessionIndex, session] of conference2026ProgramSessions.entries()) {
    for (const [speakerIndex, speaker] of session.speakers.entries()) {
      const person = conference2026PersonForName(speaker.name);
      if (!person?.portraitSrc || seen.has(person.id)) continue;
      const position = positions[person.id];
      if (position && !person.bio?.includes(position.evidence)) {
        throw new Error(`Recheck the homepage position against the updated biography for ${person.name}.`);
      }
      seen.add(person.id);
      speakers.push({
        id: person.id,
        name: speaker.name,
        ...(position ? { position: position.label } : {}),
        affiliation: person.affiliation,
        portraitSrc: person.portraitSrc,
        href: `/schedule/#schedule-person-${String(sessionIndex + 1).padStart(2, '0')}-speaker-${person.id}-${speakerIndex + 1}`,
      });
    }
  }
  return speakers;
}

export const homeSpeakers = buildHomeSpeakers();
