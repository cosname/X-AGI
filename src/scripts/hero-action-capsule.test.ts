import assert from 'node:assert/strict';
import test from 'node:test';

import { heroActionCapsuleGeometry } from './hero-action-capsule.ts';

test('hero action capsule adopts the active target dimensions', () => {
  const geometry = heroActionCapsuleGeometry(
    { left: 100, top: 40, width: 240, height: 44 },
    { left: 236, top: 40, width: 92, height: 44 },
  );

  assert.deepEqual(geometry, { x: 136, y: 0, width: 92, height: 44 });
});

test('hero action capsule follows a target that wraps onto another row', () => {
  const geometry = heroActionCapsuleGeometry(
    { left: 24, top: 180, width: 220, height: 100 },
    { left: 54, top: 236, width: 156, height: 44 },
  );

  assert.deepEqual(geometry, { x: 30, y: 56, width: 156, height: 44 });
});
