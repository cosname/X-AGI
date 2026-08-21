const PORTRAIT_MEDIA = '(max-width: 51.25rem) and (orientation: portrait)';
const FRAME_INTERVAL = 1000 / 24;

type Point = { x: number; y: number };

export type PortraitConnectionNode = Point & {
  size: number;
  color: 'lavender' | 'violet' | 'teal' | 'periwinkle';
  depth: number;
};

export type PortraitConnectionLink = {
  from: number;
  to: number;
  bend: number;
  color?: 'violet' | 'teal';
};

export type PortraitConnectionFlock = 'upper' | 'lower-left' | 'lower-right';

export const PORTRAIT_CONNECTION_NODES: readonly PortraitConnectionNode[] = [
  // Upper-right constellation.
  { x: 0.63, y: 0.08, size: 2.8, color: 'lavender', depth: 0.72 },
  { x: 0.69, y: 0.10, size: 4.2, color: 'violet', depth: 0.81 },
  { x: 0.78, y: 0.15, size: 4.8, color: 'violet', depth: 0.90 },
  { x: 0.88, y: 0.13, size: 3.5, color: 'periwinkle', depth: 0.99 },
  { x: 0.95, y: 0.17, size: 2.8, color: 'lavender', depth: 1.08 },
  { x: 0.97, y: 0.08, size: 2.5, color: 'periwinkle', depth: 0.72 },
  { x: 0.85, y: 0.18, size: 4.1, color: 'violet', depth: 0.81 },
  { x: 0.72, y: 0.21, size: 5.2, color: 'violet', depth: 0.90 },
  { x: 0.65, y: 0.17, size: 3.1, color: 'lavender', depth: 0.99 },
  { x: 0.65, y: 0.25, size: 3.4, color: 'violet', depth: 1.08 },
  { x: 0.79, y: 0.25, size: 4.4, color: 'violet', depth: 0.72 },
  { x: 0.88, y: 0.23, size: 3.6, color: 'periwinkle', depth: 0.81 },
  { x: 0.96, y: 0.22, size: 3.1, color: 'lavender', depth: 0.90 },
  { x: 0.89, y: 0.28, size: 4.7, color: 'violet', depth: 0.99 },
  { x: 0.83, y: 0.32, size: 3.6, color: 'teal', depth: 1.08 },
  { x: 0.94, y: 0.34, size: 2.8, color: 'lavender', depth: 0.72 },
  { x: 0.70, y: 0.32, size: 2.7, color: 'periwinkle', depth: 0.81 },
  { x: 0.91, y: 0.10, size: 2.4, color: 'teal', depth: 0.90 },
  { x: 0.98, y: 0.12, size: 2.3, color: 'lavender', depth: 0.99 },
  { x: 0.62, y: 0.29, size: 2.4, color: 'lavender', depth: 1.08 },
  { x: 0.93, y: 0.37, size: 2.4, color: 'periwinkle', depth: 0.72 },
  // Left-side counterweight below the primary copy.
  { x: 0.03, y: 0.64, size: 2.7, color: 'lavender', depth: 0.81 },
  { x: 0.07, y: 0.66, size: 4.3, color: 'violet', depth: 0.90 },
  { x: 0.15, y: 0.65, size: 3.4, color: 'teal', depth: 0.99 },
  { x: 0.05, y: 0.72, size: 4.8, color: 'violet', depth: 1.08 },
  { x: 0.11, y: 0.76, size: 3.3, color: 'violet', depth: 0.72 },
  { x: 0.18, y: 0.72, size: 3.5, color: 'teal', depth: 0.81 },
  { x: 0.09, y: 0.79, size: 2.7, color: 'lavender', depth: 0.90 },
  // Lower-right constellation, floating just above the terrain.
  { x: 0.80, y: 0.70, size: 2.5, color: 'lavender', depth: 0.99 },
  { x: 0.88, y: 0.71, size: 3.0, color: 'periwinkle', depth: 1.08 },
  { x: 0.76, y: 0.74, size: 4.2, color: 'violet', depth: 0.72 },
  { x: 0.85, y: 0.75, size: 4.5, color: 'violet', depth: 0.81 },
  { x: 0.93, y: 0.73, size: 3.5, color: 'periwinkle', depth: 0.90 },
  { x: 0.67, y: 0.78, size: 4.4, color: 'violet', depth: 0.99 },
  { x: 0.74, y: 0.81, size: 5.3, color: 'teal', depth: 1.08 },
  { x: 0.82, y: 0.79, size: 3.4, color: 'lavender', depth: 0.72 },
  { x: 0.66, y: 0.83, size: 3.2, color: 'violet', depth: 0.81 },
  { x: 0.79, y: 0.84, size: 4.0, color: 'violet', depth: 0.90 },
  { x: 0.90, y: 0.82, size: 3.6, color: 'teal', depth: 0.99 },
  { x: 0.72, y: 0.87, size: 3.3, color: 'lavender', depth: 1.08 },
  { x: 0.84, y: 0.87, size: 4.1, color: 'periwinkle', depth: 0.72 },
  { x: 0.94, y: 0.86, size: 2.9, color: 'periwinkle', depth: 0.81 },
  { x: 0.66, y: 0.90, size: 2.5, color: 'lavender', depth: 0.90 },
] as const;

