import { createHash } from 'node:crypto';
import { lstat, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const archiveRelativeRoot = 'assets/source-archive/2026';
const metadataFiles = new Set(['README.md', 'manifest.json', 'checksums.sha256']);
const provenanceRoot = 'session-posters-20260916';
const fail = (message) => { throw new Error(`Session poster archive registration failed: ${message}`); };

function resolveRepositoryPath(root, relativePath) {
  if (typeof relativePath !== 'string' || !relativePath || relativePath.includes('\\')
      || path.posix.isAbsolute(relativePath) || relativePath.split('/').includes('..')) {
    fail(`invalid repository path: ${relativePath}`);
  }
  return path.join(root, relativePath);
}

async function requireFile(root, relativePath) {
  const absolutePath = resolveRepositoryPath(root, relativePath);
  let metadata;
  try {
    metadata = await lstat(absolutePath);
  } catch (error) {
    if (error.code === 'ENOENT') fail(`missing required file: ${relativePath}`);
    throw error;
  }
  if (!metadata.isFile() || metadata.isSymbolicLink()) fail(`not a regular file: ${relativePath}`);
  return { absolutePath, metadata };
}

async function walkPayloads(root, relativeDirectory = archiveRelativeRoot) {
  const directory = resolveRepositoryPath(root, relativeDirectory);
  const directoryStat = await lstat(directory);
  if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink()) fail(`invalid directory: ${relativeDirectory}`);
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === '.DS_Store') continue;
    const relativePath = `${relativeDirectory}/${entry.name}`;
    if (entry.isSymbolicLink()) fail(`symbolic link: ${relativePath}`);
    if (entry.isDirectory()) files.push(...await walkPayloads(root, relativePath));
    else if (entry.isFile() && !metadataFiles.has(entry.name)) files.push(relativePath);
  }
  return files.sort();
}

export async function prepareSessionPosterArchive(root = projectRoot) {
  const manifestRelativePath = `${archiveRelativeRoot}/manifest.json`;
  const manifest = JSON.parse(await readFile(resolveRepositoryPath(root, manifestRelativePath), 'utf8'));
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.entries)) fail('unsupported manifest schema');
  const originalPaths = new Set();
  for (const entry of manifest.entries) {
    if (originalPaths.has(entry.originalPath)) fail(`duplicate provenance: ${entry.originalPath}`);
    originalPaths.add(entry.originalPath);
  }

  const entries = manifest.entries.map((entry) => ({ ...entry }));
  const newEntries = [];
  for (let index = 1; index <= 14; index += 1) {
    const id = String(index).padStart(2, '0');
    for (const kind of ['background', 'print']) {
      const basename = `session-${id}-${kind}.png`;
      const canonicalPath = `${archiveRelativeRoot}/session-posters/${basename}`;
      const { absolutePath, metadata } = await requireFile(root, canonicalPath);
      const pixels = await sharp(absolutePath).metadata();
      if (pixels.format !== 'png' || !pixels.width || !pixels.height) fail(`expected PNG image: ${canonicalPath}`);
      const runtimeCounterparts = kind === 'background' ? [] : [
        `public/2026/session-posters/session-${id}.webp`,
        `public/2026/session-posters/session-${id}-preview.webp`,
      ];
      for (const counterpart of runtimeCounterparts) await requireFile(root, counterpart);
      const originalPath = `${provenanceRoot}/${basename}`;
      const previousIndex = entries.findIndex((entry) => entry.originalPath === originalPath);
      if (previousIndex !== -1 && entries[previousIndex].canonicalPath !== canonicalPath) {
        fail(`provenance already points to a different canonical file: ${originalPath}`);
      }
      const record = {
        ...(previousIndex === -1 ? {} : entries[previousIndex]),
        originalPath,
        canonicalPath,
        status: 'archived',
        sha256: createHash('sha256').update(await readFile(absolutePath)).digest('hex'),
        bytes: metadata.size,
        mediaType: 'image/png',
        dimensions: { width: pixels.width, height: pixels.height },
        sourceModifiedAt: metadata.mtime.toISOString(),
        runtimeCounterparts,
        note: kind === 'background'
          ? 'Original text-free session poster background generated with the built-in image tool for the 2026-09-16 poster collection. The archived PNG preserves the original generated image.'
          : 'Deterministic print poster composed from the archived generated background and existing public conference program, speaker information and portraits. WebP runtime exports serve the homepage poster gallery.',
      };
      if (previousIndex === -1) newEntries.push(record);
      else entries[previousIndex] = record;
    }
  }
  entries.push(...newEntries);

  const payloadPaths = await walkPayloads(root);
  const payloadHashes = new Map();
  const uniqueArchiveHashes = new Set();
  for (const relativePath of payloadPaths) {
    const digest = createHash('sha256').update(await readFile(resolveRepositoryPath(root, relativePath))).digest('hex');
    if (uniqueArchiveHashes.has(digest)) fail(`duplicate archived payload: ${relativePath}`);
    uniqueArchiveHashes.add(digest);
    payloadHashes.set(relativePath, digest);
  }
  const canonicalPaths = new Set();
  for (const entry of entries) {
    const { absolutePath, metadata } = await requireFile(root, entry.canonicalPath);
    const digest = payloadHashes.get(entry.canonicalPath)
      ?? createHash('sha256').update(await readFile(absolutePath)).digest('hex');
    if (entry.bytes !== metadata.size || entry.sha256 !== digest) {
      fail(`existing archive record differs from its payload: ${entry.canonicalPath}`);
    }
    canonicalPaths.add(entry.canonicalPath);
  }
  for (const relativePath of payloadPaths) {
    if (!canonicalPaths.has(relativePath)) fail(`archive payload is not registered: ${relativePath}`);
  }

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date());
  const updated = {
    ...manifest,
    lastExtendedOn: [manifest.lastExtendedOn ?? manifest.importedOn ?? '', today].sort().at(-1),
    sourceEntryCount: entries.length,
    uniquePayloadCount: new Set(entries.map((entry) => entry.sha256)).size,
    archiveFileCount: payloadPaths.length,
    entries,
  };
  return {
    manifest: updated,
    manifestText: `${JSON.stringify(updated, null, 2)}\n`,
    checksumText: `${payloadPaths.map((relativePath) => `${payloadHashes.get(relativePath)}  ${relativePath}`).join('\n')}\n`,
    addedEntryCount: newEntries.length,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some((argument) => argument !== '--dry-run')) fail('usage: node scripts/register-session-poster-archive.mjs [--dry-run]');
  const result = await prepareSessionPosterArchive();
  if (!args.includes('--dry-run')) {
    await writeFile(path.join(projectRoot, archiveRelativeRoot, 'manifest.json'), result.manifestText);
    await writeFile(path.join(projectRoot, archiveRelativeRoot, 'checksums.sha256'), result.checksumText);
  }
  console.log(`${args.includes('--dry-run') ? 'Validated' : 'Registered'} 28 session poster sources (${result.addedEntryCount} added; ${result.manifest.sourceEntryCount} source entries; ${result.manifest.archiveFileCount} archived files).`);
}
