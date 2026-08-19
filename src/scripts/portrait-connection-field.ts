const PORTRAIT_MEDIA = '(max-width: 51.25rem) and (orientation: portrait)';
const FRAME_INTERVAL = 1000 / 36;

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

export const connectionDragWeight = (distance: number, radius: number) => {
  const normalized = 1 - clamp(distance / Math.max(radius, 1), 0, 1);
  return normalized * normalized * (3 - 2 * normalized);
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
    const nodeStates = [...field.querySelectorAll<HTMLElement>('[data-portrait-connection-node]')].map((element) => ({
      element,
      homeX: 0,
      homeY: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      depth: Number(element.dataset.nodeDepth ?? 1),
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
      lastX: 0,
      lastY: 0,
      velocityX: 0,
      velocityY: 0,
      initialized: false,
    };

    let fieldRect = field.getBoundingClientRect();
    let animationFrame = 0;
    let resizeFrame = 0;
    let lastTimestamp = 0;
    let visible = true;

    const reset = () => {
      pointer.velocityX = 0;
      pointer.velocityY = 0;
      pointer.initialized = false;
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
      const influenceRadius = Math.max(150, fieldRect.width * 0.58);
      let maximumDisplacement = 0;
      let maximumVelocity = 0;

      nodeStates.forEach((node) => {
        const distance = Math.hypot(pointer.x - node.homeX, pointer.y - node.homeY);
        const localWeight = pointer.initialized ? connectionDragWeight(distance, influenceRadius) : 0;
        const dragWeight = localWeight * node.depth + (pointer.initialized ? 0.09 * node.depth : 0);
        const targetX = pointer.velocityX * dragWeight * 0.82;
        const targetY = pointer.velocityY * dragWeight * 0.82;
        const damping = Math.pow(0.82, timeScale);
        node.vx = (node.vx + (targetX - node.x) * 0.075 * timeScale) * damping;
        node.vy = (node.vy + (targetY - node.y) * 0.075 * timeScale) * damping;
        node.x += node.vx * timeScale;
        node.y += node.vy * timeScale;
        maximumDisplacement = Math.max(maximumDisplacement, Math.hypot(node.x, node.y));
        maximumVelocity = Math.max(maximumVelocity, Math.hypot(node.vx, node.vy));
      });

      apply();
      const pointerSpeed = Math.hypot(pointer.velocityX, pointer.velocityY);
      field.dataset.pointerSpeed = pointerSpeed.toFixed(2);
      field.dataset.maximumDisplacement = maximumDisplacement.toFixed(2);
      pointer.velocityX *= Math.pow(0.86, timeScale);
      pointer.velocityY *= Math.pow(0.86, timeScale);

      if (pointerSpeed > 0.04 || maximumDisplacement > 0.04 || maximumVelocity > 0.02) {
        animationFrame = window.requestAnimationFrame(tick);
      } else {
        animationFrame = 0;
        lastTimestamp = 0;
        field.dataset.interaction = 'idle';
      }
    };

    const start = () => {
      if (animationFrame || reducedMotion.matches || !portraitMedia.matches || !visible) return;
      animationFrame = window.requestAnimationFrame(tick);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!event.isPrimary || reducedMotion.matches || !portraitMedia.matches || !visible) return;
      const nextX = event.clientX - fieldRect.left;
      const nextY = event.clientY - fieldRect.top;
      if (!pointer.initialized) {
        pointer.lastX = fieldRect.width * 0.5;
        pointer.lastY = fieldRect.height * 0.5;
        pointer.initialized = true;
      }
      pointer.velocityX = clamp(pointer.velocityX * 0.32 + (nextX - pointer.lastX) * 0.68, -30, 30);
      pointer.velocityY = clamp(pointer.velocityY * 0.32 + (nextY - pointer.lastY) * 0.68, -30, 30);
      pointer.x = nextX;
      pointer.y = nextY;
      pointer.lastX = nextX;
      pointer.lastY = nextY;
      field.dataset.interaction = 'drag';
      start();
    };

    const scheduleResize = () => {
      if (resizeFrame) return;
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        refreshGeometry();
      });
    };

    const handleMotionPreference = () => {
      field.dataset.animated = reducedMotion.matches ? 'false' : 'true';
      reset();
    };

    const resizeObserver = new ResizeObserver(scheduleResize);
    resizeObserver.observe(field);
    resizeObserver.observe(stage);
    const intersectionObserver = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      if (!visible && animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    }, { rootMargin: '80px' });
    intersectionObserver.observe(field);

    window.addEventListener('pointermove', onPointerMove, { passive: true, signal });
    window.addEventListener('blur', reset, { signal });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) reset();
    }, { signal });
    portraitMedia.addEventListener('change', reset, { signal });
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
  });
};
