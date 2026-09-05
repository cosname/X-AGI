export const PROBABILITY_BASELINE = 1.002;
export const MIN_POSTERIOR_AMPLITUDE = 0.12;
export const MAX_POSTERIOR_AMPLITUDE = 0.265;
export const BASE_POSTERIOR_AMPLITUDE = 0.25;
export const NARROW_POSTERIOR_AMPLITUDE = 0.185;
export const BASE_POSTERIOR_MEAN = 0.675;
export const POINTER_MEAN_SHIFT = 0.028;
export const POINTER_AMPLITUDE_WIGGLE = 0.018;
const POINTER_NEUTRAL_Y = 0.62;
export const HERO_TREE_HEIGHT = 980;
export const HERO_TREE_RIGHT_WIDTH = 743;
export const CANOPY_MAX_WIDTH = 820;
export const TERRAIN_COLUMNS = 128;

export type Point = { x: number; y: number };
export type Rect = { left: number; top: number; right: number; bottom: number };
export type DensityComponent = readonly [mean: number, sigma: number, amplitude: number];

export type TerrainLayerDefinition = {
  key: 'haze' | 'mist' | 'lavender' | 'periwinkle' | 'violet' | 'posterior' | 'navy' | 'ridge' | 'foundation';
  color: string;
  alpha: number;
  baseline: number;
  components: readonly DensityComponent[];
};

export type TerrainProfile = 'default' | 'tree-foundation';

export type TreeSide = 'left' | 'right';
export type TitleInkLayout = { element: HTMLElement; rect: Rect };
export type BranchLayout = {
  element: HTMLElement;
  side: TreeSide;
  depth: number;
  rect: Rect;
  scalePixels: Array<{
    element: HTMLElement;
    point: Point;
    phase: number;
    normalizedY: number;
    seed: number;
  }>;
};

export const STATIC_TERRAIN_LAYERS: readonly TerrainLayerDefinition[] = [
  {
    key: 'haze', color: '205 195 230', alpha: 0.64, baseline: 1.004,
    components: [[0.02, 0.18, 0.2], [0.26, 0.13, 0.09], [0.48, 0.15, 0.07], [0.73, 0.21, 0.055]],
  },
  {
    key: 'mist', color: '185 173 222', alpha: 0.7, baseline: 1.01,
    components: [[0.08, 0.145, 0.15], [0.3, 0.105, 0.065], [0.52, 0.12, 0.045], [0.75, 0.19, 0.032]],
  },
  {
    key: 'lavender', color: '155 143 214', alpha: 0.76, baseline: 1.015,
    components: [[0.1, 0.105, 0.22], [0.31, 0.07, 0.18], [0.49, 0.075, 0.16], [0.64, 0.06, 0.13]],
  },
  {
    key: 'periwinkle', color: '132 122 207', alpha: 0.82, baseline: 1.018,
    components: [[0.08, 0.09, 0.18], [0.28, 0.06, 0.17], [0.44, 0.06, 0.15], [0.59, 0.055, 0.14]],
  },
  {
    key: 'violet', color: '116 104 200', alpha: 0.86, baseline: 1.024,
    components: [[-0.03, 0.13, 0.15], [0.22, 0.055, 0.13], [0.38, 0.055, 0.14], [0.53, 0.05, 0.13]],
  },
  { key: 'posterior', color: '103 94 199', alpha: 0.9, baseline: PROBABILITY_BASELINE, components: [] },
  {
    key: 'navy', color: '15 31 105', alpha: 0.94, baseline: 1.015,
    components: [[-0.015, 0.145, 0.195], [0.11, 0.08, 0.035]],
  },
  {
    key: 'ridge', color: '92 84 172', alpha: 0.9, baseline: 1.018,
    components: [[0.71, 0.08, 0.152], [0.78, 0.07, 0.1]],
  },
  {
    key: 'foundation', color: '58 52 138', alpha: 0.92, baseline: 1.02,
    components: [[1.04, 0.14, 0.188], [0.93, 0.09, 0.062], [0.86, 0.085, 0.072]],
  },
] as const;

const TREE_FOUNDATION_COMPONENTS: readonly DensityComponent[] = [
  [0.89, 0.095, 0.09],
  [1.04, 0.16, 0.055],
  [0.78, 0.09, 0.018],
];

export const terrainLayerForProfile = (
  layer: TerrainLayerDefinition,
  profile: TerrainProfile = 'default',
): TerrainLayerDefinition => {
  if (profile !== 'tree-foundation' || layer.key !== 'foundation') return layer;
  return { ...layer, components: TREE_FOUNDATION_COMPONENTS };
};

