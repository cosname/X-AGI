import {
  BASE_POSTERIOR_AMPLITUDE,
  BASE_POSTERIOR_MEAN,
  gaussianDensity,
  mosaicRippleSample,
  posteriorForPointer,
  STATIC_TERRAIN_LAYERS,
  terrainComponentsForState,
  type DensityComponent,
} from './hero-pixel-field.ts';

const CELL = 5;
const SQUARE = 4;
const MIN_POSTERIOR_AMPLITUDE = 0.12;
const NARROW_POSTERIOR_AMPLITUDE = 0.185;
const PARTICLE_PALETTE = [
  [25, 56, 150],
  [56, 70, 157],
  [92, 103, 168],
  [107, 115, 177],
  [131, 137, 230],
  [101, 168, 179],
  [155, 143, 214],
  [235, 142, 58],
  [200, 194, 226],
] as const;
const PARTICLE_SIZES = [2, 2, 3, 3, 3, 4, 4, 5, 6] as const;

type Point = { x: number; y: number };
type Particle = Point & {
  size: number;
  color: readonly [number, number, number];
  alpha: number;
  phase: number;
};

const clamp = (value: number, minimum: number, maximum: number) => (
  Math.min(maximum, Math.max(minimum, value))
);

const randomFrom = (seed: number) => {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
};

const dampedSpring = (
  value: number,
  velocity: number,
  target: number,
  delta: number,
  stiffness: number,
  damping: number,
) => {
  const nextVelocity = (velocity + (target - value) * stiffness * delta) * Math.exp(-damping * delta);
  return { value: value + nextVelocity * delta, velocity: nextVelocity };
};

const densityTop = (
  normalizedX: number,
  components: readonly DensityComponent[],
  baseline: number,
  height: number,
) => {
  const density = components.reduce(
    (sum, [mean, sigma, peak]) => sum + gaussianDensity(normalizedX, mean, sigma) * peak,
    0,
  );
  return clamp(baseline - density, -0.12, 1.08) * height;
};

export const mastheadParticleCount = (width: number) => (width < 720 ? 148 : 228);

export const isMastheadTextSafeZone = (
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  const compact = width < 720;
  const headerDepth = Math.min(88, height * 0.3);
  const inBrandWell = y < headerDepth && x < width * (compact ? 0.44 : 0.2);
  const inNavigationWell = y < headerDepth && x > width * (compact ? 0.58 : 0.49);
  const inTitleWell = (
    x < width * (compact ? 0.82 : 0.43)
    && y > height * 0.34
    && y < height * 0.92
  );

  return inBrandWell || inNavigationWell || inTitleWell;
};

export const seedMastheadParticles = (width: number, height: number, seed: number): Particle[] => {
  const random = randomFrom(seed);
  const target = mastheadParticleCount(width);
  const particles: Particle[] = [];
  let attempts = 0;

  while (particles.length < target && attempts < target * 8) {
    attempts += 1;
    const x = (0.12 + (random() ** 0.68) * 0.88) * width;
    const y = (random() ** 1.08) * height * 0.9;
    if (isMastheadTextSafeZone(x, y, width, height)) continue;

    particles.push({
      x,
      y,
      size: PARTICLE_SIZES[Math.floor(random() * PARTICLE_SIZES.length)],
      color: PARTICLE_PALETTE[Math.floor(random() * PARTICLE_PALETTE.length)],
      alpha: 0.5 + random() * 0.46,
      phase: random() * Math.PI * 2,
    });
  }

  return particles;
};

