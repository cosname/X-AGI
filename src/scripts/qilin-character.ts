import { QILIN_JOINTS, type QilinJoint } from './qilin-rig.ts';

export type QilinArticulation = {
  angle: number; stretch: number; facing: number;
  joints: Record<QilinJoint, number>;
};
export type QilinIdle = 'look' | 'bow' | 'prance';
const wave = (p: number) => Math.sin(Math.PI * p);

// Idle poses are additive offsets, faded in and out by `weight`, so every rest
// begins and ends in the neutral stance that takeoff and landing expect.
const idleOffsets = (idle: QilinIdle, time: number) => {
  const breath = Math.sin(time / 520) * 0.012;
  if (idle === 'bow') {
    // A play bow: chest low, forelegs reaching forward, tail up and wagging.
    const wag = Math.sin(time / 150);
    return {
      angle: 5, stretch: 0.97 + breath,
      joints: {
        head: -9 + Math.sin(time / 420) * 2, tail: 16 + wag * 7,
        frontNear: -30, frontNearKnee: 12, frontFar: -24, frontFarKnee: 8,
        rearNear: -4, rearNearKnee: 3, rearFar: -3, rearFarKnee: 2,
      },
    };
  }
  if (idle === 'prance') {
    // A raised, folded foreleg that paws the air twice per second and a proud head.
    const paw = (Math.sin(time / 330) + 1) / 2;
    return {
      angle: -2, stretch: 1.01 + breath,
      joints: {
        head: -12 + Math.sin(time / 610) * 3, tail: 8 + Math.sin(time / 380) * 6,
        frontNear: -34 + paw * 14, frontNearKnee: 62 - paw * 18, frontFar: 4, frontFarKnee: -3,
        rearNear: 3, rearNearKnee: -2, rearFar: 2, rearFarKnee: -2,
      },
    };
  }
  // Look around: the head scans up and down while the tail swishes.
  const scan = Math.sin(time / 700);
  return {
    angle: 0, stretch: 1 + breath,
    joints: {
      head: -8 * Math.max(0, scan) + 5 * Math.max(0, -scan), tail: 6 * Math.sin(time / 240),
      frontNear: 0, frontNearKnee: 0, frontFar: 0, frontFarKnee: 0,
      rearNear: 0, rearNearKnee: 0, rearFar: 0, rearFarKnee: 0,
    },
  };
};

// A reusable character gait, independent of the tree, route and animation clock.
export function sampleQilinGait({ flight, recoil = 0, anticipation = 0, hop = 0, rest = 0, idle, idleWeight = 0 }: {
  flight?: number; recoil?: number; anticipation?: number; hop?: number; rest?: number;
  idle?: QilinIdle; idleWeight?: number;
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
  // A turn is a small hop in place; its legs tuck like a miniature leap.
  const h = wave(hop);
  const base = {
    angle: a * 4 + r * 2,
    stretch: 1 - r * 0.13 - a * 0.10 + h * 0.03,
    joints: {
      head: a * 7 - r * 4 - h * 4,
      tail: Math.sin(rest / 260) * 2 * (1 - a) - a * 4 - h * 6,
      frontNear: -a * 10 + r * 8 - h * 8, frontNearKnee: a * 16 + r * 12 + h * 18,
      frontFar: a * 6 - r * 7 - h * 5, frontFarKnee: -a * 10 - r * 8 + h * 12,
      rearNear: a * 12 - r * 5 + h * 10, rearNearKnee: -a * 16 + r * 12 - h * 14,
      rearFar: a * 8 - r * 6 + h * 8, rearFarKnee: -a * 12 + r * 10 - h * 12,
    },
  };
  if (!idle || idleWeight <= 0) return base;
  const offset = idleOffsets(idle, rest);
  const w = idleWeight;
  const joints = { ...base.joints };
  for (const joint of Object.keys(joints) as QilinJoint[]) joints[joint] += offset.joints[joint] * w;
  return {
    angle: base.angle + offset.angle * w,
    stretch: base.stretch + (offset.stretch - 1) * w,
    joints,
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
      element.dataset.facing = pose.facing > 0 ? 'right' : 'left';
      for (const joint of joints) joint.element?.setAttribute('transform', `rotate(${pose.joints[joint.name].toFixed(2)} ${joint.pivot.join(' ')})`);
    },
  };
}
