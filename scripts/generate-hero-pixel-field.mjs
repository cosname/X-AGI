import path from 'node:path';
import process from 'node:process';
import { Buffer } from 'node:buffer';

import sharp from 'sharp';

const SOURCE_WIDTH = 1487;
const SOURCE_HEIGHT = 980;
const SOURCE_HEADER_HEIGHT = 78;
const SOURCE_SPLIT_X = 744;
const LEFT_ROOT_X = 56;
const RIGHT_ROOT_X = 1290;
const PALETTE_SIZE = 24;
const PALETTE_SEED = 2601;

const args = process.argv.slice(2);
const previewIndex = args.indexOf('--preview');
const previewPath = previewIndex >= 0 ? args[previewIndex + 1] : undefined;
if (previewIndex >= 0) args.splice(previewIndex, 2);

const [sourcePath, outputPath] = args;
if (!sourcePath || !outputPath) {
  throw new Error('Usage: node scripts/generate-hero-pixel-field.mjs <source.png> <output.json> [--preview preview.png]');
}

const leftBoundary = (sourceY) => {
  if (sourceY < 96 || sourceY > 900) return -1;
  if (sourceY < 240) return 620;
  if (sourceY < 350) return 350;
  if (sourceY < 520) return 285;
  if (sourceY < 610) return 260;
  if (sourceY < 780) return 180;
  return 135;
};

const rightBoundary = (sourceY) => {
  if (sourceY < 90 || sourceY > 910) return SOURCE_WIDTH;
  if (sourceY < 330) return 850;
  if (sourceY < 600) return 1080;
  if (sourceY < 780) return 1160;
  return 1240;
};

const isTreeColor = (red, green, blue) => {
  const chroma = Math.max(red, green, blue) - Math.min(red, green, blue);
  if (chroma < 10) return false;

  const violetOrBlue = blue - red > 8 && blue - green > 2;
  const teal = green - red > 12 && blue - red > 8;
  const orange = red - green > 18 && green - blue > 12;
  return violetOrBlue || teal || orange;
};

const extractTransparentTree = async (inputPath) => {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.width !== SOURCE_WIDTH) {
    throw new Error(`Expected a ${SOURCE_WIDTH}px-wide reference, got ${info.width}px`);
  }

  if (info.height === SOURCE_HEIGHT) {
    return Buffer.from(data);
  }

  if (info.height !== SOURCE_HEIGHT + SOURCE_HEADER_HEIGHT) {
    throw new Error(`Expected ${SOURCE_HEIGHT}px tree art or ${SOURCE_HEIGHT + SOURCE_HEADER_HEIGHT}px full reference, got ${info.height}px`);
  }

  const output = Buffer.alloc(SOURCE_WIDTH * SOURCE_HEIGHT * 4);
  for (let y = 0; y < SOURCE_HEIGHT; y += 1) {
    const sourceY = y + SOURCE_HEADER_HEIGHT;
    for (let x = 0; x < SOURCE_WIDTH; x += 1) {
      const insideTreeRegion = x <= leftBoundary(sourceY) || x >= rightBoundary(sourceY);
      if (!insideTreeRegion) continue;

      let spatialAlpha = 1;
      if (sourceY > 720) {
        const leftTree = x < SOURCE_WIDTH / 2;
        const trunkCenter = leftTree ? LEFT_ROOT_X : RIGHT_ROOT_X;
        const startRadius = leftTree ? 92 : 104;
        const radius = Math.max(leftTree ? 48 : 56, startRadius - (sourceY - 720) * 0.2);
        const edgeDistance = radius - Math.abs(x - trunkCenter);
        if (edgeDistance <= 0) continue;
        spatialAlpha = Math.min(1, edgeDistance / 16);
      }

      const sourceIndex = (sourceY * SOURCE_WIDTH + x) * 4;
      const red = data[sourceIndex];
      const green = data[sourceIndex + 1];
      const blue = data[sourceIndex + 2];
      if (!isTreeColor(red, green, blue)) continue;
      if (sourceY > 780 && (Math.max(red, green, blue) < 150 || red - green > 18)) continue;

      const outputIndex = (y * SOURCE_WIDTH + x) * 4;
      output[outputIndex] = red;
      output[outputIndex + 1] = green;
      output[outputIndex + 2] = blue;
      output[outputIndex + 3] = Math.round(data[sourceIndex + 3] * spatialAlpha);
    }
  }

  return output;
};

const median = (values) => {
  values.sort((a, b) => a - b);
  const middle = Math.floor(values.length / 2);
  return values.length % 2 === 0
    ? (values[middle - 1] + values[middle]) / 2
    : values[middle];
};

