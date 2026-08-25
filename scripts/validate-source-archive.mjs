import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const archiveRelativeRoot = 'assets/source-archive/2026';
const archiveRoot = path.join(projectRoot, archiveRelativeRoot);
const manifestPath = path.join(archiveRoot, 'manifest.json');
const checksumPath = path.join(archiveRoot, 'checksums.sha256');

const fail = (message) => {
  throw new Error(`Source archive validation failed: ${message}`);
};

const toPosix = (value) => value.split(path.sep).join('/');

const walkFiles = (root) => {
  if (!existsSync(root)) fail(`missing directory ${toPosix(path.relative(projectRoot, root))}`);
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.name === '.DS_Store') continue;
    const absolutePath = path.join(root, entry.name);
    if (entry.isSymbolicLink()) fail(`symbolic links are not allowed: ${toPosix(path.relative(projectRoot, absolutePath))}`);
    if (entry.isDirectory()) files.push(...walkFiles(absolutePath));
    if (entry.isFile()) files.push(absolutePath);
  }
  return files;
};

const sha256 = (filePath) => createHash('sha256').update(readFileSync(filePath)).digest('hex');

const resolveRepositoryPath = (relativePath, label) => {
  if (typeof relativePath !== 'string' || relativePath.length === 0) fail(`${label} must be a non-empty string`);
  if (relativePath.includes('\\')) fail(`${label} must use forward slashes: ${relativePath}`);
  if (path.posix.isAbsolute(relativePath) || relativePath.split('/').includes('..')) {
    fail(`${label} must stay inside the repository: ${relativePath}`);
  }
  const absolutePath = path.resolve(projectRoot, relativePath);
  if (!absolutePath.startsWith(`${projectRoot}${path.sep}`)) fail(`${label} escaped the repository: ${relativePath}`);
  return absolutePath;
};

const metadataFiles = new Set(['README.md', 'manifest.json', 'checksums.sha256']);
const ambiguousStems = new Set([
  'asset',
  'background',
  'banner',
  'bg',
  'file',
  'icon',
  'image',
  'img',
  'logo',
  'mobile',
  'photo',
  'pic',
  'picture',
  'screenshot',
  'test',
]);
const ambiguousTokens = new Set(['backup', 'copy', 'draft', 'final', 'tmp', 'temp', 'untitled']);
const activeNamingRoots = [
  'assets/brand-kit/2026',
  archiveRelativeRoot,
  'public/2026',
  'src/assets/2026',
];

for (const relativeRoot of activeNamingRoots) {
  for (const filePath of walkFiles(path.join(projectRoot, relativeRoot))) {
    const basename = path.basename(filePath);
    if (metadataFiles.has(basename)) continue;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.[a-z0-9]+$/.test(basename)) {
      fail(`non-semantic filename in ${relativeRoot}: ${basename}`);
    }
    const stem = basename.slice(0, basename.lastIndexOf('.'));
    if (!/[a-z]/.test(stem)) fail(`number-only or year-only filename in ${relativeRoot}: ${basename}`);
    if (ambiguousStems.has(stem)) fail(`bare generic filename in ${relativeRoot}: ${basename}`);
    for (const token of stem.split('-')) {
      if (ambiguousTokens.has(token)) fail(`ambiguous token "${token}" in ${relativeRoot}: ${basename}`);
    }
  }
}

if (!existsSync(manifestPath)) fail('manifest.json is missing');
if (!existsSync(checksumPath)) fail('checksums.sha256 is missing');

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
if (manifest.schemaVersion !== 1) fail(`unsupported manifest schema ${manifest.schemaVersion}`);
if (!Array.isArray(manifest.entries)) fail('manifest entries must be an array');
if (manifest.sourceEntryCount !== manifest.entries.length) {
  fail(`manifest sourceEntryCount is ${manifest.sourceEntryCount}, found ${manifest.entries.length} entries`);
}

const originalPaths = new Set();
const canonicalPaths = new Set();
const manifestHashes = new Set();
const allowedStatuses = new Set(['archived', 'exact-duplicate', 'canonical-existing']);

