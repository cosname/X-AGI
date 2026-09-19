/** Select-only combobox with a native select fallback and a top-layer popup. */
export function initializeVenuePicker(root: HTMLElement, select: HTMLSelectElement, signal: AbortSignal) {
  const trigger = root.querySelector<HTMLButtonElement>('[data-venue-trigger]');
  const value = root.querySelector<HTMLElement>('[data-venue-value]');
  const menu = root.querySelector<HTMLElement>('[data-venue-menu]');
  const label = root.querySelector<HTMLLabelElement>('#poster-venue-label');
  const options = [...root.querySelectorAll<HTMLElement>('[data-venue-option]')];
  const fallback = { sync() {}, cleanup() {} };
  if (!trigger || !value || !menu || !label || options.length !== select.options.length
    || typeof menu.showPopover !== 'function') return fallback;

  let active = select.selectedIndex;
  let search = '';
  let lastTypedAt = 0;
  let positionFrame = 0;
  const isOpen = () => menu.matches(':popover-open');
  const sync = () => {
    const selected = select.options[select.selectedIndex];
    value.textContent = selected.textContent;
    trigger.title = selected.textContent || '';
    options.forEach((option, index) => option.setAttribute('aria-selected', String(index === select.selectedIndex)));
  };
  const setActive = (index: number, scroll = true) => {
    active = Math.max(0, Math.min(options.length - 1, index));
    options.forEach((option, index) => {
      if (index === active) option.dataset.active = 'true';
      else delete option.dataset.active;
    });
    trigger.setAttribute('aria-activedescendant', options[active].id);
    if (scroll) options[active].scrollIntoView({ block: 'nearest', behavior: 'instant' });
  };
  const close = (commit = false) => {
    if (!isOpen()) return;
    if (commit && select.selectedIndex !== active) {
      select.selectedIndex = active;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    menu.hidePopover();
  };
  const position = () => {
    if (!isOpen()) return;
    const box = trigger.getBoundingClientRect();
    const viewport = window.visualViewport;
    const left = (viewport?.offsetLeft ?? 0) + 12;
    const top = (viewport?.offsetTop ?? 0) + 12;
    const right = left + (viewport?.width ?? window.innerWidth) - 24;
    const bottom = top + (viewport?.height ?? window.innerHeight) - 24;
    if (box.bottom < top || box.top > bottom) { close(); return; }
    const width = Math.min(Math.max(box.width, 320), right - left);
    const below = bottom - box.bottom - 8;
    const above = box.top - top - 8;
    const upward = below < 320 && above > below;
    menu.style.width = `${width}px`;
    menu.style.maxHeight = `${Math.max(0, Math.min(320, upward ? above : below))}px`;
    menu.style.left = `${Math.max(left, Math.min(box.left, right - width))}px`;
    menu.style.top = `${upward ? box.top - 8 - menu.getBoundingClientRect().height : box.bottom + 8}px`;
  };
  const open = () => {
    if (isOpen()) return;
    menu.showPopover();
    position();
    setActive(select.selectedIndex);
  };
  const schedulePosition = (event: Event) => {
    if (!isOpen() || (event.target instanceof Node && menu.contains(event.target)) || positionFrame) return;
    positionFrame = window.requestAnimationFrame(() => { positionFrame = 0; position(); });
  };

  menu.addEventListener('beforetoggle', (event) => {
    const opened = (event as ToggleEvent).newState === 'open';
    trigger.setAttribute('aria-expanded', String(opened));
    if (!opened) {
      trigger.removeAttribute('aria-activedescendant');
      search = '';
    }
  }, { signal });
  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    if (isOpen()) close();
    else open();
  }, { signal });
  trigger.addEventListener('keydown', (event) => {
    if (event.isComposing || event.ctrlKey || event.metaKey) return;
    if (Date.now() - lastTypedAt > 700) search = '';
    const opened = isOpen();
    if (event.key === 'Escape') {
      if (opened) { event.preventDefault(); close(); }
      return;
    }
    if (event.key === 'Tab') { close(true); return; }
    if (event.key === 'Enter' || (event.key === ' ' && !search)) {
      event.preventDefault();
      if (opened) close(true);
      else open();
      return;
    }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp'].includes(event.key)) {
      event.preventDefault();
      if (event.altKey && event.key === 'ArrowUp') { close(true); return; }
      open();
      if (event.key === 'Home') setActive(0);
      else if (event.key === 'End') setActive(options.length - 1);
      else if (opened && !event.altKey) {
        const amount = event.key.startsWith('Page') ? 10 : 1;
        setActive(active + (event.key.endsWith('Down') ? amount : -amount));
      }
      search = '';
      return;
    }
    if (event.key.length !== 1 || event.altKey) return;
    event.preventDefault();
    open();
    const now = Date.now();
    search = now - lastTypedAt > 700 ? event.key : search + event.key;
    lastTypedAt = now;
    const normalized = search.toLocaleLowerCase();
    const repeated = [...normalized].every(character => character === normalized[0]);
    const prefix = repeated ? normalized[0] : normalized;
    const start = repeated ? active + 1 : active;
    const match = options.findIndex((_, offset) => select.options[(start + offset) % options.length].text.toLocaleLowerCase().startsWith(prefix));
    if (match !== -1) setActive((start + match) % options.length);
  }, { signal });
  // Keep DOM focus on the combobox while pointing at its virtual-focus options.
  menu.addEventListener('mousedown', event => event.preventDefault(), { signal });
  menu.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    const option = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-venue-option]') : null;
    if (option) setActive(options.indexOf(option), false);
  }, { signal });
  menu.addEventListener('click', (event) => {
    const option = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-venue-option]') : null;
    if (!option) return;
    setActive(options.indexOf(option), false);
    close(true);
    trigger.focus({ preventScroll: true });
  }, { signal });
  trigger.addEventListener('blur', () => close(true), { signal });
  document.addEventListener('pointerdown', (event) => {
    if (event.target instanceof Node && !trigger.contains(event.target) && !menu.contains(event.target)) close(true);
  }, { signal });
  window.addEventListener('scroll', schedulePosition, { capture: true, passive: true, signal });
  window.addEventListener('resize', schedulePosition, { passive: true, signal });
  window.visualViewport?.addEventListener('resize', schedulePosition, { passive: true, signal });
  window.visualViewport?.addEventListener('scroll', schedulePosition, { passive: true, signal });
  select.hidden = true;
  trigger.hidden = false;
  menu.hidden = false;
  trigger.parentElement!.dataset.venueEnhanced = 'true';
  label.htmlFor = trigger.id;
  sync();

  return {
    sync,
    cleanup() {
      close();
      window.cancelAnimationFrame(positionFrame);
      trigger.setAttribute('aria-expanded', 'false');
      trigger.removeAttribute('aria-activedescendant');
      trigger.hidden = true;
      menu.hidden = true;
      select.hidden = false;
      label.htmlFor = select.id;
      delete trigger.parentElement!.dataset.venueEnhanced;
    },
  };
}