export const PORTRAIT_CONNECTION_LINKS: readonly PortraitConnectionLink[] = [
  { from: 1, to: 2, bend: -8 }, { from: 2, to: 3, bend: 7 },
  { from: 2, to: 6, bend: -6 }, { from: 6, to: 7, bend: 9 },
  { from: 7, to: 8, bend: -8 }, { from: 7, to: 9, bend: 10 },
  { from: 7, to: 10, bend: -9 }, { from: 10, to: 11, bend: 7 },
  { from: 10, to: 12, bend: -7 }, { from: 11, to: 13, bend: 9 },
  { from: 13, to: 14, bend: -8, color: 'teal' }, { from: 14, to: 15, bend: 7, color: 'teal' },
  { from: 22, to: 23, bend: -7, color: 'teal' }, { from: 22, to: 24, bend: 8 },
  { from: 24, to: 25, bend: -8 }, { from: 25, to: 26, bend: 7, color: 'teal' },
  { from: 24, to: 27, bend: 9 },
  { from: 29, to: 30, bend: -7 }, { from: 30, to: 31, bend: 8 },
  { from: 31, to: 32, bend: -8 }, { from: 30, to: 33, bend: 9 },
  { from: 33, to: 34, bend: -7, color: 'teal' }, { from: 34, to: 35, bend: 8, color: 'teal' },
  { from: 34, to: 36, bend: -8 }, { from: 36, to: 37, bend: 7 },
  { from: 37, to: 38, bend: -7, color: 'teal' }, { from: 34, to: 39, bend: 9, color: 'teal' },
  { from: 39, to: 40, bend: -8 }, { from: 40, to: 41, bend: 8 },
  { from: 41, to: 42, bend: -7 },
] as const;

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));

export const connectionAvoidanceWeight = (distance: number, radius: number) => {
  const normalized = 1 - clamp(distance / Math.max(radius, 1), 0, 1);
  return normalized * normalized * (3 - 2 * normalized);
};

export const connectionDragWeight = connectionAvoidanceWeight;

export const portraitConnectionFlockForNode = (index: number): PortraitConnectionFlock => {
  if (index <= 20) return 'upper';
  if (index <= 27) return 'lower-left';
  return 'lower-right';
};

const seededUnit = (seed: number) => {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
};

export const schoolingWanderTarget = (flock: PortraitConnectionFlock, step: number) => {
  const seed = flock === 'upper' ? 11 : flock === 'lower-left' ? 37 : 71;
  return {
    x: seededUnit(seed + step * 2),
    y: seededUnit(seed + step * 2 + 1),
  };
};

