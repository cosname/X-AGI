import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { editionPages } from '../src/config/navigation.ts';
import { conference2026 } from '../src/data/conference2026.ts';
import {
  currentEdition,
  editionPath,
  goalDesignEdition,
  nextDesignEdition,
  site,
} from '../src/config/site.ts';

const root = path.resolve('dist');
const manifest = JSON.parse(
  await readFile('public/2025/downloads-manifest.json', 'utf8'),
);
const failures = [];
const managedDownloads = new Set();

for (const download of manifest.downloads ?? []) {
  if (!download.path?.startsWith('/2025/assets/slides/')) {
    failures.push(`download manifest: invalid archive path "${download.path}"`);
  }
  if (!Number.isSafeInteger(download.bytes) || download.bytes <= 0) {
    failures.push(`download manifest: invalid byte size for "${download.path}"`);
  }
  if (!/^[a-f0-9]{64}$/.test(download.sha256 ?? '')) {
    failures.push(`download manifest: invalid SHA-256 for "${download.path}"`);
  }
  if (managedDownloads.has(download.path)) {
    failures.push(`download manifest: duplicate path "${download.path}"`);
  }
  managedDownloads.add(download.path);
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolutePath)));
    if (entry.isFile()) files.push(absolutePath);
  }

  return files;
}

