import {
  continuousIndexAtPosition,
  dampGalleryFocus,
  galleryScrollTarget,
  galleryToolbarTargetIndex,
  galleryWaveScales,
  type GalleryToolbarKey,
} from './goal-history-gallery-state.ts';

const activeCleanups = new Set<() => void>();
const deferredCleanups = new Set<() => void>();

function initializeHistoryGallery(root: HTMLElement) {
  if (root.dataset.historyGalleryInitialized === 'true') return;

  const viewport = root.querySelector<HTMLElement>('[data-history-viewport]');
  const slides = Array.from(root.querySelectorAll<HTMLElement>('[data-history-event]'));
  const progress = root.querySelector<HTMLElement>('[data-history-progress]');
  const targets = Array.from(
    root.querySelectorAll<HTMLButtonElement>('[data-history-progress-target]'),
  );
  const bars = Array.from(root.querySelectorAll<HTMLElement>('[data-history-progress-bar]'));
  if (
    !viewport
    || !progress
    || slides.length === 0
    || targets.length !== slides.length
    || bars.length !== slides.length
  ) return;

  root.dataset.historyGalleryInitialized = 'true';
  const controller = new AbortController();
  const { signal } = controller;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let eventStops: number[] = [];
  let pointerStops: number[] = [];
  let progressLeft = 0;
  let scrollFocus = 0;
  let pointerFocus: number | null = null;
  let renderedFocus = 0;
  let scrollFrame = 0;
  let layoutFrame = 0;
  let waveformFrame = 0;
  let hasRendered = false;
  let activeIndex = 0;
  let rovingIndex = 0;
  let pinToFirstEdition = true;
  let programmaticScroll = false;
  let pinTimer = 0;

  const syncDirectoryState = () => {
    const nextActiveIndex = Math.max(
      0,
      Math.min(targets.length - 1, Math.round(scrollFocus)),
    );
    const focusRemainsInDirectory = progress.contains(document.activeElement);
    activeIndex = nextActiveIndex;
    if (!focusRemainsInDirectory) rovingIndex = activeIndex;

    targets.forEach((target, index) => {
      if (index === activeIndex) target.setAttribute('aria-current', 'location');
      else target.removeAttribute('aria-current');
      target.tabIndex = index === rovingIndex ? 0 : -1;
    });
  };

  const setRovingIndex = (index: number) => {
    rovingIndex = Math.max(0, Math.min(targets.length - 1, index));
    targets.forEach((target, targetIndex) => {
      target.tabIndex = targetIndex === rovingIndex ? 0 : -1;
    });
  };

  const renderWaveform = () => {
    const scales = galleryWaveScales(renderedFocus, bars.length);
    bars.forEach((bar, index) => {
      bar.style.setProperty('--history-wave-scale', scales[index].toFixed(4));
    });
  };

  const targetFocus = () => pointerFocus ?? scrollFocus;

  const animateWaveform = () => {
    waveformFrame = 0;
    const target = targetFocus();
    const nextFocus = dampGalleryFocus(
      renderedFocus,
      target,
      reducedMotion.matches,
    );

    if (!hasRendered || nextFocus !== renderedFocus) {
      renderedFocus = nextFocus;
      renderWaveform();
      hasRendered = true;
    }

    if (Math.abs(target - renderedFocus) > 0.001) {
      waveformFrame = window.requestAnimationFrame(animateWaveform);
    }
  };

  const scheduleWaveform = () => {
    if (waveformFrame) return;
    waveformFrame = window.requestAnimationFrame(animateWaveform);
  };

  const firstEditionLeft = () => eventStops[0] ?? 0;

  const scrollToFirstEdition = () => {
    if (!pinToFirstEdition) return;
    const start = firstEditionLeft();
    if (Math.abs(viewport.scrollLeft - start) < 1) return;
    programmaticScroll = true;
    viewport.style.scrollSnapType = 'none';
    viewport.scrollLeft = start;
    programmaticScroll = false;
    window.requestAnimationFrame(() => {
      viewport.style.removeProperty('scroll-snap-type');
    });
  };

  const releaseFirstEditionPin = () => {
    pinToFirstEdition = false;
    if (pinTimer) {
      window.clearTimeout(pinTimer);
      pinTimer = 0;
    }
  };

  const updateScrollFocus = () => {
    if (pinToFirstEdition && !programmaticScroll && viewport.scrollLeft > 1) {
      scrollToFirstEdition();
    }
    scrollFocus = continuousIndexAtPosition(viewport.scrollLeft, eventStops);
    syncDirectoryState();
    if (pointerFocus === null) scheduleWaveform();
  };

  const measureLayout = () => {
    const firstOffset = slides[0].offsetLeft;
    eventStops = slides.map((slide) => slide.offsetLeft - firstOffset);

    const progressBounds = progress.getBoundingClientRect();
    progressLeft = progressBounds.left;
    pointerStops = bars.map((bar) => {
      const bounds = bar.getBoundingClientRect();
      return bounds.left + bounds.width / 2 - progressBounds.left;
    });

    pointerFocus = null;
    scrollToFirstEdition();
    updateScrollFocus();
    if (!hasRendered) {
      renderedFocus = scrollFocus;
      renderWaveform();
      hasRendered = true;
    } else {
      scheduleWaveform();
    }
  };

  const scheduleLayoutMeasurement = () => {
    if (layoutFrame) return;
    layoutFrame = window.requestAnimationFrame(() => {
      layoutFrame = 0;
      measureLayout();
    });
  };

  const clearPointerFocus = () => {
    if (pointerFocus === null) return;
    pointerFocus = null;
    scheduleWaveform();
  };

  const progressTargetFromEvent = (event: Event) => {
    const target = event.target instanceof Element
      ? event.target.closest<HTMLButtonElement>('[data-history-progress-target]')
      : null;
    if (!target || !progress.contains(target)) return null;

    const index = targets.indexOf(target);
    return index >= 0 ? { target, index } : null;
  };

  viewport.addEventListener('pointerdown', releaseFirstEditionPin, { passive: true, signal });
  viewport.addEventListener('touchstart', releaseFirstEditionPin, { passive: true, signal });
  viewport.addEventListener('wheel', releaseFirstEditionPin, { passive: true, signal });

  viewport.addEventListener('scroll', () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = 0;
      updateScrollFocus();
    });
  }, { passive: true, signal });

  progress.addEventListener('click', (event) => {
    const match = progressTargetFromEvent(event);
    if (!match) return;

    const movement = galleryScrollTarget(
      match.index,
      eventStops,
      reducedMotion.matches,
    );
    const maximumLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    if (event instanceof MouseEvent && event.detail > 0 && finePointer.matches) {
      pointerFocus = movement.targetIndex;
      scheduleWaveform();
    }

    releaseFirstEditionPin();
    viewport.scrollTo({
      left: Math.min(movement.left, maximumLeft),
      behavior: movement.behavior,
    });
  }, { signal });

  progress.addEventListener('focusin', (event) => {
    const match = progressTargetFromEvent(event);
    if (match) setRovingIndex(match.index);
  }, { signal });

  progress.addEventListener('focusout', () => {
    queueMicrotask(() => {
      if (!progress.contains(document.activeElement)) setRovingIndex(activeIndex);
    });
  }, { signal });

  progress.addEventListener('keydown', (event) => {
    const match = progressTargetFromEvent(event);
    if (!match) return;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

    event.preventDefault();
    const nextIndex = galleryToolbarTargetIndex(
      match.index,
      event.key as GalleryToolbarKey,
      targets.length,
    );
    setRovingIndex(nextIndex);
    targets[nextIndex].focus({ preventScroll: true });
  }, { signal });

  progress.addEventListener('pointermove', (event) => {
    if (!event.isPrimary || event.pointerType === 'touch' || !finePointer.matches) return;
    const samples = event.getCoalescedEvents?.() ?? [];
    const latest = samples.at(-1) ?? event;
    pointerFocus = continuousIndexAtPosition(
      latest.clientX - progressLeft,
      pointerStops,
    );
    scheduleWaveform();
  }, { passive: true, signal });
  progress.addEventListener('pointerleave', clearPointerFocus, { signal });
  progress.addEventListener('pointercancel', clearPointerFocus, { signal });
  window.addEventListener('blur', clearPointerFocus, { signal });
  window.addEventListener('pagehide', clearPointerFocus, { signal });
  window.addEventListener('pageshow', scheduleLayoutMeasurement, { signal });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearPointerFocus();
  }, { signal });
  reducedMotion.addEventListener('change', scheduleWaveform, { signal });
  finePointer.addEventListener('change', () => {
    if (!finePointer.matches) clearPointerFocus();
  }, { signal });

  const resizeObserver = new ResizeObserver(scheduleLayoutMeasurement);
  resizeObserver.observe(viewport);
  resizeObserver.observe(progress);

  measureLayout();
  scrollToFirstEdition();
  pinTimer = window.setTimeout(releaseFirstEditionPin, 1200);
  root.dataset.historyReady = 'true';

  const cleanup = () => {
    controller.abort();
    resizeObserver.disconnect();
    window.cancelAnimationFrame(scrollFrame);
    window.cancelAnimationFrame(layoutFrame);
    window.cancelAnimationFrame(waveformFrame);
    if (pinTimer) window.clearTimeout(pinTimer);
    bars.forEach((bar) => bar.style.removeProperty('--history-wave-scale'));
    delete root.dataset.historyGalleryInitialized;
    delete root.dataset.historyReady;
    activeCleanups.delete(cleanup);
  };
  activeCleanups.add(cleanup);
}

