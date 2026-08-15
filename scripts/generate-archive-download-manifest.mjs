import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const sourceRoot = path.resolve('assets/slides');
const outputPath = path.resolve('public/2025/downloads-manifest.json');

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === '.DS_Store') continue;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolutePath)));
    if (entry.isFile()) files.push(absolutePath);
  }

  return files;
}

async function sha256(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

const files = await walk(sourceRoot);
const downloads = [];

for (const file of files.sort()) {
  const relativePath = path.relative(sourceRoot, file).split(path.sep).join('/');
  const metadata = await stat(file);
  downloads.push({
    path: `/2025/assets/slides/${relativePath}`,
    bytes: metadata.size,
    sha256: await sha256(file),
  });
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `${JSON.stringify({ downloads }, null, 2)}\n`,
);

console.log(`Wrote ${downloads.length} archive downloads to ${outputPath}`);
