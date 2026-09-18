import {
  conference2026PeopleRecords,
  type Conference2026PersonRole,
  type Conference2026PersonSourceRecord,
} from './conference2026-people.generated.ts';
import { conference2026ProgramSessions } from './conference2026-program.ts';
import {
  conference2026ConfirmedPeople,
  conference2026ConfirmedBios,
  conference2026ConfirmedPortraits,
} from './conference2026-people.confirmed.ts';
import {
  conference2026ArchivedPeople,
  conference2026ArchivedPortraits,
} from './conference2026-people.archived.ts';

export type { Conference2026PersonRole } from './conference2026-people.generated.ts';

export type Conference2026PortraitStatus = 'submitted' | 'archived' | 'missing';

export type Conference2026PersonScheduleItem = {
  readonly sessionNumber: number;
  readonly sourceTime: string;
  readonly title: string;
  readonly role: Conference2026PersonRole;
  readonly talkTitle?: string;
  readonly href: string;
};

export type Conference2026Person = Omit<Conference2026PersonSourceRecord, 'talkTitle'> & {
  readonly roles: readonly Conference2026PersonRole[];
  readonly talkTitle?: string;
  readonly portraitSrc?: string;
  readonly portraitStatus: Conference2026PortraitStatus;
  readonly schedule: readonly Conference2026PersonScheduleItem[];
};

const currentPeopleRecords = [
  ...conference2026PeopleRecords.filter((person) => !conference2026ConfirmedPeople.some(
    (confirmed) => confirmed.id === person.id || confirmed.name === person.name,
  )),
  ...conference2026ConfirmedPeople,
].map((person) => {
  const bio = conference2026ConfirmedBios.get(person.id);
  return bio === undefined ? person : { ...person, bio };
});

const publicPeopleRecords = [
  ...currentPeopleRecords,
  ...conference2026ArchivedPeople.filter((person) => !currentPeopleRecords.some(
    (current) => current.id === person.id || current.name === person.name,
  )),
];

const personByPublicName = new Map<string, Conference2026PersonSourceRecord>();
for (const person of publicPeopleRecords) {
  personByPublicName.set(person.name, person);
  for (const alias of person.aliases) personByPublicName.set(alias, person);
}

const scheduleByPersonId = new Map<string, Conference2026PersonScheduleItem[]>();
for (const [sessionIndex, session] of conference2026ProgramSessions.entries()) {
  const addAssignments = (
    people: typeof session.chairs | typeof session.speakers,
    role: Conference2026PersonRole,
  ) => {
    for (const scheduledPerson of people) {
      const person = personByPublicName.get(scheduledPerson.name);
      if (!person) continue;
      const assignments = scheduleByPersonId.get(person.id) ?? [];
      const key = `${sessionIndex + 1}:${role}`;
      if (!assignments.some((assignment) => `${assignment.sessionNumber}:${assignment.role}` === key)) {
        assignments.push({
          sessionNumber: sessionIndex + 1,
          sourceTime: session.sourceTime,
          title: session.title,
          role,
          ...(scheduledPerson.talkTitle ? { talkTitle: scheduledPerson.talkTitle } : {}),
          href: `/schedule/#schedule-session-${String(sessionIndex + 1).padStart(2, '0')}`,
        });
      }
      scheduleByPersonId.set(person.id, assignments);
    }
  };
  addAssignments(session.chairs, 'chair');
  addAssignments(session.speakers, 'speaker');
}

function portraitStatus(person: Conference2026PersonSourceRecord): Conference2026PortraitStatus {
  if (conference2026ConfirmedPortraits.has(person.id)) return 'submitted';
  if (conference2026ArchivedPortraits.has(person.id)) return 'archived';
  return person.hasSubmittedPortrait ? 'submitted' : 'missing';
}

function combinedRoles(
  person: Conference2026PersonSourceRecord,
  schedule: readonly Conference2026PersonScheduleItem[],
): readonly Conference2026PersonRole[] {
  const roles = new Set<Conference2026PersonRole>(person.roles);
  for (const assignment of schedule) roles.add(assignment.role);
  const roleOrder: readonly Conference2026PersonRole[] = ['chair', 'speaker'];
  return roleOrder.filter((role) => roles.has(role));
}

function authoritativeTalkTitle(
  person: Conference2026PersonSourceRecord,
  schedule: readonly Conference2026PersonScheduleItem[],
): string | undefined {
  const scheduleTitles = [...new Set(
    schedule
      .filter((assignment) => assignment.role === 'speaker')
      .map((assignment) => assignment.talkTitle)
      .filter((title): title is string => Boolean(title)),
  )];
  if (scheduleTitles.length > 1) {
    throw new Error(`${person.name} has conflicting talk titles across the confirmed schedule.`);
  }
  return scheduleTitles[0] ?? person.talkTitle;
}

export const conference2026People: readonly Conference2026Person[] = publicPeopleRecords
  .map((person) => {
    const schedule = scheduleByPersonId.get(person.id) ?? [];
    const status = portraitStatus(person);
    return {
      ...person,
      roles: combinedRoles(person, schedule),
      talkTitle: authoritativeTalkTitle(person, schedule),
      ...(status === 'missing' ? {} : {
        portraitSrc: conference2026ConfirmedPortraits.get(person.id)
          ?? conference2026ArchivedPortraits.get(person.id)
          ?? `/2026/people/${person.id}-portrait.webp`,
      }),
      portraitStatus: status,
      schedule,
    };
  })
  .sort((left, right) => {
    const leftSession = left.schedule[0]?.sessionNumber ?? Number.POSITIVE_INFINITY;
    const rightSession = right.schedule[0]?.sessionNumber ?? Number.POSITIVE_INFINITY;
    return leftSession - rightSession || left.sourceOrder - right.sourceOrder;
  });

const publishedPersonByName = new Map<string, Conference2026Person>();
for (const person of conference2026People) {
  publishedPersonByName.set(person.name, person);
  for (const alias of person.aliases) publishedPersonByName.set(alias, person);
}

export function conference2026PersonForName(name: string): Conference2026Person | undefined {
  return publishedPersonByName.get(name);
}
