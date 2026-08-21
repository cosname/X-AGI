import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TREE_FLIP_PALETTE,
  TREE_FLIP_TRAVEL_DURATION,
  titleSheenStrength,
  treeFlipSample,
  treePointerNear,
} from './hero-pixel-field.ts';

test('tree flip palette contains only the approved purple shades', () => {
  assert.deepEqual(TREE_FLIP_PALETTE, [
    'rgb(55 47 142)',
    'rgb(103 82 200)',
    'rgb(172 158 230)',
  ]);
});

test('both tree flip waves travel from bottom to top', () => {
  const start = treeFlipSample(0.5, 0.42, 0);
  const later = treeFlipSample(0.5, 0.42, 1_000);

  assert.ok(later.primaryWave < start.primaryWave);
  assert.ok(later.secondaryWave < start.secondaryWave);
});

test('tree flip wave positions repeat deterministically at the cycle boundary', () => {
  const start = treeFlipSample(0.5, 0.42, 0);
  const wrapped = treeFlipSample(0.5, 0.42, TREE_FLIP_TRAVEL_DURATION);

  assert.equal(wrapped.primaryWave, start.primaryWave);
  assert.equal(wrapped.secondaryWave, start.secondaryWave);
  assert.equal(wrapped.flip, start.flip);
  assert.equal(wrapped.cycleIndex, start.cycleIndex + 1);
});

test('tree flip seed jitter stays within its intended vertical bound', () => {
  const low = treeFlipSample(0.5, 0, 0);
  const high = treeFlipSample(0.5, 1, 0);

  assert.ok(Math.abs(low.jitteredY - 0.465) < 0.000001);
  assert.ok(Math.abs(high.jitteredY - 0.535) < 0.000001);
});

test('tree pointer proximity includes the tree and a calm approach radius', () => {
  const tree = { left: 700, top: 100, right: 980, bottom: 760 };

  assert.equal(treePointerNear({ x: 800, y: 300 }, tree, 1_024), true);
  assert.equal(treePointerNear({ x: 670, y: 300 }, tree, 1_024), true);
  assert.equal(treePointerNear({ x: 640, y: 300 }, tree, 1_024), false);
});

test('title sheen fades continuously across its proximity radius', () => {
  const radius = 80;
  const near = titleSheenStrength(8, radius);
  const middle = titleSheenStrength(32, radius);
  const far = titleSheenStrength(56, radius);

  assert.equal(titleSheenStrength(0, radius), 1);
  assert.ok(near > middle);
  assert.ok(middle > far);
  assert.equal(titleSheenStrength(58, radius), 0);
});

test('tree flip strength remains clamped across positions, seeds, and cycles', () => {
  for (const normalizedY of [-1, 0, 0.5, 1, 2]) {
    for (const seed of [-1, 0, 0.2, 0.8, 1, 2]) {
      for (const timestamp of [0, 1_000, TREE_FLIP_TRAVEL_DURATION, 72_000]) {
        const { flip } = treeFlipSample(normalizedY, seed, timestamp);
        assert.ok(flip >= 0 && flip <= 1);
      }
    }
  }
});
