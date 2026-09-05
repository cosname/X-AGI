// Clip the tree at the upper edge of the terrain, preserving the translucent
// hill layers and the original paper texture underneath them.
// All density polygons share the same stepped column grid.
export function treeClipAboveTerrain(paths: readonly string[]): string {
  const outlines = paths.map((path) => [...path.matchAll(/(-?[\d.]+)%\s+(-?[\d.]+)%/g)]
    .slice(1, -1).map((match) => ({ x: Number(match[1]), y: Number(match[2]) })));
  const boundary = (outlines[0] ?? []).map((point, index) => {
    const y = Math.min(...outlines.map((outline) => outline[index].y));
    const depth = Math.max(0, (100 - y) / 100).toFixed(6);
    return `${point.x}% calc(100% - var(--badge-terrain-height) * ${depth})`;
  });
  return `polygon(0 0,100% 0,${boundary.reverse().join(',')})`;
}
