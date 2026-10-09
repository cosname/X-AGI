import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { conference2026PeopleRecords } from './conference2026-people.generated.ts';
import {
  conference2026People,
  conference2026PersonForName,
} from './conference2026-people.ts';

describe('2026 public Chair and Speaker profiles', () => {
  it('joins Wang Haonan to the confirmed session with his current employer and supplied report', () => {
    const person = conference2026PersonForName('王淏楠');
    assert.equal(person?.affiliation, 'Sharpa');
    assert.equal(person?.portraitSrc, '/2026/people/wang-haonan-portrait.webp');
    assert.equal(person?.talkTitle, 'Signal and Noise in On-Policy Distillation: 1% of Tokens Can Be Enough');
    assert.match(person?.abstract ?? '', /0\.1%–1%/u);
    assert.deepEqual(person?.schedule.map((item) => ({ session: item.sessionNumber, time: item.sourceTime, role: item.role })), [
      { session: 12, time: '10.18上午', role: 'speaker' },
    ]);
  });

  it('publishes the reviewed public-only workbook projection', () => {
    assert.equal(conference2026PeopleRecords.length, 63);
    assert.equal(
      conference2026PeopleRecords.filter((person) => person.roles.includes('chair')).length,
      13,
    );
    assert.equal(
      conference2026PeopleRecords.filter((person) => person.roles.includes('speaker')).length,
      52,
    );
    assert.equal(
      conference2026PeopleRecords.filter((person) => person.hasSubmittedPortrait).length,
      56,
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

  it('publishes Liu Fanghui\'s revised title with the matching attendee abstract', () => {
    const person = conference2026PersonForName('刘方辉');
    const attendee = conference2026PeopleRecords.find((record) => record.id === 'liu-fanghui');
    assert.equal(person?.talkTitle, '深度学习理论的技术科学道路');
    assert.equal(person?.talkTitle, attendee?.talkTitle);
    assert.equal(person?.abstract, attendee?.abstract);
    assert.match(person?.abstract ?? '', /scaling law 算不算理论/u);
    assert.deepEqual(person?.roles, ['chair', 'speaker']);
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
    assert.deepEqual(hu?.roles, ['chair', 'speaker']);
    assert.deepEqual(hu?.schedule.map((item) => ({ title: item.title, role: item.role })), [
      { title: '语言模型基础', role: 'chair' },
    ]);
    assert.equal(conference2026People.filter((person) => ['ma-ziye', 'hu-tianyang'].includes(person.id)).length, 2);
  });

  it('uses a neutral placeholder when no unambiguous portrait is available', () => {
    const person = conference2026PersonForName('田润泽');
    assert.equal(person?.portraitStatus, 'missing');
    assert.equal(person?.portraitSrc, undefined);
    assert.equal(conference2026People.filter((candidate) => !candidate.portraitSrc).length, 5);
    for (const name of ['谢天', '祝武', '刘华斌']) {
      const candidate = conference2026PersonForName(name);
      assert.equal(candidate?.portraitStatus, 'missing');
      assert.equal(candidate?.portraitSrc, undefined);
    }
  });

  it('uses organizer-supplied Chair portraits without replacing their source profiles', () => {
    for (const [name, id] of [['胡天阳', 'hu-tianyang'], ['陈思明', 'chen-siming'], ['周默', 'zhou-mo']]) {
      const person = conference2026PersonForName(name);
      assert.equal(person?.portraitStatus, 'submitted');
      assert.equal(person?.portraitSrc, `/2026/people/${id}-portrait.webp`);
      assert.equal(person?.hasSubmittedPortrait, conference2026PeopleRecords.find((record) => record.id === id)?.hasSubmittedPortrait);
      assert.deepEqual(person?.roles, id === 'hu-tianyang' ? ['chair', 'speaker'] : ['chair']);
    }
    const chen = conference2026PersonForName('陈思明');
    assert.equal(chen?.profileUrl, 'http://fduvis.net/');
    assert.equal(chen?.department, '大数据学院');
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
