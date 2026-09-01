import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import {
  conference2026,
  conference2026PartnerDisplayGroups,
} from '../src/data/conference2026.ts';
import {
  conference2026People,
  conference2026PersonForName,
} from '../src/data/conference2026-people.ts';
import { goalHistoryEvents } from '../src/data/goal-history.ts';
import { partnerLogoByName } from '../src/data/partner-logo-assets-2026.ts';
import { currentEditionPageCopy } from '../src/config/edition-status.ts';
import { site } from '../src/config/site.ts';

const projectRoot = path.resolve('.');
const outputRoot = path.resolve('dist');
const archiveSourceRoot = path.resolve('public/2025');
const archiveOutputRoot = path.join(outputRoot, '2025');
const failures = [];

const expectedHtmlFiles = [
  'index.html',
  'about/index.html',
  'schedule/index.html',
  'poster/index.html',
  'guide/index.html',
  'register/index.html',
  '404.html',
  '2026/index.html',
  '2026/about/index.html',
  '2026/schedule/index.html',
  '2026/poster/index.html',
  '2026/guide/index.html',
  '2026/register/index.html',
  '2026/speakers/index.html',
  'speakers/index.html',
  'about.html',
  'schedule.html',
  'guide.html',
  'register.html',
  'courses.html',
  '2025/index.html',
  '2025/about.html',
  '2025/schedule.html',
  '2025/courses.html',
  '2025/guide.html',
  '2025/register.html',
];

const currentPageFiles = [
  'index.html',
  'about/index.html',
  'schedule/index.html',
  'poster/index.html',
  'guide/index.html',
  'register/index.html',
];

const expectedSitemapUrls = [
  '/',
  '/about/',
  '/schedule/',
  '/poster/',
  '/guide/',
  '/register/',
  '/2025/',
  '/2025/about.html',
  '/2025/schedule.html',
  '/2025/courses.html',
  '/2025/guide.html',
  '/2025/register.html',
].map((route) => new URL(route, site.origin).href);

const currentRedirects = new Map([
  ['2026/index.html', '/'],
  ['2026/about/index.html', '/about/'],
  ['2026/schedule/index.html', '/schedule/'],
  ['2026/poster/index.html', '/poster/'],
  ['2026/guide/index.html', '/guide/'],
  ['2026/register/index.html', '/register/'],
  ['2026/speakers/index.html', '/schedule/'],
  ['speakers/index.html', '/schedule/'],
]);

const archiveCompatibilityRedirects = new Map([
  ['about.html', '/2025/about.html'],
  ['schedule.html', '/2025/schedule.html'],
  ['courses.html', '/2025/courses.html'],
  ['guide.html', '/2025/guide.html'],
  ['register.html', '/2025/register.html'],
]);

const virtualOutputFiles = new Map([
  ['/404/', '404.html'],
]);

const runtimeBrandFiles = [
  'favicon.png',
  'goal-paper-texture.webp',
  'share-2026.png',
  'xagi-connect-logo.png',
  'xagi-mark.svg',
  'xagi-wordmark-mask.svg',
  'xagi-wordmark-zh-lockup.webp',
];
const brandMasterFiles = [
  'README.md',
  'mark-on-dark.svg',
  'mark.svg',
  'wordmark-on-dark.svg',
  'wordmark.svg',
];
const venueSourceFiles = [
  'beijing-friendship-hotel-plan.jpg',
  'friendship-hotel-xagi-offer-code.png',
  'friendship-palace-floor-2.jpg',
];

function fail(message) {
  failures.push(message);
}

function normalized(values) {
  return [...values].sort((left, right) => left.localeCompare(right, 'en'));
}

function validateExactSet(label, actualValues, expectedValues) {
  const actual = normalized(actualValues);
  const expected = normalized(expectedValues);
  const missing = expected.filter((value) => !actual.includes(value));
  const unexpected = actual.filter((value) => !expected.includes(value));

  for (const value of missing) fail(`${label}: missing "${value}"`);
  for (const value of unexpected) fail(`${label}: unexpected "${value}"`);
}

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
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

function relativeTo(directory, file) {
  return path.relative(directory, file).split(path.sep).join('/');
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function fileIntegrity(file) {
  const buffer = await readFile(file);
  return { bytes: buffer.byteLength, sha256: sha256(buffer) };
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

function cssReferences(source) {
  return [...source.matchAll(/url\(\s*(?:"([^"]+)"|'([^']+)'|([^\s)'";]+))\s*\)/gi)]
    .map((match) => match[1] ?? match[2] ?? match[3])
    .filter(Boolean);
}

function htmlReferences(source) {
  const withoutComments = source.replace(/<!--[\s\S]*?-->/g, '');
  const references = [
    ...[...withoutComments.matchAll(/\s(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)]
      .map((match) => match[1] ?? match[2]),
    ...[...withoutComments.matchAll(/\ssrcset\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)]
      .flatMap((match) => (match[1] ?? match[2] ?? '').split(','))
      .map((candidate) => candidate.trim().split(/\s+/, 1)[0]),
    ...[...withoutComments.matchAll(/\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)]
      .flatMap((match) => cssReferences(match[1] ?? match[2] ?? '')),
    ...[...withoutComments.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)]
      .flatMap((match) => cssReferences(match[1])),
  ];

  for (const match of withoutComments.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    const property = tag.match(/\s(?:property|name)=["']([^"']+)["']/i)?.[1]?.toLowerCase();
    if (property !== 'og:image' && property !== 'twitter:image') continue;
    const content = tag.match(/\scontent=["']([^"']+)["']/i)?.[1];
    if (content) references.push(content);
  }

  return references.filter(Boolean);
}

function isExternalReference(reference) {
  return localReferenceValue(reference) === undefined;
}

