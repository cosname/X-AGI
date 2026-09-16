import manifest from './paper-previews.generated.json' with { type: 'json' };

export const paperPreviews = manifest.previews;
export const paperPreviewById = new Map(paperPreviews.map((preview) => [preview.id, preview]));
