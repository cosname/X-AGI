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

// Keep the revised attendee title while the Tencent sheet still has the old one.
const confirmedTalkTitles = new Map([
  ['许洪腾', 'An Improved SE(3)-Transformer Driven by Hamiltonian Flow'],
]);
const revisedSessions = sourceSessions.map((session) => ({
  ...session,
  speakers: session.speakers.map((person) => {
    const talkTitle = confirmedTalkTitles.get(person.name);
    return talkTitle ? { ...person, talkTitle } : person;
  }),
}));
export const conference2026ProgramSessions = withOrganizerRemarks(revisedSessions);
