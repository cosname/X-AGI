import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// Re-encode owned 2026 PNGs, preserving dimensions, pixels and available metadata.
// Run without --write to inspect savings; archived source deliveries remain untouched.
const runtimeRoot = fileURLToPath(new URL('../public/2026/', import.meta.url));
const write = process.argv.includes('--write');
const results = [];
const skipped = [];

async function optimize(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await optimize(file);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith('.png')) continue;
    const original = await readFile(file);
    const optimized = await sharp(original).keepMetadata().png({ compressionLevel: 9, palette: false }).toBuffer();
    if (optimized.length >= original.length) continue;
    const before = await sharp(original).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const after = await sharp(optimized).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    if (before.info.width !== after.info.width || before.info.height !== after.info.height || !before.data.equals(after.data)) {
      skipped.push({ file: path.relative(runtimeRoot, file), reason: 'Metadata/color conversion changed decoded pixels; original retained.' });
      continue;
    }
    if (write) await writeFile(file, optimized);
    results.push({ file: path.relative(runtimeRoot, file), before: original.length, after: optimized.length });
  }
}

await optimize(runtimeRoot);
console.log(JSON.stringify({ write, savedBytes: results.reduce((total, row) => total + row.before - row.after, 0), files: results, skipped }, null, 2));
