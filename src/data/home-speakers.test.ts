import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { homeSpeakers } from './home-speakers.ts';
import { conference2026People, conference2026PersonForName } from './conference2026-people.ts';
import { conference2026ProgramSessions } from './conference2026-program.ts';

describe('homepage speaker lineup', () => {
  it('includes every scheduled speaker with an existing portrait exactly once', () => {
    const eligible = conference2026People.filter((person) => person.portraitSrc
      && person.schedule.some((assignment) => assignment.role === 'speaker'));
    assert.equal(homeSpeakers.length, 40);
    assert.equal(new Set(homeSpeakers.map((speaker) => speaker.id)).size, homeSpeakers.length);
    assert.deepEqual(new Set(homeSpeakers.map((speaker) => speaker.id)), new Set(eligible.map((person) => person.id)));
    for (const speaker of homeSpeakers) {
      assert.equal(speaker.portraitSrc, conference2026PersonForName(speaker.name)?.portraitSrc);
    }
  });

  it('follows first appearance in the program and links to the matching speaker disclosure', () => {
    const expected = conference2026ProgramSessions.flatMap((session, sessionIndex) => (
      session.speakers.flatMap((speaker, speakerIndex) => {
        const person = conference2026PersonForName(speaker.name);
        return person?.portraitSrc ? [{
          name: speaker.name,
          href: `/schedule/#schedule-person-${String(sessionIndex + 1).padStart(2, '0')}-speaker-${person.id}-${speakerIndex + 1}`,
        }] : [];
      })
    ));
    const firstAppearance = expected.filter((speaker, index) => expected.findIndex((other) => other.name === speaker.name) === index);
    assert.deepEqual(homeSpeakers.map(({ name, href }) => ({ name, href })), firstAppearance);
    assert.equal(homeSpeakers[0].name, '刘军');
  });

  it('uses concise biography-backed positions and leaves an unspecified position absent', () => {
    assert.equal(homeSpeakers.find((speaker) => speaker.id === 'liu-jun')?.position, '兴华卓越讲席教授');
    assert.equal(homeSpeakers.find((speaker) => speaker.id === 'zhang-huaqing')?.position, '博士研究生');
    assert.equal(homeSpeakers.find((speaker) => speaker.id === 'luyao-zhang')?.position, '经济学助理教授');
    assert.equal(homeSpeakers.find((speaker) => speaker.id === 'xu-huinan')?.position, undefined);
  });
});
