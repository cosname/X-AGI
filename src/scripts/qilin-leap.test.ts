import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createSceneClock, hopHeight, QILIN_CYCLE_MS, QILIN_TREE_PERCHES, qilinHillStops, qilinSceneStops, qilinTreeStops,
  sampleQilin, type QilinStop, type TreeRouteLayout,
} from './qilin-leap.ts';
import { HERO_TREE_HEIGHT, TREE_FLIP_TRAVEL_DURATION, treeFlipSample, treeWaveArrival } from './hero-pixel-field.ts';

const hillY = (x: number) => 730 + Math.sin(x / 300) * 12;
// Measured at 1440 × 900, 1024 × 768 and 1920 × 1080.
const layouts: TreeRouteLayout[] = [
  { width: 1425, height: 899, treeLeft: 588, treeTop: 20, treeWidth: 918, treeHeight: 1062, spriteWidth: 162, spriteHeight: 150, headerBottom: 78, copyRight: 846, groundY: () => 690 },
  { width: 1009, height: 767, treeLeft: 288, treeTop: 18, treeWidth: 783, treeHeight: 906, spriteWidth: 115, spriteHeight: 107, headerBottom: 73, copyRight: 642, groundY: () => 600 },
  { width: 1905, height: 1079, treeLeft: 907, treeTop: 20, treeWidth: 1101, treeHeight: 1274, spriteWidth: 164, spriteHeight: 152, headerBottom: 78, copyRight: 995, groundY: () => 850 },
];
const layout = layouts[0];
const stops = qilinSceneStops(layout, hillY)!;
const flown = (list: QilinStop[]) => list.filter((stop, index) => index > 0 && stop.flight > 0);

test('mobile hill hops stay visible, turn both ways, and close without a facing snap', () => {
  for (const width of [320, 390, 768, 844]) {
    const spriteWidth = Math.min(104, Math.max(78, width * 0.22));
    const hills = (x: number) => 680 + Math.sin(x / width * Math.PI * 2) * 25;
    const route = qilinHillStops(width, spriteWidth, hills);
    const duration = route.at(-1)!.at;
    for (let index = 1; index < route.length; index += 1) {
      const from = route[index - 1], to = route[index];
      const contact = sampleQilin(route, to.at);
      assert.equal(contact.y, hills(to.x));
      const airborne = sampleQilin(route, to.at - to.flight * 0.5);
      assert.equal(airborne.facing, Math.sign(to.x - from.x));
      assert.ok(airborne.y < Math.min(from.y, to.y) - 8, 'each hop needs a real arc');
    }
    for (let time = 0; time < duration; time += 17) {
      const pose = sampleQilin(route, time);
      assert.equal(pose.opacity, 1, 'mobile character must not exit or reset out of view');
      assert.ok(pose.x - spriteWidth * pose.scale * 0.25 >= 17);
      assert.ok(pose.x + spriteWidth * pose.scale * 0.75 <= width - 17);
    }
    const far = route.findIndex((stop) => stop.idle === 'prance');
    for (const index of [0, far]) {
      const time = route[index].at;
      const before = sampleQilin(route, time - 0.001);
      const after = sampleQilin(route, time + 0.001);
      assert.equal(before.facing, after.facing, 'turns must not snap on contact');
      assert.ok(Math.hypot(after.x - before.x, after.y - before.y) < 0.01);
      const next = route[index + 1];
      const takeoff = sampleQilin(route, next.at - next.flight - 1);
      assert.equal(takeoff.facing, -before.facing);
    }
    for (const kind of ['look', 'bow', 'prance'] as const) {
      const index = route.findIndex((stop) => stop.idle === kind);
      const next = route[index + 1];
      assert.ok(sampleQilin(route, (route[index].at + next.at - next.flight) / 2).resting > 0.9, `${kind} rest must settle`);
    }
  }
});

test('a hop clears the higher end by its lift, whether climbing or dropping', () => {
  for (const [from, to] of [[500, 500], [500, 300], [300, 500], [620, 240]]) {
    let apex = Infinity;
    for (let p = 0; p <= 1; p += 0.001) apex = Math.min(apex, hopHeight(from, to, 24, p));
    assert.ok(Math.abs(apex - (Math.min(from, to) - 24)) < 0.05);
    assert.equal(hopHeight(from, to, 24, 0), from);
    assert.ok(Math.abs(hopHeight(from, to, 24, 1) - to) < 1e-9);
  }
});

