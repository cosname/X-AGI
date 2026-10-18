import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, rmdirSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { posterResearchPapers } from '../src/data/poster-research.generated.ts';

// PDFs stay in the ignored cache. Their first-page rasters are historical archive records.
const cache = process.argv[2];
if (!cache || process.argv.length !== 3) {
  throw new Error('Usage: node scripts/render-paper-previews.mjs <PDF-cache-directory> | --reuse-archive');
}
const reuseArchive = cache === '--reuse-archive';
const sources = JSON.parse(readFileSync('src/data/paper-preview-sources.json', 'utf8'));
const archiveRoot = 'assets/source-archive/2026';
const archive = JSON.parse(readFileSync(`${archiveRoot}/manifest.json`, 'utf8'));
const previewManifestPath = 'src/data/paper-previews.generated.json';
const previous = existsSync(previewManifestPath) ? JSON.parse(readFileSync(previewManifestPath, 'utf8')) : undefined;
const retiredRoot = 'public/2026/paper-previews';
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const normalize = (text) => text.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g, '');
assert.equal(sources.sourceKind, 'attendee-submitted-pdf');
assert.deepEqual(sources.papers.map((source) => source.id), posterResearchPapers.map((paper) => paper.id), 'Every paper requires its submitted PDF');
if (reuseArchive) {
  assert.equal(previous?.sourcesSha256, digest(readFileSync('src/data/paper-preview-sources.json')), 'Archive reuse requires unchanged PDF sources');
  assert.deepEqual(previous.previews.map((preview) => preview.id), sources.papers.map((source) => source.id));
}
for (const entry of archive.entries) {
  if (digest(readFileSync(entry.canonicalPath)) !== entry.sha256) throw new Error(`Changed archive source: ${entry.canonicalPath}`);
}
// Retire only the exact, previously generated publication set after validating every file.
const retiredFiles = existsSync(retiredRoot) ? readdirSync(retiredRoot).sort() : [];
if (retiredFiles.length) {
  assert.deepEqual(retiredFiles, sources.papers.map((source) => `${source.id}-preview.webp`).sort(), 'Unexpected or incomplete paper preview publication set');
  for (const source of sources.papers) {
    const preview = previous?.previews.find((entry) => entry.id === source.id);
    assert.equal(preview?.src, `/2026/paper-previews/${source.id}-preview.webp`);
    const bytes = readFileSync(`public${preview.src}`);
    assert.equal(digest(bytes), preview.sha256, `Changed preview export: ${source.id}`);
    assert.equal(bytes.length, preview.bytes);
  }
}
// Check the whole batch before replacing any existing images or archive entries.
const titleMismatches = [];
for (const source of sources.papers) {
  const paper = posterResearchPapers.find((paper) => paper.id === source.id);
  if (!paper || paper.title !== source.title) throw new Error(`Stale source: ${source.id}`);
  if (reuseArchive) {
    const preview = previous.previews.find((entry) => entry.id === source.id);
    assert.equal(preview.title, source.title);
    assert.equal(preview.href, paper.href);
    assert.equal(preview.sourceKind, sources.sourceKind);
    assert.equal(preview.pdfSha256, source.pdfSha256);
    assert.equal(preview.archivePath, `${archiveRoot}/paper-previews/${source.id}-first-page.png`);
    assert.equal(digest(readFileSync(preview.archivePath)), preview.archiveSha256, `Changed archived preview: ${source.id}`);
    continue;
  }
  const pdf = path.join(cache, `${source.id}.pdf`);
  const bytes = readFileSync(pdf);
  if (bytes.subarray(0, 5).toString() !== '%PDF-' || digest(bytes) !== source.pdfSha256) throw new Error(`PDF hash mismatch: ${source.id}`);
  const titleText = execFileSync('pdftotext', ['-f', '1', '-l', '1', pdf, '-'], { encoding: 'utf8' });
  if (!normalize(titleText).includes(normalize(source.pdfTitle ?? paper.title))) titleMismatches.push(source.id);
}
if (titleMismatches.length) throw new Error(`PDF title mismatch: ${titleMismatches.join(', ')}`);
mkdirSync(`${archiveRoot}/paper-previews`, { recursive: true });
const previews = [];
for (const source of sources.papers) {
  const paper = posterResearchPapers.find((paper) => paper.id === source.id);
  const pdf = path.join(cache, `${source.id}.pdf`);
  const archivePath = `${archiveRoot}/paper-previews/${source.id}-first-page.png`;
  if (!reuseArchive) execFileSync('pdftoppm', ['-f', '1', '-l', '1', '-singlefile', '-scale-to', '1400', '-png', pdf, archivePath.slice(0, -4)]);
  const original = await sharp(archivePath).metadata();
  const png = readFileSync(archivePath);
  previews.push({ id: source.id, title: paper.title, href: paper.href, sourceKind: sources.sourceKind, pdfSha256: source.pdfSha256, archivePath, archiveSha256: digest(png) });
  const originalPath = `submitted-paper-previews/${path.basename(archivePath)}`;
  const index = archive.entries.findIndex((entry) => entry.canonicalPath === archivePath);
  const runtimeCounterparts = (index < 0 ? [] : archive.entries[index].runtimeCounterparts)
    .filter((file) => file !== `${retiredRoot}/${source.id}-preview.webp`);
  const record = { ...(index < 0 ? {} : archive.entries[index]), originalPath, canonicalPath: archivePath, status: 'archived', sha256: digest(png), bytes: png.length, mediaType: 'image/png', dimensions: { width: original.width, height: original.height }, runtimeCounterparts, note: `First page rendered from the attendee-submitted paper PDF. PDF SHA-256: ${source.pdfSha256}. Workbook SHA-256: ${sources.workbookSha256}.` };
  if (index >= 0) archive.entries[index] = record;
  else archive.entries.push(record);
  console.log(`${source.id}: ${reuseArchive ? 'existing archive hashes verified' : 'first page title checked and archived'}`);
}
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(`${dir}/${entry.name}`) : ['README.md', 'manifest.json', 'checksums.sha256', '.DS_Store'].includes(entry.name) ? [] : [`${dir}/${entry.name}`]);
const payloads = walk(archiveRoot).sort();
archive.sourceEntryCount = archive.entries.length;
archive.uniquePayloadCount = new Set(archive.entries.map((entry) => entry.sha256)).size;
archive.archiveFileCount = payloads.length;
if (!reuseArchive) archive.lastExtendedOn = [archive.lastExtendedOn, sources.checkedOn].filter(Boolean).sort().at(-1);
writeFileSync(`${archiveRoot}/manifest.json`, `${JSON.stringify(archive, null, 2)}\n`);
writeFileSync(`${archiveRoot}/checksums.sha256`, payloads.map((file) => `${digest(readFileSync(file))}  ${file}\n`).join(''));
writeFileSync(previewManifestPath, `${JSON.stringify({ generatedBy: 'scripts/render-paper-previews.mjs', sourcesSha256: digest(readFileSync('src/data/paper-preview-sources.json')), previews }, null, 2)}\n`);
for (const file of retiredFiles) unlinkSync(`${retiredRoot}/${file}`);
if (existsSync(retiredRoot)) rmdirSync(retiredRoot);
console.log(`Archived ${previews.length}/${posterResearchPapers.length} attendee-submitted paper previews; retired ${retiredFiles.length} unused WebP exports.`);
