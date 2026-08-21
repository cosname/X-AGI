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

export function capsuleForGlassPointer(
  targets: readonly GlassTargetGeometry[],
  pointerX: number,
  pointerY: number,
): GlassCapsuleGeometry | null {
  if (targets.length === 0) return null;

  const rows = new Map<number, GlassTargetGeometry[]>();
  targets.forEach((target) => {
    const row = rows.get(target.row) ?? [];
    row.push(target);
    rows.set(target.row, row);
  });

  const rowTargets = [...rows.values()].reduce((closest, candidates) => {
    if (!closest) return candidates;
    const candidateDistance = Math.abs(
      candidates.reduce((sum, target) => sum + target.centerY, 0) / candidates.length - pointerY,
    );
    const closestDistance = Math.abs(
      closest.reduce((sum, target) => sum + target.centerY, 0) / closest.length - pointerY,
    );
    return candidateDistance < closestDistance ? candidates : closest;
  }, null as GlassTargetGeometry[] | null);

  if (!rowTargets) return null;
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

export function capsuleForVerticalGlassPointer(
  targets: readonly GlassTargetGeometry[],
  pointerY: number,
): GlassCapsuleGeometry | null {
  if (targets.length === 0) return null;

  const ordered = [...targets].sort((top, bottom) => top.centerY - bottom.centerY);
  if (pointerY <= ordered[0].centerY) return capsuleForGlassTarget(ordered[0]);
  if (pointerY >= ordered.at(-1)!.centerY) return capsuleForGlassTarget(ordered.at(-1)!);

  for (let index = 0; index < ordered.length - 1; index += 1) {
    const top = ordered[index];
    const bottom = ordered[index + 1];
    if (pointerY > bottom.centerY) continue;

    const progress = (pointerY - top.centerY) / (bottom.centerY - top.centerY);
    const bridge = Math.sin(Math.PI * progress);
    const mix = (start: number, end: number) => start + (end - start) * progress;
    const restingHeight = mix(top.height, bottom.height);
    const travel = bottom.centerY - top.centerY;

    return {
      x: mix(top.centerX, bottom.centerX),
      y: mix(top.centerY, bottom.centerY),
      width: mix(top.width, bottom.width) * (1 - bridge * 0.045),
      height: restingHeight + Math.min(18, travel * 0.24) * bridge,
      neck: 0,
    };
  }

  return capsuleForGlassTarget(ordered.at(-1)!);
}
