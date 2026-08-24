import { spawnSync } from 'node:child_process';
import { stat } from 'node:fs/promises';
import path from 'node:path';

const bucket = process.env.OSS_BUCKET?.trim() || 'x-agi';
const source = path.resolve('dist');
const destination = `oss://${bucket}/`;
const dryRun = process.env.OSS_DRY_RUN === '1';

try {
  await stat(source);
} catch {
  throw new Error('dist/ is missing. Run `npm run build` first.');
}

const validator = path.resolve('scripts/validate-build.mjs');
const validation = spawnSync(process.execPath, [validator], { stdio: 'inherit' });
if (validation.status !== 0) {
  throw new Error('dist/ validation failed. Run `npm run build` before syncing.');
}

const args = [
  'sync',
  `${source}/`,
  destination,
  '--exclude',
  '.DS_Store',
  '--exclude',
  '**/.DS_Store',
  '--force',
];

if (dryRun) args.push('--dry-run');

console.log(`Syncing ${source}/ -> ${destination}${dryRun ? ' (dry run)' : ''}`);

const result = spawnSync('ossutil', args, { stdio: 'inherit' });
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
