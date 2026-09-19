import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { homeSpeakers } from './home-speakers.ts';
import { conference2026ProgramSessions } from './conference2026-program.ts';
import { conference2026PersonForName } from './conference2026-people.ts';

const scheduledSpeakers = new Set(conference2026ProgramSessions.flatMap((session) => session.speakers.map((person) => person.name)));
const scheduledChairs = new Set(conference2026ProgramSessions.flatMap((session) => session.chairs.map((person) => person.name)));

describe('homepage speaker lineup', () => {
  it('includes every confirmed Speaker and Chair exactly once, regardless of portrait or profile availability', () => {
    const expectedNames = new Set([...scheduledSpeakers, ...scheduledChairs].filter((name) => name !== '待确认'));
    assert.equal(homeSpeakers.length, 62);
    assert.equal(new Set(homeSpeakers.map((speaker) => speaker.id)).size, homeSpeakers.length);
    assert.deepEqual(new Set(homeSpeakers.map((speaker) => speaker.name)), expectedNames);
    for (const speaker of homeSpeakers) {
      assert.equal(speaker.portraitSrc, conference2026PersonForName(speaker.name)?.portraitSrc);
    }
    assert.equal(homeSpeakers.filter((speaker) => !speaker.portraitSrc).length, 17);
  });

  it('places missing portraits last, preserves order within both groups and keeps dual-role speaker links', () => {
    const scheduledNames = [...new Set([...scheduledSpeakers, ...scheduledChairs])].filter((name) => name !== '待确认');
    const withPortraits = scheduledNames.filter((name) => conference2026PersonForName(name)?.portraitSrc);
    const withoutPortraits = scheduledNames.filter((name) => !conference2026PersonForName(name)?.portraitSrc);
    assert.deepEqual(homeSpeakers.slice(0, withPortraits.length).map((speaker) => speaker.name), withPortraits);
    assert.deepEqual(homeSpeakers.slice(withPortraits.length).map((speaker) => speaker.name), withoutPortraits);
    assert.deepEqual(homeSpeakers.slice(0, 4).map((speaker) => speaker.name), ['刘军', '孙茂松', '冯建峰', '邱子涵']);
    assert.equal(homeSpeakers[0].href, '/schedule/#schedule-person-01-speaker-liu-jun-1');
    const dualRoles = [...scheduledChairs].filter((name) => scheduledSpeakers.has(name));
    assert.equal(dualRoles.length, 6);
    for (const name of dualRoles) {
      const entries = homeSpeakers.filter((speaker) => speaker.name === name);
      assert.equal(entries.length, 1);
      if (conference2026PersonForName(name)) assert.ok(entries[0].href.includes('-speaker-'));
    }
    assert.equal(homeSpeakers.find((speaker) => speaker.id === 'lu-yiping')?.href, '/schedule/#schedule-person-07-speaker-lu-yiping-3');
  });

  it('includes Chair-only guests with their available profile or confirmed session links', () => {
    assert.deepEqual(new Set(homeSpeakers.filter((speaker) => !scheduledSpeakers.has(speaker.name)).map((speaker) => speaker.name)), new Set([
      '王健桥', '谢天', '杨朋昆', '祝武', '周默', '陈思明', '田润泽', '马梓业', '胡天阳', '周峰',
    ]));
    assert.equal(homeSpeakers.find((speaker) => speaker.id === 'chen-siming')?.href, '/schedule/#schedule-person-08-chair-chen-siming-1');
    assert.equal(homeSpeakers.find((speaker) => speaker.id === 'hu-tianyang')?.href, '/schedule/#schedule-person-12-chair-hu-tianyang-1');
    assert.equal(homeSpeakers.find((speaker) => speaker.name === '王健桥')?.href, '/schedule/#schedule-session-01');
    assert.equal(homeSpeakers.find((speaker) => speaker.name === '杨朋昆')?.href, '/schedule/#schedule-session-05');
  });

  it('uses confirmed schedule information when no person profile has been submitted', () => {
    const missingProfiles = homeSpeakers.filter((speaker) => !conference2026PersonForName(speaker.name));
    assert.equal(missingProfiles.length, 13);
    for (const speaker of missingProfiles) {
      const sessionIndex = conference2026ProgramSessions.findIndex((session) => [...session.speakers, ...session.chairs].some((person) => person.name === speaker.name));
      const session = conference2026ProgramSessions[sessionIndex];
      const source = [...session.speakers, ...session.chairs].find((person) => person.name === speaker.name);
      assert.equal(speaker.affiliation, source?.affiliation);
      assert.equal(speaker.position, undefined);
      assert.equal(speaker.portraitSrc, undefined);
      assert.equal(speaker.href, `/schedule/#schedule-session-${String(sessionIndex + 1).padStart(2, '0')}`);
    }
  });

  it('uses concise biography-backed positions and leaves an unspecified position absent', () => {
    assert.equal(homeSpeakers.find((speaker) => speaker.id === 'liu-jun')?.position, '兴华卓越讲席教授');
    assert.equal(homeSpeakers.find((speaker) => speaker.id === 'zhang-huaqing')?.position, '博士研究生');
    assert.equal(homeSpeakers.find((speaker) => speaker.id === 'luyao-zhang')?.position, '经济学助理教授');
    assert.equal(homeSpeakers.find((speaker) => speaker.id === 'xu-huinan')?.position, undefined);
    assert.equal(homeSpeakers.find((speaker) => speaker.id === 'hu-tianyang')?.position, '助理教授');
    assert.equal(homeSpeakers.find((speaker) => speaker.id === 'chen-siming')?.position, undefined);
  });
});
