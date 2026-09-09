import assert from 'node:assert/strict';
import test from 'node:test';

import {
  adsorbGlassProgress,
  assignGlassTargetRows,
  capsuleForGlassPointer,
  capsuleForGlassTarget,
  capsuleForHorizontalGlassPointer,
  capsuleForVerticalGlassPointer,
  glassActivationShouldDismiss,
  glassGroupAllowsScrub,
  glassGroupUsesVerticalAxis,
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

  assert.equal(adsorbGlassProgress(0, 44, 44, travel), 0);
  assert.equal(adsorbGlassProgress(1, 44, 44, travel), 1);
  assert.equal(adsorbGlassProgress(0.5, 44, 44, travel), 0.5);
  assert.equal(adsorbGlassProgress(0.1, 44, 44, travel), 0);
  assert.equal(adsorbGlassProgress(0.9, 44, 44, travel), 1);
  assert.ok(adsorbGlassProgress(0.22, 44, 44, travel) < 0.22);
  assert.ok(adsorbGlassProgress(0.78, 44, 44, travel) > 0.78);
});

test('horizontal touch glass uses the same motion as a rotated menu stack', () => {
  const horizontal = assignGlassTargetRows([
    { key: 'register', left: 0, top: 0, width: 108, height: 44 },
    { key: 'schedule', left: 128, top: 0, width: 100, height: 44 },
  ]);
  const rotated = assignGlassTargetRows(horizontal.map(target => ({
    key: target.key, left: target.top, top: target.left, width: target.height, height: target.width,
  })));

  for (const x of [-10, 54, 60, 85, 116, 145, 172, 178, 240]) {
    const row = capsuleForHorizontalGlassPointer(horizontal, x, 22);
    const column = capsuleForVerticalGlassPointer(rotated, x);
    assert.ok(row && column);
    assert.deepEqual(row, {
      x: column.y, y: column.x, width: column.height, height: column.width, neck: column.neck,
    });
    assert.equal(row.neck, 0);
  }
});

test('horizontal touch glass stays in the touched row and handles empty groups', () => {
  assert.deepEqual(capsuleForHorizontalGlassPointer(targets, 44, 78), capsuleForGlassTarget(targets[2]));
  assert.equal(capsuleForHorizontalGlassPointer([], 44, 78), null);
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

test('glass scrub stays off for main inline navigation but supports inline schedule periods', () => {
  assert.equal(glassGroupAllowsScrub(false, 'compact'), false);
  assert.equal(glassGroupAllowsScrub(true, 'inline'), false);
  assert.equal(glassGroupAllowsScrub(true, 'inline', true), true);
  assert.equal(glassGroupAllowsScrub(true, 'compact'), true);
  assert.equal(glassGroupAllowsScrub(true, undefined), true);
});

test('schedule periods switch the compact navigation glass to a horizontal axis', () => {
  assert.equal(glassGroupUsesVerticalAxis('vertical', undefined, 'inline'), true);
  assert.equal(glassGroupUsesVerticalAxis('vertical', 'periods', 'inline'), false);
  assert.equal(glassGroupUsesVerticalAxis('vertical', 'periods', 'compact'), true);
  assert.equal(glassGroupUsesVerticalAxis(undefined, 'periods', 'inline'), false);
});

test('glass activation dismisses the lens instead of returning to rest', () => {
  assert.equal(glassActivationShouldDismiss('A', '/about/', 'about'), true);
  assert.equal(glassActivationShouldDismiss('A', '/register/', 'register'), true);
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
