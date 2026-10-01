import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import sharp from 'sharp';
import { conference2026People } from './conference2026-people.ts';
import { portraitStyle } from './portrait-framing.ts';

const nonHumanPortraits = new Set(['hu-yiwen', 'chen-huanran']);

describe('reviewed portrait framing', () => {
  it('frames every human portrait without stretching the source aspect ratio', async () => {
    const people = conference2026People.filter((person) => person.portraitSrc && !nonHumanPortraits.has(person.id));
    assert.equal(people.length, 52);
    for (const person of people) {
      const style = portraitStyle(person.id);
      assert.equal(style.position, 'absolute', person.id);
      const width = parseFloat(style.width!);
      const height = parseFloat(style.height!);
      for (const value of [width, height, parseFloat(style.left!), parseFloat(style.top!)]) {
        assert.ok(Number.isFinite(value), person.id);
      }
      assert.ok(width > 0 && height > 0, person.id);
      const image = await sharp(`public${person.portraitSrc}`).metadata();
      assert.ok(Math.abs((width / height) / (image.width! / image.height!) - 1) < 0.002, person.id);
    }
  });

  it('retains submitted nonhuman avatars and a neutral fallback', () => {
    for (const id of [...nonHumanPortraits, 'unknown-person']) {
      assert.deepEqual(portraitStyle(id), { objectFit: 'cover' });
    }
  });

  it('keeps poster eyes at the same height without distorting the photo', () => {
    for (const person of conference2026People.filter((person) => person.portraitSrc)) {
      const circle = portraitStyle(person.id);
      if (!circle.width) continue;
      const poster = portraitStyle(person.id, 104 / 130);
      assert.equal(poster.top, circle.top, person.id);
      assert.equal(poster.height, circle.height, person.id);
      assert.ok(Math.abs(parseFloat(poster.width!) * 0.8 - parseFloat(circle.width)) < 0.000001, person.id);
    }
  });
});
