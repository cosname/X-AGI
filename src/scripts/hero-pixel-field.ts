export const PROBABILITY_BASELINE = 1.002;
const MIN_POSTERIOR_AMPLITUDE = 0.12;
const MAX_POSTERIOR_AMPLITUDE = 0.265;
export const BASE_POSTERIOR_AMPLITUDE = 0.25;
const NARROW_POSTERIOR_AMPLITUDE = 0.185;
export const BASE_POSTERIOR_MEAN = 0.675;
const POINTER_MEAN_SHIFT = 0.028;
const POINTER_AMPLITUDE_WIGGLE = 0.018;
const POINTER_NEUTRAL_Y = 0.62;
const HERO_TREE_HEIGHT = 980;
const HERO_TREE_RIGHT_WIDTH = 743;
const CANOPY_MAX_WIDTH = 820;
const TERRAIN_COLUMNS = 128;

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

type TreeSide = 'left' | 'right';
type TitleInkLayout = { element: HTMLElement; rect: Rect };
type BranchLayout = {
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

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));

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

const dampedSpring = (
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

const distanceToRect = (point: Point, rect: Rect) => {
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

export const initializeHeroPixelFields = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  document.querySelectorAll<HTMLElement>('[data-hero-pixel-field]').forEach((field) => {
    if (field.dataset.initialized === 'true') return;
    field.dataset.initialized = 'true';

    const stage = field.closest<HTMLElement>('[data-connection-stage]') ?? field;
    const veil = field.querySelector<HTMLElement>('[data-hero-sanctuary]');
    const terrainEnabled = field.dataset.terrainEnabled !== 'false';
    const terrainProfile: TerrainProfile = field.dataset.terrainProfile === 'tree-foundation'
      ? 'tree-foundation'
      : 'default';
    const treeMotionEnabled = field.dataset.treeInteraction !== 'none';
    const treeInteractionMode = field.dataset.treeInteraction === 'wide'
      ? 'wide'
      : field.dataset.treeInteraction === 'calm'
        ? 'calm'
        : 'direct';
    const treePositions: Record<TreeSide, HTMLElement | null> = {
      left: field.querySelector<HTMLElement>('[data-tree-position="left"]'),
      right: field.querySelector<HTMLElement>('[data-tree-position="right"]'),
    };
    const branchElements = Array.from(field.querySelectorAll<HTMLElement>('[data-tree-branch]'));
    const titleInk = stage.querySelector<HTMLElement>('[data-title-ink]');
    const titleInkSurfaces = titleInk
      ? Array.from(titleInk.querySelectorAll<HTMLElement>('[data-title-ink-surface]'))
      : [];
    const terrainSurfaces = Array.from(field.querySelectorAll<HTMLElement>('[data-terrain-surface]'));
    const treeTerrainOcclusions = {
      navy: field.querySelector<HTMLElement>('[data-terrain-occlusion="navy"]'),
      foundation: field.querySelector<HTMLElement>('[data-terrain-occlusion="foundation"]'),
    };
    const echoSurfaces = Array.from(field.querySelectorAll<HTMLElement>('[data-echo]'));
    const abortController = new AbortController();
    const { signal } = abortController;

    let width = 1;
    let height = 1;
    let fieldOrigin: Point = { x: 0, y: 0 };
    let mean = BASE_POSTERIOR_MEAN;
    let amplitude = BASE_POSTERIOR_AMPLITUDE;
    let meanVelocity = 0;
    let amplitudeVelocity = 0;
    let pointer: Point = { x: 0, y: 0 };
    let pointerDirty = false;
    let branchLayouts: BranchLayout[] = [];
    let rightTreeRect: Rect | null = null;
    let titleRect: Rect | null = null;
    let titleInkLayouts: TitleInkLayout[] = [];
    let titleInkStrength = 0;
    let activeScalePixels = new Set<HTMLElement>();
    const scalePixelEntryTimes = new WeakMap<HTMLElement, number>();
    let active = false;
    let visible = true;
    let pointerFrame = 0;
    let treePulseFrame = 0;
    let treePulsePaintTimestamp = 0;
    let treePulseStartTimestamp = 0;
    let treePauseRequested = false;
    let treePulsePaused = false;
    let activeTreeFlipPixels = new Set<HTMLElement>();
    let springFrame = 0;
    let resizeFrame = 0;
    let originFrame = 0;
    let scaleCleanupTimer = 0;
    let lastTimestamp = 0;
    let lastShapeKey = '';
    const motionEnabled = () => !prefersReducedMotion.matches && finePointer.matches;
    const growthMotionEnabled = () => !prefersReducedMotion.matches;
    const baseAmplitude = () => width < 360 ? NARROW_POSTERIOR_AMPLITUDE : BASE_POSTERIOR_AMPLITUDE;
    const terrainPixelUnit = () => width < 720 ? 4 : 5;
    const terrainShapeUnit = () => Math.max(terrainPixelUnit(), width / TERRAIN_COLUMNS);
    const snapDevicePixel = (value: number) => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      return Math.round(value * ratio) / ratio;
    };

    const applyTerrainShape = (force = false) => {
      const snappedMean = snapDevicePixel(mean * width) / width;
      const snappedAmplitude = snapDevicePixel(amplitude * height) / height;
      const shapeKey = [
        Math.round(width),
        Math.round(height),
        snappedMean.toFixed(5),
        snappedAmplitude.toFixed(5),
      ].join(':');
      if (!force && shapeKey === lastShapeKey) return;
      lastShapeKey = shapeKey;

      const restingAmplitude = baseAmplitude();
      const shapeUnit = terrainShapeUnit();
      terrainSurfaces.forEach((surface, index) => {
        const key = surface.dataset.terrainSurface as TerrainLayerDefinition['key'];
        const sourceDefinition = STATIC_TERRAIN_LAYERS.find((layer) => layer.key === key);
        if (!sourceDefinition) return;
        const definition = terrainLayerForProfile(sourceDefinition, terrainProfile);
        const components = terrainComponentsForState(definition, snappedMean, snappedAmplitude, restingAmplitude);
        const terrainPath = buildDensityPolygon(width, shapeUnit, definition.baseline, components, index + 1);
        surface.style.setProperty('--terrain-path', terrainPath);
        if (key === 'navy' || key === 'foundation') {
          treeTerrainOcclusions[key]?.style.setProperty('--terrain-path', terrainPath);
        }
      });

      echoSurfaces.forEach((surface) => {
        const definition = TERRAIN_ECHOES[Number(surface.dataset.echo) - 1];
        if (!definition) return;
        const component = echoComponentForState(definition, snappedMean, snappedAmplitude, restingAmplitude);
        surface.style.setProperty(
          '--terrain-path',
          buildDensityBandPolygon(width, Math.max(shapeUnit, width / 84), definition.baseline, component),
        );
      });

      const horizontalBias = clamp((snappedMean - BASE_POSTERIOR_MEAN) / POINTER_MEAN_SHIFT, -1, 1);
      const verticalBias = clamp((snappedAmplitude - restingAmplitude) / POINTER_AMPLITUDE_WIGGLE, -1, 1);
      field.dataset.terrainBiasX = horizontalBias.toFixed(4);
      field.dataset.terrainBiasY = verticalBias.toFixed(4);
    };

    const commit = (nextMean: number, nextAmplitude: number, force = false) => {
      mean = clamp(nextMean, -0.05, 1.05);
      amplitude = clamp(
        nextAmplitude,
        MIN_POSTERIOR_AMPLITUDE,
        width < 360 ? NARROW_POSTERIOR_AMPLITUDE : MAX_POSTERIOR_AMPLITUDE,
      );
      applyTerrainShape(force);
      field.dataset.posteriorMean = mean.toFixed(4);
      field.dataset.posteriorAmplitude = amplitude.toFixed(4);
    };

    const scheduleScaleCleanup = () => {
      if (scaleCleanupTimer) window.clearTimeout(scaleCleanupTimer);
      scaleCleanupTimer = window.setTimeout(() => {
        scaleCleanupTimer = 0;
        branchLayouts.forEach(({ scalePixels }) => {
          scalePixels.forEach(({ element }) => {
            if (element.dataset.scaleActive !== 'settling') return;
            element.removeAttribute('data-scale-active');
            element.style.removeProperty('transform');
          });
        });
      }, 180);
    };

    const settleScalePixel = (element: HTMLElement) => {
      scalePixelEntryTimes.delete(element);
      element.dataset.scaleActive = 'settling';
      element.style.transform = 'translate3d(0,0,0) scale(1)';
    };

    const resetBranches = () => {
      branchLayouts.forEach(({ element }) => {
        element.style.removeProperty('transform');
        element.dataset.nearby = 'false';
      });
      activeScalePixels.forEach(settleScalePixel);
      if (activeScalePixels.size > 0) scheduleScaleCleanup();
      activeScalePixels = new Set();
      field.dataset.activeScalePixels = '0';
    };

    const clearTreePulseStyles = () => {
      branchLayouts.forEach(({ side, scalePixels }) => {
        if (side !== 'right') return;
        scalePixels.forEach(({ element }) => {
          if (!element.classList.contains('hp--growth-scale')) return;
          element.style.removeProperty('--tree-flip');
          element.style.removeProperty('--tree-flip-angle');
          element.style.removeProperty('--tree-flip-accent');
          element.removeAttribute('data-tree-flip-active');
        });
      });
      activeTreeFlipPixels = new Set();
      field.dataset.treePulse = '0';
      field.dataset.treeActiveFlips = '0';
    };

    const stopTreePulse = ({ clear = false } = {}) => {
      if (treePulseFrame) window.cancelAnimationFrame(treePulseFrame);
      treePulseFrame = 0;
      treePulsePaintTimestamp = 0;
      treePulseStartTimestamp = 0;
      if (clear) clearTreePulseStyles();
    };

    const treePulseTick = (timestamp: number) => {
      treePulseFrame = 0;
      if (
        treeInteractionMode !== 'calm'
        || !growthMotionEnabled()
        || !visible
        || document.hidden
      ) {
        treePauseRequested = false;
        treePulsePaused = false;
        field.dataset.treePulsePaused = 'false';
        stopTreePulse({ clear: true });
        return;
      }

      if (!treePulseStartTimestamp) treePulseStartTimestamp = timestamp;
      const elapsed = timestamp - treePulseStartTimestamp;

      if (!treePulsePaintTimestamp || timestamp - treePulsePaintTimestamp >= 42) {
        treePulsePaintTimestamp = timestamp;
        let maximumFlip = 0;
        const nextActiveTreeFlipPixels = new Set<HTMLElement>();

        branchLayouts.forEach(({ side, scalePixels }) => {
          if (side !== 'right') return;
          scalePixels.forEach(({ element, normalizedY, seed }) => {
            if (!element.classList.contains('hp--growth-scale')) return;
            const wasActive = activeTreeFlipPixels.has(element);
            if (treePauseRequested && !wasActive) return;

            const sample = treeFlipSample(normalizedY, seed, elapsed);
            const { flip } = sample;

            if (flip < 0.025) {
              if (wasActive) {
                element.removeAttribute('data-tree-flip-active');
                element.style.removeProperty('--tree-flip');
                element.style.removeProperty('--tree-flip-angle');
              }
              return;
            }

            const flipToken = flip.toFixed(3);
            const angleToken = `${(-flip * 168).toFixed(2)}deg`;
            if (element.dataset.treeFlipActive !== 'true') {
              element.dataset.treeFlipActive = 'true';
            }
            if (element.style.getPropertyValue('--tree-flip') !== flipToken) {
              element.style.setProperty('--tree-flip', flipToken);
            }
            if (element.style.getPropertyValue('--tree-flip-angle') !== angleToken) {
              element.style.setProperty('--tree-flip-angle', angleToken);
            }
            if (!element.style.getPropertyValue('--tree-flip-accent')) {
              element.style.setProperty('--tree-flip-accent', sample.accent);
            }
            nextActiveTreeFlipPixels.add(element);
            maximumFlip = Math.max(maximumFlip, flip);
          });
        });

        activeTreeFlipPixels.forEach((element) => {
          if (nextActiveTreeFlipPixels.has(element)) return;
          element.removeAttribute('data-tree-flip-active');
          element.style.removeProperty('--tree-flip');
          element.style.removeProperty('--tree-flip-angle');
        });
        activeTreeFlipPixels = nextActiveTreeFlipPixels;

        field.dataset.treePulse = maximumFlip.toFixed(3);
        field.dataset.treeActiveFlips = `${activeTreeFlipPixels.size}`;
        if (treePauseRequested && activeTreeFlipPixels.size === 0) {
          treePulsePaused = true;
          field.dataset.treePulsePaused = 'true';
          stopTreePulse({ clear: true });
          return;
        }
      }
      treePulseFrame = window.requestAnimationFrame(treePulseTick);
    };

    const scheduleTreePulse = () => {
      if (
        treePulseFrame
        || treePulsePaused
        || treeInteractionMode !== 'calm'
        || !growthMotionEnabled()
        || !visible
        || document.hidden
      ) return;
      field.dataset.treePulsePaused = 'false';
      treePulseFrame = window.requestAnimationFrame(treePulseTick);
    };

    const syncTreePulseForPointer = () => {
      const shouldPause = Boolean(
        active
        && finePointer.matches
        && rightTreeRect
        && treePointerNear(pointer, rightTreeRect, width),
      );
      field.dataset.treePointerNearby = shouldPause ? 'true' : 'false';
      if (shouldPause === treePauseRequested) return;
      treePauseRequested = shouldPause;
      if (!shouldPause && treePulsePaused) {
        treePulsePaused = false;
        field.dataset.treePulsePaused = 'false';
        scheduleTreePulse();
      }
    };

    const applyBranchMotion = (timestamp: number) => {
      const { branchReach, rippleRadius } = treeInteractionGeometry(width, treeInteractionMode);
      const nextActiveScalePixels = new Set<HTMLElement>();
      let maximumPixelProximity = 0;
      branchLayouts.forEach((layout) => {
        const branchProximity = 1 - clamp(distanceToRect(pointer, layout.rect) / branchReach, 0, 1);
        if (branchProximity < 0.01) {
          layout.element.dataset.nearby = 'false';
          return;
        }

        let branchActivePixels = 0;
        const sideDirection = layout.side === 'left' ? 1 : -1;
        layout.scalePixels.forEach((scalePixel) => {
          const deltaX = scalePixel.point.x - pointer.x;
          const deltaY = scalePixel.point.y - pointer.y;
          const distance = Math.hypot(deltaX, deltaY);
          if (distance >= rippleRadius) return;
          const rawScaleDepth = layout.depth <= 0.15 ? 0.18 : 0.55 + layout.depth * 0.45;
          const scaleDepth = treeInteractionMode === 'calm' ? rawScaleDepth * 0.42 : rawScaleDepth;
          const sample = mosaicRippleSample(
            distance,
            rippleRadius,
            timestamp * (treeInteractionMode === 'calm' ? 0.00072 : 0.001),
            scalePixel.phase,
            scaleDepth,
          );
          if (sample.proximity < 0.01) return;

          if (!activeScalePixels.has(scalePixel.element)) {
            scalePixelEntryTimes.set(scalePixel.element, timestamp);
          }
          const entryTime = scalePixelEntryTimes.get(scalePixel.element) ?? timestamp;
          const entryProgress = clamp((timestamp - entryTime) / 110, 0, 1);
          const directionX = distance > 1 ? deltaX / distance : sideDirection;
          const directionY = distance > 1 ? deltaY / distance : -0.35;
          const shiftX = snapDevicePixel(directionX * sample.lift * entryProgress);
          const shiftY = snapDevicePixel(directionY * sample.lift * entryProgress);
          const scale = 1 + (sample.scale - 1) * entryProgress;
          if (scalePixel.element.dataset.scaleActive !== 'true') {
            scalePixel.element.dataset.scaleActive = 'true';
          }
          const transform = `translate3d(${shiftX}px,${shiftY}px,0) scale(${scale.toFixed(3)})`;
          if (scalePixel.element.style.transform !== transform) {
            scalePixel.element.style.transform = transform;
          }
          nextActiveScalePixels.add(scalePixel.element);
          branchActivePixels += 1;
          maximumPixelProximity = Math.max(maximumPixelProximity, sample.proximity);
        });
        const nearby = branchActivePixels > 0 ? 'true' : 'false';
        if (layout.element.dataset.nearby !== nearby) layout.element.dataset.nearby = nearby;
      });

      let startedSettling = false;
      activeScalePixels.forEach((element) => {
        if (nextActiveScalePixels.has(element)) return;
        settleScalePixel(element);
        startedSettling = true;
      });
      if (startedSettling) scheduleScaleCleanup();
      activeScalePixels = nextActiveScalePixels;
      field.dataset.activeScalePixels = `${activeScalePixels.size}`;
      return maximumPixelProximity >= 0.01;
    };

    const titleGlowRadius = () => clamp(width * 0.058, 58, 92);

    const clearTitleInk = () => {
      if (titleInkStrength === 0) return;
      titleInkLayouts.forEach(({ element }) => {
        element.style.setProperty('--title-glow-r', '0px');
        element.style.setProperty('--title-glow-strength', '0');
      });
      titleInkStrength = 0;
    };

    const applyTitleInk = () => {
      if (!titleInk || titleInkLayouts.length === 0 || !titleRect || !motionEnabled() || !active) {
        clearTitleInk();
        return;
      }
      const radius = titleGlowRadius();
      const strength = titleSheenStrength(distanceToRect(pointer, titleRect), radius);
      if (strength <= 0) {
        clearTitleInk();
        return;
      }
      const strengthToken = (strength * 0.92).toFixed(3);
      titleInkLayouts.forEach(({ element, rect }) => {
        element.style.setProperty('--title-mx', `${snapDevicePixel(pointer.x - rect.left)}px`);
        element.style.setProperty('--title-my', `${snapDevicePixel(pointer.y - rect.top)}px`);
        element.style.setProperty('--title-glow-r', `${radius}px`);
        element.style.setProperty('--title-glow-strength', strengthToken);
      });
      titleInkStrength = strength;
    };

    const configureGeometry = () => {
      field.style.setProperty('--terrain-pixel-unit', `${terrainPixelUnit()}px`);
      lastShapeKey = '';
      if (terrainEnabled) commit(mean, amplitude, true);
    };

    const collectBranchLayouts = (fieldBox: DOMRect) => {
      if (!treeMotionEnabled) {
        branchLayouts = [];
        rightTreeRect = null;
        return;
      }
      const positionBoxes: Record<TreeSide, DOMRect | null> = {
        left: treePositions.left?.getBoundingClientRect() ?? null,
        right: treePositions.right?.getBoundingClientRect() ?? null,
      };
      const rightTreeBox = treePositions.right
        ?.querySelector<HTMLElement>('.hero-pixel-field__tree-artboard')
        ?.getBoundingClientRect() ?? positionBoxes.right;
      rightTreeRect = rightTreeBox
        ? {
            left: rightTreeBox.left - fieldBox.left,
            top: rightTreeBox.top - fieldBox.top,
            right: rightTreeBox.right - fieldBox.left,
            bottom: rightTreeBox.bottom - fieldBox.top,
          }
        : null;
      branchLayouts = branchElements.flatMap((element) => {
        const side = element.dataset.branchSide as TreeSide;
        const positionBox = positionBoxes[side];
        if (!positionBox) return [];
        const sourceWidth = side === 'left' ? 744 : HERO_TREE_RIGHT_WIDTH;
        const scaleX = positionBox.width / sourceWidth;
        const scaleY = positionBox.height / HERO_TREE_HEIGHT;
        const sourceLeft = Number(element.dataset.branchLeft);
        const sourceTop = Number(element.dataset.branchTop);
        const sourceRight = Number(element.dataset.branchRight);
        const sourceBottom = Number(element.dataset.branchBottom);
        const anchorX = Number(element.dataset.branchAnchorX);
        const anchorY = Number(element.dataset.branchAnchorY);
        element.style.transformOrigin = `${(anchorX / sourceWidth * 100).toFixed(3)}% ${(anchorY / HERO_TREE_HEIGHT * 100).toFixed(3)}%`;
        return [{
          element,
          side,
          depth: Number(element.dataset.branchDepth),
          rect: {
            left: positionBox.left - fieldBox.left + sourceLeft * scaleX,
            top: positionBox.top - fieldBox.top + sourceTop * scaleY,
            right: positionBox.left - fieldBox.left + sourceRight * scaleX,
            bottom: positionBox.top - fieldBox.top + sourceBottom * scaleY,
          },
          scalePixels: Array.from(element.querySelectorAll<HTMLElement>('.hp--scale')).map((scalePixel) => {
            const sizeClass = Array.from(scalePixel.classList).find((className) => /^s\d+$/.test(className));
            const sourceSize = Number(sizeClass?.slice(1) ?? 0);
            const sourceHeight = Number(scalePixel.dataset.pixelSourceHeight ?? sourceSize);
            const sourceX = parseFloat(scalePixel.style.left) / 100 * sourceWidth + sourceSize / 2;
            const sourceY = parseFloat(scalePixel.style.top) / 100 * HERO_TREE_HEIGHT + sourceHeight / 2;
            const pixelBox = scalePixel.getBoundingClientRect();
            return {
              element: scalePixel,
              point: {
                x: pixelBox.left - fieldBox.left + pixelBox.width / 2,
                y: pixelBox.top - fieldBox.top + pixelBox.height / 2,
              },
              phase: Math.hypot(sourceX - anchorX, sourceY - anchorY) * 0.065
                + (side === 'left' ? 0.35 : 1.05),
              normalizedY: clamp(sourceY / HERO_TREE_HEIGHT, 0, 1),
              seed: Math.abs(Math.sin(sourceX * 12.9898 + sourceY * 78.233)) % 1,
            };
          }),
        }];
      });
    };

    const collectTitleRect = (fieldBox: DOMRect) => {
      if (!titleInk) {
        titleRect = null;
        titleInkLayouts = [];
        titleInkStrength = 0;
        return;
      }
      const box = titleInk.getBoundingClientRect();
      titleRect = {
        left: box.left - fieldBox.left,
        top: box.top - fieldBox.top,
        right: box.right - fieldBox.left,
        bottom: box.bottom - fieldBox.top,
      };
      titleInkLayouts = titleInkSurfaces.map((element) => {
        const surfaceBox = element.getBoundingClientRect();
        return {
          element,
          rect: {
            left: surfaceBox.left - fieldBox.left,
            top: surfaceBox.top - fieldBox.top,
            right: surfaceBox.right - fieldBox.left,
            bottom: surfaceBox.bottom - fieldBox.top,
          },
        };
      });
    };

    const collectLayout = () => {
      if (treeInteractionMode === 'calm') stopTreePulse({ clear: true });
      const fieldBox = field.getBoundingClientRect();
      const previousRestingAmplitude = baseAmplitude();
      width = Math.max(1, fieldBox.width);
      height = Math.max(1, fieldBox.height);
      fieldOrigin = { x: fieldBox.left, y: fieldBox.top };
      if (!active && previousRestingAmplitude !== baseAmplitude()) {
        amplitude = baseAmplitude();
        amplitudeVelocity = 0;
      }

      const copyRects: Rect[] = Array.from(stage.querySelectorAll<HTMLElement>('[data-connection-exclusion]')).map((element) => {
        const box = element.getBoundingClientRect();
        return {
          left: box.left - fieldBox.left,
          top: box.top - fieldBox.top,
          right: box.right - fieldBox.left,
          bottom: box.bottom - fieldBox.top,
        };
      });

      const canopy = width < CANOPY_MAX_WIDTH;
      field.dataset.composition = canopy ? 'canopy' : 'triptych';

      if (canopy) {
        if (veil) {
          veil.hidden = true;
          veil.removeAttribute('style');
        }
        treePositions.left?.style.removeProperty('left');
        treePositions.right?.style.removeProperty('left');
      } else if (veil && copyRects.length > 0) {
        const tablet = width < 1184;
        const paddingX = tablet ? 36 : 42;
        const paddingY = tablet ? 26 : 32;
        const sanctuary = {
          left: Math.max(0, Math.min(...copyRects.map((rect) => rect.left)) - paddingX),
          top: Math.max(0, Math.min(...copyRects.map((rect) => rect.top)) - paddingY),
          right: Math.min(width, Math.max(...copyRects.map((rect) => rect.right)) + paddingX),
          bottom: Math.min(height, Math.max(...copyRects.map((rect) => rect.bottom)) + paddingY),
        };
        veil.hidden = false;
        veil.style.left = `${sanctuary.left}px`;
        veil.style.top = `${sanctuary.top}px`;
        veil.style.width = `${sanctuary.right - sanctuary.left}px`;
        veil.style.height = `${sanctuary.bottom - sanctuary.top}px`;
        veil.style.borderRadius = tablet ? '54px' : '72px';

        if (treePositions.left) treePositions.left.style.left = '0px';
        if (treePositions.right) {
          treePositions.right.style.left = `${width - (HERO_TREE_RIGHT_WIDTH / HERO_TREE_HEIGHT) * height}px`;
        }
      }

      amplitude = clamp(
        amplitude,
        MIN_POSTERIOR_AMPLITUDE,
        width < 360 ? NARROW_POSTERIOR_AMPLITUDE : MAX_POSTERIOR_AMPLITUDE,
      );
      configureGeometry();
      collectBranchLayouts(fieldBox);
      syncTreePulseForPointer();
      collectTitleRect(fieldBox);
      resetBranches();
      field.dataset.ready = 'true';
      scheduleTreePulse();
    };

    const stopPointerFrame = () => {
      if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
    };

    const stopSpring = () => {
      if (springFrame) window.cancelAnimationFrame(springFrame);
      springFrame = 0;
      lastTimestamp = 0;
    };

    const pointerTick = (timestamp: number) => {
      pointerFrame = 0;
      if (!active || !visible || document.hidden || !motionEnabled()) return;
      if (pointerDirty) {
        if (terrainEnabled) {
          const next = posteriorForPointer(pointer.x, pointer.y, width, height);
          meanVelocity = 0;
          amplitudeVelocity = 0;
          commit(next.mean, next.amplitude);
        }
        pointerDirty = false;
      }
      const branchMoving = treeMotionEnabled && treeInteractionMode !== 'calm'
        ? applyBranchMotion(timestamp)
        : false;
      applyTitleInk();
      if (active && branchMoving) {
        pointerFrame = window.requestAnimationFrame(pointerTick);
      }
    };

    const schedulePointerFrame = () => {
      if (!pointerFrame) pointerFrame = window.requestAnimationFrame(pointerTick);
    };

    const springTick = (timestamp: number) => {
      if (!visible || document.hidden || !motionEnabled()) {
        stopSpring();
        return;
      }
      const delta = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 1000, 0.05) : 1 / 60;
      lastTimestamp = timestamp;
      const targetAmplitude = baseAmplitude();
      const meanSpring = dampedSpring(mean, meanVelocity, BASE_POSTERIOR_MEAN, delta, 38, 8.5);
      const amplitudeSpring = dampedSpring(amplitude, amplitudeVelocity, targetAmplitude, delta, 34, 8.2);
      meanVelocity = meanSpring.velocity;
      amplitudeVelocity = amplitudeSpring.velocity;
      commit(meanSpring.value, amplitudeSpring.value);

      const settled = (
        Math.abs(mean - BASE_POSTERIOR_MEAN) < 0.0004
        && Math.abs(amplitude - targetAmplitude) < 0.0004
        && Math.abs(meanVelocity) < 0.003
        && Math.abs(amplitudeVelocity) < 0.003
      );
      if (settled) {
        mean = BASE_POSTERIOR_MEAN;
        amplitude = targetAmplitude;
        commit(mean, amplitude, true);
        stopSpring();
        return;
      }
      springFrame = window.requestAnimationFrame(springTick);
    };

    const startSpring = () => {
      stopSpring();
      if (!terrainEnabled || !motionEnabled() || !visible || document.hidden) return;
      springFrame = window.requestAnimationFrame(springTick);
    };

    const deactivate = () => {
      if (!active) return;
      active = false;
      pointerDirty = false;
      syncTreePulseForPointer();
      stopPointerFrame();
      field.dataset.interaction = 'idle';
      if (treeInteractionMode !== 'calm') {
        resetBranches();
      }
      clearTitleInk();
      startSpring();
    };

    const updatePointer = (event: PointerEvent) => {
      if (!event.isPrimary || event.pointerType === 'touch' || !motionEnabled()) return;
      const events = event.getCoalescedEvents?.() ?? [];
      const latest = events[events.length - 1] ?? event;
      pointer = {
        x: clamp(latest.clientX - fieldOrigin.x, 0, width),
        y: clamp(latest.clientY - fieldOrigin.y, 0, height),
      };
      field.dataset.pointerX = pointer.x.toFixed(1);
      field.dataset.pointerY = pointer.y.toFixed(1);
      stopSpring();
      active = true;
      pointerDirty = true;
      syncTreePulseForPointer();
      field.dataset.interaction = 'pointer';
      schedulePointerFrame();
    };

    stage.addEventListener('pointermove', updatePointer, { passive: true, signal });
    stage.addEventListener('pointerleave', deactivate, { passive: true, signal });
    stage.addEventListener('pointercancel', deactivate, { passive: true, signal });
    window.addEventListener('blur', deactivate, { signal });

    const scheduleOriginRefresh = () => {
      if (originFrame) return;
      originFrame = window.requestAnimationFrame(() => {
        originFrame = 0;
        const bounds = field.getBoundingClientRect();
        fieldOrigin = { x: bounds.left, y: bounds.top };
      });
    };
    window.addEventListener('scroll', scheduleOriginRefresh, { passive: true, signal });

    const scheduleResize = () => {
      if (resizeFrame) return;
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        collectLayout();
      });
    };
    const resizeObserver = new ResizeObserver(scheduleResize);
    resizeObserver.observe(field);
    if (stage !== field) resizeObserver.observe(stage);
    stage.querySelectorAll<HTMLElement>('[data-connection-exclusion]').forEach((element) => resizeObserver.observe(element));
    document.fonts?.ready.then(scheduleResize).catch(() => undefined);

    const resetMotion = () => {
      active = false;
      pointerDirty = false;
      stopPointerFrame();
      stopSpring();
      mean = BASE_POSTERIOR_MEAN;
      amplitude = baseAmplitude();
      meanVelocity = 0;
      amplitudeVelocity = 0;
      clearTitleInk();
      if (terrainEnabled) commit(mean, amplitude, true);
      resetBranches();
      treePauseRequested = false;
      treePulsePaused = false;
      field.dataset.treePointerNearby = 'false';
      field.dataset.treePulsePaused = 'false';
      stopTreePulse({ clear: true });
      scheduleTreePulse();
      field.dataset.animated = motionEnabled() ? 'true' : 'false';
      field.dataset.interaction = 'idle';
    };

    const intersectionObserver = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      if (!visible) resetMotion();
      else scheduleTreePulse();
    }, { rootMargin: '180px' });
    intersectionObserver.observe(field);

    prefersReducedMotion.addEventListener('change', resetMotion, { signal });
    finePointer.addEventListener('change', resetMotion, { signal });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) resetMotion();
      else scheduleTreePulse();
    }, { signal });

    const destroy = () => {
      stopPointerFrame();
      stopSpring();
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      if (originFrame) window.cancelAnimationFrame(originFrame);
      if (scaleCleanupTimer) window.clearTimeout(scaleCleanupTimer);
      stopTreePulse({ clear: true });
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      abortController.abort();
      field.dataset.initialized = 'false';
    };
    document.addEventListener('astro:before-swap', destroy, { once: true, signal });

    field.dataset.renderMode = 'dom';
    field.dataset.animated = motionEnabled() ? 'true' : 'false';
    field.dataset.interaction = 'idle';
    scheduleResize();
  });
};
