import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { conference2026 } from '../src/data/conference2026.ts';
import { editions } from '../src/config/site.ts';

const root = path.resolve('dist');
const manifest = JSON.parse(
  await readFile('public/2025/downloads-manifest.json', 'utf8'),
);
const failures = [];
const managedDownloads = new Set();

for (const download of manifest.downloads ?? []) {
  if (!download.path?.startsWith('/2025/assets/slides/')) {
    failures.push(`download manifest: invalid archive path "${download.path}"`);
  }
  if (!Number.isSafeInteger(download.bytes) || download.bytes <= 0) {
    failures.push(`download manifest: invalid byte size for "${download.path}"`);
  }
  if (!/^[a-f0-9]{64}$/.test(download.sha256 ?? '')) {
    failures.push(`download manifest: invalid SHA-256 for "${download.path}"`);
  }
  if (managedDownloads.has(download.path)) {
    failures.push(`download manifest: duplicate path "${download.path}"`);
  }
  managedDownloads.add(download.path);
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolutePath)));
    if (entry.isFile()) files.push(absolutePath);
  }

  return files;
}

function visibleText(source) {
  return source
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

async function resolvesToOutput(htmlFile, reference) {
  const pathname = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
  if (!pathname || managedDownloads.has(pathname)) return true;

  const candidate = pathname.startsWith('/')
    ? path.join(root, pathname.replace(/^\/+/, ''))
    : path.resolve(path.dirname(htmlFile), pathname);

  try {
    const metadata = await stat(candidate);
    if (metadata.isFile()) return true;
    if (metadata.isDirectory()) {
      const index = await stat(path.join(candidate, 'index.html'));
      return index.isFile();
    }
  } catch {
    return false;
  }

  return false;
}

async function outputFileForReference(sourceFile, reference) {
  const pathname = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
  if (
    !pathname ||
    managedDownloads.has(pathname) ||
    /^(?:https?:|mailto:|tel:|data:|javascript:)/.test(reference)
  ) {
    return undefined;
  }

  const candidate = pathname.startsWith('/')
    ? path.join(root, pathname.replace(/^\/+/, ''))
    : path.resolve(path.dirname(sourceFile), pathname);

  try {
    const metadata = await stat(candidate);
    if (metadata.isFile()) return candidate;
    if (metadata.isDirectory()) return path.join(candidate, 'index.html');
  } catch {
    return undefined;
  }

  return undefined;
}

async function collectInitialDependency(file, dependencies) {
  if (!file || dependencies.has(file)) return;
  dependencies.add(file);

  if (!file.endsWith('.css')) return;
  const source = await readFile(file, 'utf8');
  const references = [...source.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(
    (match) => match[1],
  );

  for (const reference of references) {
    await collectInitialDependency(
      await outputFileForReference(file, reference),
      dependencies,
    );
  }
}

async function initialLocalPayload(htmlFile) {
  const source = await readFile(htmlFile, 'utf8');
  const dependencies = new Set([htmlFile]);
  const tags = [...source.matchAll(/<(?:link|script|img|iframe)\b[^>]*>/gi)].map(
    (match) => match[0],
  );

  for (const tag of tags) {
    if (/^<(?:img|iframe)\b/i.test(tag) && /\sloading=["']lazy["']/i.test(tag)) {
      continue;
    }

    const reference = tag.match(/\s(?:href|src)=["']([^"']+)["']/i)?.[1];
    if (!reference) continue;
    await collectInitialDependency(
      await outputFileForReference(htmlFile, reference),
      dependencies,
    );
  }

  let bytes = 0;
  for (const dependency of dependencies) bytes += (await stat(dependency)).size;
  return bytes;
}

async function homepageHeroCssUsesImage(htmlFile, source, hero) {
  const inlineStyles = [...hero.matchAll(/\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)]
    .map((match) => match[1] ?? match[2] ?? '');
  if (inlineStyles.some((style) => /(?:url|image-set)\s*\(/i.test(style))) {
    return true;
  }

  const styleSources = [...source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(
    (match) => match[1],
  );
  const stylesheetReferences = [...source.matchAll(/<link\b[^>]*>/gi)]
    .map((match) => match[0])
    .filter((tag) => /\srel=["'][^"']*stylesheet[^"']*["']/i.test(tag))
    .map((tag) => tag.match(/\shref=["']([^"']+)["']/i)?.[1])
    .filter(Boolean);

  for (const reference of stylesheetReferences) {
    const stylesheet = await outputFileForReference(htmlFile, reference);
    if (stylesheet?.endsWith('.css')) {
      styleSources.push(await readFile(stylesheet, 'utf8'));
    }
  }

  const heroRules = styleSources
    .flatMap((stylesheet) => stylesheet.split('}'))
    .filter((rule) => (
      rule.includes('.hero-pixel-field')
      || rule.includes('[data-hero-pixel-field]')
      || rule.includes('.conference-hero')
    ));

  return heroRules.some((rule) => /(?:url|image-set)\s*\(/i.test(rule));
}

const outputFiles = await walk(root);

for (const htmlFile of outputFiles.filter((file) => file.endsWith('.html'))) {
  const relativeFile = path.relative(root, htmlFile);
  const source = await readFile(htmlFile, 'utf8');
  const withoutComments = source.replace(/<!--[\s\S]*?-->/g, '');
  const ids = [...withoutComments.matchAll(/\sid=["']([^"']+)["']/g)].map(
    (match) => match[1],
  );

  for (const id of new Set(ids)) {
    if (ids.filter((candidate) => candidate === id).length > 1) {
      failures.push(`${relativeFile}: duplicate id "${id}"`);
    }
  }

  const references = [
    ...withoutComments.matchAll(/\s(?:href|src)=["']([^"']+)["']/g),
  ].map((match) => match[1]);

  for (const reference of references) {
    if (
      reference.startsWith('#') ||
      /^(?:https?:|mailto:|tel:|data:|javascript:)/.test(reference)
    ) {
      continue;
    }

    if (!(await resolvesToOutput(htmlFile, reference))) {
      failures.push(`${relativeFile}: missing local reference "${reference}"`);
    }
  }
}

for (const edition of Object.values(editions).filter(({ status }) => status !== 'archived')) {
  const editionRoot = path.join(root, edition.year);
  const pageFiles = outputFiles.filter(
    (file) => file.startsWith(`${editionRoot}${path.sep}`) && file.endsWith('.html'),
  );

  if (pageFiles.length === 0) {
    failures.push(`${edition.year}: no generated edition pages found`);
    continue;
  }

  for (const file of pageFiles) {
    const route = path.relative(root, file);
    const htmlBytes = (await stat(file)).size;
    const source = await readFile(file, 'utf8');
    const isDomPixelHomepage = route === `${edition.year}/index.html`
      && source.includes('data-hero-pixel-field');
    const htmlBudget = isDomPixelHomepage ? 700_000 : 50_000;
    if (htmlBytes > htmlBudget) {
      failures.push(`${route}: HTML exceeds ${htmlBudget / 1_000} KB budget`);
    }

    if (isDomPixelHomepage) {
      const compressedBytes = gzipSync(source).byteLength;
      if (compressedBytes > 75_000) {
        failures.push(`${route}: compressed HTML exceeds 75 KB DOM-art budget`);
      }

      const hero = source.match(/<section class="conference-hero"[\s\S]*?<\/section>/)?.[0] ?? '';
      const expectedPixels = Number(hero.match(/data-pixel-count="(\d+)"/)?.[1] ?? 0);
      const renderedPixels = [...hero.matchAll(/class="hp\s/g)].length;
      const terrainLayers = [...hero.matchAll(/\sdata-layer=/g)].length;
      const terrainEchoes = [...hero.matchAll(/\sdata-echo=/g)].length;

      if (!hero.includes('data-render-mode="dom"')) {
        failures.push(`${route}: homepage hero is not marked as DOM-rendered`);
      }
      if (expectedPixels <= 0 || expectedPixels > 4_000 || renderedPixels !== expectedPixels) {
        failures.push(`${route}: invalid DOM pixel count (${renderedPixels}/${expectedPixels})`);
      }
      if (terrainLayers !== 8) {
        failures.push(`${route}: expected 8 probability terrain layers, found ${terrainLayers}`);
      }
      if (terrainEchoes !== 11) {
        failures.push(`${route}: expected 11 probability echoes, found ${terrainEchoes}`);
      }
      if (/<(?:canvas|img|picture|svg)\b/i.test(hero) || source.includes('hero-reference-trees')) {
        failures.push(`${route}: homepage hero contains a raster, Canvas, or SVG dependency`);
      }
      if (await homepageHeroCssUsesImage(file, source, hero)) {
        failures.push(`${route}: homepage hero CSS contains an image dependency`);
      }
    }

    const payloadBytes = await initialLocalPayload(file);
    const budget = route === `${edition.year}/index.html` ? 1_000_000 : 1_500_000;
    if (payloadBytes > budget) {
      failures.push(`${route}: initial local payload exceeds ${budget / 1_000_000} MB budget`);
    }
  }
}

const officialCopyByRoute = new Map([
  [
    '2026/about/index.html',
    [
      ...conference2026.introduction,
      ...conference2026.initiators,
      ...conference2026.organizers,
      ...conference2026.coOrganizers,
      ...conference2026.sponsors,
      conference2026.contact,
    ],
  ],
  [
    '2026/schedule/index.html',
    [
      '时间',
      conference2026.dates.compact,
      conference2026.venue.scheduleName,
      ...conference2026.schedule.flatMap((day) => [
        day.date,
        ...day.segments.flatMap((segment) => [segment.slot, ...segment.items]),
      ]),
    ],
  ],
  [
    '2026/poster/index.html',
    [
      conference2026.poster.title,
      conference2026.poster.headline,
      conference2026.poster.description,
      ...conference2026.poster.requirements,
      ...conference2026.poster.benefits,
      conference2026.poster.deadline.date,
      conference2026.poster.deadline.time,
      conference2026.contact,
    ],
  ],
]);

for (const [route, expectedCopy] of officialCopyByRoute) {
  const file = path.join(root, route);
  const text = visibleText(await readFile(file, 'utf8'));

  for (const expected of expectedCopy) {
    if (!text.includes(expected)) {
      failures.push(`${route}: missing official copy "${expected}"`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Build validation passed');
