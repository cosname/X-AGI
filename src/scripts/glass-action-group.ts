import {
  assignGlassTargetRows,
  capsuleForGlassPointer,
  capsuleForGlassTarget,
  capsuleForVerticalGlassPointer,
  type GlassCapsuleGeometry,
  type GlassTargetGeometry,
} from './glass-action-group-state';
import { capsuleOutlinePath } from './navigation-capsule';

const activeCleanups = new Set<() => void>();

function initializeGlassActionGroup(root: HTMLElement) {
  if (root.dataset.glassInitialized === 'true') return;

  const lens = root.querySelector<HTMLElement>('[data-glass-lens]');
  const material = root.querySelector<HTMLElement>('[data-glass-material]');
  const outline = root.querySelector<SVGSVGElement>('[data-glass-outline]');
  const outlinePaths = Array.from(root.querySelectorAll<SVGPathElement>('[data-glass-outline-path]'));
  const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-glass-target]'));
  if (!lens || !material || !outline || outlinePaths.length === 0 || targets.length === 0) return;

  root.dataset.glassInitialized = 'true';
  const controller = new AbortController();
  const { signal } = controller;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const vertical = root.dataset.glassAxis === 'vertical';
  const scrubEnabled = root.hasAttribute('data-glass-scrub');
  const activateOnRelease = root.hasAttribute('data-glass-activate-on-release');
  const resizeObserver = new ResizeObserver(() => {
    measureTargets();
    syncToCurrentState(true);
  });
  const mutationObserver = new MutationObserver(() => syncToCurrentState());

  let geometries: GlassTargetGeometry[] = [];
  let persistentTarget: HTMLElement | null = null;
  let focusedTarget: HTMLElement | null = null;
  let animationFrame = 0;
  let layoutFrame = 0;
  let scrubPointerId: number | null = null;
  let scrubTarget: HTMLElement | null = null;
  let suppressTrustedClick = false;

  const capsuleState: GlassCapsuleGeometry & { opacity: number } = {
    x: 0,
    y: 0,
    width: 0,
    height: 44,
    neck: 0,
    opacity: 0,
  };
  const capsuleTarget: GlassCapsuleGeometry & { opacity: number } = {
    ...capsuleState,
  };

  const geometryFor = (target: HTMLElement | null) => (
    target
      ? geometries.find((geometry) => geometry.key === target.dataset.glassTarget)
      : undefined
  );

  const renderLens = () => {
    lens.style.width = `${capsuleState.width.toFixed(2)}px`;
    lens.style.height = `${capsuleState.height.toFixed(2)}px`;
    lens.style.opacity = capsuleState.opacity.toFixed(3);
    lens.style.transform = `translate3d(${(capsuleState.x - capsuleState.width / 2).toFixed(2)}px, ${(capsuleState.y - capsuleState.height / 2).toFixed(2)}px, 0)`;
    lens.style.setProperty('--glass-group-neck', capsuleState.neck.toFixed(4));

    const outlinePath = capsuleOutlinePath(
      capsuleState.width,
      capsuleState.height,
      capsuleState.neck,
    );
    const glassPath = capsuleOutlinePath(
      capsuleState.width,
      capsuleState.height,
      capsuleState.neck,
      0.08,
    );
    outline.setAttribute(
      'viewBox',
      `0 0 ${capsuleState.width.toFixed(2)} ${capsuleState.height.toFixed(2)}`,
    );
    outlinePaths.forEach((path) => path.setAttribute('d', outlinePath));
    // Native rounded clipping prevents the moving vertical backdrop from exposing its rectangular layer.
    if (vertical) {
      material.style.removeProperty('clip-path');
      material.style.removeProperty('-webkit-clip-path');
    } else {
      material.style.clipPath = `path("${glassPath}")`;
      material.style.setProperty('-webkit-clip-path', `path("${glassPath}")`);
    }
  };

  const animateLens = () => {
    animationFrame = 0;
    const response = reducedMotion.matches ? 1 : 0.24;
    capsuleState.x += (capsuleTarget.x - capsuleState.x) * response;
    capsuleState.y += (capsuleTarget.y - capsuleState.y) * response;
    capsuleState.width += (capsuleTarget.width - capsuleState.width) * response;
    capsuleState.height += (capsuleTarget.height - capsuleState.height) * response;
    capsuleState.neck += (capsuleTarget.neck - capsuleState.neck) * response;
    capsuleState.opacity += (capsuleTarget.opacity - capsuleState.opacity)
      * (reducedMotion.matches ? 1 : 0.34);
    renderLens();

    const difference = Math.max(
      Math.abs(capsuleTarget.x - capsuleState.x),
      Math.abs(capsuleTarget.y - capsuleState.y),
      Math.abs(capsuleTarget.width - capsuleState.width),
      Math.abs(capsuleTarget.height - capsuleState.height),
      Math.abs(capsuleTarget.neck - capsuleState.neck) * 100,
      Math.abs(capsuleTarget.opacity - capsuleState.opacity) * 100,
    );
    if (difference > 0.08) animationFrame = window.requestAnimationFrame(animateLens);
  };

  const scheduleLens = () => {
    if (!animationFrame) animationFrame = window.requestAnimationFrame(animateLens);
  };

  const setCapsuleTarget = (geometry: GlassCapsuleGeometry | null, immediate = false) => {
    if (!geometry) return;
    Object.assign(capsuleTarget, geometry, { opacity: 1 });
    if (immediate || capsuleState.opacity === 0 || reducedMotion.matches) {
      Object.assign(capsuleState, capsuleTarget);
      renderLens();
      return;
    }
    scheduleLens();
  };

  const capsuleForPointer = (pointerX: number, pointerY: number) => (
    vertical
      ? capsuleForVerticalGlassPointer(geometries, pointerY)
      : capsuleForGlassPointer(geometries, pointerX, pointerY)
  );

  const targetForPointer = (pointerX: number, pointerY: number) => {
    const closest = geometries.reduce<GlassTargetGeometry | null>((current, geometry) => {
      if (!current) return geometry;
      const geometryDistance = vertical
        ? Math.abs(geometry.centerY - pointerY)
        : Math.hypot(geometry.centerX - pointerX, geometry.centerY - pointerY);
      const currentDistance = vertical
        ? Math.abs(current.centerY - pointerY)
        : Math.hypot(current.centerX - pointerX, current.centerY - pointerY);
      return geometryDistance < currentDistance ? geometry : current;
    }, null);
    return closest
      ? targets.find((target) => target.dataset.glassTarget === closest.key) ?? null
      : null;
  };

  const previewScrub = (clientX: number, clientY: number) => {
    const rootBounds = root.getBoundingClientRect();
    const pointerX = clientX - rootBounds.left;
    const pointerY = clientY - rootBounds.top;
    scrubTarget = targetForPointer(pointerX, pointerY);
    targets.forEach((target) => {
      target.toggleAttribute('data-glass-preview', target === scrubTarget);
    });
    setCapsuleTarget(capsuleForPointer(pointerX, pointerY));
  };

  const finishScrub = (activate: boolean) => {
    const target = scrubTarget;
    const pointerId = scrubPointerId;
    scrubPointerId = null;
    scrubTarget = null;
    root.removeAttribute('data-glass-scrubbing');
    targets.forEach((candidate) => candidate.removeAttribute('data-glass-preview'));
    if (pointerId !== null && root.hasPointerCapture(pointerId)) {
      root.releasePointerCapture(pointerId);
    }
    if (activate && target && activateOnRelease) {
      suppressTrustedClick = true;
      target.click();
      window.setTimeout(() => {
        suppressTrustedClick = false;
      }, 0);
      return;
    }
    syncToCurrentState();
  };

  const resolvePersistentTarget = () => {
    persistentTarget = targets.find((target) => target.getAttribute('aria-pressed') === 'true')
      ?? targets.find((target) => target.hasAttribute('aria-current'))
      ?? targets.find((target) => target.dataset.glassTarget === root.dataset.glassDefault)
      ?? targets[0];

    targets.forEach((target) => {
      target.toggleAttribute('data-glass-selected', target === persistentTarget);
    });
  };

  const syncToCurrentState = (immediate = false) => {
    resolvePersistentTarget();
    const activeTarget = focusedTarget ?? persistentTarget;
    const geometry = geometryFor(activeTarget);
    if (geometry) setCapsuleTarget(capsuleForGlassTarget(geometry), immediate);
  };

  const measureTargets = () => {
    window.cancelAnimationFrame(layoutFrame);
    layoutFrame = window.requestAnimationFrame(() => {
      layoutFrame = 0;
      const rootBounds = root.getBoundingClientRect();
      const rects = targets.map((target) => {
        const bounds = target.getBoundingClientRect();
        return {
          key: target.dataset.glassTarget ?? '',
          left: bounds.left - rootBounds.left,
          top: bounds.top - rootBounds.top,
          width: bounds.width,
          height: bounds.height,
        };
      });
      geometries = assignGlassTargetRows(rects, 12);
      syncToCurrentState(true);
      root.dataset.glassReady = 'true';
    });
  };

  root.addEventListener('pointerdown', (event) => {
    if (!scrubEnabled || !event.isPrimary || event.button !== 0) return;
    const directTarget = event.target instanceof Element
      ? event.target.closest<HTMLElement>('[data-glass-target]')
      : null;
    if (!directTarget || !root.contains(directTarget)) return;
    event.preventDefault();
    scrubPointerId = event.pointerId;
    root.setPointerCapture(event.pointerId);
    root.setAttribute('data-glass-scrubbing', '');
    previewScrub(event.clientX, event.clientY);
  }, { signal });

  root.addEventListener('pointermove', (event) => {
    if (scrubPointerId === null || event.pointerId !== scrubPointerId) return;
    event.preventDefault();
    previewScrub(event.clientX, event.clientY);
  }, { passive: false, signal });

  root.addEventListener('pointerup', (event) => {
    if (scrubPointerId === null || event.pointerId !== scrubPointerId) return;
    event.preventDefault();
    previewScrub(event.clientX, event.clientY);
    finishScrub(true);
  }, { signal });

  root.addEventListener('pointercancel', (event) => {
    if (scrubPointerId === null || event.pointerId !== scrubPointerId) return;
    finishScrub(false);
  }, { signal });

  root.addEventListener('click', (event) => {
    if (!suppressTrustedClick || !event.isTrusted) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    suppressTrustedClick = false;
  }, { capture: true, signal });

  root.addEventListener('pointermove', (event) => {
    if (scrubPointerId !== null || !finePointer.matches || focusedTarget) return;
    const rootBounds = root.getBoundingClientRect();
    const geometry = capsuleForPointer(
      event.clientX - rootBounds.left,
      event.clientY - rootBounds.top,
    );
    setCapsuleTarget(geometry);
  }, { passive: true, signal });

  root.addEventListener('pointerleave', () => {
    if (focusedTarget || scrubPointerId !== null) return;
    syncToCurrentState();
  }, { signal });

  targets.forEach((target) => {
    target.addEventListener('focus', () => {
      focusedTarget = target;
      const geometry = geometryFor(target);
      if (geometry) setCapsuleTarget(capsuleForGlassTarget(geometry));
    }, { signal });

    target.addEventListener('click', () => {
      if (target.hasAttribute('data-glass-select-on-click')) {
        targets.forEach((candidate) => candidate.removeAttribute('aria-current'));
        target.setAttribute('aria-current', 'location');
      }
      window.requestAnimationFrame(() => syncToCurrentState());
    }, { signal });

    mutationObserver.observe(target, {
      attributes: true,
      attributeFilter: ['aria-current', 'aria-pressed'],
    });
    resizeObserver.observe(target);
  });

  root.addEventListener('focusout', () => {
    window.requestAnimationFrame(() => {
      if (root.contains(document.activeElement)) return;
      focusedTarget = null;
      syncToCurrentState();
    });
  }, { signal });

  finePointer.addEventListener('change', () => syncToCurrentState(true), { signal });
  reducedMotion.addEventListener('change', () => syncToCurrentState(true), { signal });
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) measureTargets();
  }, { signal });

  resizeObserver.observe(root);
  void document.fonts.ready.then(measureTargets);
  measureTargets();

  const cleanup = () => {
    controller.abort();
    resizeObserver.disconnect();
    mutationObserver.disconnect();
    if (scrubPointerId !== null && root.hasPointerCapture(scrubPointerId)) {
      root.releasePointerCapture(scrubPointerId);
    }
    window.cancelAnimationFrame(animationFrame);
    window.cancelAnimationFrame(layoutFrame);
    root.removeAttribute('data-glass-ready');
    root.removeAttribute('data-glass-scrubbing');
    targets.forEach((target) => target.removeAttribute('data-glass-preview'));
    delete root.dataset.glassInitialized;
    activeCleanups.delete(cleanup);
  };
  activeCleanups.add(cleanup);
}

function initializeGlassActionGroups() {
  document.querySelectorAll<HTMLElement>('[data-glass-group]').forEach(initializeGlassActionGroup);
}

function cleanupGlassActionGroups() {
  [...activeCleanups].forEach((cleanup) => cleanup());
}

initializeGlassActionGroups();
document.addEventListener('astro:page-load', initializeGlassActionGroups);
document.addEventListener('astro:before-swap', cleanupGlassActionGroups);
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) cleanupGlassActionGroups();
});
