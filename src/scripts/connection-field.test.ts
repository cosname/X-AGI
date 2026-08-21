import assert from 'node:assert/strict';
import test from 'node:test';

import {
  connectionAvoidanceWeight,
  portraitConnectionFlockForNode,
  schoolingWanderTarget,
} from './portrait-connection-field.ts';
import {
  BASE_POSTERIOR_AMPLITUDE,
  BASE_POSTERIOR_MEAN,
  gaussianDensity,
  mosaicRippleSample,
  advanceTreeWind,
  treeWindImpulse,
  posteriorForPointer,
  STATIC_TERRAIN_LAYERS,
  terrainLayerForProfile,
  terrainComponentsForState,
  treeInteractionGeometry,
} from './hero-pixel-field.ts';
import {
  isMastheadTextSafeZone,
  mastheadParticleCount,
  seedMastheadParticles,
} from './masthead-pixel-field.ts';

test('connection avoidance is smooth, local, and bounded', () => {
  assert.equal(connectionAvoidanceWeight(0, 160), 1);
  assert.equal(connectionAvoidanceWeight(160, 160), 0);
  assert.equal(connectionAvoidanceWeight(320, 160), 0);
  assert.ok(connectionAvoidanceWeight(40, 160) > connectionAvoidanceWeight(100, 160));
  assert.ok(connectionAvoidanceWeight(100, 160) > 0);
});

test('portrait connection groups preserve the three intended school regions', () => {
  assert.equal(portraitConnectionFlockForNode(0), 'upper');
  assert.equal(portraitConnectionFlockForNode(20), 'upper');
  assert.equal(portraitConnectionFlockForNode(21), 'lower-left');
  assert.equal(portraitConnectionFlockForNode(27), 'lower-left');
  assert.equal(portraitConnectionFlockForNode(28), 'lower-right');
});

test('schooling wander targets are deterministic, bounded, and non-uniform', () => {
  const first = schoolingWanderTarget('upper', 4);
  const repeated = schoolingWanderTarget('upper', 4);
  const next = schoolingWanderTarget('upper', 5);
  const lower = schoolingWanderTarget('lower-right', 4);

  assert.deepEqual(first, repeated);
  assert.notDeepEqual(first, next);
  assert.notDeepEqual(first, lower);
  [first, next, lower].forEach(({ x, y }) => {
    assert.ok(x >= -1 && x <= 1);
    assert.ok(y >= -1 && y <= 1);
  });
});

test('gaussian density peaks at its mean', () => {
  assert.equal(gaussianDensity(0.675, 0.675, 0.078), 1);
});

test('gaussian density is symmetric and decays away from its mean', () => {
  const mean = 0.675;
  const sigma = 0.078;
  const left = gaussianDensity(mean - sigma, mean, sigma);
  const right = gaussianDensity(mean + sigma, mean, sigma);
  const far = gaussianDensity(mean + sigma * 3, mean, sigma);

  assert.ok(Math.abs(left - right) < Number.EPSILON * 8);
  assert.ok(left > far);
  assert.ok(far > 0);
});

test('gaussian density remains finite for a zero-width input', () => {
  const density = gaussianDensity(0.5, 0.5, 0);

  assert.ok(Number.isFinite(density));
  assert.equal(density, 1);
});

test('posterior keeps its own distribution and shifts gently toward the pointer', () => {
  const left = posteriorForPointer(0, 620, 1000, 1000);
  const center = posteriorForPointer(500, 620, 1000, 1000);
  const right = posteriorForPointer(1000, 620, 1000, 1000);

  assert.ok(Math.abs(left.mean - 0.647) < 1e-12);
  assert.ok(Math.abs(center.mean - BASE_POSTERIOR_MEAN) < 1e-12);
  assert.ok(Math.abs(right.mean - 0.703) < 1e-12);
  assert.ok(left.mean > 0);
  assert.ok(right.mean < 1);
});

test('posterior keeps vertical movement inside the safe probability band', () => {
  const top = posteriorForPointer(-20, -40, 1000, 1000);
  const bottom = posteriorForPointer(1100, 1200, 1000, 1000);

  assert.ok(Math.abs(top.mean - 0.647) < 1e-12);
  assert.equal(top.amplitude, 0.265);
  assert.ok(Math.abs(bottom.mean - 0.703) < 1e-12);
  assert.ok(bottom.amplitude >= 0.12);
  assert.ok(bottom.amplitude < BASE_POSTERIOR_AMPLITUDE);
});

test('posterior reserves action spacing on the narrowest layout', () => {
  assert.deepEqual(posteriorForPointer(160, 0, 320, 688), { mean: 0.675, amplitude: 0.185 });
});

test('terrain interaction changes peak values more than peak positions', () => {
  const layer = STATIC_TERRAIN_LAYERS.find(({ key }) => key === 'periwinkle');
  assert.ok(layer);

  const resting = terrainComponentsForState(
    layer,
    BASE_POSTERIOR_MEAN,
    BASE_POSTERIOR_AMPLITUDE,
  );
  const pointerRight = terrainComponentsForState(
    layer,
    BASE_POSTERIOR_MEAN + 0.028,
    BASE_POSTERIOR_AMPLITUDE,
  );

  const intrinsicPeaks = resting.slice(0, layer.components.length);
  const peakChanges = intrinsicPeaks.map((component, index) => Math.abs(pointerRight[index][2] - component[2]));
  const meanChanges = intrinsicPeaks.map((component, index) => Math.abs(pointerRight[index][0] - component[0]));
  assert.ok(peakChanges.some((change) => change > 0.004));
  assert.ok(meanChanges.every((change) => change < 0.01));
});

