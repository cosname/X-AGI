import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { editionPages } from '../src/config/navigation.ts';
import {
  conference2026,
  conference2026PartnerDisplayGroups,
} from '../src/data/conference2026.ts';
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
      conference2026.conferenceOrganization.committee.title,
      conference2026.conferenceOrganization.committee.chair,
      ...conference2026.conferenceOrganization.committee.members,
      conference2026.conferenceOrganization.secretariat.title,
      conference2026.conferenceOrganization.secretariat.secretaryGeneral,
      ...conference2026.conferenceOrganization.secretariat.members,
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
      conference2026.scheduleNotice,
      'SESSIONS & SPEAKERS',
      `大会专题与嘉宾（${conference2026.programPreview.status.replace(/\.+$/, '')}）`,
      ...conference2026.programPreview.sessions.flatMap((session) => [
        session.title,
        session.chair.name === '待确认' ? '主持人待确认' : session.chair.name,
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
      '北京友谊宾馆为 X-AGI 大会提供专属优惠',
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

  const organizerStart = source.indexOf('<div class="card-header">主办单位</div>');
  const organizerEnd = source.indexOf('<div class="card-header">协办单位</div>', organizerStart);
  const organizerText = organizerStart >= 0 && organizerEnd > organizerStart
    ? visibleText(source.slice(organizerStart, organizerEnd))
    : '';
  if (!organizerText) failures.push(`${route}: missing approved organizer section`);

  let previousOrganizerIndex = -1;
  for (const organizer of [
    '清华大学统计与数据科学系',
    '中国人民大学应用统计科学研究中心',
    '中国人民大学统计学院',
    '统计之都',
    'FAI 人工智能基础',
    '中国商业统计学会人工智能分会',
  ]) {
    const organizerIndex = organizerText.indexOf(organizer);
    if (organizerIndex < 0) {
      failures.push(`${route}: missing approved organizer "${organizer}"`);
    } else if (organizerIndex < previousOrganizerIndex) {
      failures.push(`${route}: organizer "${organizer}" is out of the approved order`);
    }
    previousOrganizerIndex = Math.max(previousOrganizerIndex, organizerIndex);
  }
}

for (const route of ['register/index.html', 'goal/register/index.html']) {
  const source = await readFile(path.join(root, route), 'utf8');
  if (visibleText(source).includes('报名链接')) {
    failures.push(`${route}: redundant registration link must stay removed`);
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

const historyHomePages = [
  ['index.html', rootIndex],
  ['goal/index.html', goalIndex],
];

for (const [route, source] of historyHomePages) {
  if (!source.includes('edition-goal-home--with-lower')) {
    failures.push(`${route}: history-first homepage must enable the long-form shell`);
  }
}

const goalHomeMarkers = [
  'data-goal-home-contract="history-first"',
  'id="goal-history"',
  'data-history-deferred',
  'id="goal-organization"',
  'class="goal-partners__legal"',
];
for (const [route, source] of historyHomePages) {
  let previousGoalMarkerIndex = -1;
  for (const marker of goalHomeMarkers) {
    const markerIndex = source.indexOf(marker);
    if (markerIndex < 0) {
      failures.push(`${route}: missing history-first marker "${marker}"`);
      continue;
    }
    if (markerIndex < previousGoalMarkerIndex) {
      failures.push(`${route}: history-first marker "${marker}" is out of order`);
    }
    previousGoalMarkerIndex = markerIndex;
  }
}

const goalText = visibleText(goalIndex);
const expectedGoalHomeCopy = [
  '从 R 会到 X-AGI 大会',
  '主办单位',
  '协办单位',
  '赞助单位',
  '京ICP备2024062260号-3',
  '京公网安备11010502057471号',
];
for (const [route, text] of [
  ['index.html', rootText],
  ['goal/index.html', goalText],
]) {
  for (const expected of expectedGoalHomeCopy) {
    if (!text.includes(expected)) {
      failures.push(`${route}: missing history-first copy "${expected}"`);
    }
  }
}

function historyLowerFragment(source) {
  const start = source.indexOf('<section class="goal-home-lower"');
  const end = source.indexOf('</main>', start);
  return start >= 0 && end > start ? source.slice(start, end) : '';
}

const rootHistoryLower = historyLowerFragment(rootIndex);
const goalHistoryLower = historyLowerFragment(goalIndex);
if (!rootHistoryLower || !goalHistoryLower) {
  failures.push('index.html and goal/index.html must both render the history-first lower page');
} else if (rootHistoryLower !== goalHistoryLower) {
  failures.push('index.html: published history-first lower page must match the Goal acceptance mirror');
}

for (const retiredCopy of [
  '一条持续生长的学术连接',
  '沿着现场，回看连接如何发生',
  '先找到属于你的那一天',
  '选择你进入现场的方式',
  '来北京，和下一代 AI 研究者见面',
  '共同连接这场大会',
  '会议概况',
  '历届现场',
  '横向滚动或使用方向键浏览',
  '上一场',
  '下一场',
]) {
  if (goalText.includes(retiredCopy)) {
    failures.push(`goal/index.html: retired lower-page copy must stay removed "${retiredCopy}"`);
  }
}

for (const retiredMarker of [
  'class="goal-home-lower__quick-nav"',
  'id="goal-overview"',
  'href="#goal-overview"',
]) {
  if (goalIndex.includes(retiredMarker)) {
    failures.push(`goal/index.html: retired overview navigation must stay removed "${retiredMarker}"`);
  }
}
if ((goalIndex.match(/data-glass-group/g) ?? []).length !== 1) {
  failures.push('goal/index.html: only the compact header may use a glass group');
}

const goalHistoryStart = goalIndex.indexOf('id="goal-history"');
const goalHistoryEnd = goalIndex.indexOf('id="goal-organization"', goalHistoryStart);
const goalHistoryFragment = goalHistoryStart >= 0 && goalHistoryEnd > goalHistoryStart
  ? goalIndex.slice(goalHistoryStart, goalHistoryEnd)
  : '';
const historyEvents = [...goalHistoryFragment.matchAll(/data-history-event(?:\s|>)/g)];
const historyImages = [...goalHistoryFragment.matchAll(/<img\b[^>]*>/g)].map((match) => match[0]);
if (historyEvents.length !== 17) {
  failures.push(`goal/index.html: expected 17 history events, found ${historyEvents.length}`);
}
if (historyImages.length !== 51) {
  failures.push(`goal/index.html: expected 51 history images, found ${historyImages.length}`);
}

let previousEditionIndex = -1;
for (const edition of [18, 17, 16]) {
  const editionIndex = goalHistoryFragment.indexOf(`data-history-edition="${edition}"`);
  if (editionIndex < 0) {
    failures.push(`goal/index.html: missing rendered history edition ${edition}`);
  } else if (editionIndex < previousEditionIndex) {
    failures.push(`goal/index.html: history edition ${edition} is out of descending order`);
  }
  previousEditionIndex = Math.max(previousEditionIndex, editionIndex);
}

const historyProgressBars = [
  ...goalHistoryFragment.matchAll(/\sdata-history-progress-bar(?:\s|>)/g),
];
if (historyProgressBars.length !== historyEvents.length) {
  failures.push(
    `goal/index.html: expected one waveform bar per history event, found ${historyProgressBars.length}`,
  );
}

const historyProgressTargets = [
  ...goalHistoryFragment.matchAll(/<button\b[^>]*\sdata-history-progress-target(?:\s|>)[^>]*>/g),
].map((match) => match[0]);
if (historyProgressTargets.length !== historyEvents.length) {
  failures.push(
    `goal/index.html: expected one directory button per history event, found ${historyProgressTargets.length}`,
  );
}
for (const [index, target] of historyProgressTargets.entries()) {
  if (!/\stype="button"(?:\s|>)/.test(target)) {
    failures.push(`goal/index.html: history directory button ${index + 1} must use type="button"`);
  }
  if (!/\saria-controls="goal-history-viewport"(?:\s|>)/.test(target)) {
    failures.push(`goal/index.html: history directory button ${index + 1} must control the gallery viewport`);
  }
  if (!/\saria-label="[^"]+"(?:\s|>)/.test(target)) {
    failures.push(`goal/index.html: history directory button ${index + 1} must have an accessible label`);
  }
}
if (historyProgressTargets.filter((target) => target.includes('aria-current="location"')).length !== 1) {
  failures.push('goal/index.html: history directory must expose exactly one initial current location');
}

const historyProgressElements = [
  ...goalHistoryFragment.matchAll(/<[^>]+\sdata-history-progress(?:\s|>)[^>]*>/g),
].map((match) => match[0]);
if (historyProgressElements.length !== 1) {
  failures.push('goal/index.html: history gallery must contain one heading waveform directory');
} else {
  const progressElement = historyProgressElements[0];
  if (!/\srole="toolbar"(?:\s|>)/.test(progressElement)) {
    failures.push('goal/index.html: history directory must use toolbar semantics');
  }
  if (!progressElement.includes('aria-label="历届会议目录"')) {
    failures.push('goal/index.html: history directory must expose its accessible label');
  }
  if (/\saria-hidden(?:=|\s|>)/.test(progressElement)) {
    failures.push('goal/index.html: interactive history directory must not be aria-hidden');
  }
}

const historyHeadingIndex = goalHistoryFragment.indexOf('data-history-heading');
const historyHeadingEnd = goalHistoryFragment.indexOf('</header>', historyHeadingIndex);
const historyProgressIndex = goalHistoryFragment.indexOf('data-history-progress');
const historyViewportIndex = goalHistoryFragment.indexOf('data-history-viewport');
if (
  historyHeadingIndex < 0
  || historyProgressIndex < historyHeadingIndex
  || historyHeadingEnd < historyProgressIndex
  || historyViewportIndex < historyHeadingEnd
) {
  failures.push('goal/index.html: history directory must stay inside the heading before the viewport');
}
for (const retiredMarker of [
  'data-history-progress-thumb',
  'data-history-controls',
  'data-history-previous',
  'data-history-next',
  'data-history-status',
  'goal-history-instructions',
]) {
  if (goalHistoryFragment.includes(retiredMarker)) {
    failures.push(`goal/index.html: retired history control must stay removed "${retiredMarker}"`);
  }
}

for (const [index, image] of historyImages.entries()) {
  if (!image.includes('loading="lazy"') || !image.includes('decoding="async"')) {
    failures.push(`goal/index.html: history image ${index + 1} must use lazy async loading`);
  }
  if (!image.includes('srcset=') || !image.includes('sizes=')) {
    failures.push(`goal/index.html: history image ${index + 1} must expose responsive candidates`);
  }
  if (!image.includes('/_assets/goal-history-')) {
    failures.push(`goal/index.html: history image ${index + 1} must use a local goal-history asset`);
  }
}
if (goalHistoryFragment.includes('mmbiz.qpic.cn') || goalHistoryFragment.includes('/2026/history/')) {
  failures.push('goal/index.html: history gallery must not hotlink Qpic or reuse the archived five-image set');
}
if (!goalHistoryFragment.includes('content-visibility: visible !important')) {
  failures.push('goal/index.html: deferred history images must retain a no-JavaScript visibility fallback');
}

const goalHistoryStyles = await readFile(path.resolve('src/styles/goal-history.css'), 'utf8');
for (const expectedStyle of [
  'scroll-snap-type: inline proximity',
  '.goal-history__progress-bar',
  'transform: scaleY(var(--history-wave-scale))',
]) {
  if (!goalHistoryStyles.includes(expectedStyle)) {
    failures.push(`goal-history.css: missing waveform gallery style "${expectedStyle}"`);
  }
}
for (const retiredStyle of [
  'scroll-snap-type: inline mandatory',
  '.goal-history__progress-thumb',
  '.goal-history__event-header::before',
]) {
  if (goalHistoryStyles.includes(retiredStyle)) {
    failures.push(`goal-history.css: retired gallery style must stay removed "${retiredStyle}"`);
  }
}

const goalHomeLowerStyles = await readFile(
  path.resolve('src/styles/goal-home-lower.css'),
  'utf8',
);
for (const expectedSelector of [
  '.edition-goal-home.edition-goal-home--with-lower',
  '.edition-2026.edition-goal-home.edition-goal-home--with-lower > main',
  '.edition-2026.edition-goal-home.edition-goal-home--with-lower .conference-home',
]) {
  if (!goalHomeLowerStyles.includes(expectedSelector)) {
    failures.push(
      `goal-home-lower.css: long-page override must outrank the fixed hero shell "${expectedSelector}"`,
    );
  }
}

const goalHistoryController = await readFile(
  path.resolve('src/scripts/goal-history-gallery.ts'),
  'utf8',
);
for (const expectedControllerSource of [
  'viewport.scrollTo({',
  'galleryScrollTarget(',
  'galleryToolbarTargetIndex(',
  "[data-history-heading]",
]) {
  if (!goalHistoryController.includes(expectedControllerSource)) {
    failures.push(
      `goal-history-gallery.ts: missing bidirectional directory behavior "${expectedControllerSource}"`,
    );
  }
}
if (goalHistoryController.includes('scrollIntoView')) {
  failures.push('goal-history-gallery.ts: directory navigation must not move the document vertically');
}

for (const retiredMarker of [
  'id="goal-agenda"',
  'data-compact-schedule',
  'data-filter-group=',
  'id="goal-registration"',
]) {
  if (goalIndex.includes(retiredMarker)) {
    failures.push(`goal/index.html: retired lower-page marker must stay removed "${retiredMarker}"`);
  }
}

const goalPartnerStart = goalIndex.indexOf('class="goal-partners"');
const goalPartnerFragment = goalPartnerStart >= 0 ? goalIndex.slice(goalPartnerStart) : '';
const goalPartnerText = visibleText(goalPartnerFragment);
if (goalPartnerText.includes('发起单位')) {
  failures.push('goal/index.html: compact organization footer must merge initiators into organizers');
}
let previousGoalPartnerIndex = -1;
for (const group of conference2026PartnerDisplayGroups) {
  const groupMarker = `goal-partners__group--${group.key}`;
  const groupIndex = goalPartnerFragment.indexOf(groupMarker);
  if (groupIndex < 0) {
    failures.push(`goal/index.html: missing semantic partner group "${group.label}"`);
  } else if (groupIndex < previousGoalPartnerIndex) {
    failures.push(`goal/index.html: partner group "${group.label}" is out of order`);
  }
  previousGoalPartnerIndex = Math.max(previousGoalPartnerIndex, groupIndex);

  let previousOrganizationIndex = -1;
  for (const organization of group.organizations) {
    const organizationIndex = goalPartnerFragment.indexOf(organization.name);
    if (organizationIndex < 0) {
      failures.push(`goal/index.html: missing ${group.label} organization "${organization.name}"`);
    } else if (organizationIndex < previousOrganizationIndex) {
      failures.push(`goal/index.html: ${group.label} organization "${organization.name}" is out of order`);
    }
    previousOrganizationIndex = Math.max(previousOrganizationIndex, organizationIndex);
  }
}

for (const [marker, description] of [
  ['data-compact-schedule', 'compact schedule'],
  ['conference-program-outline', 'goal schedule outline'],
]) {
  if (rootIndex.includes(marker)) {
    failures.push(`index.html: retired ${description} must not return to the history-first homepage`);
  }
}

const scheduleIndex = await readFile(path.join(root, 'schedule/index.html'), 'utf8');
const goalScheduleIndex = await readFile(path.join(root, 'goal/schedule/index.html'), 'utf8');
const expectedScheduleCardCount = conference2026.programPreview.sessions.length;
const schedulePlaceholders = [
  conference2026.scheduleNotice,
  'SESSIONS & SPEAKERS',
  `大会专题与嘉宾（${conference2026.programPreview.status.replace(/\.+$/, '')}）`,
];
const retiredScheduleCopy = [
  'Full schedule TBD. Current sessions and speakers are listed below.',
  'Exact dates, times, rooms, and talk titles are TBD.',
  'Time TBD',
  'Talk title TBD',
  'Speaker TBD',
  'Session Chair TBD',
  'Speakers TBD',
  '文字日程正在发布',
  conference2026.programPreview.note,
];

for (const [route, source] of [
  ['schedule/index.html', scheduleIndex],
  ['goal/schedule/index.html', goalScheduleIndex],
]) {
  const text = visibleText(source);
  if (!source.includes('class="schedule-intro"') || !source.includes('class="schedule-confirmed"')) {
    failures.push(`${route}: schedule page must keep the intro and published topics`);
  }
  if (source.includes('class="nav nav-pills schedule-tabs') || source.includes('报到日')) {
    failures.push(`${route}: unpublished day-by-day schedule must stay off the page`);
  }
  if (source.includes('goal-schedule-preview') || source.includes('conference-program-outline')) {
    failures.push(`${route}: alternate schedule-preview layout must not replace the approved template`);
  }

  const scheduleCards = [...source.matchAll(/class="[^"]*\bschedule-card\b[^"]*"/g)].length;
  const topicCards = [...source.matchAll(/class="[^"]*\bschedule-topic-card\b[^"]*"/g)].length;
  if (scheduleCards !== expectedScheduleCardCount) {
    failures.push(`${route}: expected ${expectedScheduleCardCount} schedule cards, found ${scheduleCards}`);
  }
  if (topicCards !== conference2026.programPreview.sessions.length) {
    failures.push(`${route}: expected ${conference2026.programPreview.sessions.length} topic cards, found ${topicCards}`);
  }

  for (const placeholder of schedulePlaceholders) {
    if (!text.includes(placeholder)) {
      failures.push(`${route}: missing approved schedule copy "${placeholder}"`);
    }
  }
  for (const copy of retiredScheduleCopy) {
    if (text.includes(copy)) {
      failures.push(`${route}: retired placeholder copy "${copy}" must not remain`);
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
if (syncScript.includes("'_assets/goal-history-*'")) {
  failures.push('sync-oss.mjs: production sync must publish history assets used by the official homepage');
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
