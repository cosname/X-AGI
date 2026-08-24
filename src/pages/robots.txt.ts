import type { APIRoute } from 'astro';
import { editions, site } from '../config/site';

const disallowedEditions = Object.values(editions)
  .filter(({ status }) => status === 'planning')
  .map(({ path }) => `Disallow: ${path}/`);

// Keep retired preview paths blocked until their remote OSS objects are separately removed.
const retiredRemotePreviewPaths = ['/next/', '/goal/'];

export const GET: APIRoute = () =>
  new Response(
    [
      'User-agent: *',
      'Allow: /',
      ...retiredRemotePreviewPaths.map((path) => `Disallow: ${path}`),
      ...disallowedEditions,
      `Sitemap: ${site.origin}/sitemap.xml`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
