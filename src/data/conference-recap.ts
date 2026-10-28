import document from './conference-recap.generated.json' with { type: 'json' };

export type RecapBlock =
  | { type: 'heading'; level: 2 | 3 | 4; id: string; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'gallery'; images: string[] };

export const conferenceRecap = {
  ...document,
  blocks: document.blocks as RecapBlock[],
  images: document.images as Record<string, { basename: string; alt: string; sourcePath: string; sourceSha256: string }>,
};

export const recapIntroduction = conferenceRecap.blocks
  .filter((block): block is Extract<RecapBlock, { type: 'paragraph' }> => block.type === 'paragraph')
  .slice(0, 4);
