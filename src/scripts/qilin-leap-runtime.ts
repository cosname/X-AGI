import { createQilinCharacter } from './qilin-character';
import { qilinHillStops, qilinSceneStops, sampleQilin, type QilinPose, type QilinStop } from './qilin-leap';

const DUST_LIFETIME = 520;
const unit = (seed: number) => {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
};

// The hero owns layout, visibility and time. This character has no independent
// RAF, observer or animation clock, so it cannot drift away from the tree wave.
export function createQilinLeap(field: HTMLElement) {
  const scene = field.querySelector<HTMLElement>('[data-qilin-leap]');
  const traveller = scene?.querySelector<HTMLElement>('[data-qilin-traveller]');
  const shadow = scene?.querySelector<HTMLElement>('[data-qilin-shadow]');
  const dust = [...(scene?.querySelectorAll<HTMLElement>('[data-qilin-dust]') ?? [])];
  const tree = field.querySelector<HTMLElement>('.hero-pixel-field__tree-artboard--right');
  const terrain = field.querySelector<HTMLElement>('[data-probability-terrain]');
  if (!scene || !traveller || !tree || !terrain) return;
  const actor = traveller.querySelector<HTMLElement>('[data-qilin-character]');
  const character = actor && createQilinCharacter(actor);
  if (!character) return;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let stops: QilinStop[] = [];
  let hillsOnly = false;
  let outlines: { x: number; y: number }[][] = [];
  let width = 1, spriteWidth = 1, spriteHeight = 1, terrainTop = 0, terrainHeight = 1;
  let lastTime = 0;
  let fieldHeight = 1;
  let copy: { left: number; right: number; bottom: number }[] = [];
  let dustVisible = false;
  // Pointer attention: the head follows the cursor while the animal rests, and
  // a cursor that comes too close gets a small startled hop.
  const pointer = { x: 0, y: 0, active: false };
  let look = 0;
  let startleAt = -Infinity;
  let startleArmed = true;

  const hillY = (x: number) => {
    const percent = x / width * 100;
    const heights = outlines.map((outline) => {
      const closest = outline.reduce((best, point) => Math.abs(point.x - percent) < Math.abs(best.x - percent) ? point : best);
      return terrainTop + closest.y / 100 * terrainHeight;
    }).sort((a, b) => a - b);
    // Select a lower visible ridge where the copy occupies the upper hillside.
    // Include the neighboring hop's span, not only the exact landing point.
    const reach = width * 0.16 + spriteWidth * 0.85;
    const floor = Math.max(0, ...copy.filter((rect) => rect.left < x + reach && rect.right > x - reach).map((rect) => rect.bottom));
    const clearance = floor + spriteHeight * 0.78 + 42;
    return heights.find((y) => y >= clearance && y < fieldHeight - 8) ?? Math.max(heights[0], clearance);
  };
  const topRidge = (x: number) => {
    const percent = x / width * 100;
    return Math.min(...outlines.map((outline) => {
      const closest = outline.reduce((best, point) => Math.abs(point.x - percent) < Math.abs(best.x - percent) ? point : best);
      return terrainTop + closest.y / 100 * terrainHeight;
    }));
  };

  const attend = (pose: QilinPose, elapsed: number) => {
    const span = spriteWidth * pose.scale;
    const headX = pose.x + (pose.facing > 0 ? 0.64 : -0.14) * span;
    const headY = pose.y - spriteHeight * pose.scale * 0.72;
    let target = 0;
    if (pointer.active && pose.resting > 0) {
      const ahead = (pointer.x - headX) * pose.facing;
      const dy = pointer.y - headY;
      if (Math.hypot(ahead, dy) < 440) {
        target = ahead > -24
          ? Math.max(-18, Math.min(14, Math.atan2(dy, Math.max(ahead, 36)) * 180 / Math.PI * 0.6))
          : -7;
      }
      const centerX = pose.x + span * 0.25;
      const near = Math.hypot(pointer.x - centerX, pointer.y - (pose.y - spriteHeight * pose.scale * 0.5)) < span * 0.55;
      if (near && startleArmed && pose.resting > 0.6) {
        startleAt = elapsed;
        startleArmed = false;
      } else if (!near && elapsed - startleAt > 1600) startleArmed = true;
    }
    look += (target * pose.resting - look) * (1 - Math.exp(-Math.max(0, elapsed - lastTime) / 110));
    pose.joints.head += look;
    scene.dataset.look = look.toFixed(1);
    const startle = (elapsed - startleAt) / 340;
    if (startle >= 0 && startle < 1) {
      const lift = Math.sin(Math.PI * startle);
      pose.y -= lift * 16 * pose.scale;
      pose.stretch += lift * 0.05;
      pose.joints.head -= lift * 8;
      pose.joints.tail += lift * 14;
      pose.joints.frontNearKnee += lift * 20;
      pose.joints.rearNearKnee -= lift * 16;
    }
  };

  const paintShadow = (pose: QilinPose) => {
    if (!shadow) return;
    if (pose.ground === undefined || !pose.opacity) {
      shadow.style.opacity = '0';
      return;
    }
    const span = spriteWidth * pose.scale;
    const height = Math.max(0, pose.ground - pose.y);
    const near = 1 - Math.min(1, height / 90);
    shadow.style.opacity = (0.06 + near * 0.14).toFixed(3);
    shadow.style.transform = `translate3d(${(pose.x + span * 0.25 - span * 0.36).toFixed(1)}px,${(pose.ground - 5).toFixed(1)}px,0) scale(${(span * 0.72 / 36 * (0.55 + near * 0.45)).toFixed(3)},1)`;
  };

  const paintDust = (pose: QilinPose) => {
    const landing = pose.landing;
    if (!landing || landing.age >= DUST_LIFETIME || landing.strength < 0.25) {
      if (dustVisible) dust.forEach((mote) => { mote.style.opacity = '0'; });
      dustVisible = false;
      return;
    }
    dustVisible = true;
    const span = spriteWidth * pose.scale;
    const t = landing.age / 1000;
    const fade = (1 - landing.age / DUST_LIFETIME) ** 1.4 * Math.min(1, landing.strength);
    dust.forEach((mote, index) => {
      const side = index % 2 ? 1 : -1;
      const speed = (46 + unit(index + 3) * 70) * landing.strength;
      const rise = (50 + unit(index + 11) * 70) * landing.strength;
      const footX = landing.x + span * (side > 0 ? 0.7 : -0.05);
      const x = footX + side * speed * t;
      const y = landing.y - Math.max(0, rise * t - 260 * t * t);
      mote.dataset.surface = landing.surface;
      mote.style.opacity = fade.toFixed(3);
      mote.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    });
  };

  const render = (elapsed: number) => {
    if (!stops.length) return;
    const pose = sampleQilin(stops, elapsed);
    if (finePointer.matches) attend(pose, elapsed);
    lastTime = elapsed;
    traveller.style.transform = `translate3d(${pose.x - spriteWidth * 0.25}px,${pose.y - spriteHeight}px,0) scale(${pose.scale})`;
    traveller.style.opacity = `${pose.opacity}`;
    character.render(pose);
    paintShadow(pose);
    paintDust(pose);
    scene.dataset.sceneTime = elapsed.toFixed(0);
  };

  const stage = field.closest<HTMLElement>('[data-connection-stage]') ?? field;
  stage.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    const box = field.getBoundingClientRect();
    pointer.x = event.clientX - box.left;
    pointer.y = event.clientY - box.top;
    pointer.active = true;
  }, { passive: true });
  stage.addEventListener('pointerleave', () => { pointer.active = false; }, { passive: true });

  return {
    setTerrain(paths: string[]) {
      outlines = paths.map((path) => [...path.matchAll(/(-?[\d.]+)%\s+(-?[\d.]+)%/g)]
        .slice(1, -1).map((point) => ({ x: Number(point[1]), y: Number(point[2]) }))).filter((outline) => outline.length);
      // Keep the grounded route attached when the pointer reshapes the hills.
      if (outlines.length) stops.filter((stop) => stop.surface === 'hill').forEach((stop) => { stop.y = hillY(stop.x); });
    },
    layout(useHillsOnly = false) {
      hillsOnly = useHillsOnly;
      const box = field.getBoundingClientRect();
      const treeBox = tree.getBoundingClientRect();
      const terrainBox = terrain.getBoundingClientRect();
      width = box.width;
      fieldHeight = box.height;
      spriteWidth = traveller.offsetWidth;
      spriteHeight = traveller.offsetHeight;
      terrainTop = terrainBox.top - box.top;
      terrainHeight = terrainBox.height;
      if (!outlines.length || !spriteWidth) return;
      copy = [...(field.closest('[data-connection-stage]') ?? field).querySelectorAll('[data-connection-exclusion]')]
        .map((element) => { const rect = element.getBoundingClientRect(); return { left: rect.left - box.left, right: rect.right - box.left, bottom: rect.bottom - box.top }; });
      const route = hillsOnly ? undefined : qilinSceneStops({
        width, height: fieldHeight,
        treeLeft: treeBox.left - box.left, treeTop: treeBox.top - box.top,
        treeWidth: treeBox.width, treeHeight: treeBox.height,
        spriteWidth, spriteHeight,
        headerBottom: (document.querySelector('header')?.getBoundingClientRect().bottom ?? 80) - box.top,
        copyRight: Math.max(0, ...copy.map((rect) => rect.right)),
        groundY: topRidge,
      }, hillY);
      stops = route ?? qilinHillStops(width, spriteWidth, hillY);
      scene.dataset.route = route ? 'tree' : 'hills';
      scene.dataset.ready = 'true';
      render(lastTime);
    },
    render,
    pause(reduced = false) {
      scene.dataset.motion = reduced ? 'reduced' : 'paused';
      // Without motion, show the animal standing at its first resting place.
      if (reduced) render(stops.find((stop) => stop.idle)?.at ?? 0);
    },
    play() { scene.dataset.motion = 'playing'; },
  };
}
