import { capsuleGapMorph } from './navigation-capsule.ts';

export type GlassTargetRect = {
  key: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

export type GlassTargetGeometry = GlassTargetRect & {
  right: number;
  bottom: number;
  centerX: number;
  centerY: number;
  row: number;
};

export type GlassCapsuleGeometry = {
  x: number;
  y: number;
  width: number;
  height: number;
  neck: number;
};

export function glassGroupAllowsScrub(
  scrubEnabled: boolean,
  navMode?: string,
  inlineScrubEnabled = false,
) {
  if (!scrubEnabled) return false;
  if (navMode == null || navMode === '') return true;
  return navMode === 'compact' || (navMode === 'inline' && inlineScrubEnabled);
}

export function glassGroupUsesVerticalAxis(
  axis?: string,
  scheduleNavigation?: string,
  navMode?: string,
) {
  const usesInlineSchedulePeriods = scheduleNavigation === 'periods' && navMode === 'inline';
  return axis === 'vertical' && !usesInlineSchedulePeriods;
}

export function glassActivationShouldDismiss(
  tagName: string,
  href: string | null | undefined,
  glassTarget?: string,
) {
  if (glassTarget === 'close') return true;
  if (tagName !== 'A' || !href) return false;
  return !href.startsWith('#');
}

const targetGeometry = (rect: GlassTargetRect, row: number): GlassTargetGeometry => ({
  ...rect,
  right: rect.left + rect.width,
  bottom: rect.top + rect.height,
  centerX: rect.left + rect.width / 2,
  centerY: rect.top + rect.height / 2,
  row,
});

export function assignGlassTargetRows(
  rects: readonly GlassTargetRect[],
  tolerance = 10,
): GlassTargetGeometry[] {
  let row = -1;
  let rowCenter = Number.NEGATIVE_INFINITY;

  return rects.map((rect) => {
    const centerY = rect.top + rect.height / 2;
    if (row < 0 || Math.abs(centerY - rowCenter) > tolerance) {
      row += 1;
      rowCenter = centerY;
    } else {
      rowCenter = (rowCenter + centerY) / 2;
    }

    return targetGeometry(rect, row);
  });
}

export function capsuleForGlassTarget(target: GlassTargetGeometry): GlassCapsuleGeometry {
  return {
    x: target.centerX,
    y: target.centerY,
    width: target.width,
    height: target.height,
    neck: 0,
  };
}

function nearestGlassTargetRow(
  targets: readonly GlassTargetGeometry[],
  pointerY: number,
) {
  const rows = new Map<number, GlassTargetGeometry[]>();
  targets.forEach((target) => {
    const row = rows.get(target.row) ?? [];
    row.push(target);
    rows.set(target.row, row);
  });

  return [...rows.values()].reduce((closest, candidates) => {
    if (!closest) return candidates;
    const candidateDistance = Math.abs(
      candidates.reduce((sum, target) => sum + target.centerY, 0) / candidates.length - pointerY,
    );
    const closestDistance = Math.abs(
      closest.reduce((sum, target) => sum + target.centerY, 0) / closest.length - pointerY,
    );
    return candidateDistance < closestDistance ? candidates : closest;
  }, null as GlassTargetGeometry[] | null) ?? [];
}

export function capsuleForGlassPointer(
  targets: readonly GlassTargetGeometry[],
  pointerX: number,
  pointerY: number,
): GlassCapsuleGeometry | null {
  const rowTargets = nearestGlassTargetRow(targets, pointerY);
  if (rowTargets.length === 0) return null;
  const ordered = [...rowTargets].sort((left, right) => left.centerX - right.centerX);
  if (pointerX <= ordered[0].centerX) return capsuleForGlassTarget(ordered[0]);
  if (pointerX >= ordered.at(-1)!.centerX) return capsuleForGlassTarget(ordered.at(-1)!);

  for (let index = 0; index < ordered.length - 1; index += 1) {
    const left = ordered[index];
    const right = ordered[index + 1];
    if (pointerX > right.centerX) continue;

    const progress = (pointerX - left.centerX) / (right.centerX - left.centerX);
    const morph = capsuleGapMorph(left, right, progress);
    return {
      x: left.centerX + (right.centerX - left.centerX) * progress,
      y: left.centerY + (right.centerY - left.centerY) * progress,
      width: morph.width,
      height: morph.height,
      neck: morph.neck,
    };
  }

  return capsuleForGlassTarget(ordered.at(-1)!);
}

// Light hold on each control, then mostly follow the pointer through the gap.
const GLASS_HOLD = 0.14;
const GLASS_HOLD_MAX = 0.14;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function adsorbGlassProgress(
  progress: number,
  fromSize: number,
  toSize: number,
  travel: number,
) {
  const normalized = clamp01(progress);
  if (travel <= 0) return normalized;
  const hold = Math.min(fromSize, toSize) * GLASS_HOLD;
  const stick = Math.min(GLASS_HOLD_MAX, hold / travel);
  if (normalized <= stick) return 0;
  if (normalized >= 1 - stick) return 1;
  const inner = (normalized - stick) / (1 - 2 * stick);
  const smooth = inner * inner * (3 - 2 * inner);
  return inner * 0.72 + smooth * 0.28;
}

function capsuleForAxisGlassPointer(
  targets: readonly GlassTargetGeometry[],
  pointer: number,
  vertical: boolean,
): GlassCapsuleGeometry | null {
  if (targets.length === 0) return null;

  const center = (target: GlassTargetGeometry) => vertical ? target.centerY : target.centerX;
  const size = (target: GlassTargetGeometry) => vertical ? target.height : target.width;
  const ordered = [...targets].sort((from, to) => center(from) - center(to));
  if (pointer <= center(ordered[0])) return capsuleForGlassTarget(ordered[0]);
  if (pointer >= center(ordered.at(-1)!)) return capsuleForGlassTarget(ordered.at(-1)!);

  for (let index = 0; index < ordered.length - 1; index += 1) {
    const from = ordered[index];
    const to = ordered[index + 1];
    if (pointer > center(to)) continue;

    const travel = center(to) - center(from);
    const progress = adsorbGlassProgress(
      (pointer - center(from)) / travel,
      size(from),
      size(to),
      travel,
    );
    if (progress <= 0) return capsuleForGlassTarget(from);
    if (progress >= 1) return capsuleForGlassTarget(to);

    const bridge = Math.sin(Math.PI * progress);
    const mix = (start: number, end: number) => start + (end - start) * progress;
    const restingWidth = mix(from.width, to.width);
    const restingHeight = mix(from.height, to.height);
    const stretch = Math.min(18, travel * 0.24) * bridge;

    return {
      x: mix(from.centerX, to.centerX),
      y: mix(from.centerY, to.centerY),
      width: vertical ? restingWidth * (1 - bridge * 0.045) : restingWidth + stretch,
      height: vertical ? restingHeight + stretch : restingHeight * (1 - bridge * 0.045),
      neck: 0,
    };
  }

  return capsuleForGlassTarget(ordered.at(-1)!);
}

export function capsuleForVerticalGlassPointer(
  targets: readonly GlassTargetGeometry[],
  pointerY: number,
) {
  return capsuleForAxisGlassPointer(targets, pointerY, true);
}

export function capsuleForHorizontalGlassPointer(
  targets: readonly GlassTargetGeometry[],
  pointerX: number,
  pointerY: number,
) {
  return capsuleForAxisGlassPointer(nearestGlassTargetRow(targets, pointerY), pointerX, false);
}
