import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { homeSpeakers } from './home-speakers.ts';
import { conference2026People, conference2026PersonForName } from './conference2026-people.ts';

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

  it('preserves keynote order and links dual-role guests to their speaker biography', () => {
    assert.deepEqual(homeSpeakers.slice(0, 4).map((speaker) => speaker.name), ['刘军', '冯建峰', '邱子涵', '罗涛']);
    assert.equal(homeSpeakers[0].href, '/schedule/#schedule-person-01-speaker-liu-jun-1');
    assert.equal(homeSpeakers.find((speaker) => speaker.id === 'lu-yiping')?.href, '/schedule/#schedule-person-07-speaker-lu-yiping-3');
    assert.equal(homeSpeakers.at(-1)?.name, '从鑫');
    assert.equal(homeSpeakers.at(-1)?.href, '/schedule/#schedule-person-14-speaker-cong-xin-4');
  });

  it('uses concise biography-backed positions and leaves an unspecified position absent', () => {
    assert.equal(homeSpeakers.find((speaker) => speaker.id === 'liu-jun')?.position, '兴华卓越讲席教授');
    assert.equal(homeSpeakers.find((speaker) => speaker.id === 'zhang-huaqing')?.position, '博士研究生');
    assert.equal(homeSpeakers.find((speaker) => speaker.id === 'luyao-zhang')?.position, '经济学助理教授');
    assert.equal(homeSpeakers.find((speaker) => speaker.id === 'xu-huinan')?.position, undefined);
  });
});
