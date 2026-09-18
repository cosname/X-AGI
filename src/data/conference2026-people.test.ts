import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { conference2026PeopleRecords } from './conference2026-people.generated.ts';
import {
  conference2026People,
  conference2026PersonForName,
} from './conference2026-people.ts';

describe('2026 public Chair and Speaker profiles', () => {
  it('publishes the reviewed public-only workbook projection', () => {
    assert.equal(conference2026PeopleRecords.length, 46);
    assert.equal(
      conference2026PeopleRecords.filter((person) => person.roles.includes('chair')).length,
      9,
    );
    assert.equal(
      conference2026PeopleRecords.filter((person) => person.roles.includes('speaker')).length,
      38,
    );
    assert.equal(
      conference2026PeopleRecords.filter((person) => person.hasSubmittedPortrait).length,
      40,
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

  it('reuses archived Chair information while retaining the current attendee biography', () => {
    const ma = conference2026PersonForName('马梓业');
    const currentMa = conference2026PeopleRecords.find((person) => person.id === 'ma-ziye');
    assert.equal(ma?.bio, currentMa?.bio);
    assert.equal(ma?.portraitStatus, 'archived');
    assert.equal(ma?.portraitSrc, '/2026/people/ma-ziye-portrait.webp');
    assert.deepEqual(ma?.roles, ['chair']);
    assert.deepEqual(ma?.schedule.map((item) => item.title), ['机器学习理论']);

    const hu = conference2026PersonForName('胡天阳');
    assert.ok(hu?.bio?.includes('包括统计机器学习、可信 AI、特征表示学习、深度生成模型等'));
    assert.deepEqual(hu?.roles, ['chair']);
    assert.deepEqual(hu?.schedule.map((item) => item.title), ['语言模型基础']);
    assert.equal(conference2026People.filter((person) => ['ma-ziye', 'hu-tianyang'].includes(person.id)).length, 2);
  });

  it('uses a neutral placeholder when no unambiguous portrait is available', () => {
    const person = conference2026PersonForName('田润泽');
    assert.equal(person?.portraitStatus, 'missing');
    assert.equal(person?.portraitSrc, undefined);
    assert.equal(conference2026People.filter((candidate) => !candidate.portraitSrc).length, 6);
    for (const name of ['胡天阳', '谢天', '陈思明', '周默', '祝武']) {
      const candidate = conference2026PersonForName(name);
      assert.equal(candidate?.portraitStatus, 'missing');
      assert.equal(candidate?.portraitSrc, undefined);
    }
  });

  it('applies a confirmed biography update without losing attendee report details', () => {
    const qiu = conference2026PersonForName('邱子涵');
    const attendee = conference2026PeopleRecords.find((person) => person.id === 'qiu-zihan');
    assert.match(qiu?.bio ?? '', /引用量逾 2 万次/u);
    assert.equal(qiu?.abstract, attendee?.abstract);
    assert.equal(qiu?.department, attendee?.department);
    assert.equal(qiu?.hasSubmittedPortrait, attendee?.hasSubmittedPortrait);
    assert.equal(conference2026People.filter((person) => person.id === 'qiu-zihan').length, 1);
  });
});