const makeCandidate = (rgba, indices, size, tier) => {
  let weight = 0;
  let weightedX = 0;
  let weightedY = 0;
  let opacity = 0;
  const reds = [];
  const greens = [];
  const blues = [];

  indices.forEach((pixelIndex) => {
    const rgbaIndex = pixelIndex * 4;
    const alpha = rgba[rgbaIndex + 3] / 255;
    const x = pixelIndex % SOURCE_WIDTH;
    const y = Math.floor(pixelIndex / SOURCE_WIDTH);
    weight += alpha;
    weightedX += x * alpha;
    weightedY += y * alpha;
    opacity += alpha;
    reds.push(rgba[rgbaIndex]);
    greens.push(rgba[rgbaIndex + 1]);
    blues.push(rgba[rgbaIndex + 2]);
  });

  return {
    centerX: weightedX / Math.max(weight, 0.0001),
    centerY: weightedY / Math.max(weight, 0.0001),
    size,
    color: [median(reds), median(greens), median(blues)],
    opacity: opacity / Math.max(indices.length, 1),
    tier,
  };
};

const extractCandidates = (rgba) => {
  const pixelCount = SOURCE_WIDTH * SOURCE_HEIGHT;
  const sourceMask = new Uint8Array(pixelCount);
  const remaining = new Uint8Array(pixelCount);
  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  const candidates = [];

  for (let index = 0; index < pixelCount; index += 1) {
    if (rgba[index * 4 + 3] === 0) continue;
    sourceMask[index] = 1;
    remaining[index] = 1;
  }

  for (let start = 0; start < pixelCount; start += 1) {
    if (!sourceMask[start] || visited[start]) continue;

    let head = 0;
    let tail = 0;
    queue[tail] = start;
    tail += 1;
    visited[start] = 1;
    const component = [];
    let minimumX = SOURCE_WIDTH;
    let maximumX = 0;
    let minimumY = SOURCE_HEIGHT;
    let maximumY = 0;

    while (head < tail) {
      const index = queue[head];
      head += 1;
      component.push(index);
      const x = index % SOURCE_WIDTH;
      const y = Math.floor(index / SOURCE_WIDTH);
      minimumX = Math.min(minimumX, x);
      maximumX = Math.max(maximumX, x);
      minimumY = Math.min(minimumY, y);
      maximumY = Math.max(maximumY, y);

      const neighbors = [
        x > 0 ? index - 1 : -1,
        x + 1 < SOURCE_WIDTH ? index + 1 : -1,
        y > 0 ? index - SOURCE_WIDTH : -1,
        y + 1 < SOURCE_HEIGHT ? index + SOURCE_WIDTH : -1,
      ];
      neighbors.forEach((neighbor) => {
        if (neighbor < 0 || !sourceMask[neighbor] || visited[neighbor]) return;
        visited[neighbor] = 1;
        queue[tail] = neighbor;
        tail += 1;
      });
    }

    const componentWidth = maximumX - minimumX + 1;
    const componentHeight = maximumY - minimumY + 1;
    if (Math.max(componentWidth, componentHeight) > 8 || component.length > 64) continue;

    const size = Math.max(1, Math.min(8, Math.round(Math.sqrt(component.length))));
    candidates.push(makeCandidate(rgba, component, size, 'component'));
    component.forEach((index) => {
      remaining[index] = 0;
    });
  }

  const passes = [
    [8, 0.35, 0.78, 'coarse'],
    [5, 0.2, 0.78, 'medium'],
    [3, 0.1, 0.72, 'fine'],
  ];

  passes.forEach(([pitch, occupancyThreshold, fillRatio, tier]) => {
    for (let y0 = 0; y0 < SOURCE_HEIGHT; y0 += pitch) {
      const y1 = Math.min(y0 + pitch, SOURCE_HEIGHT);
      for (let x0 = 0; x0 < SOURCE_WIDTH; x0 += pitch) {
        const x1 = Math.min(x0 + pitch, SOURCE_WIDTH);
        const indices = [];
        for (let y = y0; y < y1; y += 1) {
          for (let x = x0; x < x1; x += 1) {
            const index = y * SOURCE_WIDTH + x;
            if (remaining[index]) indices.push(index);
          }
        }
        if (indices.length === 0) continue;
        const occupancy = indices.length / ((x1 - x0) * (y1 - y0));
        if (occupancy < occupancyThreshold) continue;

        const size = Math.max(1, Math.round(pitch * fillRatio));
        candidates.push(makeCandidate(rgba, indices, size, tier));
        indices.forEach((index) => {
          remaining[index] = 0;
        });
      }
    }
  });

  const unclaimed = remaining.reduce((sum, value) => sum + value, 0);
  if (unclaimed > 0) throw new Error(`Extraction left ${unclaimed} source pixels unclaimed`);
  return candidates;
};

const seededRandom = (seed) => {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
};

const distanceSquared = (first, second) => (
  (first[0] - second[0]) ** 2
  + (first[1] - second[1]) ** 2
  + (first[2] - second[2]) ** 2
);