const cubicPoint = (progress: number, start: Point, controlA: Point, controlB: Point, end: Point): Point => {
  const inverse = 1 - progress;
  const inverseSquared = inverse * inverse;
  const progressSquared = progress * progress;
  return {
    x: inverseSquared * inverse * start.x + 3 * inverseSquared * progress * controlA.x + 3 * inverse * progressSquared * controlB.x + progressSquared * progress * end.x,
    y: inverseSquared * inverse * start.y + 3 * inverseSquared * progress * controlA.y + 3 * inverse * progressSquared * controlB.y + progressSquared * progress * end.y,
  };
};

export const portraitConnectionDots = (link: PortraitConnectionLink) => {
  const start = PORTRAIT_CONNECTION_NODES[link.from];
  const end = PORTRAIT_CONNECTION_NODES[link.to];
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.max(Math.hypot(dx, dy), 0.0001);
  const bend = link.bend * 0.0027;
  const normalX = -dy / distance;
  const normalY = dx / distance;
  const controlA = {
    x: start.x + dx * 0.34 + normalX * bend,
    y: start.y + dy * 0.34 + normalY * bend,
  };
  const controlB = {
    x: start.x + dx * 0.68 + normalX * bend,
    y: start.y + dy * 0.68 + normalY * bend,
  };
  const count = clamp(Math.round(distance * 86), 5, 15);
  return Array.from({ length: count }, (_, index) => {
    const progress = (index + 1) / (count + 1);
    return { ...cubicPoint(progress, start, controlA, controlB, end), progress };
  });
};