test('tree perches sit on the authored branch tops and land with the tree wave', () => {
  for (const dimensions of layouts) {
    const route = qilinTreeStops(dimensions);
    assert.ok(route.length >= 3, `only ${route.length} perches fit ${dimensions.width}px`);
    route.forEach((stop, index) => {
      const source = (stop.y - dimensions.treeTop) / dimensions.treeHeight * HERO_TREE_HEIGHT;
      assert.ok(QILIN_TREE_PERCHES.some((perch) => Math.abs(perch.y - source) < 1e-6), 'perch must be an authored branch');
      assert.ok(stop.y - dimensions.spriteHeight * stop.scale > dimensions.headerBottom + 12);
      assert.ok(stop.x - dimensions.spriteWidth * stop.scale * 0.25 > dimensions.copyRight + 16, 'perch must protect the copy');
      assert.ok(stop.x + dimensions.spriteWidth * stop.scale * 0.75 < dimensions.width - 12);
      const y = source / HERO_TREE_HEIGHT;
      assert.ok(Math.abs(treeFlipSample(y, 0.5, stop.at).secondaryWave - y) < 1e-10);
      if (index) {
        assert.ok(stop.y < route[index - 1].y, 'perches climb');
        assert.ok(stop.flight >= 380 && stop.flight < stop.at - route[index - 1].at, 'each bound reads as a jump after a rest');
      }
    });
  }
});

test('branch contacts follow the actual tree wave at every responsive tree height', () => {
  assert.equal(QILIN_CYCLE_MS, 2 * TREE_FLIP_TRAVEL_DURATION);
  for (const y of [0.18, 0.24, 0.33, 0.51, 0.65]) {
    for (const cycle of [0, 1, 10]) {
      const arrival = treeWaveArrival(y) + cycle * QILIN_CYCLE_MS;
      assert.ok(Math.abs(treeFlipSample(y, 0.5, arrival).secondaryWave - y) < 1e-10);
      assert.ok(treeFlipSample(y, 0.5, arrival).flip > 0.8);
    }
  }
});

test('the shared scene clock retains phase across long visibility pauses', () => {
  const clock = createSceneClock();
  assert.equal(clock.advance(100), 0);
  assert.equal(clock.advance(450), 350);
  clock.pause();
  clock.pause();
  assert.equal(clock.advance(100_000), 350);
  assert.equal(clock.advance(100_016), 366);
  clock.pause();
  assert.equal(clock.advance(200_000), 366);
});

test('the scene is ordered, climbs the tree, and resets only out of view', () => {
  for (const dimensions of layouts) {
    const route = qilinSceneStops(dimensions, hillY)!;
    assert.ok(route, `no tree route at ${dimensions.width}px`);
    route.slice(1).forEach((stop, index) => {
      assert.ok(stop.at - stop.flight >= route[index].at, `stop ${index + 1} takes off before landing`);
    });
    assert.equal(route.at(-1)!.at, QILIN_CYCLE_MS);
    assert.ok(route.some((stop) => stop.surface === 'branch' && stop.idle === 'prance'));
    for (let time = 0; time < QILIN_CYCLE_MS; time += 10) {
      const pose = sampleQilin(route, time);
      const span = dimensions.spriteWidth * pose.scale;
      const offscreen = pose.x + span * 0.75 < 0 || pose.x - span * 0.25 > dimensions.width;
      const next = sampleQilin(route, time + 10);
      if (Math.abs(next.x - pose.x) > dimensions.width / 2) {
        assert.ok(offscreen, `teleport at ${time} is visible`);
      }
    }
  }
});