function visibleText(source) {
  return source
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

async function resolvesToOutput(htmlFile, reference) {
  const pathname = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
  if (!pathname || managedDownloads.has(pathname)) return true;

  const candidate = pathname.startsWith('/')
    ? path.join(root, pathname.replace(/^\/+/, ''))
    : path.resolve(path.dirname(htmlFile), pathname);

  try {
    const metadata = await stat(candidate);
    if (metadata.isFile()) return true;
    if (metadata.isDirectory()) {
      const index = await stat(path.join(candidate, 'index.html'));
      return index.isFile();
    }
  } catch {
    return false;
  }

  return false;
}

async function outputFileForReference(sourceFile, reference) {
  const pathname = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
  if (
    !pathname ||
    managedDownloads.has(pathname) ||
    /^(?:https?:|mailto:|tel:|data:|javascript:)/.test(reference)
  ) {
    return undefined;
  }

  const candidate = pathname.startsWith('/')
    ? path.join(root, pathname.replace(/^\/+/, ''))
    : path.resolve(path.dirname(sourceFile), pathname);

  try {
    const metadata = await stat(candidate);
    if (metadata.isFile()) return candidate;
    if (metadata.isDirectory()) return path.join(candidate, 'index.html');
  } catch {
    return undefined;
  }

  return undefined;
}

async function collectInitialDependency(file, dependencies) {
  if (!file || dependencies.has(file)) return;
  dependencies.add(file);

  if (!file.endsWith('.css')) return;
  const source = await readFile(file, 'utf8');
  const references = [...source.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(
    (match) => match[1],
  );

  for (const reference of references) {
    await collectInitialDependency(
      await outputFileForReference(file, reference),
      dependencies,
    );
  }
}

async function initialLocalPayload(htmlFile) {
  const source = await readFile(htmlFile, 'utf8');
  const dependencies = new Set([htmlFile]);
  const tags = [...source.matchAll(/<(?:link|script|img|iframe)\b[^>]*>/gi)].map(
    (match) => match[0],
  );

  for (const tag of tags) {
    if (/^<(?:img|iframe)\b/i.test(tag) && /\sloading=["']lazy["']/i.test(tag)) {
      continue;
    }

    const reference = tag.match(/\s(?:href|src)=["']([^"']+)["']/i)?.[1];
    if (!reference) continue;
    await collectInitialDependency(
      await outputFileForReference(htmlFile, reference),
      dependencies,
    );
  }

  let bytes = 0;
  for (const dependency of dependencies) bytes += (await stat(dependency)).size;
  return bytes;
}

async function homepageHeroCssUsesImage(htmlFile, source, hero) {
  const inlineStyles = [...hero.matchAll(/\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)]
    .map((match) => match[1] ?? match[2] ?? '');
  if (inlineStyles.some((style) => /(?:url|image-set)\s*\(/i.test(style))) {
    return true;
  }

  const styleSources = [...source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(
    (match) => match[1],
  );
  const stylesheetReferences = [...source.matchAll(/<link\b[^>]*>/gi)]
    .map((match) => match[0])
    .filter((tag) => /\srel=["'][^"']*stylesheet[^"']*["']/i.test(tag))
    .map((tag) => tag.match(/\shref=["']([^"']+)["']/i)?.[1])
    .filter(Boolean);

  for (const reference of stylesheetReferences) {
    const stylesheet = await outputFileForReference(htmlFile, reference);
    if (stylesheet?.endsWith('.css')) {
      styleSources.push(await readFile(stylesheet, 'utf8'));
    }
  }

  const heroRules = styleSources
    .flatMap((stylesheet) => stylesheet.split('}'))
    .filter((rule) => (
      rule.includes('.hero-pixel-field')
      || rule.includes('[data-hero-pixel-field]')
      || rule.includes('.conference-hero')
    ));

  const heroClasses = new Set(
    [...hero.matchAll(/\sclass=["']([^"']+)["']/gi)]
      .flatMap((match) => match[1].split(/\s+/))
      .filter(Boolean),
  );

  return heroRules.some((rule) => {
    if (!/(?:url|image-set)\s*\(/i.test(rule)) return false;
    const selector = rule.split('{', 1)[0] ?? '';
    const selectorClasses = [...selector.matchAll(/\.([a-z0-9_-]+)/gi)]
      .map((match) => match[1]);
    return selectorClasses.some((className) => heroClasses.has(className));
  });
}

const outputFiles = await walk(root);

for (const htmlFile of outputFiles.filter((file) => file.endsWith('.html'))) {
  const relativeFile = path.relative(root, htmlFile);
  const source = await readFile(htmlFile, 'utf8');
  const withoutComments = source.replace(/<!--[\s\S]*?-->/g, '');
  const ids = [...withoutComments.matchAll(/\sid=["']([^"']+)["']/g)].map(
    (match) => match[1],
  );

  for (const id of new Set(ids)) {
    if (ids.filter((candidate) => candidate === id).length > 1) {
      failures.push(`${relativeFile}: duplicate id "${id}"`);
    }
  }

  const references = [
    ...withoutComments.matchAll(/\s(?:href|src)=["']([^"']+)["']/g),
  ].map((match) => match[1]);

  for (const reference of references) {
    if (
      reference.startsWith('#') ||
      /^(?:https?:|mailto:|tel:|data:|javascript:)/.test(reference)
    ) {
      continue;
    }

    if (!(await resolvesToOutput(htmlFile, reference))) {
      failures.push(`${relativeFile}: missing local reference "${reference}"`);
    }
  }
}

function outputRouteForPage(edition, page) {
  const route = editionPath(edition, page).replace(/^\/+|\/+$/g, '');
  if (!route) return 'index.html';
  return edition.routeStyle === 'html' ? route : `${route}/index.html`;
}

const buildGroups = [
  {
    label: 'current edition',
    edition: currentEdition,
    payloadBudgetScope: 'homepage',
    requireDomHomepage: true,
  },
  {
    label: 'next design',
    edition: nextDesignEdition,
    payloadBudgetScope: 'all',
    requireDomHomepage: true,
  },
  {
    label: 'goal design',
    edition: goalDesignEdition,
    payloadBudgetScope: 'homepage',
    requireDomHomepage: true,
  },
];

for (const group of buildGroups) {
  for (const page of editionPages(group.edition)) {
    const route = outputRouteForPage(group.edition, page);
    const file = path.join(root, route);

    try {
      await stat(file);
    } catch {
      failures.push(`${group.label}: missing generated page "${route}"`);
      continue;
    }

    const htmlBytes = (await stat(file)).size;
    const source = await readFile(file, 'utf8');
    const staticMarkup = source.replace(/<script\b[\s\S]*?<\/script>/gi, '');
    const isDomPixelHomepage = page === ''
      && source.includes('data-hero-pixel-field');
    const htmlBudget = isDomPixelHomepage ? 700_000 : 50_000;

    if (htmlBytes > htmlBudget) {
      failures.push(`${route}: HTML exceeds ${htmlBudget / 1_000} KB budget`);
    }

    if (page === '' && group.requireDomHomepage && !isDomPixelHomepage) {
      failures.push(`${route}: ${group.label} homepage must render the DOM pixel field`);
    }
    if (source.includes('liquid-glass') || source.includes('data-liquid-glass')) {
      failures.push(`${route}: retired liquid-glass interaction leaked into the build`);
    }
    if (group.edition.skin === 'legacy-2025' && !source.includes('edition-legacy-2025')) {
      failures.push(`${route}: current edition must use the legacy 2025 skin`);
    }
    if (
      group.edition.skin === 'legacy-2025'
      && (
        source.includes('edition-goal-2026')
        || source.includes('data-hero-pixel-field')
        || source.includes('data-masthead-pixel-field')
      )
    ) {
      failures.push(`${route}: current edition must not load goal preview artwork`);
    }
    if (
      group.edition.skin === 'goal'
      && !source.includes('edition-site edition-2026')
    ) {
      failures.push(`${route}: goal page must use the shared 2026 shell`);
    }
    if (
      group.edition.skin === 'goal'
      && page !== ''
      && !source.includes('edition-goal-2026')
    ) {
      failures.push(`${route}: goal inner page must use the hybrid 2026 skin`);
    }
    if (
      group.edition.skin === 'goal'
      && page !== ''
      && (
        !source.includes('data-masthead-pixel-field')
        || !source.includes('data-connection-stage')
      )
    ) {
      failures.push(`${route}: goal inner page must expose an interactive masthead field`);
    }
    if (
      group.edition.skin === 'goal'
      && (
        !source.includes('data-scroll-header="true"')
        || !source.includes('data-scroll-state="top"')
        || !source.includes('data-scroll-threshold="50"')
      )
    ) {
      failures.push(`${route}: goal page must opt into the shared scroll-header state contract`);
    }
    if (
      group.edition.skin === 'goal'
      && (
        !staticMarkup.includes('class="site-header"')
        || !staticMarkup.includes('/brand/xagi-connect-logo.png')
        || !staticMarkup.includes('data-nav-capsule="true"')
        || !staticMarkup.includes('data-nav-capsule-target')
        || staticMarkup.includes('class="navbar ')
        || staticMarkup.includes('/2025/assets/js/script.js')
      )
    ) {
      failures.push(`${route}: goal page must use only the shared 2026 navigation component`);
    }
    if (
      group.edition.skin !== 'goal'
      && (
        staticMarkup.includes('data-scroll-header="true"')
        || staticMarkup.includes('data-nav-capsule="true"')
        || staticMarkup.includes('data-nav-capsule-target')
        || staticMarkup.includes('data-pointer-effect="ripple"')
      )
    ) {
      failures.push(`${route}: goal header interaction leaked outside the goal design`);
    }

    if (isDomPixelHomepage) {
      const compressedPageBytes = gzipSync(source).byteLength;
      if (compressedPageBytes > 75_000) {
        failures.push(`${route}: compressed homepage HTML exceeds 75 KB budget`);
      }

      const hero = source.match(
        /<section\b[^>]*class="[^"]*\bconference-hero\b[^"]*"[^>]*>[\s\S]*?<\/section>/,
      )?.[0] ?? '';
      const compressedHeroBytes = gzipSync(hero).byteLength;
      if (compressedHeroBytes > 55_000) {
        failures.push(`${route}: compressed hero HTML exceeds 55 KB budget`);
      }

      const expectedPixels = Number(hero.match(/data-pixel-count="(\d+)"/)?.[1] ?? 0);
      const renderedPixels = [...hero.matchAll(/class="hp\s/g)].length;
      const terrainLayers = [...hero.matchAll(/\sdata-layer=/g)].length;
      const terrainEchoes = [...hero.matchAll(/\sdata-echo=/g)].length;
      const leftTrees = [...hero.matchAll(/data-tree-position="left"/g)].length;
      const rightTrees = [...hero.matchAll(/data-tree-position="right"/g)].length;

      if (!hero.includes('data-render-mode="dom"')) {
        failures.push(`${route}: homepage hero is not marked as DOM-rendered`);
      }
      if (expectedPixels <= 0 || expectedPixels > 4_000 || renderedPixels !== expectedPixels) {
        failures.push(`${route}: invalid DOM pixel count (${renderedPixels}/${expectedPixels})`);
      }

      if (group.edition.skin === 'goal') {
        if (
          !hero.includes('data-visual-composition="badge"')
          || !hero.includes('data-terrain-enabled="true"')
          || !hero.includes('data-tree-interaction="calm"')
          || !hero.includes('data-terrain-profile="tree-foundation"')
        ) {
          failures.push(`${route}: goal homepage must expose the badge composition contract`);
        }
        if (leftTrees !== 0 || rightTrees !== 1) {
          failures.push(`${route}: goal homepage must render one right tree and no left tree`);
        }
        if (terrainLayers !== 9 || terrainEchoes !== 11) {
          failures.push(`${route}: goal homepage must render the responsive probability terrain`);
        }
        if (
          !hero.includes('class="hero-pixel-field__paper"')
          || /<(?:img|picture)\b/i.test(hero)
          || !(await resolvesToOutput(file, '/2026/brand/goal-paper-texture.webp'))
        ) {
          failures.push(`${route}: goal homepage is missing the tiled paper surface`);
        }
        if (
          !hero.includes('conference-hero__tagline-axis')
          || /<(?:canvas|img|picture|svg)\b/i.test(hero)
          || source.includes('hero-reference-trees')
        ) {
          failures.push(`${route}: goal homepage must keep the title, tree, and terrain DOM-rendered`);
        }
      } else {
        if (
          !hero.includes('data-visual-composition="grove"')
          || !hero.includes('data-terrain-enabled="true"')
          || !hero.includes('data-tree-interaction="direct"')
        ) {
          failures.push(`${route}: non-goal homepage must preserve the grove composition contract`);
        }
        if (leftTrees !== 1 || rightTrees !== 1) {
          failures.push(`${route}: non-goal homepage must preserve both DOM trees`);
        }
        if (terrainLayers !== 9) {
          failures.push(`${route}: expected 9 probability terrain layers, found ${terrainLayers}`);
        }
        if (terrainEchoes !== 11) {
          failures.push(`${route}: expected 11 probability echoes, found ${terrainEchoes}`);
        }
        if (/<(?:canvas|img|picture|svg)\b/i.test(hero) || source.includes('hero-reference-trees')) {
          failures.push(`${route}: homepage hero contains a raster, Canvas, or SVG dependency`);
        }
        if (await homepageHeroCssUsesImage(file, source, hero)) {
          failures.push(`${route}: homepage hero CSS contains an image dependency`);
        }
      }
    }

    const shouldEnforcePayloadBudget = group.payloadBudgetScope === 'all'
      || (group.payloadBudgetScope === 'homepage' && page === '');
    if (shouldEnforcePayloadBudget) {
      const payloadBytes = await initialLocalPayload(file);
      const budget = page === '' ? 1_000_000 : 1_500_000;
      if (payloadBytes > budget) {
        failures.push(`${route}: initial local payload exceeds ${budget / 1_000_000} MB budget`);
      }
    }
  }
}

function organizationCopy(organizations) {
  return organizations.flatMap((organization) => [
    organization.name,
    ...(organization.intro ?? []),
  ]);
}

const officialCopyByRoute = new Map([
  [
    'about/index.html',
    [
      ...conference2026.introduction,
      ...organizationCopy(conference2026.organizers),
      ...organizationCopy(conference2026.coOrganizers),
      ...organizationCopy(conference2026.sponsors),
      conference2026.contact,
    ],
  ],
  [
    'schedule/index.html',
    [
      conference2026.dates.compact,
      conference2026.venue.scheduleName,
      ...conference2026.schedule.flatMap((day) => [
        day.date,
        ...day.sessions.flatMap((session) => [
          session.period,
          session.title,
          session.venue,
          session.chair?.name,
          session.chair?.bio,
          ...(session.notes ?? []),
          ...(session.talks ?? []).flatMap((talk) => [
            talk.time,
            talk.title,
            talk.speaker,
            talk.affiliation,
            talk.abstract,
            talk.bio,
          ]),
        ]),
      ]).filter(Boolean),
      conference2026.programPreview.status,
      conference2026.programPreview.note,
      ...conference2026.programPreview.sessions.flatMap((session) => [
        session.title,
        session.chair.name,
        ...session.speakers.map((speaker) => speaker.name),
      ]),
    ],
  ],
  [
    'poster/index.html',
    [
      conference2026.poster.title,
      conference2026.poster.headline,
      conference2026.poster.description,
      conference2026.poster.ticket.label,
      String(conference2026.poster.ticket.value),
      ...conference2026.poster.requirements,
      ...conference2026.poster.benefits,
      conference2026.poster.deadline.date,
      conference2026.poster.deadline.time,
      conference2026.scale.posters,
      conference2026.contact,
    ],
  ],
  [
    'guide/index.html',
    [
      conference2026.venue.scheduleName,
      conference2026.venue.nameEn,
      ...conference2026.venue.maps.flatMap((map) => [map.title, map.description]),
      '交通与住宿',
      '友谊宾馆 X-AGI 大会专属优惠',
      '5328460',
      '2026.10.16',
      '2026.10.19',
    ],
  ],
  [
    'register/index.html',
    [
      conference2026.registration.description,
      ...conference2026.registration.notes,
      ...conference2026.tickets.notes,
      ...conference2026.tickets.bands.flatMap((band) => [
        band.label,
        ...band.rows.flatMap((row) => [
          row.name,
          String(row.student),
          String(row.general),
        ]),
      ]),
      conference2026.venue.scheduleName,
      '报名链接',
    ],
  ],
]);

for (const [officialRoute, expectedCopy] of officialCopyByRoute) {
  for (const route of [officialRoute, `goal/${officialRoute}`]) {
    const file = path.join(root, route);
    const text = visibleText(await readFile(file, 'utf8'));

    for (const expected of expectedCopy) {
      if (!text.includes(expected)) {
        failures.push(`${route}: missing official copy "${expected}"`);
      }
    }
  }
}

const rootIndex = await readFile(path.join(root, 'index.html'), 'utf8');
if (rootIndex.includes('redirect-page')) {
  failures.push('index.html: official root must not be a redirect interstitial');
}
if (!rootIndex.includes('hero-section') && !rootIndex.includes('data-hero-pixel-field')) {
  failures.push('index.html: official root must render the current edition homepage');
}

const rootText = visibleText(rootIndex);
const homepagePartnerLabels = ['主办单位', '协办单位', '赞助单位'];
if (rootText.includes('发起方')) {
  failures.push('index.html: homepage partner list must not repeat the initiator section');
}

function validatePartnerOrder(route, text, labels) {
  let previousPartnerLabelIndex = -1;
  for (const label of labels) {
    const labelIndex = text.indexOf(label);
    if (labelIndex < 0) {
      failures.push(`${route}: missing homepage partner label "${label}"`);
      continue;
    }
    if (labelIndex < previousPartnerLabelIndex) {
      failures.push(`${route}: homepage partner label "${label}" is out of order`);
    }
    previousPartnerLabelIndex = labelIndex;
  }
}

validatePartnerOrder('index.html', rootText, homepagePartnerLabels);

for (const route of ['about/index.html', 'goal/about/index.html']) {
  const source = await readFile(path.join(root, route), 'utf8');
  if (/<(?:h[1-6]|div)[^>]*>\s*发起方\s*<\//u.test(source)) {
    failures.push(`${route}: organization sections must not repeat the initiator group`);
  }
}

for (const expectedCopy of [
  conference2026.programPreview.status,
  conference2026.programPreview.note,
  conference2026.registration.description,
  ...conference2026.programPreview.sessions.flatMap((session) => [
    session.title,
    session.chair.name,
    ...session.speakers.map((speaker) => speaker.name),
  ]),
]) {
  if (!rootText.includes(expectedCopy)) {
    failures.push(`index.html: missing latest program copy "${expectedCopy}"`);
  }
}

if (rootText.includes('青年之夜')) {
  failures.push('index.html: retired Youth Night copy must not be published');
}

const goalIndex = await readFile(path.join(root, 'goal/index.html'), 'utf8');
const goalPages = ['', 'about', 'schedule', 'poster', 'guide', 'register'];

for (const page of goalPages) {
  const route = page ? `goal/${page}/index.html` : 'goal/index.html';
  const source = page ? await readFile(path.join(root, route), 'utf8') : goalIndex;

  if (!source.includes('<meta name="robots" content="noindex, nofollow">')) {
    failures.push(`${route}: goal preview must be noindex and nofollow`);
  }
  if (page && !source.includes('data-pointer-effect="ripple"')) {
    failures.push(`${route}: goal masthead must expose the ripple-only pointer field`);
  }
}

if (!goalIndex.includes('edition-goal-home--with-lower')) {
  failures.push('goal/index.html: full preview must enable the long-form homepage shell');
}

const goalHomeMarkers = [
  'data-goal-home-contract="full-preview"',
  'id="goal-history"',
  'data-history-gallery',
  'id="goal-agenda"',
  'data-compact-schedule',
  'id="goal-participation"',
  'class="goal-partners"',
  'class="goal-partners__legal"',
];
let previousGoalMarkerIndex = -1;
for (const marker of goalHomeMarkers) {
  const markerIndex = goalIndex.indexOf(marker);
  if (markerIndex < 0) {
    failures.push(`goal/index.html: missing full-preview marker "${marker}"`);
    continue;
  }
  if (markerIndex < previousGoalMarkerIndex) {
    failures.push(`goal/index.html: full-preview marker "${marker}" is out of order`);
  }
  previousGoalMarkerIndex = markerIndex;
}

const expectedGoalHomeCopy = [
  conference2026.history.title,
  conference2026.history.summary,
  ...conference2026.history.stats.flatMap((item) => [item.value, item.label]),
  ...conference2026.history.gallery.flatMap((item) => [
    item.year,
    item.location,
    item.title,
    item.caption,
  ]),
  conference2026.poster.title,
  conference2026.poster.headline,
  conference2026.poster.ticket.label,
  conference2026.registration.status,
  conference2026.registration.description,
  '发起单位',
  '主办单位',
  '协办单位',
  '赞助单位',
  '京ICP备2024062260号-3',
  '京公网安备11010502057471号',
];
const goalText = visibleText(goalIndex);
for (const expected of expectedGoalHomeCopy) {
  if (!goalText.includes(expected)) {
    failures.push(`goal/index.html: missing full-preview copy "${expected}"`);
  }
}

const goalPartnerStart = goalIndex.indexOf('class="goal-partners"');
const goalPartnerFragment = goalPartnerStart >= 0 ? goalIndex.slice(goalPartnerStart) : '';
const goalPartnerText = visibleText(goalPartnerFragment);
const goalPartnerGroups = [
  ['initiators', '发起单位', conference2026.initiators],
  ['organizers', '主办单位', conference2026.organizers],
  ['co-organizers', '协办单位', conference2026.coOrganizers],
  ['sponsors', '赞助单位', conference2026.sponsors],
];
let previousGoalPartnerIndex = -1;
for (const [key, label, organizations] of goalPartnerGroups) {
  const groupMarker = `goal-partners__group--${key}`;
  const groupIndex = goalPartnerFragment.indexOf(groupMarker);
  if (groupIndex < 0) {
    failures.push(`goal/index.html: missing semantic partner group "${label}"`);
  } else if (groupIndex < previousGoalPartnerIndex) {
    failures.push(`goal/index.html: partner group "${label}" is out of order`);
  }
  previousGoalPartnerIndex = Math.max(previousGoalPartnerIndex, groupIndex);

  for (const organization of organizations) {
    if (!goalPartnerText.includes(organization.name)) {
      failures.push(`goal/index.html: missing ${label} organization "${organization.name}"`);
    }
  }
}

for (const [marker, description] of [
  ['data-goal-home-contract=', 'full-preview contract'],
  ['data-goal-home-lower', 'goal lower-page composition'],
  ['data-history-gallery', 'history gallery'],
  ['data-compact-schedule', 'compact schedule'],
  ['goal-partners__legal', 'goal legal footer'],
  ['conference-program-outline', 'goal schedule outline'],
]) {
  if (rootIndex.includes(marker)) {
    failures.push(`index.html: ${description} must not leak into the public homepage`);
  }
}

const scheduleIndex = await readFile(path.join(root, 'schedule/index.html'), 'utf8');
const goalScheduleIndex = await readFile(path.join(root, 'goal/schedule/index.html'), 'utf8');
const scheduleSessionCount = conference2026.schedule.reduce(
  (count, day) => count + day.sessions.length,
  0,
);
const publishedTalks = conference2026.schedule.flatMap((day) =>
  day.sessions.flatMap((session) => (session.talks ?? []).filter((talk) =>
    Boolean(
      talk.time
      || talk.title
      || talk.speaker
      || talk.affiliation
      || talk.abstract
      || talk.bio
      || talk.slides
    )
  ))
);
const publicScheduleCards = [
  ...scheduleIndex.matchAll(/class="[^"]*\bschedule-card\b[^"]*"/g),
].length;
const publicScheduleTalks = [
  ...scheduleIndex.matchAll(/class="[^"]*\bschedule-talk\b[^"]*"/g),
].length;
const goalScheduleDays = [
  ...goalScheduleIndex.matchAll(/class="conference-program-outline__day"/g),
].length;
const goalSchedulePeriods = [
  ...goalScheduleIndex.matchAll(/class="conference-program-outline__period"/g),
].length;
const goalScheduleTalkGroups = [
  ...goalScheduleIndex.matchAll(/class="conference-program-outline__talks"/g),
].length;
const publishedTalkGroups = conference2026.schedule.reduce(
  (count, day) => count + day.sessions.filter((session) =>
    (session.talks ?? []).some((talk) => publishedTalks.includes(talk))
  ).length,
  0,
);

if (!scheduleIndex.includes('class="conference-program-preview conference-program-preview--schedule"')) {
  failures.push('schedule/index.html: public schedule must render the shared program preview');
}
if (!scheduleIndex.includes('class="schedule-intro"') || !scheduleIndex.includes('class="nav nav-pills schedule-tabs')) {
  failures.push('schedule/index.html: public schedule must preserve its date-navigation structure');
}
if (scheduleIndex.includes('conference-program-outline')) {
  failures.push('schedule/index.html: goal schedule outline must not leak into the public schedule');
}
if (publicScheduleCards !== scheduleSessionCount) {
  failures.push(`schedule/index.html: expected ${scheduleSessionCount} schedule cards, found ${publicScheduleCards}`);
}
if (publicScheduleTalks !== publishedTalks.length) {
  failures.push(`schedule/index.html: expected ${publishedTalks.length} published talks, found ${publicScheduleTalks}`);
}

if (
  !goalScheduleIndex.includes('goal-schedule-preview')
  || !goalScheduleIndex.includes('class="conference-program-outline"')
  || !goalScheduleIndex.includes('class="conference-program-preview conference-program-preview--schedule"')
) {
  failures.push('goal/schedule/index.html: preview must compose the schedule outline and shared program preview');
}
if (goalScheduleDays !== conference2026.schedule.length) {
  failures.push(`goal/schedule/index.html: expected ${conference2026.schedule.length} schedule days, found ${goalScheduleDays}`);
}
if (goalSchedulePeriods !== scheduleSessionCount) {
  failures.push(`goal/schedule/index.html: expected ${scheduleSessionCount} schedule sessions, found ${goalSchedulePeriods}`);
}
if (goalScheduleTalkGroups !== publishedTalkGroups) {
  failures.push(`goal/schedule/index.html: expected ${publishedTalkGroups} published-talk groups, found ${goalScheduleTalkGroups}`);
}

for (const placeholder of [
  'Full schedule TBD. Current sessions and speakers are listed below.',
  'SESSIONS & SPEAKERS',
  'Exact dates, times, rooms, and talk titles are TBD.',
  'Time TBD',
  'Talk title TBD',
  'Speaker TBD',
]) {
  if (scheduleIndex.includes(placeholder) || goalScheduleIndex.includes(placeholder)) {
    failures.push(`schedule routes: retired placeholder copy must not be published ("${placeholder}")`);
  }
}

for (const talk of publishedTalks) {
  if (talk.slides) {
    for (const [route, source] of [
      ['schedule/index.html', scheduleIndex],
      ['goal/schedule/index.html', goalScheduleIndex],
    ]) {
      if (!source.includes(`href="${talk.slides}"`)) {
        failures.push(`${route}: missing published slide link "${talk.slides}"`);
      }
    }
  }
}

const aiInfra = conference2026.programPreview.sessions.find((session) => session.title === 'AI Infra');
if (!aiInfra || aiInfra.speakers.length !== 0) {
  failures.push('conference2026: AI Infra must not publish unconfirmed speakers');
}
const posterTicketCopy = '报名参加 Rising Stars Poster 即赠专业票。';
if (
  !conference2026.registration.notes.includes(posterTicketCopy)
  || !conference2026.tickets.notes.includes(posterTicketCopy)
) {
  failures.push('conference2026: registration paths must preserve the audited Rising Stars Poster wording');
}

const nextIndex = await readFile(path.join(root, 'next/index.html'), 'utf8');

function validatePreviewPartnerSection(route, source) {
  const partnerStart = source.indexOf('class="conference-partners conference-partners--logos"');
  const partnerEnd = source.indexOf('class="conference-update-strip"', partnerStart);
  if (partnerStart < 0 || partnerEnd < 0) {
    failures.push(`${route}: missing homepage organization logo section`);
    return;
  }

  const partnerFragment = source.slice(partnerStart, partnerEnd);
  const partnerText = visibleText(partnerFragment);
  const partnerLabels = ['主办单位', '协办单位', '赞助单位'];

  if (partnerText.includes('发起方')) {
    failures.push(`${route}: homepage organization section must not repeat the initiators`);
  }
  validatePartnerOrder(route, partnerText, partnerLabels);

  for (const organization of [
    ...conference2026.organizers,
    ...conference2026.coOrganizers,
    ...conference2026.sponsors,
  ]) {
    if (
      !partnerFragment.includes(`alt="${organization.name}"`)
      && !partnerText.includes(organization.name)
    ) {
      failures.push(`${route}: missing homepage organization "${organization.name}"`);
    }
  }
}

validatePreviewPartnerSection('next/index.html', nextIndex);

const redirectTargets = new Map([
  ['2026/index.html', '/'],
  ['2026/about/index.html', '/about/'],
  ['2026/schedule/index.html', '/schedule/'],
  ['2026/poster/index.html', '/poster/'],
  ['2026/guide/index.html', '/guide/'],
  ['2026/register/index.html', '/register/'],
  ['2026/speakers/index.html', '/schedule/'],
  ['speakers/index.html', '/schedule/'],
]);

for (const [route, target] of redirectTargets) {
  const source = await readFile(path.join(root, route), 'utf8');
  const canonical = new URL(target, site.origin).href;

  if (!source.includes(`content="0;url=${target}"`)) {
    failures.push(`${route}: missing redirect to "${target}"`);
  }
  if (!source.includes('<meta name="robots" content="noindex">')) {
    failures.push(`${route}: compatibility redirect must be noindex`);
  }
  if (!source.includes(`<link rel="canonical" href="${canonical}">`)) {
    failures.push(`${route}: canonical must point to "${canonical}"`);
  }
}

const robots = await readFile(path.join(root, 'robots.txt'), 'utf8');
if (!robots.includes('Disallow: /next/')) {
  failures.push('robots.txt: parked next design must be disallowed');
}
if (!robots.includes('Disallow: /goal/')) {
  failures.push('robots.txt: goal preview must be disallowed');
}

const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
for (const route of ['/', '/about/', '/schedule/', '/poster/', '/guide/', '/register/', '/2025/']) {
  const expectedUrl = new URL(route, site.origin).href;
  if (!sitemap.includes(`<loc>${expectedUrl}</loc>`)) {
    failures.push(`sitemap.xml: missing official URL "${expectedUrl}"`);
  }
}
for (const unpublishedPath of ['/next/', '/goal/', '/2026/']) {
  if (sitemap.includes(new URL(unpublishedPath, site.origin).href)) {
    failures.push(`sitemap.xml: must not publish compatibility or preview path "${unpublishedPath}"`);
  }
}

const syncScript = await readFile(path.resolve('scripts/sync-oss.mjs'), 'utf8');
for (const previewDirectory of ['next', 'goal']) {
  if (
    !syncScript.includes(`'${previewDirectory}/**'`)
    || !syncScript.includes(`'${previewDirectory}/*'`)
  ) {
    failures.push(`sync-oss.mjs: production sync must exclude "${previewDirectory}/"`);
  }
}

const forbidden2026Copy = [
  ['智猿数合', 'sponsor name is 智统数合'],
  ['/2025/assets/images/logo.svg', '2026 pages must use the official 2026 wordmark, not last year’s R mark'],
  ['/2025/assets/images/index/logo.svg', '2026 pages must use the official 2026 wordmark, not last year’s R mark'],
];

for (const file of outputFiles.filter((entry) => entry.endsWith('.html'))) {
  const route = path.relative(root, file);
  if (route.startsWith(`2025${path.sep}`)) continue;
  const source = await readFile(file, 'utf8');
  for (const [needle, reason] of forbidden2026Copy) {
    if (source.includes(needle)) {
      failures.push(`${route}: unexpected copy "${needle}" (${reason})`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Build validation passed');
