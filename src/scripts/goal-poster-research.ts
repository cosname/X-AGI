const homeResearchCleanups = new Set<() => void>();

function normalizeHomeResearchText(text: string) {
  return text.normalize('NFKC').toLowerCase().replace(/\s+/gu, ' ').trim();
}

function initializeHomeResearch(root: HTMLElement) {
  if (root.dataset.homeResearchReady === 'true') return;

  const tools = root.querySelector<HTMLElement>('[data-home-research-tools]');
  const search = root.querySelector<HTMLInputElement>('[data-home-research-search]');
  const clear = root.querySelector<HTMLButtonElement>('[data-home-research-clear]');
  const count = root.querySelector<HTMLElement>('[data-home-research-count]');
  const viewport = root.querySelector<HTMLElement>('[data-home-research-viewport]');
  const track = root.querySelector<HTMLElement>('[data-home-research-track]');
  const empty = root.querySelector<HTMLElement>('[data-home-research-empty]');
  const browse = root.querySelector<HTMLElement>('[data-home-research-browse]');
  const arrows = root.querySelector<HTMLElement>('[data-home-research-arrows]');
  const previous = root.querySelector<HTMLButtonElement>('[data-home-research-previous]');
  const next = root.querySelector<HTMLButtonElement>('[data-home-research-next]');
  const papers = [...root.querySelectorAll<HTMLElement>('[data-home-research-card]')].map((element) => ({
    element,
    text: normalizeHomeResearchText([
      element.querySelector('h3')?.textContent,
      element.querySelector('[data-home-research-name]')?.textContent,
      element.querySelector('[data-home-research-affiliation]')?.textContent,
      element.querySelector('[data-home-research-venue]')?.textContent,
    ].join(' ')),
  }));

  if (!tools || !search || !clear || !count || !viewport || !track || !empty || !browse
    || !arrows || !previous || !next || !papers.length) return;

  const controller = new AbortController();
  const { signal } = controller;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let updateFrame = 0;

  const updateArrows = () => {
    const maximum = viewport.scrollWidth - viewport.clientWidth;
    arrows.hidden = viewport.hidden || maximum <= 2;
    previous.disabled = viewport.scrollLeft <= 2;
    next.disabled = viewport.scrollLeft >= maximum - 2;
  };

  const scheduleArrowUpdate = () => {
    if (updateFrame) return;
    updateFrame = window.requestAnimationFrame(() => {
      updateFrame = 0;
      updateArrows();
    });
  };

  const updateSearch = () => {
    const terms = normalizeHomeResearchText(search.value).split(' ').filter(Boolean);
    let visibleCount = 0;
    papers.forEach((paper) => {
      const visible = terms.every((term) => paper.text.includes(term));
      paper.element.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    count.textContent = terms.length
      ? `显示 ${visibleCount} / ${papers.length} 篇报名论文`
      : `共 ${papers.length} 篇报名论文`;
    empty.hidden = visibleCount > 0;
    viewport.hidden = visibleCount === 0;
    browse.hidden = visibleCount === 0;
    clear.disabled = search.value.length === 0;
    viewport.scrollTo({ left: 0, behavior: 'instant' });
    scheduleArrowUpdate();
  };

  const advance = (direction: number) => {
    const first = papers.find((paper) => !paper.element.hidden)?.element;
    if (!first) return;
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    viewport.scrollBy({
      left: direction * (first.getBoundingClientRect().width + gap),
      behavior: reducedMotion.matches ? 'instant' : 'smooth',
    });
  };

  search.addEventListener('input', (event) => {
    if (!(event instanceof InputEvent) || !event.isComposing) updateSearch();
  }, { signal });
  search.addEventListener('compositionend', updateSearch, { signal });
  clear.addEventListener('click', () => {
    search.value = '';
    updateSearch();
    search.focus({ preventScroll: true });
  }, { signal });
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
        behavior: reducedMotion.matches ? 'instant' : 'smooth',
      });
    }
  }, { signal });

  const observer = new ResizeObserver(scheduleArrowUpdate);
  observer.observe(viewport);
  observer.observe(track);
  updateSearch();
  root.dataset.homeResearchReady = 'true';
  tools.hidden = false;

  const cleanup = () => {
    controller.abort();
    observer.disconnect();
    window.cancelAnimationFrame(updateFrame);
    papers.forEach((paper) => { paper.element.hidden = false; });
    viewport.hidden = false;
    browse.hidden = false;
    tools.hidden = true;
    arrows.hidden = true;
    empty.hidden = true;
    count.textContent = `共 ${papers.length} 篇报名论文`;
    delete root.dataset.homeResearchReady;
    homeResearchCleanups.delete(cleanup);
  };
  homeResearchCleanups.add(cleanup);
}

function initializeHomeResearchSections() {
  document.querySelectorAll<HTMLElement>('[data-home-research]').forEach(initializeHomeResearch);
}

function cleanupHomeResearchSections() {
  [...homeResearchCleanups].forEach((cleanup) => cleanup());
}

initializeHomeResearchSections();
document.addEventListener('astro:page-load', initializeHomeResearchSections);
document.addEventListener('astro:before-swap', cleanupHomeResearchSections);
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) cleanupHomeResearchSections();
});
window.addEventListener('pageshow', (event) => {
  if (event.persisted) initializeHomeResearchSections();
});
