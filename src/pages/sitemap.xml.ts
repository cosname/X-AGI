import type { APIRoute } from 'astro';
import { editionPages } from '../config/navigation';
import { editionPath, editions } from '../config/site';

const paths = Object.values(editions)
  .filter(({ status }) => status !== 'planning')
  .flatMap((edition) => editionPages(edition).map((page) => editionPath(edition, page)));

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('https://www.x-agi.cc');
  const urls = paths
    .map((path) => `<url><loc>${new URL(path, origin)}</loc></url>`)
    .join('');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