function queueHistoryGallery(root: HTMLElement) {
  if (
    root.dataset.historyGalleryInitialized === 'true'
    || root.dataset.historyObserverInitialized === 'true'
  ) return;

  const reveal = () => {
    delete root.dataset.historyDeferred;
    root.dataset.historyVisible = 'true';
    window.requestAnimationFrame(() => {
      if (root.isConnected) initializeHistoryGallery(root);
    });
  };

  if (!('IntersectionObserver' in window)) {
    reveal();
    return;
  }

  root.dataset.historyObserverInitialized = 'true';
  const deferredTarget = root.querySelector<HTMLElement>('[data-history-heading]') ?? root;
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting && entry.intersectionRatio > 0)) return;
    cleanup();
    reveal();
  }, { rootMargin: '0px' });

  const cleanup = () => {
    observer.disconnect();
    delete root.dataset.historyObserverInitialized;
    deferredCleanups.delete(cleanup);
  };
  deferredCleanups.add(cleanup);
  observer.observe(deferredTarget);
}

function initializeHistoryGalleries() {
  document.querySelectorAll<HTMLElement>('[data-history-gallery]').forEach(
    queueHistoryGallery,
  );
}

function cleanupHistoryGalleries() {
  [...deferredCleanups].forEach((cleanup) => cleanup());
  [...activeCleanups].forEach((cleanup) => cleanup());
}

initializeHistoryGalleries();
document.addEventListener('astro:page-load', initializeHistoryGalleries);
document.addEventListener('astro:before-swap', cleanupHistoryGalleries);
window.addEventListener('pageshow', (event) => {
  if (event.persisted) initializeHistoryGalleries();
});
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) cleanupHistoryGalleries();
});
