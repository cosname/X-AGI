import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import sharp from 'sharp';
import { posterResearchPapers } from '../src/data/poster-research.generated.ts';

const read = (file) => JSON.parse(readFileSync(file, 'utf8'));
const digest = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
const sources = read('src/data/paper-preview-sources.json');
const manifest = read('src/data/paper-previews.generated.json');
assert.ok(!existsSync('public/2026/paper-previews'), 'Historical paper previews must not be published');
assert.equal(manifest.sourcesSha256, digest('src/data/paper-preview-sources.json'), 'Regenerate previews after source changes');
assert.equal(sources.sourceKind, 'attendee-submitted-pdf');
assert.match(sources.workbookSha256, /^[a-f0-9]{64}$/);
assert.deepEqual(sources.papers.map((p) => p.id), posterResearchPapers.map((p) => p.id), 'Every paper needs its submitted PDF');
assert.deepEqual(manifest.previews.map((p) => p.id), sources.papers.map((p) => p.id));
for (const source of sources.papers) {
  assert.equal(source.title, posterResearchPapers.find((p) => p.id === source.id).title, `Stale title: ${source.id}`);
  assert.deepEqual(Object.keys(source).sort(), ['id', 'title', 'submissionKey', 'pdfSha256', ...(source.pdfTitle ? ['pdfTitle'] : [])].sort(), 'Attachment URLs and private fields must never enter the manifest');
  assert.match(source.submissionKey, /^[a-f0-9]{64}$/);
  assert.match(source.pdfSha256, /^[a-f0-9]{64}$/);
}
for (const preview of manifest.previews) {
  const source = sources.papers.find((p) => p.id === preview.id);
  assert.deepEqual(Object.keys(preview).sort(), ['id', 'title', 'href', 'sourceKind', 'pdfSha256', 'archivePath', 'archiveSha256'].sort());
  assert.equal(preview.sourceKind, sources.sourceKind);
  assert.equal(preview.href, posterResearchPapers.find((p) => p.id === preview.id).href);
  assert.equal(preview.pdfSha256, source.pdfSha256);
  assert.equal(preview.title, source.title);
  assert.equal(preview.archivePath, `assets/source-archive/2026/paper-previews/${preview.id}-first-page.png`);
  assert.equal(digest(preview.archivePath), preview.archiveSha256);
  const image = await sharp(preview.archivePath).metadata();
  assert.ok(image.width > 0 && image.height > 0 && Math.max(image.width, image.height) <= 1400);
  assert.equal(image.format, 'png');
  assert.ok(!image.exif && !image.iptc && !image.xmp);
}
console.log(`Verified ${manifest.previews.length} archived attendee-submitted PDF previews, source hashes, titles and metadata.`);
