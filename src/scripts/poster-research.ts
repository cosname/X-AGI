import { initializeVenuePicker } from './venue-picker';

const researchDirectoryCleanups = new Set<() => void>();

function normalizeResearchText(text: string) {
  return text.normalize('NFKC').toLowerCase().replace(/\s+/gu, ' ').trim();
}

function initializeResearchDirectory(root: HTMLElement) {
  if (root.dataset.researchReady === 'true') return;

  const tools = root.querySelector<HTMLElement>('[data-research-tools]');
  const search = root.querySelector<HTMLInputElement>('[data-research-search]');
  const filter = root.querySelector<HTMLSelectElement>('[data-research-filter]');
  const clear = root.querySelector<HTMLButtonElement>('[data-research-clear]');
  const results = root.querySelector<HTMLElement>('[data-research-results]');
  const empty = root.querySelector<HTMLElement>('[data-research-empty]');
  const papers = [...root.querySelectorAll<HTMLElement>('.poster-research__list > li')].map((element) => ({
    element,
    text: normalizeResearchText([
      element.querySelector('h3 a')?.textContent,
      element.querySelector('[data-research-name]')?.textContent,
      element.querySelector('[data-research-affiliation]')?.textContent,
    ].join(' ')),
    venue: element.querySelector('[data-research-venue]')?.textContent?.trim() ?? '',
  }));

  if (!tools || !search || !filter || !clear || !results || !empty || !papers.length) return;

  const controller = new AbortController();
  const { signal } = controller;
  const picker = initializeVenuePicker(root, filter, signal);

  const update = () => {
    picker.sync();
    const terms = normalizeResearchText(search.value).split(' ').filter(Boolean);
    const venue = filter.value;
    let visibleCount = 0;

    papers.forEach((paper) => {
      const visible = (!venue || paper.venue === venue)
        && terms.every((term) => paper.text.includes(term));
      paper.element.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    const filtered = terms.length > 0 || venue !== '';
    results.textContent = filtered
      ? `显示 ${visibleCount} / ${papers.length} 篇论文`
      : `共 ${papers.length} 篇论文`;
    empty.hidden = visibleCount > 0;
    clear.disabled = search.value.length === 0 && venue === '';
  };

  search.addEventListener('input', (event) => {
    if (!(event instanceof InputEvent) || !event.isComposing) update();
  }, { signal });
  search.addEventListener('compositionend', update, { signal });
  filter.addEventListener('change', update, { signal });
  clear.addEventListener('click', () => {
    search.value = '';
    filter.value = '';
    update();
    search.focus({ preventScroll: true });
  }, { signal });

  update();
  root.dataset.researchReady = 'true';
  tools.hidden = false;

  const cleanup = () => {
    controller.abort();
    picker.cleanup();
    papers.forEach((paper) => { paper.element.hidden = false; });
    tools.hidden = true;
    empty.hidden = true;
    delete root.dataset.researchReady;
    researchDirectoryCleanups.delete(cleanup);
  };
  researchDirectoryCleanups.add(cleanup);
}

function initializeResearchDirectories() {
  document.querySelectorAll<HTMLElement>('[data-poster-research]').forEach(initializeResearchDirectory);
}

function cleanupResearchDirectories() {
  [...researchDirectoryCleanups].forEach((cleanup) => cleanup());
}

initializeResearchDirectories();
document.addEventListener('astro:page-load', initializeResearchDirectories);
document.addEventListener('astro:before-swap', cleanupResearchDirectories);
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) cleanupResearchDirectories();
});
window.addEventListener('pageshow', (event) => {
  if (event.persisted) initializeResearchDirectories();
});
