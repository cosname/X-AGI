export type CapsuleSize = {
  width: number;
  height: number;
};

export type CapsuleGapMorph = CapsuleSize & {
  neck: number;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const mix = (start: number, end: number, progress: number) => (
  start + (end - start) * progress
);

export const capsuleGapMorph = (
  left: CapsuleSize,
  right: CapsuleSize,
  progress: number,
): CapsuleGapMorph => {
  const normalizedProgress = clamp01(progress);
  const easedProgress = normalizedProgress * normalizedProgress * (3 - 2 * normalizedProgress);
  const neck = normalizedProgress === 0 || normalizedProgress === 1
    ? 0
    : Math.sin(Math.PI * normalizedProgress) ** 2;
  const baseWidth = mix(left.width, right.width, easedProgress);
  const baseHeight = mix(left.height, right.height, easedProgress);

  return {
    width: baseWidth,
    height: baseHeight,
    neck,
  };
};
