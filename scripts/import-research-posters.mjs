import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { posterResearchPapers } from '../src/data/poster-research.ts';

const input = process.argv[2];
assert.ok(input, 'Usage: node scripts/import-research-posters.mjs <submitted-poster-directory>');
const sourceFile = 'src/data/research-poster-sources.json';
const sources = JSON.parse(readFileSync(sourceFile, 'utf8'));
const archiveRoot = 'assets/source-archive/2026';
const archive = JSON.parse(readFileSync(`${archiveRoot}/manifest.json`, 'utf8'));
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const archiveDir = `${archiveRoot}/research-posters`;
const runtimeDir = 'public/2026/research-posters';
const cache = 'output/research-poster-renders';
const manifestFile = 'src/data/research-posters.generated.json';
const previousPosters = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')).posters : [];

// Validate the complete reviewed batch before creating or replacing any assets.
assert.equal(new Set(sources.posters.map((p) => p.id)).size, sources.posters.length, 'Duplicate paper mapping');
assert.equal(new Set(sources.posters.map((p) => p.pdfSha256)).size, sources.posters.length, 'One poster cannot stand in for two papers');
assert.deepEqual(sources.posters.map((p) => p.fileName).sort(), readdirSync(input).filter((file) => /\.pdf$/i.test(file)).sort(), 'Review and include every submitted PDF exactly once');
for (const source of sources.posters) {
  const paper = posterResearchPapers.find((p) => p.id === source.id);
  assert.ok(paper, `Paper is not in the current roster: ${source.id}`);
  assert.equal(source.title, paper.title, `Review changed title: ${source.id}`);
  assert.equal(source.applicantName, paper.applicantName, `Review changed applicant: ${source.id}`);
  assert.equal(path.basename(source.fileName), source.fileName, 'Source must be a filename');
  const file = path.join(input, source.fileName);
  const bytes = readFileSync(file);
  assert.equal(bytes.subarray(0, 5).toString(), '%PDF-', `Not a PDF: ${source.fileName}`);
  assert.equal(digest(bytes), source.pdfSha256, `Review the changed PDF before importing: ${source.fileName}`);
  const info = execFileSync('pdfinfo', [file], { encoding: 'utf8' });
  assert.match(info, /^Pages:\s+1\s*$/m, `Expected a single-page poster: ${source.fileName}`);
}
for (const entry of archive.entries) {
  assert.equal(digest(readFileSync(entry.canonicalPath)), entry.sha256, `Changed archive: ${entry.canonicalPath}`);
}
for (const dir of [archiveDir, runtimeDir, cache]) mkdirSync(dir, { recursive: true });

const posters = [];
for (const source of sources.posters) {
  const archivePath = `${archiveDir}/${source.id}-poster.pdf`;
  const png = `${cache}/${source.id}-${source.pdfSha256}-4000`;
  copyFileSync(path.join(input, source.fileName), archivePath);
  chmodSync(archivePath, 0o644);
  const previous = previousPosters.find((poster) => poster.id === source.id && poster.pdfSha256 === source.pdfSha256);
  const reusable = previous && ['thumbnail', 'full'].every((role) => {
    const image = previous[role];
    return image.src === `/2026/research-posters/${source.id}-${role}.webp`
      && existsSync(`public${image.src}`) && digest(readFileSync(`public${image.src}`)) === image.sha256;
  });
  if (!reusable && !existsSync(`${png}.png`)) {
    execFileSync('pdftoppm', ['-f', '1', '-l', '1', '-singlefile', '-scale-to', '4000', '-png', archivePath, png]);
  }
  const exports = reusable ? { thumbnail: previous.thumbnail, full: previous.full } : {};
  if (!reusable) {
    for (const [role, width, quality] of [['thumbnail', 640, 82], ['full', 4000, 92]]) {
      const src = `/2026/research-posters/${source.id}-${role}.webp`;
      await sharp(`${png}.png`).resize({ width, withoutEnlargement: true }).webp({ quality, effort: 6 }).toFile(`public${src}`);
      const image = await sharp(`public${src}`).metadata();
      const bytes = readFileSync(`public${src}`);
      exports[role] = { src, width: image.width, height: image.height, bytes: bytes.length, sha256: digest(bytes) };
    }
  }
  posters.push({ id: source.id, title: source.title, pdfSha256: source.pdfSha256, archivePath, ...exports });
  const bytes = readFileSync(archivePath);
  const entry = {
    originalPath: `submitted-research-posters/${source.fileName}`,
    canonicalPath: archivePath,
    status: 'archived',
    sha256: source.pdfSha256,
    bytes: bytes.length,
    mediaType: 'application/pdf',
    runtimeCounterparts: Object.values(exports).map((image) => `public${image.src}`),
    note: `Author-submitted research poster, matched to ${source.id} on ${sources.reviewedOn}. Original PDF bytes preserved; only raster previews are published.`,
  };
  const index = archive.entries.findIndex((item) => item.canonicalPath === archivePath);
  if (index < 0) archive.entries.push(entry);
  else archive.entries[index] = entry;
  console.log(`${source.id}: poster archived; ${reusable ? 'verified existing images' : 'rendered new images'}`);
}

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory()
  ? walk(`${dir}/${entry.name}`)
  : ['README.md', 'manifest.json', 'checksums.sha256', '.DS_Store'].includes(entry.name) ? [] : [`${dir}/${entry.name}`]);
const payloads = walk(archiveRoot).sort();
archive.sourceEntryCount = archive.entries.length;
archive.uniquePayloadCount = new Set(archive.entries.map((entry) => entry.sha256)).size;
archive.archiveFileCount = payloads.length;
archive.lastExtendedOn = sources.reviewedOn;
writeFileSync(`${archiveRoot}/manifest.json`, `${JSON.stringify(archive, null, 2)}\n`);
writeFileSync(`${archiveRoot}/checksums.sha256`, payloads.map((file) => `${digest(readFileSync(file))}  ${file}\n`).join(''));
writeFileSync(manifestFile, `${JSON.stringify({
  generatedBy: 'scripts/import-research-posters.mjs',
  sourcesSha256: digest(readFileSync(sourceFile)),
  posters,
}, null, 2)}\n`);
console.log(`Imported ${posters.length} posters for ${posterResearchPapers.length} listed papers.`);