const quantizePalette = (candidates) => {
  const colors = candidates.map((candidate) => candidate.color);
  const random = seededRandom(PALETTE_SEED);
  const centers = [colors[Math.floor(random() * colors.length)].slice()];

  while (centers.length < PALETTE_SIZE) {
    const distances = colors.map((color) => Math.min(...centers.map((center) => distanceSquared(color, center))));
    const total = distances.reduce((sum, value) => sum + value, 0);
    let target = random() * total;
    let selected = colors.length - 1;
    for (let index = 0; index < distances.length; index += 1) {
      target -= distances[index];
      if (target <= 0) {
        selected = index;
        break;
      }
    }
    centers.push(colors[selected].slice());
  }

  const labels = new Int16Array(colors.length);
  for (let iteration = 0; iteration < 50; iteration += 1) {
    const sums = Array.from({ length: PALETTE_SIZE }, () => [0, 0, 0, 0]);
    colors.forEach((color, colorIndex) => {
      let nearest = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;
      centers.forEach((center, centerIndex) => {
        const distance = distanceSquared(color, center);
        if (distance >= nearestDistance) return;
        nearest = centerIndex;
        nearestDistance = distance;
      });
      labels[colorIndex] = nearest;
      sums[nearest][0] += color[0];
      sums[nearest][1] += color[1];
      sums[nearest][2] += color[2];
      sums[nearest][3] += 1;
    });
    sums.forEach((sum, index) => {
      if (sum[3] === 0) return;
      centers[index] = [sum[0] / sum[3], sum[1] / sum[3], sum[2] / sum[3]];
    });
  }

  const order = centers
    .map((center, index) => ({ center, index }))
    .sort((first, second) => (
      first.center[0] - second.center[0]
      || first.center[1] - second.center[1]
      || first.center[2] - second.center[2]
    ));
  const remap = new Int16Array(PALETTE_SIZE);
  order.forEach((entry, index) => {
    remap[entry.index] = index;
  });

  return {
    palette: order.map(({ center }) => center.map((value) => Math.max(0, Math.min(255, Math.round(value))))),
    labels: Array.from(labels, (label) => remap[label]),
  };
};

const makePayload = (candidates, palette, labels) => {
  const left = [];
  const right = [];
  const tierCounts = {};
  const sizeCounts = {};

  candidates.forEach((candidate, index) => {
    let x = Math.round(candidate.centerX - candidate.size / 2);
    const y = Math.round(candidate.centerY - candidate.size / 2);
    const alphaIndex = Math.max(1, Math.min(15, Math.round(candidate.opacity * 15)));
    const record = [x, y, candidate.size, labels[index], alphaIndex];
    if (candidate.centerX < SOURCE_SPLIT_X) left.push(record);
    else {
      x -= SOURCE_SPLIT_X;
      record[0] = x;
      right.push(record);
    }
    tierCounts[candidate.tier] = (tierCounts[candidate.tier] ?? 0) + 1;
    sizeCounts[candidate.size] = (sizeCounts[candidate.size] ?? 0) + 1;
  });

  return {
    version: 1,
    artboard: {
      width: SOURCE_WIDTH,
      height: SOURCE_HEIGHT,
      splitX: SOURCE_SPLIT_X,
      leftRootX: LEFT_ROOT_X,
      rightRootX: RIGHT_ROOT_X,
    },
    palette,
    alphaLevels: Array.from({ length: 16 }, (_, index) => Number((index / 15).toFixed(6))),
    recordFormat: ['x', 'y', 'size', 'colorIndex', 'alphaIndex'],
    left,
    right,
    stats: {
      blocks: candidates.length,
      left: left.length,
      right: right.length,
      tiers: tierCounts,
      sizes: sizeCounts,
    },
  };
};

const renderPreview = async (payload, destination) => {
  const buffer = Buffer.alloc(SOURCE_WIDTH * SOURCE_HEIGHT * 4);
  [[0, payload.left], [SOURCE_SPLIT_X, payload.right]].forEach(([offset, records]) => {
    records.forEach(([x, y, size, colorIndex, alphaIndex]) => {
      const color = payload.palette[colorIndex];
      const alpha = Math.round(payload.alphaLevels[alphaIndex] * 255);
      for (let yy = Math.max(0, y); yy < Math.min(SOURCE_HEIGHT, y + size); yy += 1) {
        for (let xx = Math.max(0, x + offset); xx < Math.min(SOURCE_WIDTH, x + offset + size); xx += 1) {
          const index = (yy * SOURCE_WIDTH + xx) * 4;
          buffer[index] = color[0];
          buffer[index + 1] = color[1];
          buffer[index + 2] = color[2];
          buffer[index + 3] = alpha;
        }
      }
    });
  });
  await sharp(buffer, {
    raw: { width: SOURCE_WIDTH, height: SOURCE_HEIGHT, channels: 4 },
  }).png({ compressionLevel: 9, palette: true }).toFile(path.resolve(destination));
};

const rgba = await extractTransparentTree(sourcePath);
const candidates = extractCandidates(rgba);
const { palette, labels } = quantizePalette(candidates);
const payload = makePayload(candidates, palette, labels);

await import('node:fs/promises').then(({ writeFile }) => writeFile(
  path.resolve(outputPath),
  `${JSON.stringify(payload)}\n`,
  'utf8',
));

if (previewPath) await renderPreview(payload, previewPath);
process.stdout.write(`${JSON.stringify(payload.stats, null, 2)}\n`);
