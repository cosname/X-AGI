import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { parseCsv } from './sync-tencent-program.mjs';

export const ATTENDEE_PEOPLE_SHEET_NAME = '2026 X-AGI 大会';

export const PUBLIC_ATTENDEE_HEADERS = [
  '门票类型',
  '姓名',
  '学校/单位',
  '院系/部门',
  '个人介绍',
  '头像照片',
  '演讲标题',
  '演讲摘要',
];

const DEFAULT_OUTPUT = fileURLToPath(
  new URL('../src/data/conference2026-people.generated.ts', import.meta.url),
);

const profileIdByName = new Map([
  ['毛小介', 'mao-xiaojie'],
  ['许洪腾', 'xu-hongteng'],
  ['罗涛', 'luo-tao'],
  ['刘威杨', 'liu-weiyang'],
  ['张先轶', 'zhang-xianyi'],
  ['赵鹏', 'zhao-peng'],
  ['马鉴昊', 'ma-jianhao'],
  ['常恒', 'chang-heng'],
  ['李秋熠', 'li-qiuyi'],
  ['许慧楠', 'xu-huinan'],
  ['马梓业', 'ma-ziye'],
  ['谢天', 'xie-tian'],
  ['陈思明', 'chen-siming'],
  ['田润泽', 'tian-runze'],
  ['周默', 'zhou-mo'],
  ['马俊杰', 'ma-junjie'],
  ['祝武', 'zhu-wu'],
  ['张元', 'yuan-zhang'],
  ['韩佳乐', 'han-jiale'],
  ['罗维俭', 'luo-weijian'],
  ['史作强', 'shi-zuoqiang'],
  ['李根', 'li-gen'],
  ['从鑫', 'cong-xin'],
  ['李鹏', 'li-peng'],
  ['王宏宁', 'wang-hongning'],
  ['Luyao Zhang', 'luyao-zhang'],
  ['周峰', 'zhou-feng'],
  ['冯建峰', 'feng-jianfeng'],
  ['胡译文', 'hu-yiwen'],
  ['曹原', 'cao-yuan'],
  ['陈焕然', 'chen-huanran'],
  ['刘子鸣', 'liu-ziming'],
  ['涂尚卿', 'tu-shangqing'],
  ['张华清', 'zhang-huaqing'],
  ['闫宇坤', 'yan-yukun'],
  ['邱子涵', 'qiu-zihan'],
]);

const aliasesByName = new Map([
  ['张元', ['Yuan Zhang']],
]);

const publicCopyCorrectionsByName = new Map([
  ['周默', {
    bio: '周默，北京大学数学科学学院助理教授，研究方向为机器学习与控制论',
  }],
]);

const exactPlaceholders = new Set([
  '',
  '-',
  '---',
  'tba',
  'tbd',
  '待定',
  '待确认',
]);

function cleanCell(value) {
  return String(value ?? '')
    .replaceAll('\u00a0', ' ')
    .replace(/[ \t]*\u2014+[ \t]*/gu, ' - ')
    .replace(/\r\n?/gu, '\n')
    .replace(/[ \t]+\n/gu, '\n')
    .replace(/\n{3,}/gu, '\n\n')
    .trim();
}

function cleanOptional(value) {
  const cleaned = cleanCell(value);
  return exactPlaceholders.has(cleaned.toLocaleLowerCase('en-US')) ? '' : cleaned;
}

function normalizeLoose(value) {
  return value.toLocaleLowerCase('zh-CN').replace(/[\s，。,.、/|·:：()（）-]+/gu, '');
}

function roleFromTicket(ticketType) {
  const normalized = ticketType.toLocaleLowerCase('en-US');
  if (normalized.includes('chair') || ticketType.includes('主席')) return 'chair';
  if (
    normalized.includes('speaker')
    || ticketType.includes('讲者')
    || ticketType.includes('嘉宾')
  ) return 'speaker';
  return null;
}

function profileUrlFromBio(value) {
  if (!/^https?:\/\/\S+$/iu.test(value)) return '';
  const normalized = value.replace(/^http(?=:)/iu, 'http');
  const parsed = new URL(normalized);
  if (!['http:', 'https:'].includes(parsed.protocol)) return '';
  return parsed.href;
}

