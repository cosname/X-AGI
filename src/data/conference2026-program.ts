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
]);
// The organizer's October 9 biography confirms his current employer.
const confirmedAffiliations = new Map([['王淏楠', 'Sharpa']]);
const revisedSessions = sourceSessions.map((session) => ({
  ...session,
  speakers: session.speakers.map((person) => {
    const talkTitle = confirmedTalkTitles.get(person.name);
    const affiliation = confirmedAffiliations.get(person.name);
    return {
      ...person,
      ...(talkTitle ? { talkTitle } : {}),
      ...(affiliation ? { affiliation } : {}),
    };
  }),
}));
export const conference2026ProgramSessions = withOrganizerRemarks(revisedSessions);