export const DYNAMIC_GAUSSIANS = [
  { key: 'lavender', sigma: 0.145, amplitudeFactor: 0.22, baseline: 1.015 },
  { key: 'periwinkle', sigma: 0.105, amplitudeFactor: 0.45, baseline: 1.018 },
  { key: 'violet', sigma: 0.115, amplitudeFactor: 0.28, baseline: 1.024 },
  { key: 'posterior', sigma: 0.078, amplitudeFactor: 1, baseline: PROBABILITY_BASELINE },
] as const;

export const TERRAIN_ECHOES = Array.from({ length: 11 }, (_, zeroIndex) => {
  const index = zeroIndex + 1;
  return {
    index,
    meanOffset: index * 0.009,
    sigma: 0.078 + index * 0.003,
    amplitudeFactor: 1 - index * 0.052,
    baseline: PROBABILITY_BASELINE + index * 0.0008,
    alpha: 0.46 - index * 0.024,
  };
});

const TERRAIN_LAYER_DEPTH: Record<TerrainLayerDefinition['key'], number> = {
  haze: 0.42,
  mist: 0.54,
  lavender: 0.72,
  periwinkle: 0.82,
  violet: 0.9,
  posterior: 1,
  navy: 0.38,
  ridge: 0.7,
  foundation: 0.4,
};

const TERRAIN_LAYER_PHASE: Record<TerrainLayerDefinition['key'], number> = {
  haze: 0.25,
  mist: 0.92,
  lavender: 1.48,
  periwinkle: 2.12,
  violet: 2.76,
  posterior: 3.34,
  navy: 3.9,
  ridge: 4.18,
  foundation: 4.46,
};

export const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));

export const TREE_FLIP_PALETTE = [
  'rgb(55 47 142)',
  'rgb(103 82 200)',
  'rgb(172 158 230)',
] as const;

export const TREE_FLIP_TRAVEL_DURATION = 9_200;
const TREE_FLIP_SECONDARY_PHASE = 0.53;
const TREE_FLIP_TRAVEL_RANGE = 1.2;
const TREE_FLIP_START_Y = 1.08;
const TREE_FLIP_JITTER = 0.07;
const TREE_FLIP_WAVE_RADIUS = 0.115;

export type TreeFlipSample = {
  cycleIndex: number;
  primaryWave: number;
  secondaryWave: number;
  jitteredY: number;
  flip: number;
  accent: (typeof TREE_FLIP_PALETTE)[number];
};

export const treeFlipSample = (
  normalizedY: number,
  seed: number,
  timestamp: number,
): TreeFlipSample => {
  const normalizedSeed = clamp(seed, 0, 1);
  const cycle = Math.max(0, timestamp) / TREE_FLIP_TRAVEL_DURATION;
  const cycleIndex = Math.floor(cycle);
  const primaryWave = TREE_FLIP_START_Y - (cycle % 1) * TREE_FLIP_TRAVEL_RANGE;
  const secondaryCycle = cycle + TREE_FLIP_SECONDARY_PHASE;
  const secondaryWave = TREE_FLIP_START_Y - (secondaryCycle % 1) * TREE_FLIP_TRAVEL_RANGE;
  const jitteredY = clamp(normalizedY, 0, 1) + (normalizedSeed - 0.5) * TREE_FLIP_JITTER;
  const waveDistance = Math.min(
    Math.abs(jitteredY - primaryWave),
    Math.abs(jitteredY - secondaryWave),
  );
  const wave = clamp(1 - waveDistance / TREE_FLIP_WAVE_RADIUS, 0, 1);
  const easedWave = wave * wave * (3 - 2 * wave);
  const randomGate = Math.abs(Math.sin(normalizedSeed * 91.73));
  const randomWeight = randomGate > 0.28 ? 0.76 + randomGate * 0.24 : 0.18;

  return {
    cycleIndex,
    primaryWave,
    secondaryWave,
    jitteredY,
    flip: clamp(easedWave * randomWeight, 0, 1),
    accent: TREE_FLIP_PALETTE[
      Math.floor(normalizedSeed * TREE_FLIP_PALETTE.length) % TREE_FLIP_PALETTE.length
    ],
  };
};

export const gaussianDensity = (x: number, mean: number, sigma: number) => {
  const normalized = (x - mean) / Math.max(sigma, 0.0001);
  return Math.exp(-0.5 * normalized * normalized);
};

export const posteriorForPointer = (pointerX: number, pointerY: number, width: number, height: number) => {
  const normalizedX = clamp(pointerX / Math.max(width, 1), 0, 1);
  const normalizedY = clamp(pointerY / Math.max(height, 1), 0, 1);
  const horizontalBias = normalizedX * 2 - 1;
  const verticalBias = clamp((POINTER_NEUTRAL_Y - normalizedY) / POINTER_NEUTRAL_Y, -1, 1);
  const responsiveMaximumAmplitude = width < 360 ? NARROW_POSTERIOR_AMPLITUDE : MAX_POSTERIOR_AMPLITUDE;
  const restingAmplitude = width < 360 ? NARROW_POSTERIOR_AMPLITUDE : BASE_POSTERIOR_AMPLITUDE;
  return {
    mean: clamp(BASE_POSTERIOR_MEAN + horizontalBias * POINTER_MEAN_SHIFT, 0, 1),
    amplitude: clamp(
      restingAmplitude + verticalBias * POINTER_AMPLITUDE_WIGGLE,
      MIN_POSTERIOR_AMPLITUDE,
      responsiveMaximumAmplitude,
    ),
  };
};

