import { sampleQilinGait, type QilinArticulation, type QilinIdle } from './qilin-character.ts';
import { HERO_TREE_HEIGHT, HERO_TREE_RIGHT_WIDTH, TREE_FLIP_TRAVEL_DURATION, treeWaveArrival } from './hero-pixel-field.ts';

export const QILIN_CYCLE_MS = TREE_FLIP_TRAVEL_DURATION * 2;
export type QilinSurface = 'hill' | 'branch';
export type QilinPoint = { x: number; y: number; scale: number };
// `lift` is the apex clearance above the higher end of a hop.
export type QilinStop = QilinPoint & {
  at: number; flight: number; lift: number; hidden?: boolean; surface?: QilinSurface; idle?: QilinIdle;
};
export type QilinPose = QilinPoint & QilinArticulation & {
  opacity: number;
  // How settled the animal is (0-1), for idles and pointer attention.
  resting: number;
  // Hill height below the feet while on or over the hills, for the shadow.
  ground?: number;
  landing?: { x: number; y: number; age: number; strength: number; surface: QilinSurface };
};
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const clamp01 = (p: number) => Math.max(0, Math.min(1, p));
const smooth = (p: number) => p * p * (3 - 2 * p);

// Contact points on the right tree artwork, in its 743 × 980 source pixels.
// Each is the top of a real branch, bud or blossom, listed from low to high.
export const QILIN_TREE_PERCHES = [
  { x: 528, y: 539 }, // trunk shoulder above the hills
  { x: 400, y: 449 }, // violet bud at the end of the left twig
  { x: 492, y: 363 }, // lavender blossom
  { x: 500, y: 205 }, // high twig below the canopy
] as const;

// A parabola through both ends whose apex clears the higher end by `clearance`.
export function hopHeight(from: number, to: number, clearance: number, progress: number) {
  const d = to - from;
  const k = from - (Math.min(from, to) - clearance);
  const b = 8 * d + 16 * k;
  const amplitude = (b + Math.sqrt(Math.max(0, b * b - 64 * d * d))) / 32;
  return from + d * progress - 4 * amplitude * progress * (1 - progress);
}

// The hills-only scene (phones, where the tree is hidden) plays the desktop
// choreography on a closed loop with no offscreen reset: a gallop, a long bound
// and a play bow out, a prance at the far end, then a quicker run back with a
// look around. Both ends leave room for the whole silhouette as it turns.
export function qilinHillStops(width: number, spriteWidth: number, hillY: (x: number) => number): QilinStop[] {
  const scale = 0.9;
  const span = spriteWidth * scale;
  const left = 18 + span * 0.25;
  const right = width - 18 - span * 0.75;
  const hill = (fraction: number, rest: Omit<QilinStop, 'x' | 'y' | 'scale'>): QilinStop => {
    const x = mix(left, right, fraction);
    return { x, y: hillY(x), scale, surface: 'hill', ...rest };
  };
  return [
    hill(0, { at: 0, flight: 0, lift: 0 }),
    hill(0.2, { at: 1300, flight: 520, lift: 12 }),
    hill(0.4, { at: 1850, flight: 460, lift: 12 }),
    hill(0.72, { at: 2900, flight: 920, lift: 34, idle: 'bow' }),
    hill(1, { at: 5100, flight: 800, lift: 22, idle: 'prance' }),
    hill(0.8, { at: 8600, flight: 600, lift: 16 }),
    hill(0.58, { at: 9200, flight: 520, lift: 14 }),
    hill(0.3, { at: 10400, flight: 880, lift: 30, idle: 'look' }),
    hill(0, { at: 13400, flight: 780, lift: 22 }),
  ];
}

export type TreeRouteLayout = {
  width: number;
  height: number;
  treeLeft: number;
  treeTop: number;
  treeWidth: number;
  treeHeight: number;
  spriteWidth: number;
  spriteHeight: number;
  headerBottom: number;
  copyRight: number;
  groundY: (x: number) => number;
};

// Perches that fit this layout, each landing as the tree wave passes its branch.
export function qilinTreeStops(layout: TreeRouteLayout): QilinStop[] {
  const { width, height, treeLeft, treeTop, treeWidth, treeHeight, spriteWidth, spriteHeight, headerBottom, copyRight, groundY } = layout;
  const fitting = QILIN_TREE_PERCHES.map((perch, index) => {
    const scale = 0.9 - index * 0.02;
    const span = spriteWidth * scale;
    const x = treeLeft + perch.x / HERO_TREE_RIGHT_WIDTH * treeWidth;
    const y = treeTop + perch.y / HERO_TREE_HEIGHT * treeHeight;
    const fits = x - span * 0.25 > copyRight + 16
      && x + span * 0.75 < width - 12
      && y - spriteHeight * scale > headerBottom + 12
      && y < Math.min(height - 16, groundY(x) - 12);
    return fits ? { x, y, scale, at: treeWaveArrival(perch.y / HERO_TREE_HEIGHT) } : undefined;
  }).filter((stop) => stop !== undefined);
  return fitting.map((stop, index) => {
    const gap = index ? stop.at - fitting[index - 1].at : Infinity;
    return {
      ...stop, surface: 'branch' as const, lift: 18,
      flight: index ? Math.min(760, gap - 220) : 900,
    };
  });
}

