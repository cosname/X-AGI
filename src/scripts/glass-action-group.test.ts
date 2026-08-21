import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assignGlassTargetRows,
  capsuleForGlassPointer,
  capsuleForGlassTarget,
  capsuleForVerticalGlassPointer,
} from './glass-action-group-state.ts';
import { capsuleOutlinePath } from './navigation-capsule.ts';

const targets = assignGlassTargetRows([
  { key: 'all', left: 0, top: 0, width: 72, height: 44 },
  { key: 'first', left: 84, top: 0, width: 96, height: 44 },
  { key: 'second', left: 0, top: 56, width: 88, height: 44 },
]);

test('glass targets receive stable visual row assignments', () => {
  assert.equal(targets[0].row, 0);
  assert.equal(targets[1].row, 0);
  assert.equal(targets[2].row, 1);
});

test('glass pointer interpolates unequal targets within one row', () => {
  const middle = capsuleForGlassPointer(targets, 84, 22);

  assert.ok(middle);
  assert.equal(middle.x, 84);
  assert.equal(middle.width, 84);
  assert.equal(middle.height, 44);
  assert.equal(middle.neck, 1);
});

test('glass pointer settles directly on a different wrapped row', () => {
  const wrapped = capsuleForGlassPointer(targets, 44, 78);
  const expected = capsuleForGlassTarget(targets[2]);

  assert.deepEqual(wrapped, expected);
  assert.equal(wrapped?.neck, 0);
});

test('glass pointer clamps to the first and last target in a row', () => {
  assert.deepEqual(
    capsuleForGlassPointer(targets, -200, 22),
    capsuleForGlassTarget(targets[0]),
  );
  assert.deepEqual(
    capsuleForGlassPointer(targets, 500, 22),
    capsuleForGlassTarget(targets[1]),
  );
});

test('vertical glass pointer stretches smoothly between stacked targets', () => {
  const verticalTargets = assignGlassTargetRows([
    { key: 'home', left: 40, top: 0, width: 104, height: 44 },
    { key: 'about', left: 20, top: 56, width: 124, height: 44 },
  ]);
  const middle = capsuleForVerticalGlassPointer(verticalTargets, 50);

  assert.ok(middle);
  assert.equal(middle.y, 50);
  assert.ok(middle.x > Math.min(verticalTargets[0].centerX, verticalTargets[1].centerX));
  assert.ok(middle.x < Math.max(verticalTargets[0].centerX, verticalTargets[1].centerX));
  assert.ok(middle.width < 114);
  assert.ok(middle.height > 44);
});

test('vertical glass pointer clamps above and below a stack', () => {
  const verticalTargets = assignGlassTargetRows([
    { key: 'home', left: 40, top: 0, width: 104, height: 44 },
    { key: 'about', left: 20, top: 56, width: 124, height: 44 },
  ]);

  assert.deepEqual(
    capsuleForVerticalGlassPointer(verticalTargets, -200),
    capsuleForGlassTarget(verticalTargets[0]),
  );
  assert.deepEqual(
    capsuleForVerticalGlassPointer(verticalTargets, 500),
    capsuleForGlassTarget(verticalTargets[1]),
  );
});

test('glass outline path remains closed and neck-aware', () => {
  const resting = capsuleOutlinePath(96, 44, 0);
  const pinched = capsuleOutlinePath(96, 44, 1);

  assert.match(resting, /^M /);
  assert.match(resting, /Z$/);
  assert.notEqual(resting, pinched);
});
