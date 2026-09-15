import { conference2026ProgramSessions } from './conference2026-program.generated.ts';
import { conference2026PersonForName } from './conference2026-people.ts';
import { conference2026 } from './conference2026.ts';

export const posterConference = {
  name: conference2026.nameZhOfficial,
  nameEn: conference2026.nameEn,
  date: conference2026.dates.compact,
  venue: conference2026.venue.name,
};

export const sessionPosters = conference2026ProgramSessions.map((session, index) => {
  const number = index + 1;
  const id = `session-${String(number).padStart(2, '0')}`;
  const match = /^10\.(17|18)(上午|下午)$/.exec(session.sourceTime);
  if (!match) throw new Error(`Unrecognized poster date: ${session.sourceTime}`);
  const people = (records: typeof session.speakers, speaker: boolean) => records.map((record) => {
    const profile = conference2026PersonForName(record.name);
    return {
      name: record.name,
      affiliation: record.affiliation ?? profile?.affiliation ?? '',
      talkTitle: speaker ? profile?.talkTitle ?? record.talkTitle ?? '' : '',
      portraitSrc: profile?.portraitSrc ?? '',
    };
  });
  return {
    number,
    id,
    title: session.title,
    sourceTime: session.sourceTime,
    day: match[1] as '17' | '18',
    dateLabel: `10 月 ${match[1]} 日 · ${match[2]}`,
    href: `/schedule/#schedule-${id}`,
    posterSrc: `/2026/session-posters/${id}.webp`,
    previewSrc: `/2026/session-posters/${id}-preview.webp`,
    chairs: people(session.chairs, false),
    speakers: people(session.speakers, true),
  };
});

export type SessionPoster = (typeof sessionPosters)[number];