test('terrain layers preserve their intrinsic resting distribution', () => {
  STATIC_TERRAIN_LAYERS.forEach((layer) => {
    const resting = terrainComponentsForState(
      layer,
      BASE_POSTERIOR_MEAN,
      BASE_POSTERIOR_AMPLITUDE,
    );
    layer.components.forEach((component, index) => {
      assert.deepEqual(resting[index], component);
    });
  });
});

test('tree foundation profile centers the right terrain beneath the root', () => {
  const foundation = STATIC_TERRAIN_LAYERS.find(({ key }) => key === 'foundation');
  assert.ok(foundation);

  const profiled = terrainLayerForProfile(foundation, 'tree-foundation');
  const densityAtRoot = profiled.components.reduce(
    (density, [mean, sigma, peak]) => density + gaussianDensity(0.903, mean, sigma) * peak,
    0,
  );

  assert.notDeepEqual(profiled.components, foundation.components);
  assert.equal(profiled.components[0][0], 0.89);
  assert.ok(profiled.components[0][2] > foundation.components[1][2]);
  assert.ok(densityAtRoot > 0.12);
  assert.ok(densityAtRoot < 0.14);
});

test('mosaic ripple stays local and preserves a stable root', () => {
  const crown = mosaicRippleSample(0, 90, 0, Math.PI / 2, 1);
  const root = mosaicRippleSample(0, 90, 0, Math.PI / 2, 0.12);
  const outside = mosaicRippleSample(90, 90, 0, Math.PI / 2, 1);

  assert.ok(crown.scale > 1.12);
  assert.ok(Math.abs(root.scale - 1) < Math.abs(crown.scale - 1));
  assert.ok(root.lift < crown.lift);
  assert.deepEqual(outside, { proximity: 0, scale: 1, lift: 0 });
});

test('mosaic ripple scale remains bounded throughout its cycle', () => {
  for (let frame = 0; frame < 120; frame += 1) {
    const sample = mosaicRippleSample(12, 90, frame / 60, 0.7, 1);
    assert.ok(sample.scale >= 0.84);
    assert.ok(sample.scale <= 1.16);
    assert.ok(sample.lift >= 0);
  }
});

test('tree ripple uses a broad proximity field around both mosaics', () => {
  const direct = treeInteractionGeometry(1280, 'direct');
  const calm = treeInteractionGeometry(1280, 'calm');
  const narrow = treeInteractionGeometry(320);
  const desktop = treeInteractionGeometry(1280);
  const ultrawide = treeInteractionGeometry(3840);

  assert.equal(direct.rippleRadius, 96);
  assert.equal(direct.branchReach, 134.4);
  assert.ok(calm.rippleRadius < direct.rippleRadius);
  assert.ok(calm.branchReach < direct.branchReach);
  assert.equal(narrow.rippleRadius, 180);
  assert.ok(desktop.rippleRadius > 350);
  assert.equal(ultrawide.rippleRadius, 380);
  assert.ok(desktop.branchReach > desktop.rippleRadius);
  assert.equal(ultrawide.branchReach, 464);

  const normalBrowsingDistance = mosaicRippleSample(240, desktop.rippleRadius, 0.5, 0.7, 1);
  assert.ok(normalBrowsingDistance.proximity > 0);
});

test('tree wind follows pointer direction and becomes stronger near the tree', () => {
  const nearRight = treeWindImpulse(18, 0, 16, 1);
  const nearLeft = treeWindImpulse(-18, 0, 16, 1);
  const distantRight = treeWindImpulse(18, 0, 16, 0.2);

  assert.ok(nearRight > 0);
  assert.ok(nearLeft < 0);
  assert.ok(Math.abs(nearRight) > Math.abs(distantRight));
  assert.ok(Math.abs(nearRight) <= 1);
});

test('tree wind layers retain inertia and settle back to rest', () => {
  let trunk = { value: 0, velocity: 0 };
  let crown = { value: 0, velocity: 0 };
  for (let frame = 0; frame < 14; frame += 1) {
    trunk = advanceTreeWind(trunk, 0.3, 1 / 60, 38, 8.4);
    crown = advanceTreeWind(crown, 1, 1 / 60, 20, 4.9);
  }

  assert.ok(crown.value > trunk.value);
  assert.ok(crown.velocity > 0);

  for (let frame = 0; frame < 240; frame += 1) {
    trunk = advanceTreeWind(trunk, 0, 1 / 60, 38, 8.4);
    crown = advanceTreeWind(crown, 0, 1 / 60, 20, 4.9);
  }

  assert.ok(Math.abs(trunk.value) < 0.001);
  assert.ok(Math.abs(crown.value) < 0.001);
  assert.ok(Math.abs(crown.velocity) < 0.005);
});

test('masthead particles are deterministic and preserve the text safe zones', () => {
  const first = seedMastheadParticles(1440, 276, 2026);
  const second = seedMastheadParticles(1440, 276, 2026);
  const textWellHits = first.filter((particle) => (
    isMastheadTextSafeZone(particle.x, particle.y, 1440, 276)
  ));
  const mobile = seedMastheadParticles(390, 246, 2026);
  const mobileTextWellHits = mobile.filter((particle) => (
    isMastheadTextSafeZone(particle.x, particle.y, 390, 246)
  ));

  assert.equal(first.length, mastheadParticleCount(1440));
  assert.deepEqual(first, second);
  assert.equal(textWellHits.length, 0);
  assert.equal(mobile.length, mastheadParticleCount(390));
  assert.equal(mobileTextWellHits.length, 0);
});
