import { sampleQilinGait, type QilinArticulation } from './qilin-character.ts';
import { TREE_FLIP_TRAVEL_DURATION, treeWaveArrival } from './hero-pixel-field.ts';

export const QILIN_CYCLE_MS = TREE_FLIP_TRAVEL_DURATION * 2;
export type QilinPoint = { x: number; y: number; scale: number };
export type QilinStop = QilinPoint & { at: number; flight: number; lift: number; hidden?: boolean };
export type QilinPose = QilinPoint & QilinArticulation & { opacity: number };
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const smooth = (p: number) => p * p * (3 - 2 * p);

// A closed hill route has no offscreen reset. Both ends leave enough room for
// the whole silhouette, including its tail when it turns back toward the hills.
export function qilinHillStops(width: number, spriteWidth: number, hillY: (x: number) => number): QilinStop[] {
  const scale = 0.9;
  const span = spriteWidth * scale;
  const left = 18 + span * 0.25;
  const right = width - 18 - span * 0.75;
  const segments = Math.max(2, Math.round((right - left) / 90));
  return Array.from({ length: segments * 2 + 1 }, (_, index) => {
    const step = index <= segments ? index : segments * 2 - index;
    const x = mix(left, right, step / segments);
    return { x, y: hillY(x), scale, at: index * 1300, flight: 880, lift: 22 };
  });
}

type TreeRouteLayout = {
  width: number;
  treeLeft: number;
  treeTop: number;
  treeWidth: number;
  treeHeight: number;
  spriteWidth: number;
  spriteHeight: number;
  headerBottom: number;
  copyRight: number;
};

// The last hill is the left launch point. Three widely separated perches then
// alternate right, left, right, leaving room for the larger animal and each hop.
export function qilinTreeStops(layout: TreeRouteLayout, after: number): QilinStop[] {
  const { width, treeLeft, treeTop, treeWidth, treeHeight, spriteWidth, spriteHeight, headerBottom, copyRight } = layout;
  const top = Math.max(treeTop + treeHeight * 0.18, headerBottom + spriteHeight * 0.86 + 38);
  const bottom = treeTop + treeHeight * 0.60;
  const count = 3;
  // Preserve two distinct lanes even when the text takes more horizontal room.
  const fit = Math.max(0, Math.min(1, (width - copyRight - 56) / (spriteWidth * 1.85)));
  const stops: QilinStop[] = [];
  for (let index = 0; index < count; index += 1) {
    const progress = index / (count - 1);
    const scale = (0.95 - progress * 0.09) * fit;
    const span = spriteWidth * scale;
    const y = mix(bottom, top, progress);
    const left = Math.max(treeLeft + treeWidth * (0.53 + progress * 0.025), copyRight + span * 0.6 + 24);
    const right = width - span * 0.52 - 20;
    const center = index % 2 === 0 ? right : Math.min(left, right - span * 0.85);
    const at = treeWaveArrival((y - treeTop) / treeHeight);
    const previousTime = stops.at(-1)?.at ?? after;
    stops.push({
      // Feet use a 25% anchor; lanes refer to the center of the full silhouette.
      x: center - span * 0.25, y, scale, at,
      flight: Math.min(1150, at - previousTime - 260), lift: 38,
    });
  }
  return stops;
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
// its gait. Direction changes finish on the perch before the next takeoff.
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
    ...from, ...sampleQilinGait({}), facing: incoming, opacity: from.hidden ? 0 : 1,
  };
  if (from.hidden || to.hidden) return pose;
  if (untilTakeoff > 0) {
    const settle = Math.min(1, sinceLanding / Math.min(320, dwell * 0.55));
    const recoil = Math.sin(settle * Math.PI) * (1 - settle);
    const anticipation = 1 - smooth(Math.min(1, untilTakeoff / Math.min(260, dwell * 0.45)));
    const turnStart = dwell * 0.16;
    const turnEnd = Math.min(dwell * 0.80, turnStart + 260);
    const turn = incoming === outgoing ? 0
      : smooth(Math.max(0, Math.min(1, (sinceLanding - turnStart) / (turnEnd - turnStart))));
    return {
      ...pose, ...sampleQilinGait({ recoil, anticipation, turn, rest: sinceLanding }),
      facing: incoming * Math.cos(Math.PI * turn),
    };
  }
  const progress = Math.min(1, (time - (to.at - to.flight)) / to.flight);
  const arc = 4 * progress * (1 - progress);
  return {
    ...pose, ...sampleQilinGait({ flight: progress }), facing: outgoing,
    x: mix(from.x, to.x, progress),
    y: mix(from.y, to.y, progress) - to.lift * arc,
    scale: mix(from.scale, to.scale, smooth(progress)),
  };
}
