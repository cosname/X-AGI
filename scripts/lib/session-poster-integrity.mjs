import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { posterConference, sessionPosters } from '../../src/data/session-posters.ts';
import { posterTemplateAssets } from './session-poster-template.mjs';

export const posterManifestPath = 'src/data/session-posters.generated.json';
export const digest = (value) => createHash('sha256').update(value).digest('hex');
export const fileDigest = (file) => digest(readFileSync(file));
export const posterContentHash = (poster) => digest(JSON.stringify({ conference: posterConference, poster }));
export const posterInputs = (poster) => {
  const paths = [
    'scripts/lib/session-poster-template.mjs',
    ...posterTemplateAssets,
    `assets/source-archive/2026/session-posters/${poster.id}-background.png`,
    ...poster.speakers.filter((person) => person.portraitSrc).map((person) => `public${person.portraitSrc}`),
  ];
  return Object.fromEntries([...new Set(paths)].map((file) => [file, fileDigest(file)]));
};

export function verifyPosterManifest(manifest) {
  if (manifest.schemaVersion !== 1 || manifest.posters?.length !== sessionPosters.length) {
    throw new Error('Poster manifest must contain every current session exactly once. Run npm run posters:render.');
  }
  for (const poster of sessionPosters) {
    const entries = manifest.posters.filter((entry) => entry.id === poster.id);
    if (entries.length !== 1) throw new Error(`Missing or duplicated poster: ${poster.id}`);
    const entry = entries[0];
    if (entry.contentHash !== posterContentHash(poster)) {
      throw new Error(`${poster.id} text is stale. Run npm run posters:render.`);
    }
    if (JSON.stringify(entry.inputs) !== JSON.stringify(posterInputs(poster))) {
      throw new Error(`${poster.id} images or template are stale. Run npm run posters:render.`);
    }
    const expected = [
      `assets/source-archive/2026/session-posters/${poster.id}-print.png`,
      `public${poster.posterSrc}`,
      `public${poster.previewSrc}`,
    ];
    if (JSON.stringify(Object.keys(entry.exports)) !== JSON.stringify(expected)) {
      throw new Error(`${poster.id} export paths differ from the gallery.`);
    }
    for (const [file, metadata] of Object.entries(entry.exports)) {
      if (metadata.sha256 !== fileDigest(file)) throw new Error(`Poster export differs: ${file}`);
    }
  }
}
