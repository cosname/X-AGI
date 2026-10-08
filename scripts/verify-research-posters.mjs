import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import sharp from 'sharp';
import { posterResearchPapers } from '../src/data/poster-research.ts';

const digest = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
const sources = JSON.parse(readFileSync('src/data/research-poster-sources.json', 'utf8'));
const manifest = JSON.parse(readFileSync('src/data/research-posters.generated.json', 'utf8'));
assert.equal(manifest.sourcesSha256, digest('src/data/research-poster-sources.json'), 'Reimport after reviewed source changes');
assert.deepEqual(manifest.posters.map((p) => p.id), sources.posters.map((p) => p.id));
assert.deepEqual(posterResearchPapers.map((p) => p.id).sort(), sources.posters.map((p) => p.id).sort(), 'Every submitted poster must be public, with no registration-only entries');
assert.equal(new Set(manifest.posters.map((p) => p.id)).size, manifest.posters.length);
assert.equal(new Set(manifest.posters.map((p) => p.pdfSha256)).size, manifest.posters.length);
const files = [];
for (const poster of manifest.posters) {
  const paper = posterResearchPapers.find((p) => p.id === poster.id);
  const source = sources.posters.find((p) => p.id === poster.id);
  assert.ok(paper, `Unknown paper: ${poster.id}`);
  assert.equal(poster.title, paper.title);
  assert.equal(source.title, paper.title);
  assert.equal(source.applicantName, paper.applicantName);
  assert.deepEqual(Object.keys(paper).sort(), ['affiliation', 'applicantName', 'href', 'id', 'title', 'venue']);
  assert.ok(paper.title && paper.applicantName && paper.affiliation);
  assert.ok(paper.href === null || new URL(paper.href).protocol === 'https:');
  assert.equal(poster.pdfSha256, source.pdfSha256);
  assert.equal(poster.archivePath, `assets/source-archive/2026/research-posters/${poster.id}-poster.pdf`);
  assert.equal(digest(poster.archivePath), source.pdfSha256);
  for (const role of ['thumbnail', 'full']) {
    const image = poster[role];
    assert.equal(image.src, `/2026/research-posters/${poster.id}-${role}.webp`);
    const file = `public${image.src}`;
    assert.equal(digest(file), image.sha256);
    assert.equal(readFileSync(file).length, image.bytes);
    const metadata = await sharp(file).metadata();
    assert.equal(metadata.format, 'webp');
    assert.equal(metadata.width, image.width);
    assert.equal(metadata.height, image.height);
    assert.ok(!metadata.exif && !metadata.iptc && !metadata.xmp);
    assert.ok(image.bytes < (role === 'thumbnail' ? 180_000 : 4_000_000), `Oversized ${role}: ${poster.id}`);
    files.push(image.src.split('/').at(-1));
  }
  assert.ok(Math.abs(poster.thumbnail.width / poster.thumbnail.height - poster.full.width / poster.full.height) < 0.01, 'Poster aspect ratio must be preserved');
}
assert.deepEqual(readdirSync('public/2026/research-posters').sort(), files.sort());
console.log(`Verified ${manifest.posters.length} author-submitted posters with complete public coverage.`);
