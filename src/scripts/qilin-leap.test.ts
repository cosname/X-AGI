import assert from 'node:assert/strict';
import test from 'node:test';
import { createSceneClock, QILIN_CYCLE_MS, qilinHillStops, qilinTreeStops, sampleQilin, type QilinStop } from './qilin-leap.ts';
import { TREE_FLIP_TRAVEL_DURATION, treeFlipSample, treeWaveArrival } from './hero-pixel-field.ts';

const ground: QilinStop[] = [80, 280, 480, 680, 880, 1050].map((x, index) => ({
  x, y: 730, at: index * 1300, scale: 0.8, lift: 28, flight: 960,
}));
const layout = {
  width: 1425, treeLeft: 588, treeTop: 20, treeWidth: 918, treeHeight: 1062,
  spriteWidth: 162, spriteHeight: 162 * 52 / 56, headerBottom: 80, copyRight: 846,
};
const branches = qilinTreeStops(layout, ground.at(-1)!.at);
const crown = branches.at(-1)!;
const stops: QilinStop[] = [...ground, ...branches,
  { ...crown, x: 1700, at: crown.at + 2700, flight: 1050 },
  { ...ground[0], x: -260, at: 16100, hidden: true },
  { ...ground[0], x: -260, at: 17200 },
  { ...ground[0], at: QILIN_CYCLE_MS, flight: 1200 },
];

test('mobile hill hops stay visible, turn both ways, and close without a facing snap', () => {
  for (const width of [320, 390, 768, 844]) {
    const spriteWidth = Math.min(104, Math.max(78, width * 0.22));
    const hillY = (x: number) => 680 + Math.sin(x / width * Math.PI * 2) * 25;
    const route = qilinHillStops(width, spriteWidth, hillY);
    const duration = route.at(-1)!.at;
    for (let index = 1; index < route.length; index += 1) {
      const from = route[index - 1], to = route[index];
      const contact = sampleQilin(route, to.at);
      assert.equal(contact.y, hillY(to.x));
      const airborne = sampleQilin(route, to.at - to.flight * 0.5);
      assert.equal(airborne.facing, Math.sign(to.x - from.x));
      assert.ok(airborne.y < (from.y + to.y) / 2 - 20);
    }
    for (let time = 0; time < duration; time += 17) {
      const pose = sampleQilin(route, time);
      assert.equal(pose.opacity, 1, 'mobile character must not exit or reset out of view');
      assert.ok(pose.x - spriteWidth * pose.scale * 0.25 >= 17);
      assert.ok(pose.x + spriteWidth * pose.scale * 0.75 <= width - 17);
    }
    for (const time of [0, route[Math.floor(route.length / 2)].at]) {
      const before = sampleQilin(route, time - 0.001);
      const after = sampleQilin(route, time + 0.001);
      assert.ok(Math.abs(before.facing - after.facing) < 0.001, 'turns must not snap at either end');
      assert.ok(Math.hypot(after.x - before.x, after.y - before.y) < 0.01);
      const takeoff = sampleQilin(route, time + 421);
      assert.equal(takeoff.facing, -before.facing);
    }
  }
});

