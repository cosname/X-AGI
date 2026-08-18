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
import {
  liquidGlassGeometry,
  liquidGlassSpring,
} from './liquid-glass.ts';

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

const traceLiquidGlassPath = (
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  tilt: number,
  scale = 1,
) => {
  const cosine = Math.cos(tilt);
  const sine = Math.sin(tilt);
  const point = (x: number, y: number) => ({
    x: centerX + (x * radiusX * cosine - y * radiusY * sine) * scale,
    y: centerY + (x * radiusX * sine + y * radiusY * cosine) * scale,
  });
  const top = point(0, -1);
  context.beginPath();
  context.moveTo(top.x, top.y);

  const topRightA = point(0.62, -0.98);
  const topRightB = point(1.04, -0.52);
  const right = point(1, 0.06);
  context.bezierCurveTo(topRightA.x, topRightA.y, topRightB.x, topRightB.y, right.x, right.y);

  const bottomRightA = point(0.98, 0.62);
  const bottomRightB = point(0.48, 1.04);
  const bottom = point(-0.08, 1);
  context.bezierCurveTo(
    bottomRightA.x,
    bottomRightA.y,
    bottomRightB.x,
    bottomRightB.y,
    bottom.x,
    bottom.y,
  );

  const bottomLeftA = point(-0.68, 0.96);
  const bottomLeftB = point(-1.04, 0.52);
  const left = point(-0.98, -0.05);
  context.bezierCurveTo(
    bottomLeftA.x,
    bottomLeftA.y,
    bottomLeftB.x,
    bottomLeftB.y,
    left.x,
    left.y,
  );

  const topLeftA = point(-0.92, -0.58);
  const topLeftB = point(-0.52, -1.02);
  context.bezierCurveTo(topLeftA.x, topLeftA.y, topLeftB.x, topLeftB.y, top.x, top.y);
  context.closePath();
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
    const liquidGlassEnabled = field.hasAttribute('data-liquid-glass-field');
    const abortController = new AbortController();
    const { signal } = abortController;
    const terrainLayer = document.createElement('canvas');
    const terrainContext = terrainLayer.getContext('2d');
    const sceneLayer = document.createElement('canvas');
    const sceneContext = sceneLayer.getContext('2d', { alpha: true });
    if (!sceneContext) {
      field.dataset.initialized = 'false';
      return;
    }
    const patternLayer = document.createElement('canvas');
    patternLayer.width = CELL;
    patternLayer.height = CELL;
    const patternContext = patternLayer.getContext('2d');

    let width = 1;
    let height = 1;
    let pixelRatio = 1;
    let particles: Particle[] = [];
    let pointer: Point = { x: 0, y: 0 };
    let lensX = { value: 0, velocity: 0 };
    let lensY = { value: 0, velocity: 0 };
    let lensTimestamp = 0;
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
      const legacyInteraction = !liquidGlassEnabled && active && motionEnabled();

      if (legacyInteraction) {
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

        if (legacyInteraction) {
          const deltaX = particle.x - pointer.x;
          const deltaY = particle.y - pointer.y;
          const distance = Math.hypot(deltaX, deltaY);
          if (distance < radius) {
            const sample = mosaicRippleSample(distance, radius, timestamp * 0.001, particle.phase, 1);
            if (sample.proximity > 0.01) {
              const directionX = distance > 1 ? deltaX / distance : 0;
              const directionY = distance > 1 ? deltaY / distance : -0.25;
              drawX += directionX * sample.lift * 3.2;
              drawY += directionY * sample.lift * 3.2;
              size = Math.max(1, particle.size * (1 + (sample.scale - 1) * 1.8));
              const wash = sample.proximity * 0.78;
              red = Math.round(red + (253 - red) * wash);
              green = Math.round(green + (248 - green) * wash);
              blue = Math.round(blue + (241 - blue) * wash);
              alpha = clamp(particle.alpha + sample.proximity * 0.38, 0, 1);
            }
          }
        }

        targetContext.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
        targetContext.fillRect(drawX, drawY, size, size);
      });
    };

    const drawLiquidGlass = () => {
      if (!liquidGlassEnabled || !active || !motionEnabled()) {
        field.dataset.liquidGlass = liquidGlassEnabled ? 'idle' : 'disabled';
        return;
      }

      const geometry = liquidGlassGeometry(width);
      const speed = Math.hypot(lensX.velocity, lensY.velocity);
      const stretch = 1 + clamp(speed / 7600, 0, 0.035);
      const radiusX = geometry.radiusX * stretch;
      const radiusY = geometry.radiusY / Math.sqrt(stretch);
      const tilt = clamp(lensX.velocity / 1700, -0.09, 0.09);
      const centerX = lensX.value;
      const centerY = lensY.value;
      const sourceWidth = (radiusX * 2 / geometry.magnification) * pixelRatio;
      const sourceHeight = (radiusY * 2 / geometry.magnification) * pixelRatio;
      const sourceCenterX = (centerX - lensX.velocity * 0.0012) * pixelRatio;
      const sourceCenterY = (centerY - lensY.velocity * 0.0012) * pixelRatio;

      context.save();
      traceLiquidGlassPath(context, centerX, centerY, radiusX, radiusY, tilt);
      context.clip();
      context.drawImage(
        sceneLayer,
        sourceCenterX - sourceWidth / 2,
        sourceCenterY - sourceHeight / 2,
        sourceWidth,
        sourceHeight,
        centerX - radiusX,
        centerY - radiusY,
        radiusX * 2,
        radiusY * 2,
      );
      const innerLight = context.createRadialGradient(
        centerX - radiusX * 0.38,
        centerY - radiusY * 0.42,
        0,
        centerX,
        centerY,
        radiusY * 1.08,
      );
      innerLight.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
      innerLight.addColorStop(0.34, 'rgba(255, 255, 255, 0.025)');
      innerLight.addColorStop(0.74, 'rgba(103, 82, 200, 0.055)');
      innerLight.addColorStop(1, 'rgba(74, 182, 193, 0.1)');
      context.fillStyle = innerLight;
      context.fillRect(centerX - radiusX, centerY - radiusY, radiusX * 2, radiusY * 2);
      context.restore();

      context.save();
      context.shadowColor = 'rgba(77, 57, 177, 0.24)';
      context.shadowBlur = 13;
      context.shadowOffsetX = 3;
      context.shadowOffsetY = 5;
      const rim = context.createLinearGradient(
        centerX - radiusX,
        centerY - radiusY,
        centerX + radiusX,
        centerY + radiusY,
      );
      rim.addColorStop(0, 'rgba(103, 82, 200, 0.66)');
      rim.addColorStop(0.24, 'rgba(255, 255, 255, 0.92)');
      rim.addColorStop(0.55, 'rgba(77, 189, 197, 0.55)');
      rim.addColorStop(0.78, 'rgba(255, 255, 255, 0.76)');
      rim.addColorStop(1, 'rgba(103, 82, 200, 0.72)');
      context.strokeStyle = rim;
      context.lineWidth = 1.4;
      traceLiquidGlassPath(context, centerX, centerY, radiusX, radiusY, tilt, 0.995);
      context.stroke();
      context.restore();

      context.save();
      context.strokeStyle = 'rgba(255, 255, 255, 0.72)';
      context.lineWidth = 0.85;
      traceLiquidGlassPath(context, centerX, centerY, radiusX, radiusY, tilt, 0.94);
      context.stroke();
      context.restore();
      field.dataset.liquidGlass = 'active';
    };

    const draw = (timestamp: number) => {
      paintTerrain();
      sceneContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      sceneContext.clearRect(0, 0, width, height);
      sceneContext.drawImage(terrainLayer, 0, 0, width, height);
      drawParticles(sceneContext, timestamp);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.drawImage(sceneLayer, 0, 0, width, height);
      let lensMoving = false;
      if (liquidGlassEnabled && active && motionEnabled()) {
        const delta = lensTimestamp ? (timestamp - lensTimestamp) / 1000 : 1 / 60;
        lensTimestamp = timestamp;
        lensX = liquidGlassSpring(lensX, pointer.x, delta, 205, 21);
        lensY = liquidGlassSpring(lensY, pointer.y, delta, 205, 21);
        lensMoving = (
          Math.abs(lensX.value - pointer.x) >= 0.12
          || Math.abs(lensY.value - pointer.y) >= 0.12
          || Math.abs(lensX.velocity) >= 0.6
          || Math.abs(lensY.velocity) >= 0.6
        );
      }
      drawLiquidGlass();
      field.dataset.ready = 'true';
      field.dataset.animated = motionEnabled() ? 'true' : 'false';
      return lensMoving;
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
      const lensMoving = draw(timestamp);
      if (!liquidGlassEnabled || lensMoving) {
        pointerFrame = window.requestAnimationFrame(pointerTick);
      }
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
      field.dataset.liquidGlass = liquidGlassEnabled ? 'idle' : 'disabled';
      lensTimestamp = 0;
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
      sceneLayer.width = canvas.width;
      sceneLayer.height = canvas.height;
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
      if (!active) {
        lensX = { value: pointer.x, velocity: 0 };
        lensY = { value: pointer.y, velocity: 0 };
        lensTimestamp = 0;
      }
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
    field.dataset.liquidGlass = liquidGlassEnabled ? 'idle' : 'disabled';
    scheduleResize();
  });
};
