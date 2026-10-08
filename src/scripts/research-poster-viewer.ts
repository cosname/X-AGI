let cleanupPosterViewer: (() => void) | undefined;

function initializePosterViewer() {
  if (cleanupPosterViewer) return;
  const dialog = document.querySelector<HTMLDialogElement>('[data-research-poster-viewer]');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const viewport = dialog.querySelector<HTMLElement>('[data-poster-viewport]')!;
  const image = dialog.querySelector<HTMLImageElement>('[data-poster-image]')!;
  const title = dialog.querySelector<HTMLElement>('[data-poster-viewer-title]')!;
  const status = dialog.querySelector<HTMLElement>('[data-poster-status]')!;
  const original = dialog.querySelector<HTMLAnchorElement>('[data-poster-original]')!;
  const zoomIn = dialog.querySelector<HTMLButtonElement>('[data-poster-zoom-in]')!;
  const zoomOut = dialog.querySelector<HTMLButtonElement>('[data-poster-zoom-out]')!;
  const zoomLevel = dialog.querySelector<HTMLOutputElement>('[data-poster-zoom-level]')!;
  const fitButton = dialog.querySelector<HTMLButtonElement>('[data-poster-fit]')!;
  const controller = new AbortController();
  const { signal } = controller;
  const triggers = [...document.querySelectorAll<HTMLAnchorElement>('[data-research-poster]')];
  let trigger: HTMLAnchorElement | undefined;
  let width = 1;
  let height = 1;
  let scale = 1;
  let fitted = true;

  const fitScale = () => Math.min(1, Math.max(1, viewport.clientWidth - 32) / width, Math.max(1, viewport.clientHeight - 32) / height);
  const setScale = (next: number, preserveCenter = false) => {
    const viewRect = viewport.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    const centerX = viewRect.left + viewport.clientLeft + viewport.clientWidth / 2;
    const centerY = viewRect.top + viewport.clientTop + viewport.clientHeight / 2;
    const imageX = (centerX - imageRect.left) / scale;
    const imageY = (centerY - imageRect.top) / scale;
    scale = Math.max(fitScale(), Math.min(2, next));
    image.style.width = `${Math.round(width * scale)}px`;
    zoomLevel.value = `${Math.round(scale * 100)}%`;
    zoomOut.disabled = scale <= fitScale() + 0.001;
    zoomIn.disabled = scale >= 2;
    if (preserveCenter) {
      const nextRect = image.getBoundingClientRect();
      viewport.scrollLeft += nextRect.left + imageX * scale - centerX;
      viewport.scrollTop += nextRect.top + imageY * scale - centerY;
    } else {
      viewport.scrollTo({ left: 0, top: 0, behavior: 'instant' });
    }
  };
  const fit = () => { fitted = true; setScale(fitScale()); };
  const zoom = (factor: number) => { fitted = false; setScale(scale * factor, true); };

  triggers.forEach((link) => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-controls', dialog.id);
    link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      trigger = link;
      title.textContent = document.getElementById(link.getAttribute('aria-describedby') ?? '')?.textContent?.trim().replace(/↗$/u, '').trim() ?? '海报预览';
      image.alt = `${title.textContent} - 作者提交的海报`;
      image.hidden = true;
      zoomIn.disabled = true;
      zoomOut.disabled = true;
      fitButton.disabled = true;
      zoomLevel.value = '…';
      status.textContent = '正在加载海报…';
      status.hidden = false;
      original.href = link.href;
      dialog.showModal();
      image.src = link.href;
    }, { signal });
  });
  image.addEventListener('load', () => {
    width = image.naturalWidth;
    height = image.naturalHeight;
    image.width = width;
    image.height = height;
    image.hidden = false;
    status.hidden = true;
    fitButton.disabled = false;
    fit();
  }, { signal });
  image.addEventListener('error', () => {
    image.hidden = true;
    status.hidden = false;
    status.textContent = '海报加载失败，请通过“查看原图”重试。';
  }, { signal });
  dialog.querySelector('[data-poster-close]')!.addEventListener('click', () => dialog.close(), { signal });
  dialog.addEventListener('click', (event) => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  }, { signal });
  dialog.addEventListener('close', () => {
    image.removeAttribute('src');
    image.hidden = true;
    trigger?.focus({ preventScroll: true });
  }, { signal });
  zoomIn.addEventListener('click', () => zoom(1.5), { signal });
  zoomOut.addEventListener('click', () => zoom(1 / 1.5), { signal });
  fitButton.addEventListener('click', fit, { signal });
  const observer = new ResizeObserver(() => {
    if (dialog.open && !image.hidden) {
      if (fitted) fit();
      else setScale(scale, true);
    }
  });
  observer.observe(viewport);
  cleanupPosterViewer = () => {
    if (dialog.open) dialog.close();
    controller.abort();
    observer.disconnect();
    triggers.forEach((link) => { link.removeAttribute('aria-haspopup'); link.removeAttribute('aria-controls'); });
    cleanupPosterViewer = undefined;
  };
}

initializePosterViewer();
document.addEventListener('astro:page-load', initializePosterViewer);
document.addEventListener('astro:before-swap', () => cleanupPosterViewer?.());
window.addEventListener('pagehide', (event) => { if (!event.persisted) cleanupPosterViewer?.(); });
window.addEventListener('pageshow', (event) => { if (event.persisted) initializePosterViewer(); });
