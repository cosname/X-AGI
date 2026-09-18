import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { homeSpeakers } from './home-speakers.ts';
import { conference2026People, conference2026PersonForName } from './conference2026-people.ts';

describe('homepage speaker lineup', () => {
  it('includes every scheduled Speaker and Chair exactly once, including those without portraits', () => {
    const eligible = conference2026People.filter((person) => person.schedule.some(
      (assignment) => assignment.role === 'speaker' || assignment.role === 'chair',
    ));
    assert.equal(homeSpeakers.length, 49);
    assert.equal(new Set(homeSpeakers.map((speaker) => speaker.id)).size, homeSpeakers.length);
    assert.deepEqual(new Set(homeSpeakers.map((speaker) => speaker.id)), new Set(eligible.map((person) => person.id)));
    for (const speaker of homeSpeakers) {
      assert.equal(speaker.portraitSrc, conference2026PersonForName(speaker.name)?.portraitSrc);
    }
  });

  it('preserves keynote order and links dual-role guests to their speaker biography', () => {
    assert.deepEqual(homeSpeakers.slice(0, 4).map((speaker) => speaker.name), ['刘军', '孙茂松', '冯建峰', '邱子涵']);
    assert.equal(homeSpeakers[0].href, '/schedule/#schedule-person-01-speaker-liu-jun-1');
    assert.equal(homeSpeakers.find((speaker) => speaker.id === 'lu-yiping')?.href, '/schedule/#schedule-person-07-speaker-lu-yiping-3');
    assert.equal(homeSpeakers[40].name, '从鑫');
    assert.equal(homeSpeakers[40].href, '/schedule/#schedule-person-14-speaker-cong-xin-4');
    for (const person of eligibleDualRoleGuests()) {
      assert.equal(homeSpeakers.filter((speaker) => speaker.id === person.id).length, 1);
      assert.ok(homeSpeakers.find((speaker) => speaker.id === person.id)?.href.includes('-speaker-'));
    }
  });

  it('appends Chair-only guests in schedule order with their Chair biography links', () => {
    assert.deepEqual(homeSpeakers.slice(41).map((speaker) => speaker.id), [
      'xie-tian', 'zhu-wu', 'zhou-mo', 'chen-siming', 'tian-runze', 'ma-ziye', 'hu-tianyang', 'zhou-feng',
    ]);
    assert.equal(homeSpeakers.find((speaker) => speaker.id === 'chen-siming')?.href, '/schedule/#schedule-person-08-chair-chen-siming-1');
    assert.equal(homeSpeakers.find((speaker) => speaker.id === 'hu-tianyang')?.href, '/schedule/#schedule-person-12-chair-hu-tianyang-1');
    assert.deepEqual(homeSpeakers.filter((speaker) => !speaker.portraitSrc).map((speaker) => speaker.id), [
      'xie-tian', 'zhu-wu', 'zhou-mo', 'tian-runze',
    ]);
    for (const speaker of homeSpeakers.slice(41)) assert.ok(speaker.href.includes('-chair-'));
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

function eligibleDualRoleGuests() {
  return conference2026People.filter((person) => person.schedule.some((assignment) => assignment.role === 'speaker')
    && person.schedule.some((assignment) => assignment.role === 'chair'));
}
