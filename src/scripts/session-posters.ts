const posterGalleryCleanups = new Set<() => void>();

function initializeSessionPosters(root: HTMLElement) {
  if (root.dataset.posterGalleryReady === 'true') return;

  const viewport = root.querySelector<HTMLElement>('[data-poster-viewport]');
  const track = root.querySelector<HTMLElement>('[data-poster-track]');
  const cards = [...root.querySelectorAll<HTMLElement>('[data-poster-card]')];
  const filters = root.querySelector<HTMLElement>('[data-poster-filters]');
  const filterButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-poster-filter]')];
  const count = root.querySelector<HTMLElement>('[data-poster-count]');
  const arrows = root.querySelector<HTMLElement>('[data-poster-arrows]');
  const previous = root.querySelector<HTMLButtonElement>('[data-poster-previous]');
  const next = root.querySelector<HTMLButtonElement>('[data-poster-next]');
  const dialog = root.querySelector<HTMLDialogElement>('[data-poster-dialog]');
  const dialogTitle = root.querySelector<HTMLElement>('[data-poster-dialog-title]');
  const dialogDate = root.querySelector<HTMLElement>('[data-poster-dialog-date]');
  const dialogImage = root.querySelector<HTMLImageElement>('[data-poster-dialog-image]');
  const download = root.querySelector<HTMLAnchorElement>('[data-poster-download]');
  const zoom = root.querySelector<HTMLButtonElement>('[data-poster-zoom]');
  const schedule = root.querySelector<HTMLAnchorElement>('[data-poster-dialog-schedule]');
  const links = [...root.querySelectorAll<HTMLAnchorElement>('[data-poster-open]')];

  if (!viewport || !track || !cards.length || !filters || !count || !arrows || !previous
    || !next || !dialog || !dialogTitle || !dialogDate || !dialogImage || !download || !schedule || !zoom) return;

  const controller = new AbortController();
  const { signal } = controller;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let returnFocus: HTMLElement | null = null;
  let scrollFrame = 0;
  let backdropPointerDown = false;

  const updateArrows = () => {
    const maximum = viewport.scrollWidth - viewport.clientWidth;
    arrows.hidden = maximum <= 2;
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
    const firstCard = cards.find((card) => !card.hidden);
    if (!firstCard) return;
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    viewport.scrollBy({
      left: direction * (firstCard.getBoundingClientRect().width + gap),
      behavior: reducedMotion.matches ? 'auto' : 'smooth',
    });
  };

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const selected = button.dataset.posterFilter;
      filterButtons.forEach((filter) => {
        filter.setAttribute('aria-pressed', String(filter === button));
      });
      cards.forEach((card) => {
        card.hidden = selected !== 'all' && card.dataset.posterDay !== selected;
      });
      count.textContent = `${cards.filter((card) => !card.hidden).length} 个专题`;
      viewport.scrollTo({ left: 0, behavior: 'auto' });
      scheduleArrowUpdate();
    }, { signal });
  });

  previous.addEventListener('click', () => advance(-1), { signal });
  next.addEventListener('click', () => advance(1), { signal });
  viewport.addEventListener('scroll', scheduleArrowUpdate, { passive: true, signal });
  viewport.addEventListener('keydown', (event) => {
    if (event.target !== viewport) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      advance(event.key === 'ArrowLeft' ? -1 : 1);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      viewport.scrollTo({
        left: event.key === 'Home' ? 0 : viewport.scrollWidth,
        behavior: reducedMotion.matches ? 'auto' : 'smooth',
      });
    }
  }, { signal });

  if (typeof dialog.showModal === 'function') {
    links.forEach((link) => {
      link.setAttribute('aria-haspopup', 'dialog');
      link.setAttribute('aria-controls', dialog.id);
      link.addEventListener('click', (event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        returnFocus = link;
        dialogTitle.textContent = link.dataset.posterTitle ?? '专题海报';
        dialogDate.textContent = link.dataset.posterDate ?? '';
        dialogImage.src = link.href;
        dialogImage.alt = link.querySelector('img')?.alt ?? dialogTitle.textContent;
        download.href = link.href;
        download.download = `x-agi-2026-${link.dataset.posterId}.webp`;
        schedule.href = link.dataset.posterSchedule ?? '/schedule/';
        dialog.removeAttribute('data-zoomed');
        zoom.setAttribute('aria-pressed', 'false');
        zoom.textContent = '放大阅读';
        dialog.showModal();
        document.documentElement.classList.add('session-poster-dialog-open');
        const imageContainer = dialogImage.parentElement;
        if (imageContainer) imageContainer.scrollTo({ top: 0, left: 0 });
      }, { signal });
    });
  }

  zoom.addEventListener('click', () => {
    const zoomed = dialog.toggleAttribute('data-zoomed');
    zoom.setAttribute('aria-pressed', String(zoomed));
    zoom.textContent = zoomed ? '适应窗口' : '放大阅读';
    if (!zoomed) dialogImage.parentElement?.scrollTo({ top: 0, left: 0 });
  }, { signal });

  const isBackdrop = (event: MouseEvent) => {
    const bounds = dialog.getBoundingClientRect();
    return event.target === dialog && (
      event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom
    );
  };

  dialog.addEventListener('pointerdown', (event) => {
    backdropPointerDown = isBackdrop(event);
  }, { signal });
  dialog.addEventListener('click', (event) => {
    if (backdropPointerDown && isBackdrop(event)) dialog.close();
    backdropPointerDown = false;
  }, { signal });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('session-poster-dialog-open');
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
  }, { signal });

  const observer = new ResizeObserver(scheduleArrowUpdate);
  observer.observe(viewport);
  filters.hidden = false;
  root.dataset.posterGalleryReady = 'true';
  updateArrows();

  const cleanup = () => {
    returnFocus = null;
    if (dialog.open) dialog.close();
    document.documentElement.classList.remove('session-poster-dialog-open');
    controller.abort();
    observer.disconnect();
    window.cancelAnimationFrame(scrollFrame);
    delete root.dataset.posterGalleryReady;
    posterGalleryCleanups.delete(cleanup);
  };
  posterGalleryCleanups.add(cleanup);
}

function initializeSessionPosterGalleries() {
  document.querySelectorAll<HTMLElement>('[data-session-poster-gallery]').forEach(initializeSessionPosters);
}

function cleanupSessionPosterGalleries() {
  [...posterGalleryCleanups].forEach((cleanup) => cleanup());
}

initializeSessionPosterGalleries();
document.addEventListener('astro:page-load', initializeSessionPosterGalleries);
document.addEventListener('astro:before-swap', cleanupSessionPosterGalleries);
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) cleanupSessionPosterGalleries();
});
window.addEventListener('pageshow', (event) => {
  if (event.persisted) initializeSessionPosterGalleries();
});
