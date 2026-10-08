import submissions from './research-poster-sources.json' with { type: 'json' };

// Latest poster submissions determine the public roster. Keep review metadata private.
export const posterResearchPapers = submissions.posters.map(({ id, title, applicantName, affiliation, venue, href }) => ({
  id, title, applicantName, affiliation, venue, href,
})).toSorted((left, right) =>
  left.title.localeCompare(right.title, 'en', { sensitivity: 'base', numeric: true }),
);