export const initializeMastheadPixelFields = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  document.querySelectorAll<HTMLElement>('[data-masthead-pixel-field]').forEach((field, fieldIndex) => {
    if (field.dataset.initialized === 'true') return;

    const canvas = field.querySelector<HTMLCanvasElement>('canvas');
    const context = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !context) return;

    field.dataset.initialized = 'true';

    const stage = field.closest<HTMLElement>('[data-connection-stage]') ?? field;
    const rippleOnly = field.dataset.pointerEffect === 'ripple';
    const abortController = new AbortController();
    const { signal } = abortController;
    const terrainLayer = document.createElement('canvas');
    const terrainContext = terrainLayer.getContext('2d');
    const patternLayer = document.createElement('canvas');
    patternLayer.width = CELL;
    patternLayer.height = CELL;
    const patternContext = patternLayer.getContext('2d');

    let width = 1;
    let height = 1;
    let pixelRatio = 1;
    let particles: Particle[] = [];
    let pointer: Point = { x: 0, y: 0 };
    let fieldOrigin: Point = { x: 0, y: 0 };
    let mean = BASE_POSTERIOR_MEAN;
    let amplitude = BASE_POSTERIOR_AMPLITUDE;
    let meanVelocity = 0;
    let amplitudeVelocity = 0;
    let lastTerrainKey = '';
    let lastTimestamp = 0;
    let pointerFrame = 0;
    let springFrame = 0;
    let resizeFrame = 0;
    let originFrame = 0;
    let active = false;
    let visible = true;
    let pointerDirty = false;

    const motionEnabled = () => !prefersReducedMotion.matches && finePointer.matches;
    const baseAmplitude = () => (width < 360 ? NARROW_POSTERIOR_AMPLITUDE : BASE_POSTERIOR_AMPLITUDE);

    const paintTerrain = (force = false) => {
      if (!terrainContext) return;
      const terrainKey = [
        Math.round(width),
        Math.round(height),
        mean.toFixed(4),
        amplitude.toFixed(4),
      ].join(':');
      if (!force && terrainKey === lastTerrainKey) return;
      lastTerrainKey = terrainKey;

      terrainContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      terrainContext.clearRect(0, 0, width, height);
      terrainContext.fillStyle = '#f5f0ea';
      terrainContext.fillRect(0, 0, width, height);

      const restingAmplitude = baseAmplitude();
      const columns = Math.max(1, Math.ceil(width / CELL));

      STATIC_TERRAIN_LAYERS.forEach((layer) => {
        if (!patternContext) return;
        const [red, green, blue] = layer.color.split(' ').map(Number);
        patternContext.clearRect(0, 0, CELL, CELL);
        patternContext.fillStyle = `rgba(${red}, ${green}, ${blue}, ${layer.alpha})`;
        patternContext.fillRect(0, 0, SQUARE, SQUARE);
        const pattern = terrainContext.createPattern(patternLayer, 'repeat');
        if (!pattern) return;

        const components = terrainComponentsForState(layer, mean, amplitude, restingAmplitude);
        terrainContext.fillStyle = pattern;
        terrainContext.beginPath();
        terrainContext.moveTo(0, height);
        for (let column = 0; column <= columns; column += 1) {
          const x = (column / columns) * width;
          const rawTop = densityTop(column / columns, components, layer.baseline, height);
          const top = rawTop * 0.58 + height * 0.4;
          terrainContext.lineTo(x, top);
        }
        terrainContext.lineTo(width, height);
        terrainContext.closePath();
        terrainContext.fill();
      });
    };

    const drawParticles = (targetContext: CanvasRenderingContext2D, timestamp: number) => {
      const radius = clamp(width * 0.11, 78, 148);
      const interacting = active && motionEnabled();

      if (interacting && !rippleOnly) {
        const glow = targetContext.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, radius);
        glow.addColorStop(0, 'rgba(255, 252, 247, 0.3)');
        glow.addColorStop(0.42, 'rgba(235, 142, 58, 0.1)');
        glow.addColorStop(1, 'rgba(255, 252, 247, 0)');
        targetContext.fillStyle = glow;
        targetContext.beginPath();
        targetContext.arc(pointer.x, pointer.y, radius, 0, Math.PI * 2);
        targetContext.fill();
      }

      particles.forEach((particle) => {
        let drawX = particle.x;
        let drawY = particle.y;
        let size = particle.size;
        let [red, green, blue] = particle.color;
        let alpha = particle.alpha;

        if (interacting) {
          const deltaX = particle.x - pointer.x;
          const deltaY = particle.y - pointer.y;
          const distance = Math.hypot(deltaX, deltaY);
          if (distance < radius) {
            const sample = mosaicRippleSample(distance, radius, timestamp * 0.001, particle.phase, 1);
            if (sample.proximity > 0.01) {
              const directionX = distance > 1 ? deltaX / distance : 0;
              const directionY = distance > 1 ? deltaY / distance : -0.25;
              const movement = rippleOnly ? 2.35 : 3.2;
              const scaleStrength = rippleOnly ? 1.35 : 1.8;
              drawX += directionX * sample.lift * movement;
              drawY += directionY * sample.lift * movement;
              size = Math.max(1, particle.size * (1 + (sample.scale - 1) * scaleStrength));
              if (rippleOnly) {
                alpha = clamp(particle.alpha + sample.proximity * 0.16, 0, 1);
              } else {
                const wash = sample.proximity * 0.78;
                red = Math.round(red + (253 - red) * wash);
                green = Math.round(green + (248 - green) * wash);
                blue = Math.round(blue + (241 - blue) * wash);
                alpha = clamp(particle.alpha + sample.proximity * 0.38, 0, 1);
              }
            }
          }
        }

        targetContext.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
        targetContext.fillRect(drawX, drawY, size, size);
      });
    };

    const draw = (timestamp: number) => {
      paintTerrain();
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.drawImage(terrainLayer, 0, 0, width, height);
      drawParticles(context, timestamp);
      field.dataset.ready = 'true';
      field.dataset.animated = motionEnabled() ? 'true' : 'false';
    };

    const commit = (nextMean: number, nextAmplitude: number) => {
      mean = clamp(nextMean, -0.05, 1.05);
      amplitude = clamp(
        nextAmplitude,
        MIN_POSTERIOR_AMPLITUDE,
        width < 360 ? NARROW_POSTERIOR_AMPLITUDE : 0.265,
      );
    };

    const stopPointerFrame = () => {
      if (!pointerFrame) return;
      window.cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
    };

    const stopSpring = () => {
      if (!springFrame) return;
      window.cancelAnimationFrame(springFrame);
      springFrame = 0;
      lastTimestamp = 0;
    };

    const pointerTick = (timestamp: number) => {
      pointerFrame = 0;
      if (!active || !visible || document.hidden || !motionEnabled()) return;
      if (pointerDirty) {
        const next = posteriorForPointer(pointer.x, pointer.y, width, height);
        meanVelocity = 0;
        amplitudeVelocity = 0;
        commit(
          BASE_POSTERIOR_MEAN + (next.mean - BASE_POSTERIOR_MEAN) * 2.8,
          baseAmplitude() + (next.amplitude - baseAmplitude()) * 2.4,
        );
        pointerDirty = false;
      }
      draw(timestamp);
      pointerFrame = window.requestAnimationFrame(pointerTick);
    };

    const springTick = (timestamp: number) => {
      if (!visible || document.hidden || !motionEnabled()) {
        stopSpring();
        return;
      }
      const delta = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 1000, 0.05) : 1 / 60;
      lastTimestamp = timestamp;
      const targetAmplitude = baseAmplitude();
      const meanSpring = dampedSpring(mean, meanVelocity, BASE_POSTERIOR_MEAN, delta, 38, 8.5);
      const amplitudeSpring = dampedSpring(amplitude, amplitudeVelocity, targetAmplitude, delta, 34, 8.2);
      meanVelocity = meanSpring.velocity;
      amplitudeVelocity = amplitudeSpring.velocity;
      commit(meanSpring.value, amplitudeSpring.value);
      draw(timestamp);

      const settled = (
        Math.abs(mean - BASE_POSTERIOR_MEAN) < 0.0004
        && Math.abs(amplitude - targetAmplitude) < 0.0004
        && Math.abs(meanVelocity) < 0.003
        && Math.abs(amplitudeVelocity) < 0.003
      );
      if (!settled) {
        springFrame = window.requestAnimationFrame(springTick);
        return;
      }
      mean = BASE_POSTERIOR_MEAN;
      amplitude = targetAmplitude;
      draw(timestamp);
      stopSpring();
    };

    const startSpring = () => {
      stopSpring();
      if (!motionEnabled() || !visible || document.hidden) return;
      springFrame = window.requestAnimationFrame(springTick);
    };

    const deactivate = () => {
      if (!active) return;
      active = false;
      pointerDirty = false;
      stopPointerFrame();
      field.dataset.interaction = 'idle';
      draw(performance.now());
      startSpring();
    };

    const resize = () => {
      const bounds = field.getBoundingClientRect();
      width = Math.max(1, Math.round(bounds.width));
      height = Math.max(1, Math.round(bounds.height));
      fieldOrigin = { x: bounds.left, y: bounds.top };
      const pixelBudgetRatio = Math.sqrt(3_400_000 / Math.max(width * height, 1));
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75, pixelBudgetRatio);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      terrainLayer.width = canvas.width;
      terrainLayer.height = canvas.height;
      if (!active) amplitude = baseAmplitude();
      particles = seedMastheadParticles(width, height, 2026 + fieldIndex);
      lastTerrainKey = '';
      paintTerrain(true);
      draw(performance.now());
      field.dataset.particleCount = `${particles.length}`;
    };

    const scheduleResize = () => {
      if (resizeFrame) return;
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        resize();
      });
    };

    stage.addEventListener('pointermove', (event) => {
      if (!event.isPrimary || event.pointerType === 'touch' || !motionEnabled()) return;
      const latest = event.getCoalescedEvents?.().at(-1) ?? event;
      pointer = {
        x: clamp(latest.clientX - fieldOrigin.x, 0, width),
        y: clamp(latest.clientY - fieldOrigin.y, 0, height),
      };
      stopSpring();
      active = true;
      pointerDirty = true;
      field.dataset.interaction = 'pointer';
      if (!pointerFrame) pointerFrame = window.requestAnimationFrame(pointerTick);
    }, { passive: true, signal });
    stage.addEventListener('pointerleave', deactivate, { passive: true, signal });
    stage.addEventListener('pointercancel', deactivate, { passive: true, signal });
    window.addEventListener('blur', deactivate, { signal });
    window.addEventListener('scroll', () => {
      if (originFrame) return;
      originFrame = window.requestAnimationFrame(() => {
        originFrame = 0;
        const bounds = field.getBoundingClientRect();
        fieldOrigin = { x: bounds.left, y: bounds.top };
      });
    }, { passive: true, signal });

    const resizeObserver = new ResizeObserver(scheduleResize);
    resizeObserver.observe(field);
    if (stage !== field) resizeObserver.observe(stage);

    const intersectionObserver = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      if (visible) return;
      active = false;
      pointerDirty = false;
      stopPointerFrame();
      stopSpring();
      mean = BASE_POSTERIOR_MEAN;
      amplitude = baseAmplitude();
      lastTerrainKey = '';
      draw(performance.now());
    }, { rootMargin: '180px' });
    intersectionObserver.observe(field);

    const handleMotionChange = () => {
      deactivate();
      lastTerrainKey = '';
      draw(performance.now());
    };
    prefersReducedMotion.addEventListener('change', handleMotionChange, { signal });
    finePointer.addEventListener('change', handleMotionChange, { signal });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) deactivate();
    }, { signal });

    const destroy = () => {
      stopPointerFrame();
      stopSpring();
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      if (originFrame) window.cancelAnimationFrame(originFrame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      abortController.abort();
      field.dataset.initialized = 'false';
    };
    document.addEventListener('astro:before-swap', destroy, { once: true, signal });

    field.dataset.renderMode = 'canvas';
    field.dataset.interaction = 'idle';
    scheduleResize();
  });
};
