const TAU = Math.PI * 2;
const NETWORK_FRAME_INTERVAL = 1000 / 36;

type Point = { x: number; y: number };
type Variant = 'masthead' | 'poster';
type Speck = Point & { size: number; shade: number };
type Body = {
  home: Point;
  x: number;
  y: number;
  radius: number;
  color: string;
  phase: number;
  kind: 'soma' | 'body';
  specks: Speck[];
};
type Tendril = {
  from: number;
  to: number;
  color: string;
  specks: Array<Point & { size: number; t: number }>;
};
type PointerState = {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  active: boolean;
  dragging: boolean;
  pointerId: number | null;
};

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));

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

const cubicPoint = (progress: number, start: Point, controlA: Point, controlB: Point, end: Point): Point => {
  const inverse = 1 - progress;
  const inverseSquared = inverse * inverse;
  const progressSquared = progress * progress;
  return {
    x: inverseSquared * inverse * start.x + 3 * inverseSquared * progress * controlA.x + 3 * inverse * progressSquared * controlB.x + progressSquared * progress * end.x,
    y: inverseSquared * inverse * start.y + 3 * inverseSquared * progress * controlA.y + 3 * inverse * progressSquared * controlB.y + progressSquared * progress * end.y,
  };
};

const isConnectionVariant = (value: string | undefined): value is Variant => (
  value === 'masthead' || value === 'poster'
);

