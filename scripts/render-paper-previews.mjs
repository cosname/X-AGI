import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { posterResearchPapers } from '../src/data/poster-research.generated.ts';

// PDFs stay in the ignored cache; only their first-page raster is archived/published.
const cache = process.argv[2];
if (!cache) throw new Error('Usage: node scripts/render-paper-previews.mjs <PDF-cache-directory>');
const sources = JSON.parse(readFileSync('src/data/paper-preview-sources.json', 'utf8'));
const archiveRoot = 'assets/source-archive/2026';
const archive = JSON.parse(readFileSync(`${archiveRoot}/manifest.json`, 'utf8'));
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const normalize = (text) => text.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g, '');
assert.equal(sources.sourceKind, 'attendee-submitted-pdf');
assert.deepEqual(sources.papers.map((source) => source.id), posterResearchPapers.map((paper) => paper.id), 'Every paper requires its submitted PDF');
for (const entry of archive.entries) {
  if (digest(readFileSync(entry.canonicalPath)) !== entry.sha256) throw new Error(`Changed archive source: ${entry.canonicalPath}`);
}
for (const dir of [`${archiveRoot}/paper-previews`, 'public/2026/paper-previews']) mkdirSync(dir, { recursive: true });
// Check the whole batch before replacing any existing images or archive entries.
const titleMismatches = [];
for (const source of sources.papers) {
  const paper = posterResearchPapers.find((paper) => paper.id === source.id);
  if (!paper || paper.title !== source.title) throw new Error(`Stale source: ${source.id}`);
  const pdf = path.join(cache, `${source.id}.pdf`);
  const bytes = readFileSync(pdf);
  if (bytes.subarray(0, 5).toString() !== '%PDF-' || digest(bytes) !== source.pdfSha256) throw new Error(`PDF hash mismatch: ${source.id}`);
  const titleText = execFileSync('pdftotext', ['-f', '1', '-l', '1', pdf, '-'], { encoding: 'utf8' });
  if (!normalize(titleText).includes(normalize(source.pdfTitle ?? paper.title))) titleMismatches.push(source.id);
}
if (titleMismatches.length) throw new Error(`PDF title mismatch: ${titleMismatches.join(', ')}`);
const previews = [];
for (const source of sources.papers) {
  const paper = posterResearchPapers.find((paper) => paper.id === source.id);
  const pdf = path.join(cache, `${source.id}.pdf`);
  const archivePath = `${archiveRoot}/paper-previews/${source.id}-first-page.png`;
  execFileSync('pdftoppm', ['-f', '1', '-l', '1', '-singlefile', '-scale-to', '1400', '-png', pdf, archivePath.slice(0, -4)]);
  const src = `/2026/paper-previews/${source.id}-preview.webp`;
  await sharp(archivePath).resize({ width: 640, withoutEnlargement: true }).webp({ quality: 88, effort: 6 }).toFile(`public${src}`);
  const image = await sharp(`public${src}`).metadata();
  const original = await sharp(archivePath).metadata();
  const png = readFileSync(archivePath);
  const webp = readFileSync(`public${src}`);
  previews.push({ id: source.id, title: paper.title, href: paper.href, sourceKind: sources.sourceKind, pdfSha256: source.pdfSha256, src, width: image.width, height: image.height, bytes: webp.length, sha256: digest(webp), archivePath, archiveSha256: digest(png) });
  const originalPath = `submitted-paper-previews/${path.basename(archivePath)}`;
  const record = { originalPath, canonicalPath: archivePath, status: 'archived', sha256: digest(png), bytes: png.length, mediaType: 'image/png', dimensions: { width: original.width, height: original.height }, runtimeCounterparts: [`public${src}`], note: `First page rendered from the attendee-submitted paper PDF. PDF SHA-256: ${source.pdfSha256}. Workbook SHA-256: ${sources.workbookSha256}.` };
  const index = archive.entries.findIndex((entry) => entry.canonicalPath === archivePath);
  if (index >= 0) archive.entries[index] = record;
  else archive.entries.push(record);
  console.log(`${source.id}: first page title checked and rendered`);
}
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(`${dir}/${entry.name}`) : ['README.md', 'manifest.json', 'checksums.sha256', '.DS_Store'].includes(entry.name) ? [] : [`${dir}/${entry.name}`]);
const payloads = walk(archiveRoot).sort();
archive.sourceEntryCount = archive.entries.length;
archive.uniquePayloadCount = new Set(archive.entries.map((entry) => entry.sha256)).size;
archive.archiveFileCount = payloads.length;
archive.lastExtendedOn = sources.checkedOn;
writeFileSync(`${archiveRoot}/manifest.json`, `${JSON.stringify(archive, null, 2)}\n`);
writeFileSync(`${archiveRoot}/checksums.sha256`, payloads.map((file) => `${digest(readFileSync(file))}  ${file}\n`).join(''));
writeFileSync('src/data/paper-previews.generated.json', `${JSON.stringify({ generatedBy: 'scripts/render-paper-previews.mjs', sourcesSha256: digest(readFileSync('src/data/paper-preview-sources.json')), previews }, null, 2)}\n`);
console.log(`Rendered ${previews.length}/${posterResearchPapers.length} attendee-submitted paper previews.`);