export const terrainComponentsForState = (
  layer: TerrainLayerDefinition,
  mean: number,
  amplitude: number,
  restingAmplitude = BASE_POSTERIOR_AMPLITUDE,
) => {
  const horizontalBias = clamp((mean - BASE_POSTERIOR_MEAN) / POINTER_MEAN_SHIFT, -1, 1);
  const verticalBias = clamp((amplitude - restingAmplitude) / POINTER_AMPLITUDE_WIGGLE, -1, 1);
  const horizontalStrength = Math.abs(horizontalBias);
  const pointerFocus = 0.5 + horizontalBias * 0.5;
  const depth = TERRAIN_LAYER_DEPTH[layer.key];
  const phase = TERRAIN_LAYER_PHASE[layer.key];

  const components: DensityComponent[] = layer.components.map(([componentMean, sigma, peak], index) => {
    const proximity = gaussianDensity(componentMean, pointerFocus, 0.22);
    const wave = Math.sin(phase + index * 0.83 + pointerFocus * Math.PI * 1.7);
    const peakScale = clamp(
      1
        + depth * horizontalStrength * ((proximity - 0.32) * 0.14 + wave * 0.035)
        + depth * verticalBias * (0.024 + proximity * 0.038),
      0.82,
      1.18,
    );
    const localMeanShift = (
      (pointerFocus - componentMean)
      * depth
      * horizontalStrength
      * proximity
      * 0.012
    );
    const sigmaScale = clamp(
      1 + depth * horizontalStrength * (0.026 - proximity * 0.045) - depth * verticalBias * proximity * 0.018,
      0.92,
      1.08,
    );
    return [componentMean + localMeanShift, sigma * sigmaScale, peak * peakScale] as const;
  });

  const dynamic = DYNAMIC_GAUSSIANS.find((definition) => definition.key === layer.key);
  if (dynamic) {
    const meanResponse = layer.key === 'posterior' ? 0.78 : 0.34 + depth * 0.12;
    const peakWave = Math.sin(phase + pointerFocus * Math.PI * 1.8);
    const dynamicMean = (
      BASE_POSTERIOR_MEAN
      + (mean - BASE_POSTERIOR_MEAN) * meanResponse
      + horizontalBias * Math.sin(phase) * depth * 0.0025
    );
    const dynamicSigma = dynamic.sigma * clamp(
      1 + depth * horizontalStrength * peakWave * 0.05 - depth * verticalBias * 0.025,
      0.92,
      1.08,
    );
    const dynamicAmplitude = amplitude * dynamic.amplitudeFactor * clamp(
      1 + depth * horizontalStrength * peakWave * 0.075 + depth * verticalBias * 0.035,
      0.86,
      1.14,
    );
    components.push([dynamicMean, dynamicSigma, dynamicAmplitude]);
  }

  return components;
};

const hashUnit = (x: number, seed: number) => {
  let value = Math.imul(x + seed, 374761393) + Math.imul(seed * 3, 668265263);
  value = (value ^ (value >>> 13)) * 1274126177;
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
};

export const buildDensityPolygon = (
  width: number,
  pixelUnit: number,
  baseline: number,
  components: readonly DensityComponent[],
  layerSeed: number,
) => {
  const columns = Math.max(1, Math.ceil(width / pixelUnit));
  const points = ['0% 100%'];
  for (let column = 0; column <= columns; column += 1) {
    const normalizedX = column / columns;
    const density = components.reduce(
      (sum, [componentMean, sigma, peak]) => sum + gaussianDensity(normalizedX, componentMean, sigma) * peak,
      0,
    );
    const irregularity = (hashUnit(column, layerSeed + 2601) - 0.5) * 0.003;
    const y = clamp(baseline - density - irregularity, -0.12, 1.08) * 100;
    const x = normalizedX * 100;
    const nextX = Math.min(100, ((column + 1) / columns) * 100);
    points.push(`${x.toFixed(4)}% ${y.toFixed(4)}%`, `${nextX.toFixed(4)}% ${y.toFixed(4)}%`);
  }
  points.push('100% 100%');
  return `polygon(${points.join(',')})`;
};

