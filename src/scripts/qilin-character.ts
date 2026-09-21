import { QILIN_JOINTS, type QilinJoint } from './qilin-rig.ts';

export type QilinArticulation = {
  angle: number; stretch: number; facing: number;
  joints: Record<QilinJoint, number>;
};
const wave = (p: number) => Math.sin(Math.PI * p);

// A reusable character gait, independent of the tree, route and animation clock.
export function sampleQilinGait({ flight, recoil = 0, anticipation = 0, turn = 0, rest = 0 }: {
  flight?: number; recoil?: number; anticipation?: number; turn?: number; rest?: number;
}): Omit<QilinArticulation, 'facing'> {
  if (flight !== undefined) {
    const p = flight;
    const lift = wave(p);
    const swing = Math.sin(p * Math.PI * 2);
    const release = Math.max(0, 1 - p * 5);
    return {
      angle: -6 * swing + 4 * release,
      stretch: 1 + 0.055 * lift - 0.10 * release,
      joints: {
        head: -5 * lift + 7 * release,
        tail: -10 * lift + 3 * swing * lift - 4 * release,
        frontNear: -18 * swing - 10 * release,
        frontNearKnee: 30 * lift + 16 * release,
        frontFar: -13 * Math.sin(p * Math.PI * 2 + 0.3) * lift + 6 * release,
        frontFarKnee: 22 * lift - 10 * release,
        rearNear: 24 * lift + 12 * release,
        rearNearKnee: -26 * lift - 16 * release,
        rearFar: 20 * lift * (1 - p * 0.3) + 8 * release,
        rearFarKnee: -22 * lift - 12 * release,
      },
    };
  }
  const a = anticipation, r = recoil;
  return {
    angle: a * 4 + r * 2,
    stretch: 1 - r * 0.13 - a * 0.10 - wave(turn) * 0.035,
    joints: {
      head: a * 7 - r * 4 - wave(Math.min(1, turn * 1.3)) * 5,
      tail: Math.sin(rest / 260) * 2 * (1 - a) - a * 4,
      frontNear: -a * 10 + r * 8, frontNearKnee: a * 16 + r * 12,
      frontFar: a * 6 - r * 7, frontFarKnee: -a * 10 - r * 8,
      rearNear: a * 12 - r * 5, rearNearKnee: -a * 16 + r * 12,
      rearFar: a * 8 - r * 6, rearFarKnee: -a * 12 + r * 10,
    },
  };
}

export function createQilinCharacter(element: HTMLElement) {
  const body = element.querySelector<HTMLElement>('[data-qilin-body-frame]');
  const facing = element.querySelector<SVGGElement>('[data-qilin-facing]');
  if (!body || !facing) return;
  const joints = Object.entries(QILIN_JOINTS).map(([name, pivot]) => ({
    name: name as QilinJoint, pivot,
    element: element.querySelector<SVGGElement>(`[data-qilin-joint="${name}"]`),
  }));
  return {
    render(pose: QilinArticulation) {
      body.style.transform = `rotate(${pose.angle * pose.facing}deg) scale(${1 / Math.sqrt(pose.stretch)},${pose.stretch})`;
      facing.setAttribute('transform', `translate(28 0) scale(${pose.facing} 1) translate(-28 0)`);
      element.dataset.facing = pose.facing > 0.05 ? 'right' : pose.facing < -0.05 ? 'left' : 'turning';
      for (const joint of joints) joint.element?.setAttribute('transform', `rotate(${pose.joints[joint.name]} ${joint.pivot.join(' ')})`);
    },
  };
}