test('left-to-right hill hops make foot contact and remain upright throughout the cycle', () => {
  for (const stop of [...ground, ...branches]) {
    const pose = sampleQilin(stops, stop.at);
    assert.ok(Math.abs(pose.x - stop.x) < 1e-7);
    assert.ok(Math.abs(pose.y - stop.y) < 1e-7);
    assert.ok(Math.abs(pose.angle) < 1e-8);
  }
  let previousX = 0;
  for (let time = 0; time < QILIN_CYCLE_MS; time += 10) {
    const pose = sampleQilin(stops, time);
    assert.ok(Number.isFinite(pose.x + pose.y + pose.scale));
    assert.ok(Math.abs(pose.angle) < 7, 'pitch must never become a whole-body turn');
    assert.ok(pose.stretch > 0.85 && pose.stretch < 1.06);
    if (time < ground.at(-1)!.at) {
      assert.ok(pose.x >= previousX, 'hills must be traversed from left to right');
      previousX = pose.x;
    }
  }
  const halfway = sampleQilin(stops, 820);
  assert.ok(halfway.y < 730 - 25, 'a hop needs a real arc above the hill');
  assert.notEqual(halfway.joints.frontNear, halfway.joints.rearNear, 'front and rear legs should not move as one rigid sprite');
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

test('takeoff, contact, and the loop boundary have continuous positions and poses', () => {
  for (const stop of [...ground.slice(1), ...branches]) {
    for (const time of [stop.at - stop.flight, stop.at]) {
      const before = sampleQilin(stops, time - 0.001);
      const after = sampleQilin(stops, time + 0.001);
      assert.ok(Math.hypot(after.x - before.x, after.y - before.y) < 0.01);
      assert.ok(Math.abs(after.stretch - before.stretch) < 0.001);
      assert.ok(Math.abs(after.angle - before.angle) < 0.001);
    }
  }
  const end = sampleQilin(stops, QILIN_CYCLE_MS - 0.001);
  const start = sampleQilin(stops, 0);
  assert.ok(Math.hypot(end.x - start.x, end.y - start.y) < 0.01);
  assert.ok(Math.abs(end.scale - start.scale) < 0.001);
  assert.equal(sampleQilin(stops, 16500).opacity, 0, 'reset must happen out of view');
});


test('tree perches alternate wide left and right lanes while following the same wave', () => {
  for (const dimensions of [
    layout,
    { ...layout, width: 1009, treeLeft: 296, treeWidth: 782, treeHeight: 906, spriteWidth: 115.2, spriteHeight: 107, copyRight: 742 },
    { ...layout, treeHeight: 708, spriteWidth: 150, spriteHeight: 139 },
  ]) {
    const route = qilinTreeStops(dimensions, 6500);
    assert.equal(route.length, 3);
    route.forEach((stop, index) => {
      assert.ok(stop.flight >= 500, 'each bound needs enough time to read as a jump');
      assert.ok(stop.y - dimensions.spriteHeight * stop.scale > dimensions.headerBottom + 30);
      const center = stop.x + dimensions.spriteWidth * stop.scale * 0.25;
      const half = dimensions.spriteWidth * stop.scale * 0.5;
      assert.ok(center - half > dimensions.copyRight + 12, 'left lane must protect the copy');
      assert.ok(center + half < dimensions.width - 12, 'right lane must fit the larger sprite');
      const y = (stop.y - dimensions.treeTop) / dimensions.treeHeight;
      assert.ok(Math.abs(treeFlipSample(y, 0.5, stop.at).secondaryWave - y) < 1e-10);
      if (index) {
        assert.ok(stop.y < route[index - 1].y);
        const dx = stop.x - route[index - 1].x;
        assert.ok(index % 2 ? dx < -half * 1.5 : dx > half * 1.5, 'successive perches must switch sides');
      }
    });
  }
});


test('the head faces the travel direction for every complete airborne hop', () => {
  for (let index = 1; index < stops.length; index += 1) {
    const from = stops[index - 1], to = stops[index];
    if (from.hidden || to.hidden || !to.flight) continue;
    const direction = Math.sign(to.x - from.x);
    for (const progress of [0, 0.1, 0.5, 0.9, 0.999]) {
      const pose = sampleQilin(stops, to.at - to.flight + to.flight * progress);
      assert.equal(pose.facing, direction, `wrong facing on hop ${index} at ${progress}`);
    }
  }
});

test('a turn finishes in place before the next takeoff, without teleporting the body', () => {
  for (const perch of branches.slice(0, 2)) {
    const index = stops.indexOf(perch);
    const next = stops[index + 1];
    const before = sampleQilin(stops, perch.at + 1);
    const takeoff = next.at - next.flight;
    const after = sampleQilin(stops, takeoff - 1);
    assert.equal(before.facing, Math.sign(perch.x - stops[index - 1].x));
    assert.equal(after.facing, Math.sign(next.x - perch.x));
    assert.notEqual(before.facing, after.facing);
    let previous = before;
    for (let t = perch.at + 2; t < takeoff; t += 1) {
      const pose = sampleQilin(stops, t);
      assert.equal(pose.x, perch.x);
      assert.equal(pose.y, perch.y);
      assert.ok(Math.abs(pose.facing - previous.facing) < 0.05);
      previous = pose;
    }
  }
});

test('head, tail, and leg joints articulate independently and remain continuous at contacts', () => {
  const crouch = sampleQilin(stops, stops[1].at - stops[1].flight);
  const tuck = sampleQilin(stops, stops[1].at - stops[1].flight / 2);
  assert.ok(Math.abs(crouch.joints.head - tuck.joints.head) > 8);
  assert.ok(tuck.joints.frontNearKnee > 25);
  assert.ok(tuck.joints.rearNearKnee < -20);
  assert.notEqual(tuck.joints.frontNearKnee, tuck.joints.frontFarKnee);
  assert.notEqual(tuck.joints.rearNear, tuck.joints.rearFar);
  assert.ok(Math.abs(tuck.joints.tail) > 8);
  for (const stop of [...ground.slice(1), ...branches]) {
    for (const t of [stop.at - stop.flight, stop.at]) {
      const a = sampleQilin(stops, t - 0.001);
      const b = sampleQilin(stops, t + 0.001);
      for (const joint of Object.keys(a.joints) as (keyof typeof a.joints)[]) {
        assert.ok(Math.abs(a.joints[joint] - b.joints[joint]) < 0.01, `${joint} pops at ${t}`);
      }
    }
  }
});
