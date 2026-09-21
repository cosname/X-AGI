// Joint positions and masks live in the original 56 × 52 mosaic coordinates.
// Every tile belongs to one part; the source artwork and sampled colors stay intact.
export const QILIN_JOINTS = {
  tail: [24, 33], head: [43, 26],
  frontFar: [49, 30], frontFarKnee: [53, 34],
  rearFar: [26, 39], rearFarKnee: [25, 44],
  rearNear: [22, 38], rearNearKnee: [18, 44],
  frontNear: [44, 34], frontNearKnee: [47, 38],
} as const;
export type QilinJoint = keyof typeof QILIN_JOINTS;
export type QilinPart = QilinJoint | 'body';
export const QILIN_LAYERS = [
  { name: 'tail' }, { name: 'rearFar', child: 'rearFarKnee' },
  { name: 'frontFar', child: 'frontFarKnee' }, { name: 'body' }, { name: 'head' },
  { name: 'rearNear', child: 'rearNearKnee' }, { name: 'frontNear', child: 'frontNearKnee' },
] as const;
const inside = (x: number, y: number, polygon: readonly (readonly number[])[]) => {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [ax, ay] = polygon[i];
    const [bx, by] = polygon[j];
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) hit = !hit;
  }
  return hit;
};
const limbs = [
  { part: 'frontFar', knee: 'frontFarKnee', split: 34, shape: [[47, 29], [53, 27], [57, 31], [57, 40], [51, 40], [49, 34], [46, 34]] },
  { part: 'frontNear', knee: 'frontNearKnee', split: 38, shape: [[39, 33], [46, 33], [51, 36], [47, 43], [39, 46], [39, 41], [44, 37]] },
  { part: 'rearNear', knee: 'rearNearKnee', split: 44, shape: [[21, 36], [26, 38], [23, 44], [14, 53], [8, 53], [10, 47], [15, 43], [16, 39]] },
  { part: 'rearFar', knee: 'rearFarKnee', split: 44, shape: [[23, 38], [30, 38], [29, 43], [26, 49], [20, 51], [20, 44]] },
] as const;
export function qilinPartFor(x: number, y: number): QilinPart {
  for (const limb of limbs) {
    if (inside(x + 0.45, y + 0.45, limb.shape)) return y >= limb.split ? limb.knee : limb.part;
  }
  if (x < 25 && y >= 21 && y < 40) return 'tail';
  if ((y < 26 && x >= 18) || (x >= 44 && y < 29)) return 'head';
  return 'body';
}
