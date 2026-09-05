type Point = { x: number; y: number };
type Link = { from: number; to: number };

// Distances follow the existing graph, so a touch never draws shortcuts across copy.
export function connectionDistances(points: readonly Point[], links: readonly Link[], source: number): number[] {
  const distances = points.map(() => Infinity);
  if (!points[source]) return distances;
  distances[source] = 0;
  const visited = new Set<number>();
  for (let step = 0; step < points.length; step += 1) {
    let closest = -1;
    for (let index = 0; index < points.length; index += 1) {
      if (!visited.has(index) && Number.isFinite(distances[index]) && (closest < 0 || distances[index] < distances[closest])) closest = index;
    }
    if (closest < 0) break;
    visited.add(closest);
    for (const link of links) {
      const next = link.from === closest ? link.to : link.to === closest ? link.from : -1;
      if (next < 0 || !points[next]) continue;
      const length = Math.hypot(points[closest].x - points[next].x, points[closest].y - points[next].y);
      distances[next] = Math.min(distances[next], distances[closest] + length);
    }
  }
  return distances;
}

export function connectionPulseEnergy(distance: number, elapsed: number): number {
  if (!Number.isFinite(distance)) return 0;
  const age = elapsed - distance / 0.42;
  if (age <= 0 || age >= 480) return 0;
  return Math.sin(Math.PI * age / 480) ** 2;
}
