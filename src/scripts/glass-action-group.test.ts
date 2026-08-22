import assert from 'node:assert/strict';
import test from 'node:test';

import {
  adsorbVerticalGlassProgress,
  assignGlassTargetRows,
  capsuleForGlassPointer,
  capsuleForGlassTarget,
  capsuleForVerticalGlassPointer,
  glassActivationShouldDismiss,
  glassGroupAllowsScrub,
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

test('vertical glass progress holds near each stacked target', () => {
  const travel = 56;

  assert.equal(adsorbVerticalGlassProgress(0, 44, 44, travel), 0);
  assert.equal(adsorbVerticalGlassProgress(1, 44, 44, travel), 1);
  assert.equal(adsorbVerticalGlassProgress(0.5, 44, 44, travel), 0.5);
  assert.equal(adsorbVerticalGlassProgress(0.1, 44, 44, travel), 0);
  assert.equal(adsorbVerticalGlassProgress(0.9, 44, 44, travel), 1);
  assert.ok(adsorbVerticalGlassProgress(0.22, 44, 44, travel) < 0.22);
  assert.ok(adsorbVerticalGlassProgress(0.78, 44, 44, travel) > 0.78);
});

test('vertical glass pointer adsorbs onto the nearest stacked target', () => {
  const verticalTargets = assignGlassTargetRows([
    { key: 'home', left: 40, top: 0, width: 104, height: 44 },
    { key: 'about', left: 20, top: 56, width: 124, height: 44 },
  ]);

  assert.deepEqual(
    capsuleForVerticalGlassPointer(verticalTargets, 28),
    capsuleForGlassTarget(verticalTargets[0]),
  );
  assert.deepEqual(
    capsuleForVerticalGlassPointer(verticalTargets, 72),
    capsuleForGlassTarget(verticalTargets[1]),
  );

  const leaving = capsuleForVerticalGlassPointer(verticalTargets, 40);
  assert.ok(leaving);
  assert.ok(leaving.y > verticalTargets[0].centerY);
  assert.ok(leaving.y < 50);
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

test('glass scrub stays off for inline header navigation', () => {
  assert.equal(glassGroupAllowsScrub(false, 'compact'), false);
  assert.equal(glassGroupAllowsScrub(true, 'inline'), false);
  assert.equal(glassGroupAllowsScrub(true, 'compact'), true);
  assert.equal(glassGroupAllowsScrub(true, undefined), true);
});

test('glass activation dismisses the lens instead of returning to rest', () => {
  assert.equal(glassActivationShouldDismiss('A', '/goal/about/', 'about'), true);
  assert.equal(glassActivationShouldDismiss('A', '/goal/register/', 'register'), true);
  assert.equal(glassActivationShouldDismiss('BUTTON', null, 'close'), true);
  assert.equal(glassActivationShouldDismiss('BUTTON', null, 'filter'), false);
  assert.equal(glassActivationShouldDismiss('A', '#section', 'about'), false);
});

test('glass outline path remains closed and neck-aware', () => {
  const resting = capsuleOutlinePath(96, 44, 0);
  const pinched = capsuleOutlinePath(96, 44, 1);

  assert.match(resting, /^M /);
  assert.match(resting, /Z$/);
  assert.notEqual(resting, pinched);
});
