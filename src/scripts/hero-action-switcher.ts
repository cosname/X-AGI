import { heroActionCapsuleGeometry } from './hero-action-capsule';
import { assignGlassTargetRows, capsuleForGlassPointer, type GlassTargetGeometry } from './glass-action-group-state';
import { capsuleOutlinePath } from './navigation-capsule';

export function initializeHeroActionSwitchers() {
  document.querySelectorAll<HTMLElement>('[data-hero-action-switcher]').forEach((switcher) => {
    if (switcher.dataset.actionCapsuleInitialized === 'true') return;
    const capsule = switcher.querySelector<HTMLElement>('.conference-hero__action-capsule');
    const material = capsule?.querySelector<HTMLElement>('.conference-hero__action-material');
    const targets = [...switcher.querySelectorAll<HTMLAnchorElement>('[data-hero-action-target]')];
    const register = targets.find((target) => target.dataset.heroActionTarget === 'register');
    if (!capsule || !material || !register || targets.length < 2) return;
    switcher.dataset.actionCapsuleInitialized = 'true';
    const controller = new AbortController();
    const { signal } = controller;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let activeTarget = register;
    let bounds = switcher.getBoundingClientRect();
    let geometries: GlassTargetGeometry[] = [];
    let frame = 0;
    let gesture: { id: number; x: number; y: number; dragging: boolean } | null = null;
    let pendingPoint: { x: number; y: number } | null = null;
    let suppressClick = false;

    const paint = (geometry: { x: number; y: number; width: number; height: number }, neck = 0) => {
      capsule.style.setProperty('--hero-action-capsule-x', `${geometry.x}px`);
      capsule.style.setProperty('--hero-action-capsule-y', `${geometry.y}px`);
      capsule.style.setProperty('--hero-action-capsule-width', `${geometry.width}px`);
      capsule.style.setProperty('--hero-action-capsule-height', `${geometry.height}px`);
      if (neck > 0.01 && !reducedMotion.matches) {
        material.style.clipPath = `path("${capsuleOutlinePath(geometry.width, geometry.height, neck)}")`;
      } else material.style.removeProperty('clip-path');
    };
    const activate = (target: HTMLAnchorElement) => {
      activeTarget = target;
      switcher.dataset.heroActionActive = target.dataset.heroActionTarget;
      const geometry = geometries.find((item) => item.key === target.dataset.heroActionTarget);
      if (geometry) paint({ x: geometry.left, y: geometry.top, width: geometry.width, height: geometry.height });
    };
    const measure = () => {
      bounds = switcher.getBoundingClientRect();
      geometries = assignGlassTargetRows(targets.map((target) => {
        const geometry = heroActionCapsuleGeometry(bounds, target.getBoundingClientRect());
        return { key: target.dataset.heroActionTarget!, left: geometry.x, top: geometry.y, width: geometry.width, height: geometry.height };
      }));
      activate(activeTarget);
      switcher.dataset.actionCapsuleReady = 'true';
    };
    const preview = (clientX: number, clientY: number) => {
      const x = clientX - bounds.left;
      const y = clientY - bounds.top;
      const shape = capsuleForGlassPointer(geometries, x, y);
      if (!shape) return;
      const closest = geometries.reduce((a, b) =>
        Math.hypot(b.centerX - shape.x, b.centerY - shape.y) < Math.hypot(a.centerX - shape.x, a.centerY - shape.y) ? b : a);
      activeTarget = targets.find((target) => target.dataset.heroActionTarget === closest.key)!;
      switcher.dataset.heroActionActive = closest.key;
      paint({ x: shape.x - shape.width / 2, y: shape.y - shape.height / 2, width: shape.width, height: shape.height }, shape.neck);
    };
    const cancelGesture = () => {
      const id = gesture?.id;
      gesture = null;
      pendingPoint = null;
      window.cancelAnimationFrame(frame);
      frame = 0;
      switcher.removeAttribute('data-action-scrubbing');
      if (id !== undefined && switcher.hasPointerCapture(id)) switcher.releasePointerCapture(id);
      activate(register);
    };
    switcher.addEventListener('pointerdown', (event) => {
      suppressClick = false;
      if (!event.isPrimary || event.button !== 0 || event.pointerType === 'mouse') return;
      if (!(event.target instanceof Element) || !event.target.closest('[data-hero-action-target]')) return;
      measure();
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, dragging: false };
    }, { passive: true, signal });
    switcher.addEventListener('pointermove', (event) => {
      if (!gesture || event.pointerId !== gesture.id) return;
      const dx = Math.abs(event.clientX - gesture.x);
      const dy = Math.abs(event.clientY - gesture.y);
      if (!gesture.dragging) {
        if (dy > 10 && dy >= dx) { cancelGesture(); return; }
        if (dx < 8 || dx <= dy) return;
        gesture.dragging = true;
        switcher.setPointerCapture(event.pointerId);
        switcher.setAttribute('data-action-scrubbing', '');
      }
      event.preventDefault();
      pendingPoint = { x: event.clientX, y: event.clientY };
      if (!frame) frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (pendingPoint) preview(pendingPoint.x, pendingPoint.y);
      });
    }, { passive: false, signal });
    switcher.addEventListener('pointerup', (event) => {
      if (!gesture || event.pointerId !== gesture.id) return;
      if (!gesture.dragging) { cancelGesture(); return; }
      event.preventDefault();
      preview(event.clientX, event.clientY);
      const target = activeTarget;
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const inside = geometries.some((item) => x >= item.left - 12 && x <= item.right + 12 && y >= item.top - 12 && y <= item.bottom + 12);
      suppressClick = true;
      cancelGesture();
      if (inside) target.click();
    }, { signal });
    switcher.addEventListener('click', (event) => {
      if (!suppressClick || !event.isTrusted) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      suppressClick = false;
    }, { capture: true, signal });
    switcher.addEventListener('pointercancel', cancelGesture, { signal });
    switcher.addEventListener('lostpointercapture', (event) => {
      // Touch starts with implicit capture on the link; its transfer bubbles here.
      if (event.target === switcher && gesture && !switcher.hasPointerCapture(event.pointerId)) cancelGesture();
    }, { signal });
    targets.forEach((target) => {
      target.addEventListener('pointerenter', (event) => { if (event.pointerType !== 'touch' && !gesture) activate(target); }, { signal });
      target.addEventListener('focus', () => activate(target), { signal });
    });
    switcher.addEventListener('pointerleave', () => { if (!gesture) activate(register); }, { signal });
    switcher.addEventListener('focusout', () => {
      window.requestAnimationFrame(() => { if (!switcher.contains(document.activeElement)) activate(register); });
    }, { signal });
    const resizeObserver = new ResizeObserver(() => {
      cancelGesture();
      measure();
    });
    const observe = () => {
      resizeObserver.observe(switcher);
      targets.forEach((target) => resizeObserver.observe(target));
    };
    observe();
    void document.fonts.ready.then(() => { if (!signal.aborted) measure(); });
    measure();
    window.addEventListener('blur', cancelGesture, { signal });
    window.addEventListener('pagehide', () => { cancelGesture(); resizeObserver.disconnect(); }, { signal });
    window.addEventListener('pageshow', (event) => { if (event.persisted) { observe(); measure(); } }, { signal });
    document.addEventListener('astro:before-swap', () => {
      cancelGesture();
      resizeObserver.disconnect();
      controller.abort();
      delete switcher.dataset.actionCapsuleInitialized;
    }, { once: true, signal });
  });
}
