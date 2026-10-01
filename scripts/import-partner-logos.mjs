import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { partnerLogoByName } from '../src/data/partner-logo-assets-2026.ts';

const [input, date, ...requested] = process.argv.slice(2);
if (!input || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) {
  throw new Error('Usage: node scripts/import-partner-logos.mjs <curated-svg-directory> <YYYY-MM-DD> [logo.svg ...]');
}
const root = 'assets/source-archive/2026';
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(await readFile(`${root}/manifest.json`, 'utf8'));
const selected = [...new Set(Object.values(partnerLogoByName).map((logo) => path.basename(logo.src)))];
const names = requested.length ? [...new Set(requested)] : selected;
const unknown = names.filter((name) => !selected.includes(name));
if (unknown.length) throw new Error(`Unknown partner logo: ${unknown.join(', ')}`);
// Read and validate the complete supplied batch before changing published assets.
const batch = await Promise.all(names.map(async (name) => {
  const bytes = await readFile(path.join(input, name));
  const svg = bytes.toString();
  if (!name.endsWith('.svg') || !svg.includes('<svg')
    || /<(?:script|foreignObject)\b|\bon\w+\s*=|(?:href|src)\s*=\s*["'](?:https?:|file:|\/\/)/i.test(svg)) {
    throw new Error(`Expected a self-contained static SVG: ${name}`);
  }
  const dimensions = await sharp(bytes).metadata();
  return { name, bytes, dimensions, sha256: digest(bytes) };
}));
for (const item of batch) {
  const runtime = `public/2026/logos/${item.name}`;
  const originalPath = `partner-logos-${date}/${item.name}`;
  const existing = manifest.entries.find((entry) => entry.sha256 === item.sha256);
  const canonicalPath = existing?.canonicalPath ?? `${root}/partner-logos-${date}/${item.name}`;
  await mkdir(path.dirname(canonicalPath), { recursive: true });
  if (!existing) await writeFile(canonicalPath, item.bytes);
  // Add a viewBox to supplied fixed-size SVGs so they scale in the page.
  let svg = item.bytes.toString();
  if (!/<svg[^>]*\bviewBox=/.test(svg)) {
    svg = svg.replace('<svg ', `<svg viewBox="0 0 ${item.dimensions.width} ${item.dimensions.height}" `);
  }
  await writeFile(runtime, svg);
  const record = {
    originalPath, canonicalPath, status: existing ? 'exact-duplicate' : 'archived',
    sha256: item.sha256, bytes: item.bytes.length, mediaType: 'image/svg+xml',
    dimensions: { width: item.dimensions.width, height: item.dimensions.height },
    runtimeCounterparts: [runtime],
    note: 'Organizer-supplied selected vector logo. Source preserved exactly; runtime may add a viewBox for responsive sizing.',
  };
  const index = manifest.entries.findIndex((entry) => entry.originalPath === originalPath);
  if (index < 0) manifest.entries.push(record); else manifest.entries[index] = record;
  for (const entry of manifest.entries) {
    entry.runtimeCounterparts = entry.runtimeCounterparts.map((file) =>
      file === runtime.replace(/\.svg$/, '.png') ? runtime : file);
  }
}
if (!requested.length) {
  for (const name of await readdir('public/2026/logos')) {
    if (!selected.includes(name)) await rm(`public/2026/logos/${name}`);
  }
}
async function walk(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = `${dir}/${entry.name}`;
    if (entry.isDirectory()) result.push(...await walk(file));
    else if (!['README.md', 'manifest.json', 'checksums.sha256', '.DS_Store'].includes(entry.name)) result.push(file);
  }
  return result.sort();
}
const files = await walk(root);
manifest.sourceEntryCount = manifest.entries.length;
manifest.uniquePayloadCount = new Set(manifest.entries.map((entry) => entry.sha256)).size;
manifest.archiveFileCount = files.length;
manifest.lastExtendedOn = date;
await writeFile(`${root}/manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(`${root}/checksums.sha256`, (await Promise.all(files.map(async (file) => `${digest(await readFile(file))}  ${file}\n`))).join(''));
console.log(`Imported ${batch.length} selected partner logos.`);
