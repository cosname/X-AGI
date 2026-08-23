import assert from 'node:assert/strict';
import test from 'node:test';

import { capsuleGapMorph, capsuleOutlinePath } from './navigation-capsule.ts';

test('navigation capsule keeps each label size at the gap edges', () => {
  const left = { width: 56, height: 36 };
  const right = { width: 88, height: 36 };

  assert.deepEqual(capsuleGapMorph(left, right, 0), { ...left, neck: 0 });
  assert.deepEqual(capsuleGapMorph(left, right, 1), { ...right, neck: 0 });
});

test('navigation capsule keeps its interpolated size while crossing a gap', () => {
  const middle = capsuleGapMorph(
    { width: 56, height: 36 },
    { width: 88, height: 36 },
    0.5,
  );

  assert.equal(middle.neck, 1);
  assert.equal(middle.width, 72);
  assert.equal(middle.height, 36);
});

test('navigation capsule neck is symmetric and continuous around the gap center', () => {
  const size = { width: 72, height: 36 };
  const before = capsuleGapMorph(size, size, 0.35);
  const after = capsuleGapMorph(size, size, 0.65);

  assert.ok(Math.abs(before.neck - after.neck) < 0.000001);
  assert.ok(before.neck < capsuleGapMorph(size, size, 0.5).neck);
  assert.equal(before.width, size.width);
  assert.equal(after.height, size.height);
});

test('navigation capsule shares one closed path generator for rendered lenses', () => {
  const resting = capsuleOutlinePath(96, 38, 0);
  const pinched = capsuleOutlinePath(96, 38, 1);
  const clipped = capsuleOutlinePath(96, 38, 1, 0.08);

  assert.match(resting, /^M /);
  assert.match(resting, /Z$/);
  assert.notEqual(resting, pinched);
  assert.notEqual(pinched, clipped);
});
