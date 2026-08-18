import type { APIRoute } from 'astro';
import { editions, site } from '../config/site';

const disallowedEditions = Object.values(editions)
  .filter(({ status }) => status === 'planning')
  .map(({ path }) => `Disallow: ${path}/`);

export const GET: APIRoute = () =>
  new Response(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /next/',
      'Disallow: /goal/',
      ...disallowedEditions,
      `Sitemap: ${site.origin}/sitemap.xml`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
