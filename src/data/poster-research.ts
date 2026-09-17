import { posterResearchPapers as submittedPapers } from './poster-research.generated.ts';

// Both public lists use title order without changing the imported registration data.
export const posterResearchPapers = submittedPapers.toSorted((left, right) =>
  left.title.localeCompare(right.title, 'en', { sensitivity: 'base', numeric: true }),
);
