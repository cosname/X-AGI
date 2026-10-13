import type { Conference2026ProgramSourceSession } from './conference2026-program.generated.ts';
import type { ScheduleSession, ScheduleTalk } from './conference2026.ts';

function formatTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export function programSessionTalks(
  session: Conference2026ProgramSourceSession,
  timetable: ScheduleSession | undefined,
): readonly ScheduleTalk[] {
  if (timetable?.category !== 'parallel') return timetable?.talks ?? [];

  const count = session.speakers.length;
  const match = timetable.time?.match(/^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/u);
  if (!match || ![3, 4].includes(count)) {
    throw new Error(`Confirm individual talk times for ${session.title}.`);
  }
  const [startHour, startMinute, endHour, endMinute] = match.slice(1).map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  if (startHour > 23 || endHour > 23 || startMinute > 59 || endMinute > 59 || end - start !== 120) {
    throw new Error(`Expected a two-hour parallel session for ${session.title}.`);
  }

  const duration = 120 / count;
  return session.speakers.map((speaker, index) => ({
    speaker: speaker.name,
    affiliation: speaker.affiliation,
    title: speaker.talkTitle ?? '',
    time: `${formatTime(start + duration * index)}-${formatTime(start + duration * (index + 1))}`,
  }));
}