function mergeField(records, field, name) {
  const values = [...new Set(records.map((record) => record[field]).filter(Boolean))];
  if (values.length > 1) {
    throw new Error(`${name} has conflicting ${field} values across attendee rows.`);
  }
  return values[0] ?? '';
}

export function parseAttendeePeopleCsv(input) {
  const rows = parseCsv(input);
  if (rows.length < 2) throw new Error('Attendee CSV must contain a header and data rows.');

  const headers = rows[0].map(cleanCell);
  const headerIndex = new Map();
  for (const [index, header] of headers.entries()) {
    if (!header) continue;
    if (headerIndex.has(header)) throw new Error(`Duplicate attendee header: ${header}`);
    headerIndex.set(header, index);
  }
  const missingHeaders = PUBLIC_ATTENDEE_HEADERS.filter((header) => !headerIndex.has(header));
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required public attendee headers: ${missingHeaders.join(', ')}`);
  }

  const field = (row, header) => cleanCell(row[headerIndex.get(header)]);
  const rawRecords = rows.slice(1).flatMap((row, rowIndex) => {
    const ticketType = field(row, '门票类型');
    const role = roleFromTicket(ticketType);
    if (!role) return [];

    const name = field(row, '姓名');
    const affiliation = field(row, '学校/单位');
    if (!name) throw new Error(`Attendee row ${rowIndex + 2} has an empty name.`);
    if (!affiliation) throw new Error(`${name} has an empty affiliation.`);

    const id = profileIdByName.get(name);
    if (!id) throw new Error(`No stable public profile id is configured for ${name}.`);

    const department = cleanOptional(field(row, '院系/部门'));
    const submittedBio = cleanOptional(field(row, '个人介绍'));
    const profileUrl = profileUrlFromBio(submittedBio);
    const identityOnlyBio = normalizeLoose(submittedBio) === normalizeLoose(name)
      || normalizeLoose(submittedBio) === normalizeLoose(`${affiliation}${department}`);
    const bio = profileUrl || identityOnlyBio ? '' : submittedBio;
    const talkTitle = cleanOptional(field(row, '演讲标题'));
    const submittedAbstract = cleanOptional(field(row, '演讲摘要'));
    const abstract = submittedAbstract === talkTitle ? '' : submittedAbstract;

    return [{
      id,
      name,
      role,
      affiliation,
      department,
      bio,
      profileUrl,
      talkTitle,
      abstract,
      hasSubmittedPortrait: Boolean(cleanOptional(field(row, '头像照片'))),
    }];
  });

  if (rawRecords.length === 0) throw new Error('Attendee CSV contains no Chair or Speaker rows.');
  if (rawRecords.length > 200) throw new Error('Attendee CSV contains more than 200 Chair or Speaker rows.');

  const grouped = Map.groupBy(rawRecords, (record) => record.name);
  const people = [...grouped.entries()].map(([name, records], sourceOrder) => {
    const id = mergeField(records, 'id', name);
    const talkTitle = mergeField(records, 'talkTitle', name);
    const abstract = mergeField(records, 'abstract', name);
    const person = {
      id,
      name,
      aliases: aliasesByName.get(name) ?? [],
      roles: [...new Set(records.map((record) => record.role))],
      affiliation: mergeField(records, 'affiliation', name),
      department: mergeField(records, 'department', name),
      bio: mergeField(records, 'bio', name),
      profileUrl: mergeField(records, 'profileUrl', name),
      talkTitle,
      abstract,
      hasSubmittedPortrait: records.some((record) => record.hasSubmittedPortrait),
      sourceOrder,
      ...(publicCopyCorrectionsByName.get(name) ?? {}),
    };
    return Object.fromEntries(Object.entries(person).filter(([, value]) => value !== ''));
  });

  const ids = people.map((person) => person.id);
  if (new Set(ids).size !== ids.length) throw new Error('Public profile ids must be unique.');
  return people;
}

export function publicPeopleHash(people) {
  return createHash('sha256').update(JSON.stringify(people)).digest('hex');
}

export function renderPeopleModule(people) {
  const source = {
    sheetName: ATTENDEE_PEOPLE_SHEET_NAME,
    sourceHash: publicPeopleHash(people),
    people,
  };

  return `// Generated by scripts/sync-attendee-people.mjs. Do not edit manually.\n` +
    `// This file contains an explicit public-only allowlist. The source workbook must never be committed.\n` +
    `\n` +
    `export type Conference2026PersonRole = 'chair' | 'speaker';\n` +
    `\n` +
    `export type Conference2026PersonSourceRecord = {\n` +
    `  readonly id: string;\n` +
    `  readonly name: string;\n` +
    `  readonly aliases: readonly string[];\n` +
    `  readonly roles: readonly Conference2026PersonRole[];\n` +
    `  readonly affiliation: string;\n` +
    `  readonly department?: string;\n` +
    `  readonly bio?: string;\n` +
    `  readonly profileUrl?: string;\n` +
    `  readonly talkTitle?: string;\n` +
    `  readonly abstract?: string;\n` +
    `  readonly hasSubmittedPortrait: boolean;\n` +
    `  readonly sourceOrder: number;\n` +
    `};\n` +
    `\n` +
    `export const conference2026PeopleSource = ${JSON.stringify(source, null, 2)} as const satisfies {\n` +
    `  readonly sheetName: string;\n` +
    `  readonly sourceHash: string;\n` +
    `  readonly people: readonly Conference2026PersonSourceRecord[];\n` +
    `};\n` +
    `\n` +
    `export const conference2026PeopleRecords: readonly Conference2026PersonSourceRecord[] =\n` +
    `  conference2026PeopleSource.people;\n`;
}

