import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';

const source = path.resolve('dist');
const destination = path.resolve('upload');
const keepInUpload = new Set(['README.md']);
const skipFromDist = new Set(['CNAME']);

try {
  await stat(source);
} catch {
  throw new Error('dist/ is missing. Run `npm run build` before preparing the OSS upload folder.');
}

await mkdir(destination, { recursive: true });

for (const entry of await readdir(destination, { withFileTypes: true })) {
  if (keepInUpload.has(entry.name)) continue;
  await rm(path.join(destination, entry.name), { recursive: true, force: true });
}

for (const entry of await readdir(source, { withFileTypes: true })) {
  if (skipFromDist.has(entry.name)) continue;
  await cp(path.join(source, entry.name), path.join(destination, entry.name), {
    recursive: true,
  });
}

const uploaded = (await readdir(destination)).filter((name) => !keepInUpload.has(name));
console.log(`Prepared ${uploaded.length} OSS upload entries in ${path.relative(process.cwd(), destination)}/`);
