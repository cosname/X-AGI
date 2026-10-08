import manifest from './research-posters.generated.json' with { type: 'json' };

export const researchPosters = manifest.posters;
export const researchPosterById = new Map(researchPosters.map((poster) => [poster.id, poster]));
