import assert from 'node:assert/strict';
import test from 'node:test';

import {
  continuousIndexAtPosition,
  dampGalleryFocus,
  galleryScrollTarget,
  galleryToolbarTargetIndex,
  galleryWaveScales,
} from './goal-history-gallery-state.ts';

const assertClose = (actual: number, expected: number, tolerance = 1e-9) => {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
};

test('continuous focus follows measured event stops', () => {
  const stops = [0, 100, 300, 600];

  assert.equal(continuousIndexAtPosition(0, stops), 0);
  assert.equal(continuousIndexAtPosition(50, stops), 0.5);
  assert.equal(continuousIndexAtPosition(200, stops), 1.5);
  assert.equal(continuousIndexAtPosition(450, stops), 2.5);
  assert.equal(continuousIndexAtPosition(600, stops), 3);
});

test('continuous focus clamps pointer and scroll positions to both ends', () => {
  const stops = [12, 48, 96];

  assert.equal(continuousIndexAtPosition(-100, stops), 0);
  assert.equal(continuousIndexAtPosition(1_000, stops), 2);
  assert.equal(continuousIndexAtPosition(Number.NaN, stops), 0);
});

test('continuous focus handles empty, single, duplicate, and invalid stops', () => {
  assert.equal(continuousIndexAtPosition(20, []), 0);
  assert.equal(continuousIndexAtPosition(20, [8]), 0);
  assert.equal(continuousIndexAtPosition(50, [0, 0, 100]), 1.5);
  assert.equal(continuousIndexAtPosition(50, [0, Number.NaN, 100]), 1.5);
});

test('gallery scroll targets use measured stops and motion preferences', () => {
  const stops = [0, 112, 287, 540];

  assert.deepEqual(galleryScrollTarget(0, stops, false), {
    targetIndex: 0,
    left: 0,
    behavior: 'smooth',
  });
  assert.deepEqual(galleryScrollTarget(2, stops, false), {
    targetIndex: 2,
    left: 287,
    behavior: 'smooth',
  });
  assert.deepEqual(galleryScrollTarget(3, stops, true), {
    targetIndex: 3,
    left: 540,
    behavior: 'auto',
  });
});

test('gallery scroll targets clamp invalid and out-of-range requests', () => {
  const stops = [0, 120, 360];

  assert.equal(galleryScrollTarget(-5, stops, false).targetIndex, 0);
  assert.equal(galleryScrollTarget(50, stops, false).targetIndex, 2);
  assert.equal(galleryScrollTarget(Number.NaN, stops, false).targetIndex, 0);
  assert.deepEqual(galleryScrollTarget(2, [], true), {
    targetIndex: 0,
    left: 0,
    behavior: 'auto',
  });
  assert.equal(galleryScrollTarget(1, [0, Number.NaN, 240], false).left, 0);
});

test('toolbar keys move focus without wrapping past either end', () => {
  assert.equal(galleryToolbarTargetIndex(2, 'ArrowLeft', 5), 1);
  assert.equal(galleryToolbarTargetIndex(2, 'ArrowRight', 5), 3);
  assert.equal(galleryToolbarTargetIndex(2, 'Home', 5), 0);
  assert.equal(galleryToolbarTargetIndex(2, 'End', 5), 4);
  assert.equal(galleryToolbarTargetIndex(0, 'ArrowLeft', 5), 0);
  assert.equal(galleryToolbarTargetIndex(4, 'ArrowRight', 5), 4);
});

test('toolbar keys handle empty and invalid ranges safely', () => {
  assert.equal(galleryToolbarTargetIndex(3, 'End', 0), 0);
  assert.equal(galleryToolbarTargetIndex(Number.NaN, 'ArrowRight', 4), 1);
  assert.equal(galleryToolbarTargetIndex(2, 'End', Number.NaN), 0);
});

test('wave scales match the rendered event count', () => {
  assert.equal(galleryWaveScales(7, 15).length, 15);
  assert.equal(galleryWaveScales(8, 17).length, 17);
  assert.deepEqual(galleryWaveScales(0, 0), []);
  assert.deepEqual(galleryWaveScales(0, 1), [1]);
});

test('wave forms a symmetric peak that decays to its baseline', () => {
  const scales = galleryWaveScales(7, 15);

  assert.equal(scales[7], 1);
  assertClose(scales[6], scales[8]);
  assertClose(scales[5], scales[9]);
  assert.ok(scales[7] > scales[6]);
  assert.ok(scales[6] > scales[5]);
  assert.ok(scales[5] > scales[4]);
  assert.equal(scales[4], 0.22);
  assert.equal(scales[0], 0.22);
});

test('fractional focus moves smoothly between neighboring bars', () => {
  const scales = galleryWaveScales(6.5, 15);

  assertClose(scales[6], scales[7]);
  assert.ok(scales[6] < 1);
  assert.ok(scales[6] > scales[5]);
  assert.ok(scales[7] > scales[8]);
  assert.ok(scales.every((scale) => scale >= 0.22 && scale <= 1));
});

test('wave focus clamps safely for invalid and out-of-range positions', () => {
  assert.deepEqual(galleryWaveScales(-10, 3), galleryWaveScales(0, 3));
  assert.deepEqual(galleryWaveScales(10, 3), galleryWaveScales(2, 3));
  assert.deepEqual(galleryWaveScales(Number.NaN, 3), galleryWaveScales(0, 3));
});

test('focus damping converges and reduced motion snaps immediately', () => {
  const first = dampGalleryFocus(0, 10, false);
  const second = dampGalleryFocus(first, 10, false);

  assert.ok(first > 0 && first < 10);
  assert.ok(second > first && second < 10);
  assert.equal(dampGalleryFocus(0, 10, true), 10);
  assert.equal(dampGalleryFocus(Number.NaN, 4, false), 4);
  assert.equal(dampGalleryFocus(4, Number.NaN, false), 3.04);
});
