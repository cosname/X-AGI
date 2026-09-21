import { createQilinCharacter } from './qilin-character';
import { QILIN_CYCLE_MS, qilinHillStops, qilinTreeStops, sampleQilin, type QilinStop } from './qilin-leap';

// The hero owns layout, visibility and time. This character has no independent
// RAF, observer or animation clock, so it cannot drift away from the tree wave.
export function createQilinLeap(field: HTMLElement) {
  const scene = field.querySelector<HTMLElement>('[data-qilin-leap]');
  const traveller = scene?.querySelector<HTMLElement>('[data-qilin-traveller]');
  const tree = field.querySelector<HTMLElement>('.hero-pixel-field__tree-artboard--right');
  const terrain = field.querySelector<HTMLElement>('[data-probability-terrain]');
  if (!scene || !traveller || !tree || !terrain) return;
  const actor = traveller.querySelector<HTMLElement>('[data-qilin-character]');
  const character = actor && createQilinCharacter(actor);
  if (!character) return;
  let stops: QilinStop[] = [];
  let hillsOnly = false;
  let outlines: { x: number; y: number }[][] = [];
  let width = 1, spriteWidth = 1, spriteHeight = 1, terrainTop = 0, terrainHeight = 1;
  let lastTime = 0;
  let fieldHeight = 1;
  let copy: { left: number; right: number; bottom: number }[] = [];
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
  const render = (elapsed: number) => {
    if (!stops.length) return;
    lastTime = elapsed;
    const pose = sampleQilin(stops, elapsed);
    traveller.style.transform = `translate3d(${pose.x - spriteWidth * 0.25}px,${pose.y - spriteHeight}px,0) scale(${pose.scale})`;
    traveller.style.opacity = `${pose.opacity}`;
    character.render(pose);
    scene.dataset.sceneTime = elapsed.toFixed(0);
  };
  return {
    setTerrain(paths: string[]) {
      outlines = paths.map((path) => [...path.matchAll(/(-?[\d.]+)%\s+(-?[\d.]+)%/g)]
        .slice(1, -1).map((point) => ({ x: Number(point[1]), y: Number(point[2]) }))).filter((outline) => outline.length);
      // Keep the grounded route attached when the pointer reshapes the hills.
      if (outlines.length) stops.filter((stop) => hillsOnly || stop.at <= 6500 || stop.at === QILIN_CYCLE_MS)
        .forEach((stop) => { stop.y = hillY(stop.x); });
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
      scene.dataset.route = hillsOnly ? 'hills' : 'tree';
      if (hillsOnly) {
        stops = qilinHillStops(width, spriteWidth, hillY);
        scene.dataset.ready = 'true';
        render(lastTime);
        return;
      }
      stops = [0.055, 0.19, 0.33, 0.47, 0.61, 0.73].map((x, index) => ({
        x: width * x, y: hillY(width * x), scale: 0.78,
        at: index * 1300, flight: 960, lift: Math.min(28, box.height * 0.032),
      }));
      const headerBottom = (document.querySelector('header')?.getBoundingClientRect().bottom ?? 80) - box.top;
      stops.push(...qilinTreeStops({
        width, treeLeft: treeBox.left - box.left, treeTop: treeBox.top - box.top,
        treeWidth: treeBox.width, treeHeight: treeBox.height,
        spriteWidth, spriteHeight, headerBottom,
        copyRight: Math.max(0, ...copy.map((rect) => rect.right)),
      }, stops.at(-1)!.at));
      const crown = stops.at(-1)!;
      // Exit beyond the edge, reset while invisible, then hop back into view.
      stops.push({ ...crown, x: width + spriteWidth * 2, at: crown.at + 2700, flight: 1050, lift: 18 });
      stops.push({ ...stops[0], x: -spriteWidth * 2, at: 16100, flight: 0, hidden: true });
      stops.push({ ...stops[0], x: -spriteWidth * 2, at: 17200, flight: 0 });
      stops.push({ ...stops[0], at: QILIN_CYCLE_MS, flight: 1200, lift: 22 });
      scene.dataset.ready = 'true';
      render(lastTime);
    },
    render,
    pause(reduced = false) {
      scene.dataset.motion = reduced ? 'reduced' : 'paused';
      if (reduced) render(0);
    },
    play() { scene.dataset.motion = 'playing'; },
  };
}