// Hills, tree and exit for the desktop scene. The route enters from the left
// edge, varies its tempo across the hills, climbs with the wave, rests at the
// top and leaps out to the right; the reset happens entirely out of view.
export function qilinSceneStops(layout: TreeRouteLayout, hillY: (x: number) => number): QilinStop[] | undefined {
  const perches = qilinTreeStops(layout);
  if (perches.length < 2) return undefined;
  const { width, spriteWidth } = layout;
  const hillScale = 0.78;
  const first = perches[0];
  const launch = Math.max(width * 0.3, first.x - Math.min(360, Math.max(200, width * 0.22)));
  const start = 18 + spriteWidth * hillScale * 0.25;
  const hill = (fraction: number, rest: Omit<QilinStop, 'x' | 'y' | 'scale'>): QilinStop => {
    const x = mix(start, launch, fraction);
    return { x, y: hillY(x), scale: hillScale, surface: 'hill', ...rest };
  };
  const entry = { x: -spriteWidth * 1.2, y: hillY(0), scale: hillScale, surface: 'hill' as const, lift: 0 };
  const crown = perches.at(-1)!;
  crown.idle = 'prance';
  return [
    { ...entry, at: 0, flight: 0 },
    // Two quick gallop hops, a long bound and a look around.
    hill(0, { at: 620, flight: 560, lift: 14 }),
    hill(0.16, { at: 1180, flight: 460, lift: 12 }),
    hill(0.45, { at: 2350, flight: 960, lift: 38, idle: 'look' }),
    // A quicker run to the tree, then a play bow before the big leap.
    hill(0.66, { at: 4800, flight: 800, lift: 24 }),
    hill(0.83, { at: 5550, flight: 600, lift: 16 }),
    hill(1, { at: 6300, flight: 620, lift: 16, idle: 'bow' }),
    ...perches.map((perch, index) => (index ? perch : { ...perch, lift: 34 })),
    { ...crown, idle: undefined, x: width + spriteWidth * 1.4, y: crown.y - 40, at: 15700, flight: 1000, lift: 36 },
    { ...entry, at: QILIN_CYCLE_MS, flight: 0 },
  ];
}

// One clock drives the tree and the animal. Pauses never advance or restart it.
export function createSceneClock() {
  let elapsed = 0;
  let previous: number | undefined;
  return {
    advance(timestamp: number) {
      if (previous !== undefined) elapsed += Math.max(0, timestamp - previous);
      previous = timestamp;
      return elapsed;
    },
    pause() { previous = undefined; },
  };
}

// The route supplies the travel direction; the independent character supplies
// its gait. Direction changes are a small hop in place on the perch, flipping
// at the top of the hop, before the next takeoff.
export function sampleQilin(stops: QilinStop[], elapsed: number): QilinPose {
  const duration = stops.at(-1)!.at;
  const time = ((elapsed % duration) + duration) % duration;
  const index = Math.max(1, stops.findIndex((stop) => stop.at > time));
  const from = stops[index - 1];
  const to = stops[index];
  const sinceLanding = time - from.at;
  const dwell = to.at - to.flight - from.at;
  const untilTakeoff = dwell - sinceLanding;
  const outgoing = Math.sign(to.x - from.x) || 1;
  const previous = index > 1 ? stops[index - 2] : stops.at(-2)!;
  const incoming = Math.sign(from.x - previous.x) || outgoing;
  const pose: QilinPose = {
    x: from.x, y: from.y, scale: from.scale, ...sampleQilinGait({}),
    facing: incoming, opacity: from.hidden ? 0 : 1, resting: 0,
  };
  if (from.hidden || to.hidden) return pose;
  if (untilTakeoff > 0) {
    const settleTime = Math.min(320, dwell * 0.55);
    const anticipationTime = Math.min(260, dwell * 0.45);
    const settle = Math.min(1, sinceLanding / settleTime);
    const recoil = Math.sin(settle * Math.PI) * (1 - settle);
    const anticipation = 1 - smooth(Math.min(1, untilTakeoff / anticipationTime));
    const turnTime = incoming === outgoing ? 0 : Math.min(300, dwell * 0.5);
    const turnStart = Math.min(settleTime * 0.6, Math.max(0, dwell - anticipationTime * 0.6 - turnTime));
    const hop = turnTime ? clamp01((sinceLanding - turnStart) / turnTime) : 0;
    const quietStart = turnTime ? turnStart + turnTime : settleTime;
    const quietEnd = dwell - anticipationTime;
    const fade = Math.min(350, Math.max(0, quietEnd - quietStart) / 2);
    const resting = fade > 40
      ? smooth(clamp01((sinceLanding - quietStart) / fade)) * smooth(clamp01((quietEnd - sinceLanding) / fade))
      : 0;
    const bounce = Math.sin(Math.PI * hop) * 12 * from.scale;
    const flown = sinceLanding < 600 && from.flight > 0 && !previous.hidden;
    return {
      ...pose,
      ...sampleQilinGait({ recoil, anticipation, hop, rest: sinceLanding, idle: from.idle, idleWeight: resting }),
      facing: hop > 0.5 ? outgoing : incoming,
      y: from.y - bounce,
      resting,
      ground: from.surface === 'hill' ? from.y : undefined,
      landing: flown ? {
        x: from.x, y: from.y, age: sinceLanding,
        strength: Math.min(1, from.lift / 30) * (from.flight / 900), surface: from.surface ?? 'hill',
      } : undefined,
    };
  }
  const progress = Math.min(1, (time - (to.at - to.flight)) / to.flight);
  const x = mix(from.x, to.x, progress);
  return {
    ...pose, ...sampleQilinGait({ flight: progress }), facing: outgoing,
    x,
    y: hopHeight(from.y, to.y, to.lift, progress),
    scale: mix(from.scale, to.scale, smooth(progress)),
    ground: from.surface === 'hill' && to.surface === 'hill' ? mix(from.y, to.y, progress) : undefined,
  };
}
