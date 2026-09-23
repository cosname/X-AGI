import { conference2026ProgramSessions } from './conference2026-program.ts';
import { conference2026PersonForName } from './conference2026-people.ts';

export type HomeSpeaker = {
  readonly id: string;
  readonly name: string;
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
        seen.add(key);
        const sessionLabel = String(sessionIndex + 1).padStart(2, '0');
        speakers.push({
          id: person?.id ?? `schedule-${role}-${sessionLabel}-${personIndex + 1}`,
          name: scheduledPerson.name,
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