async function workbookToCsv(workbookPath) {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'xagi-attendee-people-'));
  try {
    const result = spawnSync(
      'soffice',
      ['--headless', '--convert-to', 'csv', '--outdir', tempDirectory, workbookPath],
      { encoding: 'utf8' },
    );
    if (result.error?.code === 'ENOENT') {
      throw new Error('LibreOffice soffice is required to read .xls/.xlsx attendee workbooks.');
    }
    if (result.status !== 0) {
      throw new Error(`LibreOffice failed to convert the attendee workbook (exit ${result.status}).`);
    }
    const csvFiles = (await readdir(tempDirectory)).filter((file) => file.endsWith('.csv'));
    if (csvFiles.length !== 1) {
      throw new Error(`Expected one converted attendee CSV, found ${csvFiles.length}.`);
    }
    return await readFile(path.join(tempDirectory, csvFiles[0]), 'utf8');
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}

export async function syncAttendeePeople(inputPath, outputPath = DEFAULT_OUTPUT) {
  const extension = path.extname(inputPath).toLocaleLowerCase('en-US');
  const input = extension === '.csv'
    ? await readFile(inputPath, 'utf8')
    : await workbookToCsv(inputPath);
  const people = parseAttendeePeopleCsv(input);
  const content = renderPeopleModule(people);
  const current = await readFile(outputPath, 'utf8').catch(() => '');
  if (current === content) return { changed: false, outputPath, personCount: people.length };
  await writeFile(outputPath, content, 'utf8');
  return { changed: true, outputPath, personCount: people.length };
}

function parseArguments(argv) {
  let inputPath = '';
  let outputPath = DEFAULT_OUTPUT;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--workbook' || argument === '--csv') {
      inputPath = argv[index + 1] ?? '';
      index += 1;
    } else if (argument === '--output') {
      outputPath = argv[index + 1] ?? '';
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  if (!inputPath) throw new Error('Usage: npm run people:sync -- --workbook /absolute/path/to/attendee-list.xls');
  return { inputPath, outputPath };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const { inputPath, outputPath } = parseArguments(process.argv.slice(2));
  const result = await syncAttendeePeople(inputPath, outputPath);
  console.log(
    `${result.changed ? 'Updated' : 'Verified'} ${result.personCount} public people in ${result.outputPath}`,
  );
}
