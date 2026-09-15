import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { posterManifestPath, verifyPosterManifest } from './lib/session-poster-integrity.mjs';

const manifest = JSON.parse(await readFile(posterManifestPath, 'utf8'));
verifyPosterManifest(manifest);
for (const poster of manifest.posters) {
  for (const [file, recorded] of Object.entries(poster.exports)) {
    const metadata = await sharp(file).metadata();
    const preview = file.endsWith('-preview.webp');
    const width = preview ? 540 : 1080;
    const height = preview ? 720 : 1440;
    if (metadata.width !== width || metadata.height !== height || recorded.width !== width || recorded.height !== height) {
      throw new Error(`Incorrect poster dimensions: ${file}`);
    }
    if (recorded.bytes !== (await readFile(file)).length) throw new Error(`Incorrect poster size: ${file}`);
    if (file.endsWith('.webp') && recorded.bytes > (preview ? 140_000 : 550_000)) {
      throw new Error(`Poster exceeds its download budget: ${file}`);
    }
    if (metadata.exif || metadata.iptc || metadata.xmp) throw new Error(`Poster contains embedded metadata: ${file}`);
  }
}
console.log(`Verified ${manifest.posters.length} session posters: current content, source hashes, exports, dimensions and metadata.`);
