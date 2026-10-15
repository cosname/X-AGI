import {
  conference2026ProgramSessions as sourceSessions,
  type Conference2026ProgramSourceSession,
} from './conference2026-program.generated.ts';

// Organizer-confirmed addition, 2026-09-17: Liu Jun gives the opening address.
// Keep the Tencent snapshot intact; retire this supplement when the source owns it.
const organizerRemarks = { name: '刘军', affiliation: '清华大学', talkTitle: '主办方致辞' } as const;

export function withOrganizerRemarks(
  sessions: readonly Conference2026ProgramSourceSession[],
): readonly Conference2026ProgramSourceSession[] {
  if (!sessions.some((session) => session.title === 'Keynote')) {
    throw new Error('The confirmed organizer address requires the Keynote session.');
  }
  return sessions.map((session) => {
    if (session.title !== 'Keynote') return session;
    const existing = session.speakers.find((speaker) => speaker.name === organizerRemarks.name);
    return {
      ...session,
      speakers: [
        { ...organizerRemarks, ...existing, talkTitle: organizerRemarks.talkTitle },
        ...session.speakers.filter((speaker) => speaker.name !== organizerRemarks.name),
      ],
    };
  });
}

// Keep the organizer-confirmed attendee titles while Tencent has older versions.
const confirmedTalkTitles = new Map([
  ['孙茂松', '人工智能随想录'],
  ['许洪腾', 'An Improved SE(3)-Transformer Driven by Hamiltonian Flow'],
  ['刘方辉', '深度学习理论的技术科学道路'],
  ['王淏楠', 'Signal and Noise in On-Policy Distillation: 1% of Tokens Can Be Enough'],
  ['周峰', '高效大模型'],
]);
// The organizer's October 9 biography confirms his current employer.
const confirmedAffiliations = new Map([['王淏楠', 'Sharpa']]);
// Organizer-confirmed withdrawals, 2026-10-13.
const withdrawnSpeakers = new Set(['周帆', '毛小介', '张华枫', '刘子寅']);
const revisedSessions = sourceSessions.map((sourceSession) => {
  // Organizer-confirmed October 15 title and three-speaker lineup.
  // Keep this correction until the next Tencent snapshot includes it.
  const session: Conference2026ProgramSourceSession = ['语言模型基础', '扩散语言模型'].includes(sourceSession.title)
    ? {
      ...sourceSession,
      title: '扩散语言模型',
      speakers: [
        {
          name: '刘华斌',
          affiliation: '蚂蚁集团',
          talkTitle: 'Parallel Generation, Iterative Refinement: The Evolution of LLaDA 2.x in Practice',
        },
        {
          name: '胡天阳',
          affiliation: '香港中文大学（深圳）',
          talkTitle: '扩散式语言建模探索：从掩码扩散到连续扩散',
        },
        {
          name: '李根',
          affiliation: '香港中文大学',
          talkTitle: 'ConvergeFlow: Language Flow with Provable Convergence to Token Embeddings',
        },
      ],
    }
    : sourceSession;
  const availableSpeakers = session.speakers.filter((person) => !withdrawnSpeakers.has(person.name));
  // Organizer-confirmed October 13 lineup: Zhou Feng gives the final talk.
  const speakers = session.title === 'AI的数理和计算基础'
    ? [
      ...availableSpeakers.filter((person) => person.name !== '周峰'),
      { name: '周峰', affiliation: '中国人民大学' },
    ]
    : availableSpeakers;
  // The organizer reserved a third 40-minute talk; the speaker is not confirmed yet.
  if (session.title === 'Physics of Deep Learning' && speakers.length === 2) {
    speakers.push({ name: 'TBD' });
  }
  return {
    ...session,
    speakers: speakers.map((person) => {
      const talkTitle = confirmedTalkTitles.get(person.name);
      const affiliation = confirmedAffiliations.get(person.name);
      return {
        ...person,
        ...(talkTitle ? { talkTitle } : {}),
        ...(affiliation ? { affiliation } : {}),
      };
    }),
  };
});
export const conference2026ProgramSessions = withOrganizerRemarks(revisedSessions);
