type AxisSpring = {
  value: number;
  velocity: number;
};

type LensTarget = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const clamp = (value: number, minimum: number, maximum: number) => (
  Math.min(maximum, Math.max(minimum, value))
);

export const liquidGlassSpring = (
  spring: AxisSpring,
  target: number,
  deltaSeconds: number,
  stiffness = 230,
  damping = 24,
): AxisSpring => {
  const delta = clamp(deltaSeconds, 1 / 240, 1 / 20);
  const acceleration = (target - spring.value) * stiffness;
  const velocity = (spring.velocity + acceleration * delta) * Math.exp(-damping * delta);
  return {
    value: spring.value + velocity * delta,
    velocity,
  };
};

export const liquidGlassGeometry = (viewportWidth: number) => {
  const radiusX = clamp(viewportWidth * 0.042, 48, 64);
  return {
    radiusX,
    radiusY: radiusX * 1.16,
    magnification: 1.072,
  };
};

export const liquidGlassSample = (
  distance: number,
  radius: number,
  depth = 1,
) => {
  const normalizedDistance = clamp(distance / Math.max(radius, 1), 0, 1);
  if (normalizedDistance >= 1) {
    return { proximity: 0, scale: 1, refraction: 0 };
  }
  const linearProximity = 1 - normalizedDistance;
  const proximity = linearProximity * linearProximity * (3 - 2 * linearProximity);
  const response = proximity * clamp(depth, 0, 1);
  const meniscus = Math.sin(normalizedDistance * Math.PI) * clamp(depth, 0, 1);

  return {
    proximity,
    scale: 1 + response * 0.082,
    refraction: meniscus * (0.45 + proximity * 0.55) * 2.8,
  };
};

export const liquidGlassPointerEnabled = (
  hasLens: boolean,
  wideViewport: boolean,
  reducedMotion: boolean,
  finePointer: boolean,
) => hasLens && wideViewport && !reducedMotion && finePointer;

const targetForElement = (panel: HTMLElement, element: HTMLElement): LensTarget => {
  const panelRect = panel.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const paddingX = 9;
  const paddingY = 2;
  return {
    x: elementRect.left - panelRect.left - paddingX,
    y: elementRect.top - panelRect.top - paddingY,
    width: elementRect.width + paddingX * 2,
    height: elementRect.height + paddingY * 2,
  };
};

