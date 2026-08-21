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

export const capsuleOutlinePath = (
  width: number,
  height: number,
  neck: number,
  inset = 1.1,
) => {
  const left = inset;
  const right = Math.max(left + 1, width - inset);
  const top = inset;
  const bottom = Math.max(top + 1, height - inset);
  const radius = Math.max(1, (bottom - top) / 2);
  const middle = (left + right) / 2;
  const lobeEnd = Math.min(middle - 1, Math.max(left + radius, width * 0.27));
  const lobeStart = Math.max(middle + 1, Math.min(right - radius, width * 0.73));
  const bridge = Math.max(2, lobeStart - lobeEnd);
  const waist = Math.min(height * 0.09, 3.4) * clamp01(neck);
  const control = bridge * 0.22;
  const curve = radius * 0.5522848;

  return [
    `M ${left + radius} ${top}`,
    `H ${lobeEnd}`,
    `C ${lobeEnd + control} ${top} ${middle - control} ${top + waist} ${middle} ${top + waist}`,
    `C ${middle + control} ${top + waist} ${lobeStart - control} ${top} ${lobeStart} ${top}`,
    `H ${right - radius}`,
    `C ${right - radius + curve} ${top} ${right} ${top + radius - curve} ${right} ${top + radius}`,
    `C ${right} ${bottom - radius + curve} ${right - radius + curve} ${bottom} ${right - radius} ${bottom}`,
    `H ${lobeStart}`,
    `C ${lobeStart - control} ${bottom} ${middle + control} ${bottom - waist} ${middle} ${bottom - waist}`,
    `C ${middle - control} ${bottom - waist} ${lobeEnd + control} ${bottom} ${lobeEnd} ${bottom}`,
    `H ${left + radius}`,
    `C ${left + radius - curve} ${bottom} ${left} ${bottom - radius + curve} ${left} ${bottom - radius}`,
    `C ${left} ${top + radius - curve} ${left + radius - curve} ${top} ${left + radius} ${top}`,
    'Z',
  ].join(' ');
};
