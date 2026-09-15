import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { sessionPosters } from '../src/data/session-posters.ts';
import { sessionPosterHtml } from './lib/session-poster-template.mjs';
import { fileDigest, posterContentHash, posterInputs, posterManifestPath } from './lib/session-poster-integrity.mjs';

const exec = promisify(execFile);
const outputRoot = 'output/session-posters-20260916';
const archiveRoot = 'assets/source-archive/2026/session-posters';
const runtimeRoot = 'public/2026/session-posters';
const selectedId = process.argv.find((arg) => arg.startsWith('--session='))?.split('=')[1];
const posters = selectedId ? sessionPosters.filter((poster) => poster.id === selectedId) : sessionPosters;
if (!posters.length) throw new Error(`Unknown session: ${selectedId}`);
await mkdir(outputRoot, { recursive: true });
await mkdir(runtimeRoot, { recursive: true });
const pages = new Map();
for (const poster of posters) {
  const html = sessionPosterHtml(poster, `${archiveRoot}/${poster.id}-background.png`);
  pages.set(`/${poster.id}.html`, html);
  await writeFile(`${outputRoot}/${poster.id}.html`, html);
}
if (process.argv.includes('--prepare')) {
  console.log(`Prepared ${posters.length} self-contained poster HTML files in ${outputRoot}.`);
  process.exit(0);
}

const server = createServer((request, response) => {
  const html = pages.get(request.url);
  response.writeHead(html ? 200 : 404, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(html ?? 'Not found');
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const browserSession = `xagi-poster-export-${process.pid}`;
const env = { ...process.env, CHROME_DEVTOOLS_AXI_SESSION: browserSession };
const browser = async (...args) => {
  const result = await exec('chrome-devtools-axi', args, { env, maxBuffer: 4 * 1024 * 1024, timeout: 60_000 });
  return result.stdout;
};
const entries = [];
try {
  for (const [index, poster] of posters.entries()) {
    await browser('open', `http://127.0.0.1:${port}/${poster.id}.html`);
    if (index === 0) await browser('emulate', '--viewport', '1080x1440x1', '--color-scheme', 'light');
    const report = await browser('eval', `async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(image => image.decode()));
      const problems = [];
      for (const card of document.querySelectorAll('.speaker')) {
        const bounds = card.getBoundingClientRect();
        for (const text of card.querySelectorAll('[data-fit]')) {
          const rect = text.getBoundingClientRect();
          if (rect.bottom > bounds.bottom - 16 || rect.right > bounds.right - 16 || text.scrollWidth > text.clientWidth + 1) {
            problems.push(card.dataset.person + ': ' + text.textContent);
          }
        }
      }
      const title = document.querySelector('h1').getBoundingClientRect();
      if (title.bottom > document.querySelector('.chairs').getBoundingClientRect().top - 12) problems.push('Session heading overlaps Chair');
      if (document.documentElement.scrollWidth > 1080 || document.documentElement.scrollHeight > 1440) problems.push('Page overflow');
      const result = {id: '${poster.id}', width: innerWidth, height: innerHeight, problems, userAgent: navigator.userAgent, font: getComputedStyle(document.body).fontFamily};
      document.documentElement.dataset.exportReady = problems.length ? 'false' : 'true';
      return result;
    }`);
    await writeFile(`${outputRoot}/${poster.id}-layout.txt`, report);
    const resultLine = report.split('\n').find((line) => line.startsWith('result: '));
    const outerResult = resultLine ? JSON.parse(resultLine.slice('result: '.length)) : null;
    const layout = typeof outerResult === 'string' ? JSON.parse(outerResult) : outerResult;
    if (!layout || layout.problems.length || layout.width !== 1080 || layout.height !== 1440) {
      throw new Error(`Poster layout check did not pass for ${poster.id}: ${report}`);
    }
    const printPath = `${archiveRoot}/${poster.id}-print.png`;
    await browser('screenshot', path.resolve(printPath));
    const exports = {};
    await sharp(printPath).webp({ quality: 94, effort: 6 }).toFile(`public${poster.posterSrc}`);
    await sharp(printPath).resize(540, 720).webp({ quality: 86, effort: 6 }).toFile(`public${poster.previewSrc}`);
    for (const file of [printPath, `public${poster.posterSrc}`, `public${poster.previewSrc}`]) {
      const metadata = await sharp(file).metadata();
      exports[file] = { sha256: fileDigest(file), bytes: (await readFile(file)).length, width: metadata.width, height: metadata.height };
    }
    entries.push({ id: poster.id, contentHash: posterContentHash(poster), inputs: posterInputs(poster), exports });
    console.log(`${poster.id}: exact text and layout checked; PNG master, WebP and preview exported.`);
  }
  if (!selectedId) {
    await writeFile(posterManifestPath, `${JSON.stringify({
      schemaVersion: 1,
      generatedBy: 'scripts/render-session-posters.mjs',
      generatedAt: new Date().toISOString(),
      renderEnvironment: 'Chrome on macOS; PingFang SC and embedded IBM Plex Sans Condensed',
      posters: entries,
    }, null, 2)}\n`);
    console.log(`Wrote ${posterManifestPath}. Register source archive with node scripts/register-session-poster-archive.mjs.`);
  }
} finally {
  try { await browser('stop'); } finally { await new Promise((resolve) => server.close(resolve)); }
}
