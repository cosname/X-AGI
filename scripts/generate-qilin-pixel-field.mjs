import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

// Sample the supplied transparent character into the site's DOM mosaic.
const source = new URL('../assets/source-archive/2026/brand/qilin-leaping-source.png', import.meta.url);
const output = new URL('../src/data/qilin-pixel-field.generated.json', import.meta.url);
const bytes = await readFile(source);
const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
let left = info.width;
let top = info.height;
let right = 0;
let bottom = 0;
for (let y = 0; y < info.height; y += 1) {
  for (let x = 0; x < info.width; x += 1) {
    if (data[(y * info.width + x) * 4 + 3] < 128) continue;
    left = Math.min(left, x);
    top = Math.min(top, y);
    right = Math.max(right, x);
    bottom = Math.max(bottom, y);
  }
}
if (left > right || top > bottom) throw new Error('The qilin source contains no visible pixels.');

const columns = 56;
const step = (right - left + 1) / columns;
const rows = Math.ceil((bottom - top + 1) / step);
const palette = ['91 70 164', '126 98 191', '171 151 212', '212 201 233', '238 231 242', '204 171 106'];
const pixels = [];
for (let row = 0; row < rows; row += 1) {
  for (let column = 0; column < columns; column += 1) {
    let weight = 0;
    let samples = 0;
    const color = [0, 0, 0];
    for (let y = Math.floor(top + row * step); y < Math.min(info.height, top + (row + 1) * step); y += 1) {
      for (let x = Math.floor(left + column * step); x < Math.min(info.width, left + (column + 1) * step); x += 1) {
        const index = (y * info.width + x) * 4;
        const alpha = data[index + 3] / 255;
        weight += alpha;
        samples += 1;
        for (let channel = 0; channel < 3; channel += 1) color[channel] += data[index + channel] * alpha;
      }
    }
    const coverage = weight / samples;
    if (coverage < 0.24) continue;
    const [red, green, blue] = color.map((value) => value / weight);
    const light = Math.min(red, green, blue);
    const tone = red > blue * 1.12 && green > blue * 1.06 ? 5
      : light > 220 ? 4 : light > 170 ? 3 : light > 100 ? 2 : green > 35 ? 1 : 0;
    pixels.push([column, row, tone, coverage < 0.5 ? 1 : 0]);
  }
}

await writeFile(output, `${JSON.stringify({
  generatedBy: 'scripts/generate-qilin-pixel-field.mjs',
  sourceSha256: createHash('sha256').update(bytes).digest('hex'),
  width: columns,
  height: rows,
  palette,
  pixels,
})}\n`);
console.log(`Generated ${pixels.length} qilin pixels (${columns} x ${rows}).`);
