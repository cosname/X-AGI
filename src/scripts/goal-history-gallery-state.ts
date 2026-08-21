function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizedStops(stops: readonly number[]) {
  let previous = 0;
  return stops.map((stop, index) => {
    const finiteStop = Number.isFinite(stop) ? stop : previous;
    const normalized = index === 0 ? finiteStop : Math.max(previous, finiteStop);
    previous = normalized;
    return normalized;
  });
}

export function continuousIndexAtPosition(
  position: number,
  stops: readonly number[],
) {
  if (stops.length <= 1) return 0;

  const safeStops = normalizedStops(stops);
  const first = safeStops[0];
  const last = safeStops.at(-1) ?? first;
  const safePosition = Number.isFinite(position) ? clamp(position, first, last) : first;

  if (safePosition <= first || last <= first) return 0;
  if (safePosition >= last) return safeStops.length - 1;

  for (let index = 1; index < safeStops.length; index += 1) {
    const right = safeStops[index];
    if (safePosition > right) continue;

    const left = safeStops[index - 1];
    const span = right - left;
    if (span <= 0) return index;
    return index - 1 + (safePosition - left) / span;
  }

  return safeStops.length - 1;
}

export function galleryScrollTarget(
  requestedIndex: number,
  stops: readonly number[],
  reducedMotion: boolean,
) {
  const safeStops = normalizedStops(stops);
  const targetIndex = safeStops.length > 0
    ? clamp(
      Number.isFinite(requestedIndex) ? Math.round(requestedIndex) : 0,
      0,
      safeStops.length - 1,
    )
    : 0;

  return {
    targetIndex,
    left: safeStops[targetIndex] ?? 0,
    behavior: reducedMotion ? 'auto' as const : 'smooth' as const,
  };
}

export type GalleryToolbarKey = 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End';

export function galleryToolbarTargetIndex(
  currentIndex: number,
  key: GalleryToolbarKey,
  count: number,
) {
  const safeCount = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  if (safeCount === 0) return 0;

  const safeIndex = clamp(
    Number.isFinite(currentIndex) ? Math.round(currentIndex) : 0,
    0,
    safeCount - 1,
  );

  if (key === 'Home') return 0;
  if (key === 'End') return safeCount - 1;
  if (key === 'ArrowLeft') return Math.max(0, safeIndex - 1);
  return Math.min(safeCount - 1, safeIndex + 1);
}

export function galleryWaveScales(
  focus: number,
  count: number,
  minimumScale = 0.22,
  influenceRadius = 3,
) {
  const safeCount = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  if (safeCount === 0) return [];
  if (safeCount === 1) return [1];

  const safeFocus = Number.isFinite(focus)
    ? clamp(focus, 0, safeCount - 1)
    : 0;
  const safeMinimumScale = Number.isFinite(minimumScale)
    ? clamp(minimumScale, 0, 1)
    : 0.22;
  const safeRadius = Number.isFinite(influenceRadius)
    ? Math.max(0.0001, influenceRadius)
    : 3;

  return Array.from({ length: safeCount }, (_, index) => {
    const distance = Math.abs(index - safeFocus);
    if (distance >= safeRadius) return safeMinimumScale;

    const influence = (Math.cos(Math.PI * distance / safeRadius) + 1) / 2;
    return safeMinimumScale + (1 - safeMinimumScale) * influence;
  });
}

export function dampGalleryFocus(
  current: number,
  target: number,
  reducedMotion: boolean,
  response = 0.24,
  snapThreshold = 0.001,
) {
  const safeTarget = Number.isFinite(target) ? target : 0;
  if (!Number.isFinite(current) || reducedMotion) return safeTarget;

  const safeResponse = Number.isFinite(response) ? clamp(response, 0, 1) : 0.24;
  const safeThreshold = Number.isFinite(snapThreshold)
    ? Math.max(0, snapThreshold)
    : 0.001;
  const next = current + (safeTarget - current) * safeResponse;
  return Math.abs(safeTarget - next) <= safeThreshold ? safeTarget : next;
}