export const initializePortraitConnectionFields = () => {
  const portraitMedia = window.matchMedia(PORTRAIT_MEDIA);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  document.querySelectorAll<HTMLElement>('[data-portrait-connection-field]').forEach((field) => {
    if (field.dataset.initialized === 'true') return;
    field.dataset.initialized = 'true';

    const stage = field.closest<HTMLElement>('[data-connection-stage]') ?? field;
    const abortController = new AbortController();
    const { signal } = abortController;
    const nodeStates = [...field.querySelectorAll<HTMLElement>('[data-portrait-connection-node]')].map((element, index) => ({
      element,
      index,
      flock: portraitConnectionFlockForNode(index),
      homeX: 0,
      homeY: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      depth: Number(element.dataset.nodeDepth ?? 1),
    }));
    const flockStates = (['upper', 'lower-left', 'lower-right'] as const).map((flock, index) => ({
      flock,
      seed: index * 41 + 17,
      step: 0,
      nextTargetAt: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      targetX: 0,
      targetY: 0,
    }));
    const linkDots = [...field.querySelectorAll<HTMLElement>('[data-portrait-link-dot]')].map((element) => ({
      element,
      from: Number(element.dataset.linkFrom ?? 0),
      to: Number(element.dataset.linkTo ?? 0),
      progress: Number(element.dataset.linkProgress ?? 0.5),
    }));

    const pointer = {
      x: 0,
      y: 0,
      active: false,
    };

    let fieldRect = field.getBoundingClientRect();
    let animationFrame = 0;
    let resizeFrame = 0;
    let lastTimestamp = 0;
    let visible = true;

    const stop = () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      lastTimestamp = 0;
    };

    const reset = () => {
      stop();
      pointer.active = false;
      flockStates.forEach((flock) => {
        flock.step = 0;
        flock.nextTargetAt = 0;
        flock.x = 0;
        flock.y = 0;
        flock.vx = 0;
        flock.vy = 0;
        flock.targetX = 0;
        flock.targetY = 0;
      });
      nodeStates.forEach((node) => {
        node.x = 0;
        node.y = 0;
        node.vx = 0;
        node.vy = 0;
        node.element.style.removeProperty('--connection-drag-x');
        node.element.style.removeProperty('--connection-drag-y');
      });
      linkDots.forEach(({ element }) => {
        element.style.removeProperty('--connection-drag-x');
        element.style.removeProperty('--connection-drag-y');
      });
      field.dataset.pointerSpeed = '0.00';
      field.dataset.maximumDisplacement = '0.00';
      field.dataset.interaction = 'idle';
    };

    const refreshGeometry = () => {
      fieldRect = field.getBoundingClientRect();
      nodeStates.forEach((node) => {
        node.homeX = fieldRect.width * Number(node.element.dataset.nodeX ?? 0);
        node.homeY = fieldRect.height * Number(node.element.dataset.nodeY ?? 0);
      });
      field.dataset.ready = 'true';
    };

    const apply = () => {
      nodeStates.forEach((node) => {
        node.element.style.setProperty('--connection-drag-x', `${node.x.toFixed(2)}px`);
        node.element.style.setProperty('--connection-drag-y', `${node.y.toFixed(2)}px`);
      });
      linkDots.forEach(({ element, from, to, progress }) => {
        const start = nodeStates[from];
        const end = nodeStates[to];
        const x = start.x * (1 - progress) + end.x * progress;
        const y = start.y * (1 - progress) + end.y * progress;
        element.style.setProperty('--connection-drag-x', `${x.toFixed(2)}px`);
        element.style.setProperty('--connection-drag-y', `${y.toFixed(2)}px`);
      });
    };

    const flockAmplitude = (flock: PortraitConnectionFlock) => {
      if (flock === 'upper') {
        return { x: Math.min(24, fieldRect.width * 0.055), y: Math.min(16, fieldRect.height * 0.016) };
      }
      if (flock === 'lower-left') {
        return { x: Math.min(18, fieldRect.width * 0.045), y: Math.min(13, fieldRect.height * 0.013) };
      }
      return { x: Math.min(22, fieldRect.width * 0.052), y: Math.min(14, fieldRect.height * 0.014) };
    };

    const updateFlocks = (timestamp: number, timeScale: number) => {
      flockStates.forEach((flock) => {
        if (timestamp >= flock.nextTargetAt) {
          const target = schoolingWanderTarget(flock.flock, flock.step);
          const amplitude = flockAmplitude(flock.flock);
          flock.targetX = target.x * amplitude.x;
          flock.targetY = target.y * amplitude.y;
          flock.step += 1;
          const pauseUnit = (seededUnit(flock.seed + flock.step * 3) + 1) / 2;
          flock.nextTargetAt = timestamp + 2600 + pauseUnit * 2800;
        }
        const damping = Math.pow(0.91, timeScale);
        flock.vx = (flock.vx + (flock.targetX - flock.x) * 0.026 * timeScale) * damping;
        flock.vy = (flock.vy + (flock.targetY - flock.y) * 0.026 * timeScale) * damping;
        flock.x += flock.vx * timeScale;
        flock.y += flock.vy * timeScale;
      });
    };

    const tick = (timestamp: number) => {
      if (!visible || !portraitMedia.matches || document.hidden) {
        animationFrame = 0;
        lastTimestamp = 0;
        return;
      }

      const elapsed = lastTimestamp ? timestamp - lastTimestamp : FRAME_INTERVAL;
      if (elapsed < FRAME_INTERVAL - 0.5) {
        animationFrame = window.requestAnimationFrame(tick);
        return;
      }
      const timeScale = clamp(elapsed / FRAME_INTERVAL, 0.7, 2.2);
      lastTimestamp = timestamp - (elapsed % FRAME_INTERVAL);
      updateFlocks(timestamp, timeScale);
      const timeSeconds = timestamp * 0.001;
      const influenceRadius = Math.max(88, fieldRect.width * 0.27);
      const avoidanceDistance = Math.min(48, fieldRect.width * 0.125);
      let maximumDisplacement = 0;
      let maximumAvoidance = 0;

      nodeStates.forEach((node) => {
        const flock = flockStates.find((candidate) => candidate.flock === node.flock)!;
        const individualX = (
          Math.sin(timeSeconds * (0.31 + node.depth * 0.045) + node.index * 1.37) * 4.2
          + Math.sin(timeSeconds * 0.17 + node.index * 0.63) * 2.1
        ) * node.depth;
        const individualY = (
          Math.cos(timeSeconds * (0.26 + node.depth * 0.036) + node.index * 1.09) * 3.2
          + Math.sin(timeSeconds * 0.14 + node.index * 0.47) * 1.6
        ) * node.depth;

        const projectedX = node.homeX + flock.x + individualX;
        const projectedY = node.homeY + flock.y + individualY;
        const deltaX = projectedX - pointer.x;
        const deltaY = projectedY - pointer.y;
        const distance = Math.max(0.001, Math.hypot(deltaX, deltaY));
        const avoidance = pointer.active
          ? connectionAvoidanceWeight(distance, influenceRadius)
          : 0;
        maximumAvoidance = Math.max(maximumAvoidance, avoidance);
        const escapeX = deltaX / distance * avoidanceDistance * avoidance * node.depth;
        const escapeY = deltaY / distance * avoidanceDistance * avoidance * node.depth;
        const unclampedX = flock.x + individualX + escapeX;
        const unclampedY = flock.y + individualY + escapeY;
        const targetX = clamp(unclampedX, 8 - node.homeX, fieldRect.width - 8 - node.homeX);
        const targetY = clamp(unclampedY, 8 - node.homeY, fieldRect.height - 8 - node.homeY);
        const damping = Math.pow(0.78, timeScale);
        node.vx = (node.vx + (targetX - node.x) * 0.084 * timeScale) * damping;
        node.vy = (node.vy + (targetY - node.y) * 0.084 * timeScale) * damping;
        node.x += node.vx * timeScale;
        node.y += node.vy * timeScale;
        maximumDisplacement = Math.max(maximumDisplacement, Math.hypot(node.x, node.y));
      });

      apply();
      field.dataset.pointerSpeed = '0.00';
      field.dataset.maximumDisplacement = maximumDisplacement.toFixed(2);
      field.dataset.interaction = maximumAvoidance > 0.02 ? 'avoid' : 'wander';
      field.dataset.avoidance = maximumAvoidance.toFixed(3);
      animationFrame = window.requestAnimationFrame(tick);
    };

    const start = () => {
      if (animationFrame || reducedMotion.matches || !portraitMedia.matches || !visible) return;
      animationFrame = window.requestAnimationFrame(tick);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!event.isPrimary || reducedMotion.matches || !portraitMedia.matches || !visible) return;
      const currentRect = field.getBoundingClientRect();
      pointer.x = event.clientX - currentRect.left;
      pointer.y = event.clientY - currentRect.top;
      pointer.active = (
        pointer.x >= 0
        && pointer.x <= currentRect.width
        && pointer.y >= 0
        && pointer.y <= currentRect.height
      );
      start();
    };

    const clearPointer = (event: PointerEvent) => {
      if (!event.isPrimary) return;
      pointer.active = false;
    };

    const scheduleResize = () => {
      if (resizeFrame) return;
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        refreshGeometry();
        start();
      });
    };

    const handleMotionPreference = () => {
      field.dataset.animated = reducedMotion.matches ? 'false' : 'true';
      reset();
      start();
    };

    const resizeObserver = new ResizeObserver(scheduleResize);
    resizeObserver.observe(field);
    resizeObserver.observe(stage);
    const intersectionObserver = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      if (!visible) stop();
      else start();
    }, { rootMargin: '80px' });
    intersectionObserver.observe(field);

    window.addEventListener('pointermove', onPointerMove, { passive: true, signal });
    window.addEventListener('pointerup', clearPointer, { passive: true, signal });
    window.addEventListener('pointercancel', clearPointer, { passive: true, signal });
    window.addEventListener('blur', () => {
      pointer.active = false;
    }, { signal });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else start();
    }, { signal });
    portraitMedia.addEventListener('change', () => {
      reset();
      refreshGeometry();
      start();
    }, { signal });
    reducedMotion.addEventListener('change', handleMotionPreference, { signal });

    const destroy = () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      abortController.abort();
      field.dataset.initialized = 'false';
    };
    document.addEventListener('astro:before-swap', destroy, { once: true, signal });

    refreshGeometry();
    field.dataset.animated = reducedMotion.matches ? 'false' : 'true';
    start();
  });
};
