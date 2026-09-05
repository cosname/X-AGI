export type HeaderScrollState = 'top' | 'scrolled';

export const DEFAULT_HEADER_SCROLL_THRESHOLD = 50;

export function resolveHeaderScrollState(
  scrollY: number,
  threshold = DEFAULT_HEADER_SCROLL_THRESHOLD,
): HeaderScrollState {
  const safeScrollY = Number.isFinite(scrollY) ? Math.max(0, scrollY) : 0;
  const safeThreshold = Number.isFinite(threshold)
    ? Math.max(0, threshold)
    : DEFAULT_HEADER_SCROLL_THRESHOLD;

  return safeScrollY > safeThreshold ? 'scrolled' : 'top';
}

function thresholdFor(header: HTMLElement) {
  const configured = Number(header.dataset.scrollThreshold);
  return Number.isFinite(configured) ? configured : DEFAULT_HEADER_SCROLL_THRESHOLD;
}

const registeredHeaders = new Set<HTMLElement>();
let initialized = false;
let animationFrame = 0;

function syncRegisteredHeaders() {
  registeredHeaders.forEach((header) => {
    if (!header.isConnected) {
      registeredHeaders.delete(header);
      return;
    }

    const state = resolveHeaderScrollState(window.scrollY, thresholdFor(header));
    if (header.dataset.scrollState === state) return;
    header.dataset.scrollState = state;
    header.classList.toggle('scrolled', state === 'scrolled');
  });
}

function scheduleSync() {
  if (animationFrame !== 0) return;
  animationFrame = window.requestAnimationFrame(() => {
    animationFrame = 0;
    syncRegisteredHeaders();
  });
}

export function initializeScrollHeaderState() {
  document.querySelectorAll<HTMLElement>('[data-scroll-header]').forEach((header) => {
    registeredHeaders.add(header);
  });
  if (registeredHeaders.size === 0) return;

  if (initialized) {
    syncRegisteredHeaders();
    return;
  }

  initialized = true;
  window.addEventListener('scroll', scheduleSync, { passive: true });
  window.addEventListener('pageshow', syncRegisteredHeaders);
  syncRegisteredHeaders();
}
