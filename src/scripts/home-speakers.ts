const speakerLineupCleanups = new Set<() => void>();

function initializeSpeakerLineup(root: HTMLElement) {
  if (root.dataset.speakerLineupReady === 'true') return;
  const viewport = root.querySelector<HTMLElement>('[data-speaker-viewport]');
  const track = root.querySelector<HTMLElement>('[data-speaker-track]');
  const firstPerson = root.querySelector<HTMLElement>('[data-home-speaker]');
  const arrows = root.querySelector<HTMLElement>('[data-speaker-arrows]');
  const previous = root.querySelector<HTMLButtonElement>('[data-speaker-previous]');
  const next = root.querySelector<HTMLButtonElement>('[data-speaker-next]');
  if (!viewport || !track || !firstPerson || !arrows || !previous || !next) return;

  const controller = new AbortController();
  const { signal } = controller;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let scrollFrame = 0;
  const behavior = () => reducedMotion.matches ? 'auto' : 'smooth';
  const updateArrows = () => {
    const maximum = viewport.scrollWidth - viewport.clientWidth;
    const canScroll = maximum > 2;
    arrows.hidden = !canScroll;
    viewport.tabIndex = canScroll ? 0 : -1;
    if (canScroll) viewport.setAttribute('aria-describedby', 'home-speakers-hint');
    else viewport.removeAttribute('aria-describedby');
    previous.disabled = viewport.scrollLeft <= 2;
    next.disabled = viewport.scrollLeft >= maximum - 2;
  };
  const scheduleArrowUpdate = () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = 0;
      updateArrows();
    });
  };
  const advance = (direction: number) => {
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    const step = firstPerson.getBoundingClientRect().width + gap;
    const edge = Number.parseFloat(getComputedStyle(viewport).scrollPaddingLeft) || 0;
    const visibleCount = Math.max(1, Math.floor((viewport.clientWidth - 2 * edge + gap) / step));
    viewport.scrollBy({ left: direction * step * visibleCount, behavior: behavior() });
  };

  previous.addEventListener('click', () => advance(-1), { signal });
  next.addEventListener('click', () => advance(1), { signal });
  viewport.addEventListener('scroll', scheduleArrowUpdate, { passive: true, signal });
  viewport.addEventListener('keydown', (event) => {
    if (event.target !== viewport || viewport.scrollWidth <= viewport.clientWidth + 2) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      advance(event.key === 'ArrowLeft' ? -1 : 1);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      viewport.scrollTo({
        left: event.key === 'Home' ? 0 : viewport.scrollWidth,
        behavior: behavior(),
      });
    }
  }, { signal });

  const observer = new ResizeObserver(scheduleArrowUpdate);
  observer.observe(viewport);
  root.dataset.speakerLineupReady = 'true';
  updateArrows();

  const cleanup = () => {
    controller.abort();
    observer.disconnect();
    window.cancelAnimationFrame(scrollFrame);
    delete root.dataset.speakerLineupReady;
    speakerLineupCleanups.delete(cleanup);
  };
  speakerLineupCleanups.add(cleanup);
}

function initializeSpeakerLineups() {
  document.querySelectorAll<HTMLElement>('[data-home-speakers]').forEach(initializeSpeakerLineup);
}
function cleanupSpeakerLineups() {
  [...speakerLineupCleanups].forEach((cleanup) => cleanup());
}

initializeSpeakerLineups();
document.addEventListener('astro:page-load', initializeSpeakerLineups);
document.addEventListener('astro:before-swap', cleanupSpeakerLineups);
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) cleanupSpeakerLineups();
});
window.addEventListener('pageshow', (event) => {
  if (event.persisted) initializeSpeakerLineups();
});