for (const entry of manifest.entries) {
  if (typeof entry.originalPath !== 'string' || entry.originalPath.length === 0) fail('an entry has no originalPath');
  if (path.posix.isAbsolute(entry.originalPath) || entry.originalPath.includes('..') || entry.originalPath.includes('\\')) {
    fail(`originalPath must be provenance only, never an external absolute path: ${entry.originalPath}`);
  }
  if (originalPaths.has(entry.originalPath)) fail(`duplicate originalPath: ${entry.originalPath}`);
  originalPaths.add(entry.originalPath);

  if (!allowedStatuses.has(entry.status)) fail(`unsupported status for ${entry.originalPath}: ${entry.status}`);
  if (!/^[a-f0-9]{64}$/.test(entry.sha256)) fail(`invalid SHA-256 for ${entry.originalPath}`);
  if (!Number.isSafeInteger(entry.bytes) || entry.bytes <= 0) fail(`invalid byte count for ${entry.originalPath}`);
  if (typeof entry.note !== 'string' || entry.note.trim().length === 0) fail(`missing note for ${entry.originalPath}`);

  const canonicalPath = resolveRepositoryPath(entry.canonicalPath, `canonicalPath for ${entry.originalPath}`);
  if (!existsSync(canonicalPath) || !statSync(canonicalPath).isFile()) {
    fail(`missing canonical file for ${entry.originalPath}: ${entry.canonicalPath}`);
  }
  if (statSync(canonicalPath).size !== entry.bytes) fail(`byte count differs for ${entry.canonicalPath}`);
  if (sha256(canonicalPath) !== entry.sha256) fail(`SHA-256 differs for ${entry.canonicalPath}`);
  canonicalPaths.add(entry.canonicalPath);
  manifestHashes.add(entry.sha256);

  if (!Array.isArray(entry.runtimeCounterparts)) fail(`runtimeCounterparts must be an array for ${entry.originalPath}`);
  for (const runtimeCounterpart of entry.runtimeCounterparts) {
    const runtimePath = resolveRepositoryPath(runtimeCounterpart, `runtime counterpart for ${entry.originalPath}`);
    if (!existsSync(runtimePath) || !statSync(runtimePath).isFile()) {
      fail(`missing runtime counterpart for ${entry.originalPath}: ${runtimeCounterpart}`);
    }
  }
}

if (manifest.uniquePayloadCount !== manifestHashes.size) {
  fail(`manifest uniquePayloadCount is ${manifest.uniquePayloadCount}, found ${manifestHashes.size} unique hashes`);
}

const archivePayloadFiles = walkFiles(archiveRoot).filter((filePath) => !metadataFiles.has(path.basename(filePath)));
if (manifest.archiveFileCount !== archivePayloadFiles.length) {
  fail(`manifest archiveFileCount is ${manifest.archiveFileCount}, found ${archivePayloadFiles.length} payload files`);
}

const archiveHashes = new Map();
for (const filePath of archivePayloadFiles) {
  const relativePath = toPosix(path.relative(projectRoot, filePath));
  if (!canonicalPaths.has(relativePath)) fail(`archive payload is absent from manifest: ${relativePath}`);
  const digest = sha256(filePath);
  if (archiveHashes.has(digest)) fail(`duplicate archive payloads: ${archiveHashes.get(digest)} and ${relativePath}`);
  archiveHashes.set(digest, relativePath);
}

const checksumEntries = new Map();
for (const line of readFileSync(checksumPath, 'utf8').trim().split('\n')) {
  const match = line.match(/^([a-f0-9]{64})  (.+)$/);
  if (!match) fail(`invalid checksums.sha256 line: ${line}`);
  const [, digest, relativePath] = match;
  if (checksumEntries.has(relativePath)) fail(`duplicate checksum path: ${relativePath}`);
  checksumEntries.set(relativePath, digest);
}

if (checksumEntries.size !== archivePayloadFiles.length) {
  fail(`checksums.sha256 covers ${checksumEntries.size} files, expected ${archivePayloadFiles.length}`);
}
for (const filePath of archivePayloadFiles) {
  const relativePath = toPosix(path.relative(projectRoot, filePath));
  if (checksumEntries.get(relativePath) !== sha256(filePath)) fail(`checksum list differs for ${relativePath}`);
}

const textExtensions = new Set(['.astro', '.css', '.html', '.js', '.json', '.md', '.mjs', '.ts', '.txt', '.yaml', '.yml']);
const textRoots = ['README.md', 'assets', 'docs', 'scripts', 'src'];
const forbiddenFragments = ['/U' + 'sers/', '/V' + 'olumes/', '/private/' + 'tmp/', 'file:' + '//'];

for (const relativeRoot of textRoots) {
  const absoluteRoot = path.join(projectRoot, relativeRoot);
  const files = statSync(absoluteRoot).isDirectory() ? walkFiles(absoluteRoot) : [absoluteRoot];
  for (const filePath of files) {
    if (!textExtensions.has(path.extname(filePath))) continue;
    const contents = readFileSync(filePath, 'utf8');
    for (const fragment of forbiddenFragments) {
      if (contents.includes(fragment)) {
        fail(`private absolute filesystem path found in ${toPosix(path.relative(projectRoot, filePath))}`);
      }
    }
    if (/(?:^|[\s"'`(])[A-Za-z]:[\\/]/m.test(contents)) {
      fail(`Windows absolute filesystem path found in ${toPosix(path.relative(projectRoot, filePath))}`);
    }
  }
}

console.log(
  `Source archive validation passed (${manifest.sourceEntryCount} source entries, ${archivePayloadFiles.length} archived files).`,
);
