import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const routePrefix = '/2025/assets/slides/';
const sourceRoot = path.resolve('assets/slides');
const manifest = JSON.parse(
  await readFile('public/2025/downloads-manifest.json', 'utf8'),
);
const failures = [];

async function sha256(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

for (const download of manifest.downloads ?? []) {
  if (!download.path.startsWith(routePrefix)) {
    failures.push(`Invalid archive path: ${download.path}`);
    continue;
  }

  const relativePath = download.path.slice(routePrefix.length);
  const file = path.join(sourceRoot, relativePath);

  try {
    const metadata = await stat(file);
    if (metadata.size !== download.bytes) {
      failures.push(`Byte-size mismatch: ${download.path}`);
      continue;
    }
    if ((await sha256(file)) !== download.sha256) {
      failures.push(`SHA-256 mismatch: ${download.path}`);
    }
  } catch {
    failures.push(`Missing local download: ${download.path}`);
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Verified ${manifest.downloads.length} archive downloads`);