export const initializeLiquidGlassNavigation = () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  document.querySelectorAll<HTMLElement>('[data-liquid-glass-nav="true"]').forEach((header) => {
    if (header.dataset.liquidGlassInitialized === 'true') return;

    const panel = header.querySelector<HTMLElement>('.site-navigation__panel');
    const lens = panel?.querySelector<HTMLElement>('[data-nav-liquid-glass]');
    const targets = panel
      ? Array.from(panel.querySelectorAll<HTMLElement>('[data-nav-liquid-target]'))
      : [];
    if (!panel || !lens || targets.length === 0) return;

    header.dataset.liquidGlassInitialized = 'true';
    const abortController = new AbortController();
    const { signal } = abortController;
    let activeTarget: HTMLElement | null = null;
    let target: LensTarget = { x: 0, y: 0, width: 1, height: 1 };
    let x: AxisSpring = { value: 0, velocity: 0 };
    let y: AxisSpring = { value: 0, velocity: 0 };
    let width: AxisSpring = { value: 1, velocity: 0 };
    let height: AxisSpring = { value: 1, velocity: 0 };
    let frame = 0;
    let lastTimestamp = 0;
    let hideTimer = 0;
    let hasPosition = false;

    const canAnimate = () => !reducedMotion.matches && finePointer.matches;
    const canShow = () => header.dataset.navMode === 'inline';

    const render = () => {
      lens.style.setProperty('--liquid-x', `${x.value.toFixed(2)}px`);
      lens.style.setProperty('--liquid-y', `${y.value.toFixed(2)}px`);
      lens.style.setProperty('--liquid-width', `${width.value.toFixed(2)}px`);
      lens.style.setProperty('--liquid-height', `${height.value.toFixed(2)}px`);
      const horizontalVelocity = clamp(x.velocity / 1250, -0.04, 0.04);
      lens.style.setProperty('--liquid-skew', `${(horizontalVelocity * 8).toFixed(3)}deg`);
      lens.style.setProperty('--liquid-stretch', `${(1 + Math.abs(horizontalVelocity)).toFixed(4)}`);
    };

    const stopFrame = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      lastTimestamp = 0;
    };

    const tick = (timestamp: number) => {
      frame = 0;
      if (!activeTarget) return;
      const delta = lastTimestamp ? (timestamp - lastTimestamp) / 1000 : 1 / 60;
      lastTimestamp = timestamp;
      x = liquidGlassSpring(x, target.x, delta);
      y = liquidGlassSpring(y, target.y, delta);
      width = liquidGlassSpring(width, target.width, delta, 250, 25);
      height = liquidGlassSpring(height, target.height, delta, 250, 25);
      render();

      const settled = (
        Math.abs(x.value - target.x) < 0.08
        && Math.abs(y.value - target.y) < 0.08
        && Math.abs(width.value - target.width) < 0.08
        && Math.abs(height.value - target.height) < 0.08
        && Math.abs(x.velocity) < 0.5
        && Math.abs(y.velocity) < 0.5
      );
      if (!settled) frame = window.requestAnimationFrame(tick);
    };

    const scheduleFrame = () => {
      if (!frame) frame = window.requestAnimationFrame(tick);
    };

    const showFor = (element: HTMLElement) => {
      if (!canShow()) return;
      if (hideTimer) window.clearTimeout(hideTimer);
      hideTimer = 0;
      target = targetForElement(panel, element);
      activeTarget?.removeAttribute('data-liquid-glass-active');
      activeTarget = element;
      activeTarget.setAttribute('data-liquid-glass-active', 'true');
      lens.setAttribute('data-active', 'true');

      if (!hasPosition || !canAnimate()) {
        hasPosition = true;
        x = { value: target.x, velocity: 0 };
        y = { value: target.y, velocity: 0 };
        width = { value: target.width, velocity: 0 };
        height = { value: target.height, velocity: 0 };
        render();
        stopFrame();
        return;
      }
      scheduleFrame();
    };

    const hide = (immediate = false) => {
      const finish = () => {
        activeTarget?.removeAttribute('data-liquid-glass-active');
        activeTarget = null;
        lens.removeAttribute('data-active');
        stopFrame();
      };
      if (immediate) {
        finish();
        return;
      }
      if (hideTimer) window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(finish, 90);
    };

    targets.forEach((element) => {
      element.addEventListener('pointerenter', () => {
        if (finePointer.matches) showFor(element);
      }, { passive: true, signal });
      element.addEventListener('focus', () => showFor(element), { signal });
      element.addEventListener('blur', () => hide(), { signal });
    });
    panel.addEventListener('pointerleave', () => hide(), { passive: true, signal });
    panel.addEventListener('pointerenter', () => {
      if (hideTimer) window.clearTimeout(hideTimer);
      hideTimer = 0;
    }, { passive: true, signal });

    const syncGeometry = () => {
      if (!activeTarget) return;
      if (!canShow()) {
        hide(true);
        return;
      }
      target = targetForElement(panel, activeTarget);
      if (!canAnimate()) {
        x = { value: target.x, velocity: 0 };
        y = { value: target.y, velocity: 0 };
        width = { value: target.width, velocity: 0 };
        height = { value: target.height, velocity: 0 };
        render();
        return;
      }
      scheduleFrame();
    };

    const resizeObserver = new ResizeObserver(syncGeometry);
    resizeObserver.observe(panel);
    const navModeObserver = new MutationObserver(() => {
      if (!canShow()) hide(true);
      else syncGeometry();
    });
    navModeObserver.observe(header, { attributes: true, attributeFilter: ['data-nav-mode'] });
    reducedMotion.addEventListener('change', syncGeometry, { signal });
    finePointer.addEventListener('change', () => {
      if (!finePointer.matches && document.activeElement !== activeTarget) hide(true);
      else syncGeometry();
    }, { signal });

    const destroy = () => {
      if (hideTimer) window.clearTimeout(hideTimer);
      stopFrame();
      resizeObserver.disconnect();
      navModeObserver.disconnect();
      abortController.abort();
      header.dataset.liquidGlassInitialized = 'false';
    };
    document.addEventListener('astro:before-swap', destroy, { once: true, signal });
  });
};
