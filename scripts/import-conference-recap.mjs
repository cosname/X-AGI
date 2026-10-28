import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const archiveRoot = 'assets/source-archive/2026';
const sourcePath = `${archiveRoot}/conference-recap/conference-recap-article.md`;
const [input = sourcePath, cache] = process.argv.slice(2);
const source = await readFile(input);
const curation = JSON.parse(await readFile('src/data/conference-recap-curation.json', 'utf8'));
const manifest = JSON.parse(await readFile(`${archiveRoot}/manifest.json`, 'utf8'));
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const images = {};

async function register(bytes, basename, originalPath, runtimeCounterparts, extra = {}) {
  const sha256 = digest(bytes);
  const existing = manifest.entries.find((entry) => entry.sha256 === sha256);
  const canonicalPath = existing?.canonicalPath ?? `${archiveRoot}/conference-recap/${basename}`;
  if (!existing) {
    await mkdir(path.dirname(canonicalPath), { recursive: true });
    await writeFile(canonicalPath, bytes);
  }
  const record = {
    originalPath, canonicalPath, status: existing && existing.originalPath !== originalPath ? 'exact-duplicate' : 'archived',
    sha256, bytes: bytes.length, runtimeCounterparts, ...extra,
  };
  const index = manifest.entries.findIndex((entry) => entry.originalPath === originalPath);
  if (index === -1) manifest.entries.push(record);
  else manifest.entries[index] = record;
  return canonicalPath;
}

await register(source, 'conference-recap-article.md', 'conference-recap-20261025/article.md', [], {
  mediaType: 'text/markdown',
  note: 'Organizer-authored conference recap supplied for republication on the conference website. Original Markdown bytes are preserved.',
});

const imagePattern = /!\[Image\]\(([^)]+)\)/g;
const matches = [...source.toString().matchAll(imagePattern)];
const imageByHash = new Map();
await mkdir('src/assets/2026/recap', { recursive: true });
for (const match of matches) {
  const url = new URL(match[1]);
  const sourceIndex = url.hash.match(/imgIndex=(\d+)/)?.[1];
  const item = curation.images[sourceIndex];
  if (!item || url.protocol !== 'https:' || url.hostname !== 'mmbiz.qpic.cn') {
    throw new Error(`Unreviewed recap image: ${sourceIndex}`);
  }
  url.hash = '';
  let bytes;
  if (cache) bytes = await readFile(path.join(cache, `image-${sourceIndex.padStart(2, '0')}`));
  else {
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Recap image ${sourceIndex}: HTTP ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
  }
  const metadata = await sharp(bytes).metadata();
  if (!['jpeg', 'png', 'webp'].includes(metadata.format) || !metadata.width || !metadata.height) {
    throw new Error(`Invalid recap image ${sourceIndex}`);
  }
  const sha256 = digest(bytes);
  const basename = imageByHash.get(sha256) ?? `recap-${item.id}.webp`;
  const runtime = `src/assets/2026/recap/${basename}`;
  if (!imageByHash.has(sha256)) {
    await sharp(bytes).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 86 }).toFile(runtime);
    imageByHash.set(sha256, basename);
  }
  const canonicalPath = await register(bytes, `recap-${item.id}.${metadata.format === 'jpeg' ? 'jpg' : metadata.format}`,
    `conference-recap-20261025/image-${sourceIndex.padStart(2, '0')}.${metadata.format}`, [runtime], {
      mediaType: `image/${metadata.format}`,
      dimensions: { width: metadata.width, height: metadata.height },
      sourceUrl: url.href,
      note: 'Image from the organizer-supplied recap. Preserve the original bytes; the website uses a metadata-free WebP export.',
    });
  images[sourceIndex] = { basename, alt: item.alt, sourcePath: canonicalPath, sourceSha256: sha256 };
}

const blocks = [];
const anchorCounts = new Map();
const plainText = (text) => text.replace(/\*\*/g, '').replace(/\u2014+/g, '，').trim();
for (const paragraph of source.toString().trim().split(/\n\s*\n/)) {
  if (paragraph.startsWith('X-AGI 组委会 统计之都 ') || ['左右滑动查看更多', 'Read more', '报告人'].includes(paragraph)) continue;
  const imageMatches = [...paragraph.matchAll(imagePattern)];
  if (imageMatches.length) {
    const imageIds = imageMatches.map((match) => new URL(match[1]).hash.match(/imgIndex=(\d+)/)[1]);
    if (imageIds.some((id) => !images[id])) throw new Error('Missing imported recap image');
    blocks.push({ type: 'gallery', images: imageIds });
    continue;
  }
  const heading = paragraph.match(/^\*\*([^*]+)\*\*$/)?.[1];
  if (heading && curation.headings[heading]) {
    const [level, anchor] = curation.headings[heading];
    const count = (anchorCounts.get(anchor) ?? 0) + 1;
    anchorCounts.set(anchor, count);
    blocks.push({ type: 'heading', level, id: count === 1 ? anchor : `${anchor}-${count}`, text: heading });
    continue;
  }
  const text = plainText(paragraph);
  if (text.startsWith('·')) {
    if (blocks.at(-1)?.type !== 'list') blocks.push({ type: 'list', items: [] });
    blocks.at(-1).items.push(text.replace(/^·\s*/, ''));
  } else blocks.push({ type: 'paragraph', text });
}

const document = {
  generatedBy: 'scripts/import-conference-recap.mjs; do not edit by hand',
  title: curation.title, author: curation.author, publication: curation.publication,
  publishedDate: curation.publishedDate, sourceSha256: digest(source),
  featuredImages: curation.featuredImages.map(String), images, blocks,
};
await writeFile('src/data/conference-recap.generated.json', `${JSON.stringify(document, null, 2)}\n`);

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = `${directory}/${entry.name}`;
    if (entry.isDirectory()) files.push(...await walk(file));
    else if (!['README.md', 'manifest.json', 'checksums.sha256', '.DS_Store'].includes(entry.name)) files.push(file);
  }
  return files.sort();
}
const payloads = await walk(archiveRoot);
manifest.sourceEntryCount = manifest.entries.length;
manifest.uniquePayloadCount = new Set(manifest.entries.map((entry) => entry.sha256)).size;
manifest.archiveFileCount = payloads.length;
manifest.lastExtendedOn = '2026-10-27';
await writeFile(`${archiveRoot}/manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(`${archiveRoot}/checksums.sha256`, (await Promise.all(payloads.map(async (file) => `${digest(await readFile(file))}  ${file}\n`))).join(''));
console.log(`Imported recap: ${blocks.length} blocks, ${matches.length} image placements, ${imageByHash.size} unique images.`);
