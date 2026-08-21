import {
  claimInitialization,
  formatGalleryStatus,
  formatScheduleStatus,
  galleryMovement,
  matchesScheduleFilters,
  nearestSlideIndex,
  releaseInitialization,
  type ScheduleFilters,
} from './goal-home-lower-state';

const activeCleanups = new Set<() => void>();

function initializeGallery(root: HTMLElement) {
  const viewport = root.querySelector<HTMLElement>('[data-gallery-viewport]');
  const slides = Array.from(root.querySelectorAll<HTMLElement>('[data-gallery-slide]'));
  const previous = root.querySelector<HTMLButtonElement>('[data-gallery-previous]');
  const next = root.querySelector<HTMLButtonElement>('[data-gallery-next]');
  const status = root.querySelector<HTMLElement>('[data-gallery-status]');
  if (!viewport || !previous || !next || !status || slides.length === 0) return;
  if (!claimInitialization(root.dataset, 'galleryInitialized')) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const controller = new AbortController();
  const { signal } = controller;
  let activeIndex = 0;
  let scrollFrame = 0;
  let releaseTimer = 0;
  let suppressScrollSync = false;

  const slideCenters = () => slides.map(
    (slide) => slide.offsetLeft + slide.offsetWidth / 2,
  );
  const currentSlideIndex = () => nearestSlideIndex(
    slideCenters(),
    viewport.scrollLeft + viewport.clientWidth / 2,
  );
  const setInstantScrollLeft = (left: number) => {
    const inlineScrollBehavior = viewport.style.scrollBehavior;
    viewport.style.scrollBehavior = 'auto';
    viewport.scrollLeft = left;
    void viewport.scrollLeft;
    if (inlineScrollBehavior) {
      viewport.style.scrollBehavior = inlineScrollBehavior;
    } else {
      viewport.style.removeProperty('scroll-behavior');
    }
  };

  const updateStatus = (index: number) => {
    if (index === activeIndex && status.textContent === formatGalleryStatus(index, slides.length)) {
      return;
    }

    activeIndex = index;
    status.textContent = formatGalleryStatus(index, slides.length);
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === index;
      slide.toggleAttribute('data-gallery-active', active);
      const sourceLink = slide.querySelector<HTMLAnchorElement>('[data-gallery-source]');
      if (sourceLink) sourceLink.tabIndex = active ? 0 : -1;
    });
  };

  const releaseScrollSync = () => {
    window.clearTimeout(releaseTimer);
    suppressScrollSync = false;
    updateStatus(currentSlideIndex());
  };

  const moveTo = (requestedIndex: number) => {
    const { targetIndex, moveInstantly } = galleryMovement(
      requestedIndex,
      slides.length,
      reducedMotion.matches,
    );
    suppressScrollSync = true;
    window.clearTimeout(releaseTimer);
    if (moveInstantly) {
      setInstantScrollLeft(slides[targetIndex].offsetLeft);
    } else {
      viewport.scrollTo({ left: slides[targetIndex].offsetLeft, behavior: 'smooth' });
    }
    updateStatus(targetIndex);
    releaseTimer = window.setTimeout(releaseScrollSync, moveInstantly ? 0 : 1_200);
  };

  previous.addEventListener('click', () => moveTo(activeIndex - 1), { signal });
  next.addEventListener('click', () => moveTo(activeIndex + 1), { signal });
  viewport.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    moveTo(activeIndex + (event.key === 'ArrowRight' ? 1 : -1));
  }, { signal });
  viewport.addEventListener('scroll', () => {
    if (suppressScrollSync) return;
    window.cancelAnimationFrame(scrollFrame);
    scrollFrame = window.requestAnimationFrame(() => {
      updateStatus(currentSlideIndex());
    });
  }, { passive: true, signal });
  viewport.addEventListener('scrollend', releaseScrollSync, { signal });

  updateStatus(0);

  const cleanup = () => {
    controller.abort();
    window.cancelAnimationFrame(scrollFrame);
    window.clearTimeout(releaseTimer);
    releaseInitialization(root.dataset, 'galleryInitialized');
    activeCleanups.delete(cleanup);
  };
  activeCleanups.add(cleanup);
}

function initializeCompactSchedule(root: HTMLElement) {
  const dateGroup = root.querySelector<HTMLElement>('[data-filter-group="date"]');
  const categoryGroup = root.querySelector<HTMLElement>('[data-filter-group="category"]');
  const items = Array.from(root.querySelectorAll<HTMLElement>('[data-schedule-item]'));
  const empty = root.querySelector<HTMLElement>('[data-schedule-empty]');
  const status = root.querySelector<HTMLElement>('[data-schedule-status]');
  if (!dateGroup || !categoryGroup || !empty || !status || items.length === 0) return;
  if (!claimInitialization(root.dataset, 'scheduleInitialized')) return;

  const controller = new AbortController();
  const { signal } = controller;
  const filters: ScheduleFilters = { date: 'all', category: 'all' };

  const applyFilters = () => {
    let visibleCount = 0;
    items.forEach((item) => {
      const visible = matchesScheduleFilters({
        date: item.dataset.scheduleDate ?? '',
        category: item.dataset.scheduleCategory ?? '',
      }, filters);
      item.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    empty.hidden = visibleCount > 0;
    status.textContent = formatScheduleStatus(visibleCount);
  };

  const bindFilterGroup = (group: HTMLElement, name: keyof ScheduleFilters) => {
    const buttons = Array.from(group.querySelectorAll<HTMLButtonElement>('[data-filter-value]'));
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        filters[name] = button.dataset.filterValue ?? 'all';
        buttons.forEach((candidate) => {
          candidate.setAttribute('aria-pressed', candidate === button ? 'true' : 'false');
        });
        applyFilters();
      }, { signal });
    });
  };

  bindFilterGroup(dateGroup, 'date');
  bindFilterGroup(categoryGroup, 'category');
  applyFilters();

  const cleanup = () => {
    controller.abort();
    releaseInitialization(root.dataset, 'scheduleInitialized');
    activeCleanups.delete(cleanup);
  };
  activeCleanups.add(cleanup);
}

function initializeGoalHomeLower() {
  document.querySelectorAll<HTMLElement>('[data-history-gallery]').forEach(initializeGallery);
  document.querySelectorAll<HTMLElement>('[data-compact-schedule]').forEach(initializeCompactSchedule);
}

function cleanupGoalHomeLower() {
  [...activeCleanups].forEach((cleanup) => cleanup());
}

initializeGoalHomeLower();
document.addEventListener('astro:page-load', initializeGoalHomeLower);
document.addEventListener('astro:before-swap', cleanupGoalHomeLower);
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) cleanupGoalHomeLower();
});