export const initializeConnectionFields = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  document.querySelectorAll<HTMLElement>('[data-connection-field]').forEach((field, fieldIndex) => {
    if (field.dataset.initialized === 'true') return;

    const variantName = field.dataset.connectionField;
    if (!isConnectionVariant(variantName)) return;

    const canvas = field.querySelector<HTMLCanvasElement>('canvas');
    const context = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !context) return;

    field.dataset.initialized = 'true';

    const variant = variantName;
    const stage = field.closest<HTMLElement>('[data-connection-stage]') ?? field;
    const seed = (variant === 'poster' ? 3601 : 1601) + fieldIndex;
    const abortController = new AbortController();
    const { signal } = abortController;

    const staticLayer = document.createElement('canvas');
    const staticContext = staticLayer.getContext('2d');
    const bodies: Body[] = [];
    const tendrils: Tendril[] = [];
    const palette = ['#5340b8', '#2c4b9d', '#2c908c', '#7a62d0', '#e28a2f'];
    const pointer: PointerState = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      active: false,
      dragging: false,
      pointerId: null,
    };
    const motionEnabled = () => !prefersReducedMotion.matches;

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let animationFrame = 0;
    let resizeFrame = 0;
    let lastTimestamp = 0;
    let visible = false;
    let cachedNucleus = { cx: 0, cy: 0, rx: 0, ry: 0 };
    let cachedFieldOrigin = { x: 0, y: 0 };
    let originFrame = 0;
    let interactionState = 'idle';

    const scatterDisc = (radius: number, count: number, tightness: number, random: () => number): Speck[] => {
      const specks: Speck[] = [];
      for (let index = 0; index < count; index += 1) {
        const angle = random() * TAU;
        const reach = radius * Math.pow(random(), tightness) * (0.72 + random() * 0.38);
        specks.push({
          x: Math.cos(angle) * reach + (random() - 0.5) * 2.2,
          y: Math.sin(angle) * reach * (0.86 + random() * 0.22) + (random() - 0.5) * 2.2,
          size: 0.8 + random() * 1.7,
          shade: 0.45 + random() * 0.55,
        });
      }
      return specks;
    };

    const controlsFor = (start: Point, end: Point, sweep: number) => ({
      controlA: { x: start.x + (end.x - start.x) * 0.28, y: start.y + sweep },
      controlB: { x: start.x + (end.x - start.x) * 0.72, y: end.y - sweep * 0.3 },
    });

    const seedTendril = (from: Point, to: Point, sweep: number, random: () => number) => {
      const { controlA, controlB } = controlsFor(from, to, sweep);
      const length = Math.hypot(to.x - from.x, to.y - from.y);
      const steps = Math.max(16, Math.round(length / 4.4));
      const specks: Tendril['specks'] = [];
      for (let index = 1; index < steps; index += 1) {
        if (random() < 0.12) continue;
        const progress = index / steps;
        const point = cubicPoint(progress, from, controlA, controlB, to);
        specks.push({
          x: point.x + (random() - 0.5) * 1.8,
          y: point.y + (random() - 0.5) * 1.8,
          size: random() > 0.86 ? 2 : 1.05 + random() * 0.5,
          t: progress,
        });
      }
      return specks;
    };

    const collectLayout = () => {
      const fieldBox = field.getBoundingClientRect();
      cachedFieldOrigin = { x: fieldBox.left, y: fieldBox.top };
      const title = stage.querySelector<HTMLElement>('[data-connection-anchor="title"]');

      if (!title) {
        cachedNucleus = variant === 'poster'
          ? { cx: width * 0.32, cy: height * 0.52, rx: width * 0.2, ry: height * 0.18 }
          : { cx: width * 0.28, cy: height * 0.62, rx: width * 0.18, ry: height * 0.16 };
        return;
      }

      const box = title.getBoundingClientRect();
      cachedNucleus = {
        cx: box.left - fieldBox.left + box.width / 2,
        cy: box.top - fieldBox.top + box.height / 2,
        rx: box.width / 2 + 28,
        ry: box.height / 2 + 22,
      };
    };

    const addBody = (
      body: Omit<Body, 'x' | 'y' | 'specks'> & { specks?: Speck[] },
      random: () => number,
    ) => {
      const specks = body.specks ?? scatterDisc(
        body.radius,
        Math.round(body.radius * (body.kind === 'soma' ? 3.2 : 2.1)),
        body.kind === 'soma' ? 0.72 : 0.55,
        random,
      );
      bodies.push({ ...body, x: body.home.x, y: body.home.y, specks });
      return bodies.length - 1;
    };

    const makeNetworkScene = () => {
      const random = randomFrom(seed);
      bodies.length = 0;
      tendrils.length = 0;
      const compact = width < 720;
      const scale = Math.min(width, height);
      const nucleus = cachedNucleus;
      const somaHome = { x: nucleus.cx, y: nucleus.cy };
      const somaRadius = Math.max(8, Math.min(nucleus.rx, nucleus.ry) * 0.22);

      const soma = addBody({
        home: somaHome,
        radius: somaRadius,
        color: '#5340b8',
        phase: 0.2,
        kind: 'soma',
        specks: scatterDisc(somaRadius * 0.82, compact ? 18 : 28, 0.85, random),
      }, random);

      const ringCount = compact ? 7 : 10;
      const ring: number[] = [];
      for (let index = 0; index < ringCount; index += 1) {
        const angle = (index / ringCount) * TAU - 0.35;
        const jitter = 0.9 + random() * 0.16;
        const home = {
          x: nucleus.cx + Math.cos(angle) * nucleus.rx * 1.18 * jitter,
          y: nucleus.cy + Math.sin(angle) * nucleus.ry * 1.35 * jitter,
        };
        ring.push(addBody({
          home,
          radius: scale * (index % 3 === 0 ? 0.02 : 0.011),
          color: palette[index % palette.length],
          phase: random() * TAU,
          kind: 'body',
        }, random));
      }

      ring.forEach((node, index) => {
        const next = ring[(index + 1) % ring.length];
        const sweep = (random() - 0.5) * 18;
        tendrils.push({
          from: node,
          to: next,
          color: '#6a58c6',
          specks: seedTendril(bodies[node].home, bodies[next].home, sweep, random),
        });
        if (index % 2 === 0) {
          const spokeSweep = (random() - 0.5) * 12;
          tendrils.push({
            from: soma,
            to: node,
            color: '#5c4bbd',
            specks: seedTendril(somaHome, bodies[node].home, spokeSweep, random),
          });
        }
      });

      const outwardCount = compact ? 4 : 6;
      for (let index = 0; index < outwardCount; index += 1) {
        const source = ring[(index * 2) % ring.length];
        const angle = (index / outwardCount) * TAU + 0.4;
        const reach = scale * (0.14 + random() * 0.08);
        const home = {
          x: clamp(bodies[source].home.x + Math.cos(angle) * reach, width * 0.04, width * 1.02),
          y: clamp(bodies[source].home.y + Math.sin(angle) * reach, height * 0.04, height * 0.96),
        };
        const outer = addBody({
          home,
          radius: scale * 0.01,
          color: palette[(index + 2) % palette.length],
          phase: random() * TAU,
          kind: 'body',
        }, random);
        const sweep = (random() - 0.5) * height * 0.04;
        tendrils.push({
          from: source,
          to: outer,
          color: index % 3 === 0 ? '#d88936' : '#6f5dcc',
          specks: seedTendril(bodies[source].home, home, sweep, random),
        });
      }
    };

    const drawWave = (target: CanvasRenderingContext2D, color: string, points: Array<[number, number]>) => {
      target.beginPath();
      target.moveTo(points[0][0], points[0][1]);
      for (let index = 1; index < points.length - 2; index += 1) {
        target.quadraticCurveTo(
          points[index][0],
          points[index][1],
          (points[index][0] + points[index + 1][0]) / 2,
          (points[index][1] + points[index + 1][1]) / 2,
        );
      }
      target.quadraticCurveTo(
        points[points.length - 2][0],
        points[points.length - 2][1],
        points[points.length - 1][0],
        points[points.length - 1][1],
      );
      target.closePath();
      target.fillStyle = color;
      target.fill();
    };

    const renderStaticLayer = () => {
      if (!staticContext) return;
      staticContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      staticContext.clearRect(0, 0, width, height);
      staticContext.fillStyle = '#f5f0ea';
      staticContext.fillRect(0, 0, width, height);

      const wash = staticContext.createRadialGradient(width * 0.68, height * 0.46, 0, width * 0.68, height * 0.46, width * 0.5);
      wash.addColorStop(0, 'rgba(120, 100, 210, 0.07)');
      wash.addColorStop(1, 'rgba(120, 100, 210, 0)');
      staticContext.fillStyle = wash;
      staticContext.fillRect(0, 0, width, height);

      if (variant === 'masthead') {
        drawWave(staticContext, 'rgba(24, 56, 128, 0.9)', [
          [0, height], [0, height * 0.78], [width * 0.1, height * 0.72], [width * 0.18, height * 0.84], [width * 0.32, height * 0.9], [width * 0.4, height],
        ]);
        drawWave(staticContext, 'rgba(67, 76, 188, 0.16)', [
          [0, height], [0, height * 0.72], [width * 0.16, height * 0.68], [width * 0.26, height * 0.84], [width * 0.46, height],
        ]);
        drawWave(staticContext, 'rgba(238, 148, 54, 0.7)', [
          [width * 0.73, height], [width * 0.8, height * 0.88], [width * 0.9, height * 0.74], [width, height * 0.66], [width, height],
        ]);
      }

      ([[0.9, 0.08, 0.075, 'rgba(42, 140, 150, 0.16)'], [0.84, 0.17, 0.05, 'rgba(61, 160, 144, 0.08)']] as const).forEach(([x, y, radius, color]) => {
        const gradient = staticContext.createRadialGradient(width * x, height * y, 0, width * x, height * y, Math.min(width, height) * radius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'rgba(42, 140, 150, 0)');
        staticContext.fillStyle = gradient;
        staticContext.beginPath();
        staticContext.arc(width * x, height * y, Math.min(width, height) * radius, 0, TAU);
        staticContext.fill();
      });
    };

    const drift = (phase: number, timestamp: number) => {
      if (prefersReducedMotion.matches) return { x: 0, y: 0 };
      return {
        x: Math.sin(timestamp * 0.00022 + phase) * 2.1 + Math.sin(timestamp * 0.00011 + phase * 1.7) * 1.2,
        y: Math.cos(timestamp * 0.00018 + phase * 0.8) * 1.7,
      };
    };

    const updateNetworkScene = (timestamp: number) => {
      bodies.forEach((body) => {
        const ambient = drift(body.phase, timestamp);
        let targetX = body.home.x + ambient.x;
        let targetY = body.home.y + ambient.y;
        if (pointer.active && body.kind === 'body' && !prefersReducedMotion.matches) {
          const dx = pointer.x - body.home.x;
          const dy = pointer.y - body.home.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 140 && distance > 0.001) {
            const pull = (1 - distance / 140) * 8;
            targetX += (dx / distance) * pull;
            targetY += (dy / distance) * pull;
          }
        }
        body.x += (targetX - body.x) * 0.06;
        body.y += (targetY - body.y) * 0.06;
      });
    };

    const drawNetworkScene = () => {
      tendrils.forEach((tendril) => {
        const from = bodies[tendril.from];
        const to = bodies[tendril.to];
        const shiftX = (from.x - from.home.x + to.x - to.home.x) * 0.5;
        const shiftY = (from.y - from.home.y + to.y - to.home.y) * 0.5;
        context.fillStyle = tendril.color;
        tendril.specks.forEach((speck) => {
          context.globalAlpha = 0.36 + speck.t * 0.22;
          context.fillRect(speck.x + shiftX, speck.y + shiftY, speck.size, speck.size);
        });
      });

      bodies.forEach((body) => {
        context.fillStyle = body.color;
        body.specks.forEach((speck) => {
          context.globalAlpha = speck.shade * (body.kind === 'soma' ? 0.86 : 0.78);
          context.fillRect(body.x + speck.x, body.y + speck.y, speck.size, speck.size);
        });
      });
    };

    const draw = (timestamp = 0) => {
      pointer.x += (pointer.targetX - pointer.x) * 0.12;
      pointer.y += (pointer.targetY - pointer.y) * 0.12;
      updateNetworkScene(timestamp);

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.globalAlpha = 1;
      context.drawImage(staticLayer, 0, 0, width, height);
      drawNetworkScene();
      context.globalAlpha = 1;
      field.dataset.ready = 'true';
      field.dataset.animated = motionEnabled() ? 'true' : 'false';
    };

    const tick = (timestamp: number) => {
      if (!visible || document.hidden) {
        animationFrame = 0;
        return;
      }
      if (!motionEnabled()) {
        draw(timestamp);
        animationFrame = 0;
        return;
      }
      const elapsed = lastTimestamp ? timestamp - lastTimestamp : NETWORK_FRAME_INTERVAL;
      if (!lastTimestamp || elapsed >= NETWORK_FRAME_INTERVAL - 0.5) {
        draw(timestamp);
        lastTimestamp = timestamp - (elapsed % NETWORK_FRAME_INTERVAL);
      }
      animationFrame = window.requestAnimationFrame(tick);
    };

    const start = () => {
      if (animationFrame || !visible || document.hidden) return;
      if (!motionEnabled()) {
        draw(performance.now());
        return;
      }
      lastTimestamp = 0;
      animationFrame = window.requestAnimationFrame(tick);
    };

    const stop = () => {
      if (!animationFrame) return;
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      lastTimestamp = 0;
    };

    const resize = () => {
      const bounds = field.getBoundingClientRect();
      width = Math.max(1, Math.round(bounds.width));
      height = Math.max(1, Math.round(bounds.height));
      const pixelBudgetRatio = Math.sqrt(3_400_000 / Math.max(width * height, 1));
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75, pixelBudgetRatio);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      staticLayer.width = canvas.width;
      staticLayer.height = canvas.height;
      pointer.targetX = width * 0.62;
      pointer.targetY = height * 0.48;
      pointer.x = pointer.targetX;
      pointer.y = pointer.targetY;
      collectLayout();
      makeNetworkScene();
      renderStaticLayer();
      draw(performance.now());
      start();
    };

    const scheduleResize = () => {
      if (resizeFrame) return;
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        resize();
      });
    };

    const resizeObserver = new ResizeObserver(scheduleResize);
    resizeObserver.observe(field);
    if (stage !== field) resizeObserver.observe(stage);
    const titleAnchor = stage.querySelector<HTMLElement>('[data-connection-anchor="title"]');
    if (titleAnchor) resizeObserver.observe(titleAnchor);
    document.fonts?.ready.then(scheduleResize).catch(() => undefined);

    const intersectionObserver = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      if (visible) start();
      else stop();
    }, { rootMargin: '180px' });
    intersectionObserver.observe(field);

    const updatePointerPosition = (event: PointerEvent) => {
      pointer.targetX = event.clientX - cachedFieldOrigin.x;
      pointer.targetY = event.clientY - cachedFieldOrigin.y;
    };

    const setInteractionState = (state: 'idle' | 'hover' | 'drag') => {
      if (interactionState === state) return;
      interactionState = state;
      field.dataset.interaction = state;
    };

    const scheduleOriginRefresh = () => {
      if (originFrame) return;
      originFrame = window.requestAnimationFrame(() => {
        originFrame = 0;
        const bounds = field.getBoundingClientRect();
        cachedFieldOrigin = { x: bounds.left, y: bounds.top };
      });
    };

    const deactivatePointer = () => {
      pointer.active = false;
      pointer.dragging = false;
      pointer.pointerId = null;
      setInteractionState('idle');
    };

    stage.addEventListener('pointermove', (event) => {
      if (!event.isPrimary || event.pointerType === 'touch' || !finePointer.matches || prefersReducedMotion.matches) return;
      updatePointerPosition(event);
      pointer.active = true;
      if (pointer.dragging && pointer.pointerId === event.pointerId && event.buttons !== 1) {
        pointer.dragging = false;
      }
      setInteractionState(pointer.dragging ? 'drag' : 'hover');
    }, { passive: true, signal });

    stage.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || event.pointerType === 'touch' || !finePointer.matches || prefersReducedMotion.matches) return;
      const target = event.target;
      if (target instanceof Element && target.closest('a, button, input, select, textarea, summary')) return;
      updatePointerPosition(event);
      pointer.active = true;
      pointer.dragging = true;
      pointer.pointerId = event.pointerId;
      setInteractionState('drag');
    }, { passive: true, signal });

    stage.addEventListener('pointerleave', deactivatePointer, { passive: true, signal });
    stage.addEventListener('pointercancel', deactivatePointer, { passive: true, signal });
    stage.addEventListener('lostpointercapture', deactivatePointer, { passive: true, signal });
    window.addEventListener('pointerup', deactivatePointer, { passive: true, signal });
    window.addEventListener('scroll', scheduleOriginRefresh, { passive: true, signal });
    window.addEventListener('blur', deactivatePointer, { signal });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else start();
    }, { signal });

    const handleMotionChange = () => {
      deactivatePointer();
      stop();
      draw(performance.now());
      start();
    };
    prefersReducedMotion.addEventListener('change', handleMotionChange, { signal });
    finePointer.addEventListener('change', deactivatePointer, { signal });

    const destroy = () => {
      stop();
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      if (originFrame) window.cancelAnimationFrame(originFrame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      abortController.abort();
      field.dataset.initialized = 'false';
    };
    document.addEventListener('astro:before-swap', destroy, { once: true, signal });

    scheduleResize();
  });
};
