/** A local light source that only schedules frames while it is moving. */
export function initializeBrandHighlight(brand: HTMLAnchorElement | null) {
  const logo = brand?.querySelector<HTMLElement>('.site-brand__logo');
  if (!brand || !logo) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const forcedColors = matchMedia('(forced-colors: active)');
  const finePointer = matchMedia('(any-hover: hover) and (any-pointer: fine)');
  const rest = { x: 50, y: 8, energy: 0 };
  let current = { ...rest };
  let target = { ...rest };
  let bounds: DOMRect | null = null;
  let frame = 0;
  let lastTime = 0;
  let suspended = false;

  const write = () => {
    logo.style.setProperty('--brand-light-x', `${current.x.toFixed(2)}%`);
    logo.style.setProperty('--brand-light-y', `${current.y.toFixed(2)}%`);
    logo.style.setProperty('--brand-light-energy', current.energy.toFixed(3));
  };
  const clear = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    bounds = null;
    current = { ...rest };
    target = { ...rest };
    delete brand.dataset.brandPressed;
    for (const property of ['--brand-light-x', '--brand-light-y', '--brand-light-energy']) {
      logo.style.removeProperty(property);
    }
  };
  const animate = (time: number) => {
    frame = 0;
    const elapsed = lastTime ? Math.min(64, time - lastTime) : 16;
    lastTime = time;
    const easing = 1 - Math.exp(-elapsed / 75);
    current.x += (target.x - current.x) * easing;
    current.y += (target.y - current.y) * easing;
    current.energy += (target.energy - current.energy) * easing;
    const settled = Math.abs(target.x - current.x) < 0.03
      && Math.abs(target.y - current.y) < 0.03
      && Math.abs(target.energy - current.energy) < 0.002;
    if (settled) current = { ...target };
    write();
    if (!settled) frame = requestAnimationFrame(animate);
    else {
      lastTime = 0;
      if (target.energy === 0) clear();
    }
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(animate);
  };
  const follow = (event: PointerEvent) => {
    if (event.pointerType === 'touch' || !finePointer.matches || reducedMotion.matches
      || forcedColors.matches || suspended || document.hidden) return;
    bounds ??= logo.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    target = {
      x: Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100)),
      y: Math.max(0, Math.min(100, (event.clientY - bounds.top) / bounds.height * 100)),
      energy: 1,
    };
    schedule();
  };
  const release = () => {
    delete brand.dataset.brandPressed;
    bounds = null;
    if (reducedMotion.matches || forcedColors.matches || suspended || document.hidden) {
      clear();
      return;
    }
    if (target.energy === 0) return;
    target = { ...rest };
    schedule();
  };

  brand.addEventListener('pointerenter', (event) => { bounds = null; follow(event); }, { passive: true });
  brand.addEventListener('pointermove', follow, { passive: true });
  brand.addEventListener('pointerdown', (event) => {
    if (event.isPrimary && event.button === 0) brand.dataset.brandPressed = '';
  }, { passive: true });
  brand.addEventListener('pointerleave', release);
  brand.addEventListener('pointercancel', release);
  window.addEventListener('pointerup', () => { delete brand.dataset.brandPressed; }, { passive: true });
  // Navigation and touch scrolling keep their native events and hit target.
  window.addEventListener('scroll', release, { passive: true });
  window.addEventListener('resize', release, { passive: true });
  window.addEventListener('blur', clear);
  window.addEventListener('pagehide', () => { suspended = true; clear(); });
  window.addEventListener('pageshow', () => { suspended = false; clear(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
  for (const preference of [reducedMotion, forcedColors, finePointer]) {
    preference.addEventListener('change', clear);
  }
}
