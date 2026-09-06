import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { conference2026PeopleRecords } from './conference2026-people.generated.ts';
import {
  conference2026People,
  conference2026PersonForName,
} from './conference2026-people.ts';

describe('2026 public Chair and Speaker profiles', () => {
  it('publishes the reviewed public-only workbook projection', () => {
    assert.equal(conference2026PeopleRecords.length, 36);
    assert.equal(
      conference2026PeopleRecords.filter((person) => person.roles.includes('chair')).length,
      8,
    );
    assert.equal(
      conference2026PeopleRecords.filter((person) => person.roles.includes('speaker')).length,
      29,
    );
    assert.equal(
      conference2026PeopleRecords.filter((person) => person.hasSubmittedPortrait).length,
      30,
    );
    assert.equal(
      new Set(conference2026PeopleRecords.map((person) => person.id)).size,
      conference2026PeopleRecords.length,
    );
  });

  it('joins a schedule alias without changing its public display name', () => {
    const person = conference2026PersonForName('Yuan Zhang');
    assert.equal(person?.name, '张元');
    assert.ok(person?.schedule.some((item) => item.title === 'AI + Finance'));
  });

  it('merges source and schedule roles into one profile', () => {
    const person = conference2026PersonForName('陈焕然');
    assert.deepEqual(person?.roles, ['chair', 'speaker']);
    assert.ok(person?.schedule.some((item) => item.role === 'chair'));
    assert.ok(person?.schedule.some((item) => item.role === 'speaker'));
  });

  it('uses the confirmed schedule as the public report-title authority', () => {
    const person = conference2026PersonForName('Luyao Zhang');
    const scheduledTalk = person?.schedule.find((item) => item.role === 'speaker')?.talkTitle;
    assert.match(scheduledTalk ?? '', /Across Oracle Protocols/u);
    assert.equal(person?.talkTitle, scheduledTalk);
  });

  it('uses a neutral placeholder when no unambiguous portrait is available', () => {
    const person = conference2026PersonForName('田润泽');
    assert.equal(person?.portraitStatus, 'missing');
    assert.equal(person?.portraitSrc, undefined);
    assert.equal(conference2026People.filter((candidate) => !candidate.portraitSrc).length, 6);
    for (const name of ['马梓业', '谢天', '陈思明', '周默', '祝武']) {
      const candidate = conference2026PersonForName(name);
      assert.equal(candidate?.portraitStatus, 'missing');
      assert.equal(candidate?.portraitSrc, undefined);
    }
  });
});