export const buildDensityBandPolygon = (
  width: number,
  pixelUnit: number,
  baseline: number,
  component: DensityComponent,
  thickness = 0.0045,
) => {
  const [mean, sigma, amplitude] = component;
  const start = Math.max(0, mean - sigma * 3.2);
  const end = Math.min(1, mean + sigma * 3.2);
  const columns = Math.max(18, Math.ceil(((end - start) * width) / pixelUnit));
  const upper: string[] = [];
  const lower: string[] = [];
  for (let column = 0; column <= columns; column += 1) {
    const progress = column / columns;
    const normalizedX = start + (end - start) * progress;
    const density = gaussianDensity(normalizedX, mean, sigma) * amplitude;
    const y = clamp(baseline - density, -0.12, 1.08);
    upper.push(`${(normalizedX * 100).toFixed(4)}% ${(y * 100).toFixed(4)}%`);
    lower.unshift(`${(normalizedX * 100).toFixed(4)}% ${(Math.min(1.08, y + thickness) * 100).toFixed(4)}%`);
  }
  return `polygon(${upper.concat(lower).join(',')})`;
};

export const echoComponentForState = (
  definition: (typeof TERRAIN_ECHOES)[number],
  mean: number,
  amplitude: number,
  restingAmplitude = BASE_POSTERIOR_AMPLITUDE,
): DensityComponent => {
  const horizontalBias = clamp((mean - BASE_POSTERIOR_MEAN) / POINTER_MEAN_SHIFT, -1, 1);
  const verticalBias = clamp((amplitude - restingAmplitude) / POINTER_AMPLITUDE_WIGGLE, -1, 1);
  const response = 0.38 + definition.index * 0.018;
  const wave = Math.sin(definition.index * 0.57 + horizontalBias * 1.4);
  return [
    BASE_POSTERIOR_MEAN + definition.meanOffset + (mean - BASE_POSTERIOR_MEAN) * response,
    definition.sigma * clamp(1 + Math.abs(horizontalBias) * wave * 0.045 - verticalBias * 0.018, 0.93, 1.07),
    amplitude * definition.amplitudeFactor * clamp(1 + horizontalBias * wave * 0.055 + verticalBias * 0.025, 0.9, 1.1),
  ];
};

export const dampedSpring = (
  value: number,
  velocity: number,
  target: number,
  delta: number,
  stiffness: number,
  damping: number,
) => {
  const nextVelocity = (velocity + (target - value) * stiffness * delta) * Math.exp(-damping * delta);
  return { value: value + nextVelocity * delta, velocity: nextVelocity };
};

export const distanceToRect = (point: Point, rect: Rect) => {
  const deltaX = Math.max(rect.left - point.x, 0, point.x - rect.right);
  const deltaY = Math.max(rect.top - point.y, 0, point.y - rect.bottom);
  return Math.hypot(deltaX, deltaY);
};

export const treePointerNear = (point: Point, rect: Rect, viewportWidth: number) => (
  distanceToRect(point, rect) <= clamp(viewportWidth * 0.04, 36, 72)
);

export const titleSheenStrength = (distance: number, radius: number) => {
  const proximity = clamp(1 - distance / Math.max(radius * 0.72, 1), 0, 1);
  return proximity * proximity * (3 - 2 * proximity);
};

export const mosaicRippleSample = (
  distance: number,
  radius: number,
  timeSeconds: number,
  phase: number,
  depth: number,
) => {
  const linearProximity = 1 - clamp(distance / Math.max(radius, 1), 0, 1);
  const proximity = linearProximity * linearProximity * (3 - 2 * linearProximity);
  if (proximity <= 0) return { proximity: 0, scale: 1, lift: 0 };

  const pulse = (
    Math.sin(timeSeconds * 8.8 - distance * 0.13 + phase) * 0.72
    + Math.sin(timeSeconds * 5.2 - distance * 0.071 + phase * 0.61) * 0.28
  );
  const response = proximity * clamp(depth, 0, 1);
  return {
    proximity,
    scale: clamp(1 + pulse * response * 0.16, 0.84, 1.16),
    lift: response * (0.18 + (pulse + 1) * 0.58),
  };
};

export const treeInteractionGeometry = (
  viewportWidth: number,
  mode: 'direct' | 'wide' | 'calm' = 'wide',
) => {
  if (mode === 'calm') {
    const rippleRadius = clamp(viewportWidth * 0.052, 54, 94);
    return {
      rippleRadius,
      branchReach: clamp(rippleRadius + 42, 96, 142),
    };
  }
  if (mode === 'direct') {
    return {
      rippleRadius: clamp(viewportWidth * 0.075, 68, 118),
      branchReach: clamp(viewportWidth * 0.105, 72, 156),
    };
  }
  const rippleRadius = clamp(viewportWidth * 0.285, 180, 380);
  return {
    rippleRadius,
    branchReach: clamp(rippleRadius + 84, 244, 480),
  };
};
