import { spawnSync } from 'node:child_process';

const accessKeyId = process.env.OSS_ACCESS_KEY_ID?.trim();
const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET?.trim();

if (!accessKeyId || !accessKeySecret) {
  console.error('Missing OSS credentials.');
  console.error('Set OSS_ACCESS_KEY_ID and OSS_ACCESS_KEY_SECRET, then run: npm run oss:configure');
  process.exit(1);
}

const run = (args) => {
  const result = spawnSync('ossutil', args, { encoding: 'utf8' });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || 'ossutil failed\n');
    process.exit(result.status ?? 1);
  }
};

run(['config', 'set', 'region', 'cn-beijing']);
run(['config', 'set', 'accessKeyID', accessKeyId]);
run(['config', 'set', 'accessKeySecret', accessKeySecret]);

console.log('Wrote ossutil credentials to ~/.ossutilconfig for region cn-beijing.');
console.log('Next: npm run oss:sync');