function localReferenceValue(reference) {
  const value = reference.trim().replace(/&amp;/g, '&');
  if (!value || value.startsWith('#')) return undefined;

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(value);
  if (value.startsWith('//') || hasScheme) {
    if (!value.startsWith('//') && !/^https?:/i.test(value)) return undefined;
    try {
      const absolute = new URL(value, site.origin);
      if (absolute.origin !== new URL(site.origin).origin) return undefined;
      return `${absolute.pathname}${absolute.search}${absolute.hash}`;
    } catch {
      return undefined;
    }
  }

  return value;
}

function referencePath(reference) {
  const rawPath = localReferenceValue(reference)?.split(/[?#]/, 1)[0] ?? '';
  try {
    return decodeURIComponent(rawPath);
  } catch {
    return rawPath;
  }
}

function referenceTargetsArchive(sourceFile, reference) {
  if (isExternalReference(reference)) return false;
  const pathname = referencePath(reference);
  const candidate = pathname.startsWith('/')
    ? path.join(outputRoot, pathname.replace(/^\/+/, ''))
    : path.resolve(path.dirname(sourceFile), pathname);
  const relative = relativeTo(outputRoot, candidate);
  return relative === '2025'
    || relative.startsWith('2025/')
    || archiveCompatibilityRedirects.has(relative);
}

function referenceTargetsCurrentAssets(sourceFile, reference) {
  if (isExternalReference(reference)) return false;
  const pathname = referencePath(reference);
  const candidate = pathname.startsWith('/')
    ? path.join(outputRoot, pathname.replace(/^\/+/, ''))
    : path.resolve(path.dirname(sourceFile), pathname);
  const relative = relativeTo(outputRoot, candidate);
  return relative === '_assets'
    || relative.startsWith('_assets/')
    || relative === '2026'
    || relative.startsWith('2026/');
}

async function outputFileForReference(sourceFile, reference, managedDownloads) {
  if (isExternalReference(reference)) return undefined;
  const pathname = referencePath(reference);
  if (!pathname || managedDownloads.has(pathname)) return undefined;

  const candidate = pathname.startsWith('/')
    ? path.join(outputRoot, virtualOutputFiles.get(pathname) ?? pathname.replace(/^\/+/, ''))
    : path.resolve(path.dirname(sourceFile), pathname);
  const relativeCandidate = path.relative(outputRoot, candidate);
  if (relativeCandidate.startsWith('..') || path.isAbsolute(relativeCandidate)) return undefined;

  try {
    const metadata = await stat(candidate);
    if (metadata.isFile()) return candidate;
    if (metadata.isDirectory()) {
      const indexFile = path.join(candidate, 'index.html');
      if ((await stat(indexFile)).isFile()) return indexFile;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

async function validateLocalReferences(file, references, managedDownloads) {
  const route = relativeTo(outputRoot, file);

  for (const reference of references) {
    if (isExternalReference(reference)) continue;
    const pathname = referencePath(reference);
    if (!pathname || managedDownloads.has(pathname)) continue;
    if (!(await outputFileForReference(file, reference, managedDownloads))) {
      fail(`${route}: missing local reference "${reference}"`);
    }
  }
}

async function initialLocalPayload(htmlFile, managedDownloads) {
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
    const dependency = await outputFileForReference(htmlFile, reference, managedDownloads);
    if (!dependency) continue;
    dependencies.add(dependency);

    if (dependency.endsWith('.css')) {
      const stylesheet = await readFile(dependency, 'utf8');
      for (const cssReference of cssReferences(stylesheet)) {
        const cssDependency = await outputFileForReference(
          dependency,
          cssReference,
          managedDownloads,
        );
        if (cssDependency) dependencies.add(cssDependency);
      }
    }
  }

  let bytes = 0;
  for (const dependency of dependencies) bytes += (await stat(dependency)).size;
  return bytes;
}

const downloadManifest = JSON.parse(
  await readFile(path.join(archiveSourceRoot, 'downloads-manifest.json'), 'utf8'),
);
const managedDownloads = new Set();
for (const download of downloadManifest.downloads ?? []) {
  if (!download.path?.startsWith('/2025/assets/slides/')) {
    fail(`download manifest: invalid archive path "${download.path}"`);
  }
  if (!Number.isSafeInteger(download.bytes) || download.bytes <= 0) {
    fail(`download manifest: invalid byte size for "${download.path}"`);
  }
  if (!/^[a-f0-9]{64}$/.test(download.sha256 ?? '')) {
    fail(`download manifest: invalid SHA-256 for "${download.path}"`);
  }
  if (managedDownloads.has(download.path)) {
    fail(`download manifest: duplicate path "${download.path}"`);
  }
  managedDownloads.add(download.path);
}

const archiveManifestSource = await readFile('scripts/manifests/public-2025.sha256', 'utf8');
const archiveManifest = new Map();
for (const [index, line] of archiveManifestSource.split(/\r?\n/).entries()) {
  if (!line || line.startsWith('#')) continue;
  const [expectedHash, expectedBytes, repositoryPath, ...extra] = line.split('\t');
  if (
    extra.length > 0
    || !/^[a-f0-9]{64}$/.test(expectedHash ?? '')
    || !/^\d+$/.test(expectedBytes ?? '')
    || !repositoryPath?.startsWith('public/2025/')
  ) {
    fail(`public-2025 manifest: invalid line ${index + 1}`);
    continue;
  }
  if (archiveManifest.has(repositoryPath)) {
    fail(`public-2025 manifest: duplicate path "${repositoryPath}"`);
  }
  archiveManifest.set(repositoryPath, {
    bytes: Number(expectedBytes),
    sha256: expectedHash,
  });
}

const archiveSourceFiles = await walk(archiveSourceRoot);
const archiveSourcePaths = archiveSourceFiles.map((file) => relativeTo(projectRoot, file));
validateExactSet('public-2025 manifest', archiveManifest.keys(), archiveSourcePaths);
if (archiveManifest.size !== 92) {
  fail(`public-2025 manifest: expected 92 files, found ${archiveManifest.size}`);
}

for (const sourceFile of archiveSourceFiles) {
  const repositoryPath = relativeTo(projectRoot, sourceFile);
  const expected = archiveManifest.get(repositoryPath);
  if (!expected) continue;
  const sourceIntegrity = await fileIntegrity(sourceFile);
  if (sourceIntegrity.bytes !== expected.bytes || sourceIntegrity.sha256 !== expected.sha256) {
    fail(`${repositoryPath}: frozen archive source differs from its integrity manifest`);
  }

  const archiveRelativePath = relativeTo(archiveSourceRoot, sourceFile);
  const outputFile = path.join(archiveOutputRoot, archiveRelativePath);
  if (!(await exists(outputFile))) {
    fail(`2025/${archiveRelativePath}: frozen archive file is missing from dist`);
    continue;
  }
  const outputIntegrity = await fileIntegrity(outputFile);
  if (outputIntegrity.bytes !== expected.bytes || outputIntegrity.sha256 !== expected.sha256) {
    fail(`2025/${archiveRelativePath}: dist copy differs from the frozen archive source`);
  }
}

const archiveOutputFiles = await walk(archiveOutputRoot);
validateExactSet(
  'dist/2025 archive',
  archiveOutputFiles.map((file) => relativeTo(archiveOutputRoot, file)),
  archiveSourceFiles.map((file) => relativeTo(archiveSourceRoot, file)),
);

const outputFiles = await walk(outputRoot);
const htmlFiles = outputFiles.filter((file) => file.endsWith('.html'));
validateExactSet(
  'generated HTML inventory',
  htmlFiles.map((file) => relativeTo(outputRoot, file)),
  expectedHtmlFiles,
);

for (const retiredDirectory of ['goal', 'next']) {
  if (outputFiles.some((file) => relativeTo(outputRoot, file).startsWith(`${retiredDirectory}/`))) {
    fail(`dist/${retiredDirectory}: retired preview output must not exist`);
  }
}

for (const htmlFile of htmlFiles) {
  const source = await readFile(htmlFile, 'utf8');
  const route = relativeTo(outputRoot, htmlFile);
  const withoutComments = source.replace(/<!--[\s\S]*?-->/g, '');
  const ids = [...withoutComments.matchAll(/\sid=["']([^"']+)["']/g)].map((match) => match[1]);
  for (const id of new Set(ids)) {
    if (ids.filter((candidate) => candidate === id).length > 1) {
      fail(`${route}: duplicate id "${id}"`);
    }
  }
  await validateLocalReferences(htmlFile, htmlReferences(source), managedDownloads);
}

const cssFiles = outputFiles.filter((file) => file.endsWith('.css'));
for (const cssFile of cssFiles) {
  const source = await readFile(cssFile, 'utf8');
  await validateLocalReferences(cssFile, cssReferences(source), managedDownloads);
}

for (const route of currentPageFiles) {
  const file = path.join(outputRoot, route);
  const source = await readFile(file, 'utf8');
  for (const reference of htmlReferences(source)) {
    if (referenceTargetsArchive(file, reference)) {
      fail(`${route}: current 2026 page depends on frozen /2025 content through "${reference}"`);
    }
  }
}
for (const cssFile of cssFiles.filter((file) => !relativeTo(outputRoot, file).startsWith('2025/'))) {
  const source = await readFile(cssFile, 'utf8');
  for (const reference of cssReferences(source)) {
    if (referenceTargetsArchive(cssFile, reference)) {
      fail(`${relativeTo(outputRoot, cssFile)}: current CSS depends on frozen /2025 content through "${reference}"`);
    }
  }
}

for (const archiveFile of archiveOutputFiles) {
  const extension = path.extname(archiveFile).toLowerCase();
  if (!['.html', '.css', '.js', '.json', '.svg'].includes(extension)) continue;
  const source = await readFile(archiveFile, 'utf8');
  const references = extension === '.css' ? cssReferences(source) : extension === '.html' ? htmlReferences(source) : [];
  for (const reference of references) {
    if (referenceTargetsCurrentAssets(archiveFile, reference)) {
      fail(`${relativeTo(outputRoot, archiveFile)}: frozen archive depends on current content through "${reference}"`);
    }
  }
  if (/\/(?:2026|_assets)\//.test(source)) {
    fail(`${relativeTo(outputRoot, archiveFile)}: frozen archive contains a current-edition dependency`);
  }
}

async function validatePublicCopies(label, publicDirectory, expectedFiles) {
  const sourceFiles = await walk(publicDirectory);
  const sourceNames = sourceFiles.map((file) => relativeTo(publicDirectory, file));
  validateExactSet(`${label} source`, sourceNames, expectedFiles);

  const outputDirectory = path.join(outputRoot, relativeTo(path.resolve('public'), publicDirectory));
  const outputFilesForDirectory = await walk(outputDirectory);
  validateExactSet(
    `${label} output`,
    outputFilesForDirectory.map((file) => relativeTo(outputDirectory, file)),
    expectedFiles,
  );

  for (const relativeFile of expectedFiles) {
    const sourceIntegrity = await fileIntegrity(path.join(publicDirectory, relativeFile));
    const outputIntegrity = await fileIntegrity(path.join(outputDirectory, relativeFile));
    if (
      sourceIntegrity.bytes !== outputIntegrity.bytes
      || sourceIntegrity.sha256 !== outputIntegrity.sha256
    ) {
      fail(`${label}: output copy differs for "${relativeFile}"`);
    }
  }
}

await validatePublicCopies('2026 runtime brand', path.resolve('public/2026/brand'), runtimeBrandFiles);
await validatePublicCopies('2026 legal assets', path.resolve('public/2026/legal'), ['beian-icon.png']);

const selectedLogoFiles = Object.values(partnerLogoByName).map((logo) => path.basename(logo.src));
const displayedPartnerCount = conference2026PartnerDisplayGroups.reduce(
  (total, group) => total + group.organizations.length,
  0,
);
if (
  selectedLogoFiles.length !== displayedPartnerCount
  || new Set(selectedLogoFiles).size !== displayedPartnerCount
) {
  fail(
    `2026 partner logos: expected ${displayedPartnerCount} unique selections, `
    + `found ${new Set(selectedLogoFiles).size}`,
  );
}
await validatePublicCopies('2026 partner logos', path.resolve('public/2026/logos'), selectedLogoFiles);

const personPortraitFiles = conference2026People.flatMap((person) => (
  person.portraitSrc ? [path.basename(person.portraitSrc)] : []
));
if (personPortraitFiles.length !== 28 || new Set(personPortraitFiles).size !== 28) {
  fail(
    `2026 people portraits: expected 28 unique attendee-submitted portraits and six placeholders, `
    + `found ${new Set(personPortraitFiles).size}`,
  );
}
await validatePublicCopies(
  '2026 people portraits',
  path.resolve('public/2026/people'),
  personPortraitFiles,
);

const public2026Root = path.resolve('public/2026');
validateExactSet(
  '2026 public asset tree',
  (await walk(public2026Root)).map((file) => relativeTo(public2026Root, file)),
  [
    ...runtimeBrandFiles.map((file) => `brand/${file}`),
    'legal/beian-icon.png',
    ...selectedLogoFiles.map((file) => `logos/${file}`),
    ...personPortraitFiles.map((file) => `people/${file}`),
  ],
);

const brandKitRoot = path.resolve('assets/brand-kit/2026');
const brandKitFiles = await walk(brandKitRoot);
validateExactSet(
  '2026 brand master kit',
  brandKitFiles.map((file) => relativeTo(brandKitRoot, file)),
  brandMasterFiles,
);
const masterHashes = new Set();
for (const masterFile of brandKitFiles.filter((file) => file.endsWith('.svg'))) {
  masterHashes.add((await fileIntegrity(masterFile)).sha256);
}
for (const outputFile of outputFiles) {
  if (masterHashes.has((await fileIntegrity(outputFile)).sha256)) {
    fail(`${relativeTo(outputRoot, outputFile)}: non-published brand master leaked into dist`);
  }
}
const sourceTextFiles = (await walk(path.resolve('src'))).filter((file) =>
  ['.astro', '.css', '.js', '.json', '.mjs', '.ts'].includes(path.extname(file)),
);
for (const sourceFile of sourceTextFiles) {
  if ((await readFile(sourceFile, 'utf8')).includes('brand-kit')) {
    fail(`${relativeTo(projectRoot, sourceFile)}: runtime source must not import the brand master kit`);
  }
}

const venueRoot = path.resolve('src/assets/2026/venue');
const venueFiles = await walk(venueRoot);
validateExactSet(
  '2026 venue source assets',
  venueFiles.map((file) => relativeTo(venueRoot, file)),
  venueSourceFiles,
);
const guideSource = await readFile(path.join(outputRoot, 'guide/index.html'), 'utf8');
for (const venueFile of venueSourceFiles) {
  const stem = path.parse(venueFile).name;
  if (!guideSource.includes(stem)) fail(`guide/index.html: missing venue asset "${venueFile}"`);
  if (!outputFiles.some((file) => path.basename(file).startsWith(`${stem}.`))) {
    fail(`dist/_assets: missing emitted venue asset "${venueFile}"`);
  }
}

const historyBasenames = goalHistoryEvents.flatMap((event) =>
  event.photos.map((photo) => photo.basename),
);
if (goalHistoryEvents.length !== 17 || historyBasenames.length !== 51) {
  fail(`goal history: expected 17 events and 51 images, found ${goalHistoryEvents.length} and ${historyBasenames.length}`);
}
const historyRoot = path.resolve('src/assets/2026/goal-history');
const historySourceFiles = await walk(historyRoot);
validateExactSet(
  '2026 history source assets',
  historySourceFiles.map((file) => relativeTo(historyRoot, file)),
  historyBasenames,
);

const rootIndex = await readFile(path.join(outputRoot, 'index.html'), 'utf8');
const historyStart = rootIndex.indexOf('id="goal-history"');
const historyEnd = rootIndex.indexOf('id="goal-organization"', historyStart);
const historyFragment = historyStart >= 0 && historyEnd > historyStart
  ? rootIndex.slice(historyStart, historyEnd)
  : '';
const renderedHistoryEvents = [...historyFragment.matchAll(/data-history-event(?:\s|>)/g)].length;
const renderedHistoryImages = [...historyFragment.matchAll(/<img\b[^>]*>/g)].map((match) => match[0]);
if (renderedHistoryEvents !== 17) {
  fail(`index.html: expected 17 rendered history events, found ${renderedHistoryEvents}`);
}
if (renderedHistoryImages.length !== 51) {
  fail(`index.html: expected 51 rendered history images, found ${renderedHistoryImages.length}`);
}
for (const basename of historyBasenames) {
  const stem = path.parse(basename).name;
  if (!historyFragment.includes(stem)) fail(`index.html: missing history source "${basename}"`);
  if (!outputFiles.some((file) => path.basename(file).startsWith(`${stem}.`))) {
    fail(`dist/_assets: missing emitted history source "${basename}"`);
  }
}
for (const [index, image] of renderedHistoryImages.entries()) {
  if (!image.includes('loading="lazy"') || !image.includes('decoding="async"')) {
    fail(`index.html: history image ${index + 1} must load lazily with async decoding`);
  }
  if (!image.includes('srcset=') || !image.includes('sizes=')) {
    fail(`index.html: history image ${index + 1} must expose responsive candidates`);
  }
}
if (historyFragment.includes('mmbiz.qpic.cn') || historyFragment.includes('/2026/history/')) {
  fail('index.html: history gallery must use only owned 2026 source images');
}

for (const logo of Object.values(partnerLogoByName)) {
  if (!rootIndex.includes(logo.src)) fail(`index.html: missing selected partner logo "${logo.src}"`);
}
for (const brandPath of runtimeBrandFiles.map((file) => `/2026/brand/${file}`)) {
  if (!outputFiles.some((file) => relativeTo(outputRoot, file) === brandPath.slice(1))) {
    fail(`dist: missing runtime brand asset "${brandPath}"`);
  }
}
for (const retiredRuntimePrefix of ['href="/brand/', 'src="/brand/', 'href="/2025/', 'src="/2025/']) {
  if (rootIndex.includes(retiredRuntimePrefix)) {
    fail(`index.html: homepage contains retired runtime path "${retiredRuntimePrefix.slice(0, -1)}"`);
  }
}

if (rootIndex.includes('redirect-page')) {
  fail('index.html: official root must not be a redirect interstitial');
}
for (const marker of [
  'data-hero-pixel-field',
  'data-goal-home-contract="history-first"',
  'edition-goal-home--with-lower',
  'id="goal-history"',
  'id="goal-organization"',
  'class="goal-partners__legal"',
]) {
  if (!rootIndex.includes(marker)) fail(`index.html: missing published homepage marker "${marker}"`);
}
if (!rootIndex.includes('property="og:image"') || !rootIndex.includes('/2026/brand/share-2026.png')) {
  fail('index.html: homepage must publish the 2026 share image');
}
if (!rootIndex.includes('property="og:title"') || !rootIndex.includes(conference2026.name)) {
  fail('index.html: homepage share title must use the Chinese conference name');
}
if (!rootIndex.includes('property="og:description"') || !rootIndex.includes(conference2026.venue.name)) {
  fail('index.html: homepage must publish its venue in the Open Graph description');
}
if (gzipSync(rootIndex).byteLength > 75_000) {
  fail('index.html: compressed homepage HTML exceeds 75 KB');
}
if ((await initialLocalPayload(path.join(outputRoot, 'index.html'), managedDownloads)) > 1_000_000) {
  fail('index.html: initial local payload exceeds 1 MB');
}

const officialCopyByRoute = new Map([
  ['about/index.html', [
    ...conference2026.introduction,
    conference2026.conferenceOrganization.committee.title,
    conference2026.conferenceOrganization.committee.chair,
    ...conference2026.conferenceOrganization.committee.members,
    conference2026.conferenceOrganization.secretariat.title,
    conference2026.conferenceOrganization.secretariat.secretaryGeneral,
    ...conference2026.conferenceOrganization.secretariat.members,
    ...conference2026.organizers.map((organization) => organization.name),
    ...conference2026.coOrganizers.map((organization) => organization.name),
    ...conference2026.strategicPartners.map((organization) => organization.name),
    ...conference2026.sponsors.map((organization) => organization.name),
    conference2026.contact,
  ]],
  ['schedule/index.html', [
    conference2026.dates.compact,
    conference2026.venue.scheduleName,
    currentEditionPageCopy('schedule').label,
    ...conference2026.programPreview.sessions.flatMap((session) => [
      session.title,
      ...session.chairs.map((chair) => chair.name === '待确认' ? 'Chair 待确认' : chair.name),
      ...session.speakers.flatMap((speaker) => [speaker.name, speaker.talkTitle ?? '']),
    ]),
    ...conference2026People.flatMap((person) => [
      person.name,
      ...person.aliases,
      person.affiliation,
      person.department ?? '',
      person.bio ?? '',
      person.abstract ?? '',
    ]),
  ]],
  ['poster/index.html', [
    conference2026.poster.title,
    conference2026.poster.headline,
    conference2026.poster.description,
    conference2026.poster.ticket.label,
    String(conference2026.poster.ticket.value),
    ...conference2026.poster.requirements,
    ...conference2026.poster.benefits,
    conference2026.poster.deadline.date,
    conference2026.poster.deadline.time,
    conference2026.scale.posters,
    conference2026.contact,
  ]],
  ['guide/index.html', [
    conference2026.venue.scheduleName,
    conference2026.venue.nameEn,
    ...conference2026.venue.maps.flatMap((map) => [map.title, map.description]),
    '交通与住宿',
    '北京友谊宾馆为 X-AGI 大会提供专属优惠',
    '5328460',
    '2026.10.16',
    '2026.10.19',
  ]],
  ['register/index.html', [
    conference2026.registration.description,
    ...conference2026.registration.notes,
    ...conference2026.tickets.notes,
    ...conference2026.tickets.bands.flatMap((band) => [
      band.label,
      ...band.rows.flatMap((row) => [row.name, String(row.student), String(row.general)]),
    ]),
    conference2026.venue.scheduleName,
  ]],
]);

for (const [route, expectedCopy] of officialCopyByRoute) {
  const source = await readFile(path.join(outputRoot, route), 'utf8');
  const text = visibleText(source);
  if (!source.includes('edition-2026-inner') || !source.includes('edition-goal-2026')) {
    fail(`${route}: current inner page must use the self-contained 2026 shell`);
  }
  if (!source.includes('data-masthead-pixel-field') || !source.includes('data-connection-stage')) {
    fail(`${route}: current inner page must expose the interactive masthead field`);
  }
  const htmlByteLimit = route === 'schedule/index.html' ? 300_000 : 50_000;
  if ((await stat(path.join(outputRoot, route))).size > htmlByteLimit) {
    fail(`${route}: HTML exceeds ${Math.round(htmlByteLimit / 1000)} KB`);
  }
  if ((await initialLocalPayload(path.join(outputRoot, route), managedDownloads)) > 1_500_000) {
    fail(`${route}: initial local payload exceeds 1.5 MB`);
  }
  for (const expected of expectedCopy) {
    const normalizedExpected = String(expected).replace(/\s+/gu, ' ').trim();
    if (normalizedExpected && !text.includes(normalizedExpected)) {
      fail(`${route}: missing official copy "${expected}"`);
    }
  }
}

const scheduleSource = await readFile(path.join(outputRoot, 'schedule/index.html'), 'utf8');
const scheduleVisibleText = visibleText(scheduleSource);
const scheduleMetaIndex = scheduleSource.indexOf('class="page-header__meta"');
const scheduleMainIndex = scheduleSource.indexOf('data-schedule-page');
if (scheduleMetaIndex < 0 || scheduleMainIndex < 0 || scheduleMetaIndex > scheduleMainIndex) {
  fail('schedule/index.html: date and venue metadata must stay in the page header above the schedule');
}
if (scheduleSource.includes('schedule-intro')) {
  fail('schedule/index.html: date and venue metadata must not return as a standalone schedule row');
}
const scheduleCardCount = [...scheduleSource.matchAll(/class="[^"]*\bschedule-card\b[^"]*"/g)].length;
if (scheduleCardCount !== conference2026.programPreview.sessions.length) {
  fail(`schedule/index.html: expected ${conference2026.programPreview.sessions.length} schedule cards, found ${scheduleCardCount}`);
}
const schedulePeriodCount = [...scheduleSource.matchAll(/class="[^"]*\bschedule-period-group\b[^"]*"/g)].length;
if (schedulePeriodCount !== 4) {
  fail(`schedule/index.html: expected 4 half-day groups, found ${schedulePeriodCount}`);
}
const scheduleWeekdayByDate = new Map(
  conference2026.schedule.map((day) => [day.date.slice(5), day.weekday]),
);
for (const sourceTime of new Set(conference2026.programPreview.sessions.map((session) => session.sourceTime))) {
  const match = sourceTime.match(/^(\d{2})\.(\d{2})(上午|下午)$/u);
  if (!match) continue;
  const shortDate = `${match[1]}.${match[2]}`;
  const weekday = scheduleWeekdayByDate.get(shortDate);
  const expectedLabel = `${Number(match[1])} 月 ${Number(match[2])} 日${weekday ? ` · ${weekday}` : ''} · ${match[3]}`;
  if (!scheduleVisibleText.includes(expectedLabel)) {
    fail(`schedule/index.html: missing combined period heading "${expectedLabel}"`);
  }
}
if (scheduleVisibleText.includes('个专题')) {
  fail('schedule/index.html: redundant topic counts must not be published in period headings');
}
const chairCardCount = [...scheduleSource.matchAll(/data-schedule-chair-card/g)].length;
if (chairCardCount !== conference2026.programPreview.sessions.length) {
  fail(`schedule/index.html: expected ${conference2026.programPreview.sessions.length} standalone Chair cards, found ${chairCardCount}`);
}
if (scheduleSource.includes('session-chair__label">主席') || scheduleVisibleText.includes('主席待确认')) {
  fail('schedule/index.html: schedule role labels must use Chair consistently');
}
if (/\bDAY\s+\d{2}\b/u.test(scheduleVisibleText)) {
  fail('schedule/index.html: redundant DAY labels must not be published');
}
if (/计划人数|完成度|对接人/u.test(scheduleVisibleText)) {
  fail('schedule/index.html: internal source fields must not be published');
}
for (const retiredCopy of [
  '半天粒度日程已发布，具体钟点持续更新中',
  'HALF-DAY PROGRAM',
  '专题、嘉宾及报告题目持续更新，具体钟点稍后公布。',
]) {
  if (scheduleVisibleText.includes(retiredCopy)) {
    fail(`schedule/index.html: retired explanatory copy must stay removed: "${retiredCopy}"`);
  }
}
if (scheduleSource.includes('schedule-tabs') || scheduleSource.includes('goal-schedule-preview')) {
  fail('schedule/index.html: retired schedule preview structure must not return');
}

const scheduledProfilePlacements = conference2026.programPreview.sessions.flatMap((session) => {
  const speakerPlacements = session.speakers.flatMap((speaker) => {
    const person = conference2026PersonForName(speaker.name);
    return person ? [{
      person,
      role: 'speaker',
      defaultOpen: session.title.trim().toLowerCase() === 'keynote',
    }] : [];
  });
  const chairPlacements = session.chairs.flatMap((chair) => {
    const person = conference2026PersonForName(chair.name);
    return person ? [{
      person,
      role: 'chair',
      defaultOpen: false,
    }] : [];
  });
  return [...chairPlacements, ...speakerPlacements];
});
validateExactSet(
  'schedule inline profile people',
  [...new Set(scheduledProfilePlacements.map(({ person }) => person.id))],
  conference2026People.map((person) => person.id),
);

const profileTags = [...scheduleSource.matchAll(/<details\b[^>]*data-schedule-person-profile[^>]*>/g)];
if (profileTags.length !== scheduledProfilePlacements.length) {
  fail(`schedule/index.html: expected ${scheduledProfilePlacements.length} inline profiles, found ${profileTags.length}`);
}
for (const role of ['speaker', 'chair']) {
  const expectedRoleCount = scheduledProfilePlacements.filter((placement) => placement.role === role).length;
  const actualRoleCount = profileTags.filter((match) => match[0].includes(`data-person-role="${role}"`)).length;
  if (actualRoleCount !== expectedRoleCount) {
    fail(`schedule/index.html: expected ${expectedRoleCount} ${role} profiles, found ${actualRoleCount}`);
  }
}
const profileIds = profileTags.map((match) => match[0].match(/\bid="([^"]+)"/)?.[1]);
if (profileIds.some((id) => !id) || new Set(profileIds).size !== profileIds.length) {
  fail('schedule/index.html: inline profile disclosure ids must be present and unique');
}
const defaultOpenProfileTags = profileTags.filter((match) => /\sopen(?:\s|>|=)/u.test(match[0]));
const expectedDefaultOpenPlacements = scheduledProfilePlacements.filter(({ defaultOpen }) => defaultOpen);
if (defaultOpenProfileTags.length !== expectedDefaultOpenPlacements.length) {
  fail(`schedule/index.html: expected ${expectedDefaultOpenPlacements.length} default-open Keynote profiles, found ${defaultOpenProfileTags.length}`);
}
for (const match of defaultOpenProfileTags) {
  if (!match[0].includes('data-person-role="speaker"') || !match[0].includes('data-default-open="true"')) {
    fail('schedule/index.html: only Keynote speaker profiles may be open by default');
  }
}
if (profileTags.some((match) => /\sname=/u.test(match[0]))) {
  fail('schedule/index.html: person disclosures must remain independent rather than becoming an accordion');
}
const expectedPortraitPlacements = scheduledProfilePlacements
  .filter(({ person }) => Boolean(person.portraitSrc))
  .length;
const expectedPlaceholderPlacements = scheduledProfilePlacements.length - expectedPortraitPlacements;
const inlinePortraitCount = [...scheduleSource.matchAll(/class="([^"]*)"/g)]
  .filter((match) => match[1].split(/\s+/u).includes('schedule-person-profile__portrait'))
  .length;
const inlinePlaceholderCount = [...scheduleSource.matchAll(/class="([^"]*)"/g)]
  .filter((match) => match[1].split(/\s+/u).includes('schedule-person-profile__portrait-placeholder'))
  .length;
if (inlinePortraitCount !== expectedPortraitPlacements) {
  fail(`schedule/index.html: expected ${expectedPortraitPlacements} inline portraits, found ${inlinePortraitCount}`);
}
if (inlinePlaceholderCount !== expectedPlaceholderPlacements) {
  fail(`schedule/index.html: expected ${expectedPlaceholderPlacements} portrait placeholders, found ${inlinePlaceholderCount}`);
}
for (const image of scheduleSource.matchAll(/<img\b[^>]*class="schedule-person-profile__portrait"[^>]*>/g)) {
  if (!image[0].includes('loading="lazy"') || !image[0].includes('decoding="async"')) {
    fail('schedule/index.html: every person portrait must load lazily with async decoding');
  }
  if (!image[0].includes('src="/2026/people/')) {
    fail('schedule/index.html: every person portrait must use a local 2026 asset');
  }
}
const inlineSummaryCount = [...scheduleSource.matchAll(/<summary\b[^>]*class="schedule-person-profile__summary"[^>]*>/g)].length;
if (inlineSummaryCount !== scheduledProfilePlacements.length) {
  fail('schedule/index.html: every inline profile must use a native summary control');
}
for (const summary of scheduleSource.matchAll(/<summary\b[^>]*class="schedule-person-profile__summary"[^>]*>([\s\S]*?)<\/summary>/g)) {
  if (visibleText(summary[1]).includes('资料')) {
    fail('schedule/index.html: profile disclosure rows must use the arrow without a redundant data label');
  }
}
const bioSectionCount = [...scheduleSource.matchAll(/data-profile-section="bio"/g)].length;
if (bioSectionCount !== scheduledProfilePlacements.length) {
  fail('schedule/index.html: every inline profile must include one biography section');
}
for (const speakerProfile of scheduleSource.matchAll(/<details\b[^>]*data-person-role="speaker"[^>]*>([\s\S]*?)<\/details>/g)) {
  const abstractIndex = speakerProfile[1].indexOf('data-profile-section="abstract"');
  const bioIndex = speakerProfile[1].indexOf('data-profile-section="bio"');
  if (abstractIndex >= 0 && abstractIndex > bioIndex) {
    fail('schedule/index.html: speaker abstracts must appear before biographies');
  }
}
for (const chairProfile of scheduleSource.matchAll(/<details\b[^>]*data-person-role="chair"[^>]*>([\s\S]*?)<\/details>/g)) {
  if (chairProfile[1].includes('data-profile-section="abstract"')) {
    fail('schedule/index.html: chair profiles must not render a talk abstract');
  }
}
const expectedSessionProfileToggleCount = conference2026.programPreview.sessions.length;
const expectedDisabledSessionProfileToggleCount = conference2026.programPreview.sessions
  .filter((session) => ![...session.chairs, ...session.speakers]
    .some((scheduledPerson) => Boolean(conference2026PersonForName(scheduledPerson.name))))
  .length;
const sessionProfileToggleTags = [
  ...scheduleSource.matchAll(/<button\b[^>]*data-schedule-session-profiles-toggle[^>]*>/g),
];
if (sessionProfileToggleTags.length !== expectedSessionProfileToggleCount) {
  fail(`schedule/index.html: expected ${expectedSessionProfileToggleCount} session profile controls, found ${sessionProfileToggleTags.length}`);
}
if (sessionProfileToggleTags.some((match) => !match[0].includes('aria-expanded="false"'))) {
  fail('schedule/index.html: every session profile control must expose its initial collapsed state');
}
const disabledSessionProfileToggleCount = sessionProfileToggleTags
  .filter((match) => /\sdisabled(?:\s|>|=)/u.test(match[0]))
  .length;
if (disabledSessionProfileToggleCount !== expectedDisabledSessionProfileToggleCount) {
  fail(`schedule/index.html: expected ${expectedDisabledSessionProfileToggleCount} disabled empty-session controls, found ${disabledSessionProfileToggleCount}`);
}
if (scheduleSource.includes('data-schedule-profiles-toggle') || scheduleVisibleText.includes('展开全部演讲')) {
  fail('schedule/index.html: the retired page-level profile control must stay removed');
}
if (!/展开\s*全部/u.test(scheduleVisibleText) || scheduleVisibleText.includes('资料见本专题讲者')) {
  fail('schedule/index.html: session profile controls must match the current schedule copy');
}
const speakerItemCount = [...scheduleSource.matchAll(/class="[^"]*\bsession-item--speaker\b[^"]*"/g)].length;
const expectedSpeakerItemCount = conference2026.programPreview.sessions
  .reduce((total, session) => total + session.speakers.length, 0);
if (speakerItemCount !== expectedSpeakerItemCount) {
  fail(`schedule/index.html: expected ${expectedSpeakerItemCount} speaker rows, found ${speakerItemCount}`);
}
const talkTitleCount = [...scheduleSource.matchAll(/class="session-speaker__talk-title"/g)].length;
const expectedTalkTitleCount = conference2026.programPreview.sessions
  .flatMap((session) => session.speakers)
  .filter((speaker) => Boolean(speaker.talkTitle))
  .length;
if (talkTitleCount !== expectedTalkTitleCount) {
  fail(`schedule/index.html: expected ${expectedTalkTitleCount} confirmed talk titles, found ${talkTitleCount}`);
}
if (scheduleSource.includes('data-people-directory') || scheduleSource.includes('/speakers/#')) {
  fail('schedule/index.html: standalone people-directory structure or links must not return');
}
for (const privateMarker of [
  '订单号',
  '第三方订单号',
  '支付方式',
  '优惠邀请码',
  '手机号',
  '微信号',
]) {
  if (scheduleVisibleText.includes(privateMarker)) {
    fail(`schedule/index.html: private workbook field leaked: "${privateMarker}"`);
  }
}
for (const forbiddenSource of ['cdn-img.bagevent.com', 'attendee-list.xls']) {
  if (scheduleSource.includes(forbiddenSource)) {
    fail(`schedule/index.html: non-public source reference leaked: "${forbiddenSource}"`);
  }
}
if (gzipSync(scheduleSource).byteLength > 100_000) {
  fail('schedule/index.html: compressed HTML exceeds 100 KB');
}
for (const person of conference2026People) {
  for (const assignment of person.schedule) {
    if (assignment.role === 'speaker' && assignment.talkTitle && person.talkTitle !== assignment.talkTitle) {
      fail(`schedule/index.html: ${person.name} report title must match the confirmed schedule`);
    }
  }
}

const registerSource = await readFile(path.join(outputRoot, 'register/index.html'), 'utf8');
if (visibleText(registerSource).includes('报名链接')) {
  fail('register/index.html: redundant registration link must stay removed');
}

for (const [route, target] of currentRedirects) {
  const source = await readFile(path.join(outputRoot, route), 'utf8');
  const canonical = new URL(target, site.origin).href;
  if (!source.includes(`content="0;url=${target}"`)) fail(`${route}: missing redirect to "${target}"`);
  if (!source.includes('<meta name="robots" content="noindex">')) fail(`${route}: redirect must be noindex`);
  if (!source.includes(`<link rel="canonical" href="${canonical}">`)) {
    fail(`${route}: canonical must point to "${canonical}"`);
  }
}
for (const [route, target] of archiveCompatibilityRedirects) {
  const source = await readFile(path.join(outputRoot, route), 'utf8');
  const canonical = new URL(target, site.origin).href;
  if (!source.includes(`content="0;url=${target}"`)) fail(`${route}: missing archive redirect to "${target}"`);
  if (!source.includes('<meta name="robots" content="noindex">')) fail(`${route}: redirect must be noindex`);
  if (!source.includes(`<link rel="canonical" href="${canonical}">`)) {
    fail(`${route}: canonical must point to "${canonical}"`);
  }
}

const robots = await readFile(path.join(outputRoot, 'robots.txt'), 'utf8');
for (const retiredPath of ['/goal/', '/next/']) {
  if (!robots.includes(`Disallow: ${retiredPath}`)) {
    fail(`robots.txt: retired remote path "${retiredPath}" must remain disallowed`);
  }
}

const sitemap = await readFile(path.join(outputRoot, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
validateExactSet('sitemap.xml URLs', sitemapUrls, expectedSitemapUrls);

const syncScript = await readFile(path.resolve('scripts/sync-oss.mjs'), 'utf8');
if (/(?:^|["'\s])--delete(?:["'\s]|$)/m.test(syncScript)) {
  fail('sync-oss.mjs: full-site synchronization must never use --delete');
}
for (const retiredDirectory of ['goal', 'next']) {
  if (syncScript.includes(`'${retiredDirectory}/**'`) || syncScript.includes(`'${retiredDirectory}/*'`)) {
    fail(`sync-oss.mjs: retired preview exclusion for "${retiredDirectory}/" must stay removed`);
  }
}
if (syncScript.includes("'_assets/goal-history-*'")) {
  fail('sync-oss.mjs: production sync must publish the current history assets');
}
if (!syncScript.includes("path.resolve('scripts/validate-build.mjs')")) {
  fail('sync-oss.mjs: production sync must validate dist before uploading');
}

const goalStylesSource = await readFile(path.resolve('src/styles/goal-2026.css'), 'utf8');
if (!/\.edition-2026\.edition-goal-2026\s+\.site-footer\s*\{[^}]*background:\s*transparent;/s.test(goalStylesSource)) {
  fail('goal-2026.css: current inner-page footer must override the shared 2026 background regardless of stylesheet order');
}

const siteConfigSource = await readFile(path.resolve('src/config/site.ts'), 'utf8');
for (const retiredExport of ['goalDesignEdition', 'nextDesignEdition']) {
  if (siteConfigSource.includes(retiredExport)) {
    fail(`src/config/site.ts: retired preview export "${retiredExport}" must stay removed`);
  }
}
for (const retiredPath of [
  'src/pages/goal',
  'src/pages/next',
  'src/design-goal',
  'src/design-next',
  'design-qa.md',
  'public/brand',
  'public/favicon.png',
  'public/favicon.svg',
]) {
  if (await exists(path.resolve(retiredPath))) fail(`${retiredPath}: retired preview source must not exist`);
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Build validation passed');
