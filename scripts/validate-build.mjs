import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { conference2026 } from '../src/data/conference2026.ts';
import { goalHistoryEvents } from '../src/data/goal-history.ts';
import { partnerLogoByName } from '../src/data/partner-logo-assets-2026.ts';
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
if (selectedLogoFiles.length !== 13 || new Set(selectedLogoFiles).size !== 13) {
  fail(`2026 partner logos: expected 13 unique selections, found ${new Set(selectedLogoFiles).size}`);
}
await validatePublicCopies('2026 partner logos', path.resolve('public/2026/logos'), selectedLogoFiles);

const public2026Root = path.resolve('public/2026');
validateExactSet(
  '2026 public asset tree',
  (await walk(public2026Root)).map((file) => relativeTo(public2026Root, file)),
  [
    ...runtimeBrandFiles.map((file) => `brand/${file}`),
    'legal/beian-icon.png',
    ...selectedLogoFiles.map((file) => `logos/${file}`),
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
    ...conference2026.sponsors.map((organization) => organization.name),
    conference2026.contact,
  ]],
  ['schedule/index.html', [
    conference2026.dates.compact,
    conference2026.venue.scheduleName,
    conference2026.scheduleNotice,
    'SESSIONS & SPEAKERS',
    `大会专题与嘉宾（${conference2026.programPreview.status.replace(/\.+$/, '')}）`,
    ...conference2026.programPreview.sessions.flatMap((session) => [
      session.title,
      session.chair.name === '待确认' ? '主席待确认' : session.chair.name,
      ...session.speakers.map((speaker) => speaker.name),
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
  if ((await stat(path.join(outputRoot, route))).size > 50_000) {
    fail(`${route}: HTML exceeds 50 KB`);
  }
  if ((await initialLocalPayload(path.join(outputRoot, route), managedDownloads)) > 1_500_000) {
    fail(`${route}: initial local payload exceeds 1.5 MB`);
  }
  for (const expected of expectedCopy) {
    if (!text.includes(expected)) fail(`${route}: missing official copy "${expected}"`);
  }
}

const scheduleSource = await readFile(path.join(outputRoot, 'schedule/index.html'), 'utf8');
const scheduleCardCount = [...scheduleSource.matchAll(/class="[^"]*\bschedule-card\b[^"]*"/g)].length;
if (scheduleCardCount !== conference2026.programPreview.sessions.length) {
  fail(`schedule/index.html: expected ${conference2026.programPreview.sessions.length} schedule cards, found ${scheduleCardCount}`);
}
if (scheduleSource.includes('schedule-tabs') || scheduleSource.includes('goal-schedule-preview')) {
  fail('schedule/index.html: retired schedule preview structure must not return');
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
