import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BASE_POSTERIOR_AMPLITUDE,
  BASE_POSTERIOR_MEAN,
  gaussianDensity,
  mosaicRippleSample,
  posteriorForPointer,
  STATIC_TERRAIN_LAYERS,
  terrainComponentsForState,
} from './hero-pixel-field.ts';
import {
  isMastheadTextSafeZone,
  mastheadParticleCount,
  seedMastheadParticles,
} from './masthead-pixel-field.ts';
import {
  liquidGlassGeometry,
  liquidGlassPointerEnabled,
  liquidGlassSample,
  liquidGlassSpring,
} from './liquid-glass.ts';

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

test('liquid glass keeps a restrained convex magnification at every viewport size', () => {
  const narrow = liquidGlassGeometry(320);
  const desktop = liquidGlassGeometry(1440);
  const ultrawide = liquidGlassGeometry(3840);

  assert.equal(narrow.radiusX, 48);
  assert.ok(desktop.radiusX > narrow.radiusX);
  assert.equal(ultrawide.radiusX, 64);
  assert.equal(desktop.radiusY, desktop.radiusX * 1.16);
  assert.equal(desktop.magnification, 1.072);
});

test('liquid glass magnifies the center and resolves cleanly at its rim', () => {
  const center = liquidGlassSample(0, 90, 1);
  const meniscus = liquidGlassSample(45, 90, 1);
  const edge = liquidGlassSample(90, 90, 1);
  const root = liquidGlassSample(0, 90, 0.12);

  assert.equal(center.proximity, 1);
  assert.equal(center.scale, 1.082);
  assert.ok(meniscus.refraction > center.refraction);
  assert.deepEqual(edge, { proximity: 0, scale: 1, refraction: 0 });
  assert.ok(root.scale > 1);
  assert.ok(root.scale < center.scale);
});

test('liquid glass spring converges without overshooting into unstable geometry', () => {
  let spring = { value: 0, velocity: 0 };
  for (let frame = 0; frame < 180; frame += 1) {
    spring = liquidGlassSpring(spring, 100, 1 / 60);
    assert.ok(Number.isFinite(spring.value));
    assert.ok(Number.isFinite(spring.velocity));
    assert.ok(spring.value > -1);
    assert.ok(spring.value < 112);
  }
  assert.ok(Math.abs(spring.value - 100) < 0.001);
});

test('liquid glass pointer interaction disables cleanly at fallback boundaries', () => {
  assert.equal(liquidGlassPointerEnabled(true, true, false, true), true);
  assert.equal(liquidGlassPointerEnabled(false, true, false, true), false);
  assert.equal(liquidGlassPointerEnabled(true, false, false, true), false);
  assert.equal(liquidGlassPointerEnabled(true, true, true, true), false);
  assert.equal(liquidGlassPointerEnabled(true, true, false, false), false);
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