test('takeoff, contact, and the loop boundary have continuous positions and poses', () => {
  for (const stop of flown(stops)) {
    for (const time of [stop.at - stop.flight, stop.at]) {
      const before = sampleQilin(stops, time - 0.001);
      const after = sampleQilin(stops, time + 0.001);
      assert.ok(Math.hypot(after.x - before.x, after.y - before.y) < 0.01);
      assert.ok(Math.abs(after.stretch - before.stretch) < 0.001);
      assert.ok(Math.abs(after.angle - before.angle) < 0.001);
      for (const joint of Object.keys(before.joints) as (keyof typeof before.joints)[]) {
        assert.ok(Math.abs(before.joints[joint] - after.joints[joint]) < 0.01, `${joint} pops at ${time}`);
      }
    }
  }
  for (let time = 0; time < QILIN_CYCLE_MS; time += 10) {
    const pose = sampleQilin(stops, time);
    assert.ok(Number.isFinite(pose.x + pose.y + pose.scale));
    assert.ok(Math.abs(pose.angle) < 7, 'pitch must never become a whole-body turn');
    assert.ok(pose.stretch > 0.85 && pose.stretch < 1.07);
  }
});

test('the head faces the travel direction for every complete airborne hop', () => {
  for (let index = 1; index < stops.length; index += 1) {
    const from = stops[index - 1], to = stops[index];
    if (!to.flight) continue;
    const direction = Math.sign(to.x - from.x);
    for (const progress of [0, 0.1, 0.5, 0.9, 0.999]) {
      const pose = sampleQilin(stops, to.at - to.flight + to.flight * progress);
      assert.equal(pose.facing, direction, `wrong facing on hop ${index} at ${progress}`);
    }
  }
});

test('a turn is one small hop in place that flips at its top and ends before takeoff', () => {
  let turns = 0;
  for (let index = 2; index < stops.length - 1; index += 1) {
    const perch = stops[index], next = stops[index + 1];
    const incoming = Math.sign(perch.x - stops[index - 1].x);
    const outgoing = Math.sign(next.x - perch.x);
    if (incoming === outgoing) continue;
    turns += 1;
    const takeoff = next.at - next.flight;
    let flips = 0;
    let previous = sampleQilin(stops, perch.at + 1);
    assert.equal(previous.facing, incoming);
    for (let t = perch.at + 2; t < takeoff; t += 1) {
      const pose = sampleQilin(stops, t);
      assert.equal(pose.x, perch.x);
      assert.ok(pose.y <= perch.y);
      if (pose.facing !== previous.facing) {
        flips += 1;
        assert.ok(pose.y < perch.y - 6 * perch.scale, 'facing flips only while airborne');
      }
      previous = pose;
    }
    assert.equal(flips, 1);
    assert.equal(previous.facing, outgoing);
  }
  assert.ok(turns >= 1, 'the tree climb switches sides');
});

test('rests carry idles and attention, fading to neutral before takeoff', () => {
  for (const kind of ['look', 'bow', 'prance'] as const) {
    const index = stops.findIndex((stop) => stop.idle === kind);
    assert.ok(index > 0, `${kind} missing`);
    const perch = stops[index], next = stops[index + 1];
    const middle = (perch.at + next.at - next.flight) / 2;
    const pose = sampleQilin(stops, middle);
    assert.ok(pose.resting > 0.9, `${kind} rest must settle`);
    assert.equal(sampleQilin(stops, next.at - next.flight - 1).resting, 0);
    assert.equal(sampleQilin(stops, perch.at + 1).resting, 0);
  }
  const prance = stops.find((stop) => stop.idle === 'prance')!;
  const raised = sampleQilin(stops, prance.at + 1500);
  assert.ok(raised.joints.frontNearKnee > 30, 'the foreleg is raised');
});

test('landings report dust and hill hops report the ground for the shadow', () => {
  const bound = stops.find((stop) => stop.idle === 'look')!;
  const landed = sampleQilin(stops, bound.at + 100);
  assert.ok(landed.landing && landed.landing.age === 100 && landed.landing.strength > 0.5);
  assert.equal(landed.ground, bound.y);
  const airborne = sampleQilin(stops, bound.at - bound.flight / 2);
  assert.ok(airborne.ground !== undefined && airborne.ground - airborne.y > 30);
  const branch = stops.find((stop) => stop.surface === 'branch')!;
  assert.equal(sampleQilin(stops, branch.at + 100).ground, undefined);
  assert.equal(sampleQilin(stops, branch.at + 100).landing?.surface, 'branch');
});
