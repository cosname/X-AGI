import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const TENCENT_PROGRAM_URL = 'https://docs.qq.com/sheet/DUnZzaE5Ia2pVRHRj?tab=BB08J2';
export const TENCENT_PROGRAM_TAB_ID = 'BB08J2';
export const TENCENT_PROGRAM_SHEET_NAME = '工作表1';
export const MAX_AUTOMATED_SESSION_DELETIONS = 2;

export const EXPECTED_HEADERS = [
  '时间',
  '主题',
  'chair（单位）',
  'Speaker1：Title',
  'Speaker2',
  'Speaker3',
  'Speaker4',
  '对接人',
];

const DEFAULT_OUTPUT = fileURLToPath(
  new URL('../src/data/conference2026-program.generated.ts', import.meta.url),
);

const affiliationAliases = new Map([
  ['上交', '上海交通大学'],
  ['上海交通大学', '上海交通大学'],
  ['港城大', '香港城市大学'],
  ['香港城市大学', '香港城市大学'],
  ['人大', '中国人民大学'],
  ['中国人民大学', '中国人民大学'],
  ['清华', '清华大学'],
  ['清华大学', '清华大学'],
  ['北大', '北京大学'],
  ['北京大学', '北京大学'],
  ['数学所', '中国科学院数学与系统科学研究院'],
  ['中国科学院数学与系统科学研究院', '中国科学院数学与系统科学研究院'],
  ['上财', '上海财经大学'],
  ['上海财经大学', '上海财经大学'],
  ['复旦', '复旦大学'],
  ['复旦大学', '复旦大学'],
  ['同济', '同济大学'],
  ['同济大学', '同济大学'],
  ['港中深', '香港中文大学（深圳）'],
  ['香港中文大学（深圳）', '香港中文大学（深圳）'],
  ['港中文', '香港中文大学'],
  ['香港中文大学', '香港中文大学'],
  ['qwen', 'Qwen'],
  ['kimi', 'Kimi'],
]);

function cleanCell(value) {
  return value.replaceAll('\u00a0', ' ').trim();
}

export function parseCsv(input) {
  const text = input.replace(/^\uFEFF/u, '');
  if (text.includes('\uFFFD')) {
    throw new Error('CSV is not valid UTF-8.');
  }

  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  const finishField = () => {
    row.push(field);
    field = '';
  };

  const finishRow = () => {
    finishField();
    rows.push(row);
    row = [];
  };

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') {
      if (field.length > 0) throw new Error('Malformed quoted CSV field.');
      quoted = true;
    } else if (character === ',') {
      finishField();
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      finishRow();
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error('CSV has an unterminated quoted field.');
  if (field.length > 0 || row.length > 0) finishRow();
  return rows;
}

function normalizeAffiliation(value) {
  const cleaned = cleanCell(value);
  return affiliationAliases.get(cleaned.toLocaleLowerCase('en-US')) ?? cleaned;
}

export function parsePerson(value, label, { required = false } = {}) {
  const cleaned = cleanCell(value);
  if (!cleaned) {
    if (required) throw new Error(`${label} is empty.`);
    return null;
  }

  const match = cleaned.match(/^(.*?)\s*[（(]\s*(.+)\s*[）)]\s*$/u);
  if (!match) {
    if (/[()（）]/u.test(cleaned)) throw new Error(`${label} has malformed parentheses: ${cleaned}`);
    return { name: cleaned };
  }

  const name = cleanCell(match[1]);
  const affiliation = normalizeAffiliation(match[2]);
  if (!name) throw new Error(`${label} has an empty name.`);
  if (!affiliation) throw new Error(`${label} has an empty affiliation.`);
  return { name, affiliation };
}

export function parseProgramCsv(input) {
  const rows = parseCsv(input);
  if (rows.length < 2) throw new Error('CSV must contain a header and at least one data row.');

  const headers = rows[0].map(cleanCell);
  assertHeaders(headers);

  const populatedRows = rows
    .slice(1)
    .filter((candidate) => candidate.some((value) => cleanCell(value)));

  if (populatedRows.length === 0) throw new Error('CSV contains no program rows.');
  if (populatedRows.length > 100) throw new Error('CSV contains more than 100 program rows.');

  const titles = new Set();
  const sessions = populatedRows.map((candidate, rowIndex) => {
    if (candidate.length > EXPECTED_HEADERS.length) {
      throw new Error(`Row ${rowIndex + 2} has more than ${EXPECTED_HEADERS.length} columns.`);
    }

    const values = [...candidate];
    while (values.length < EXPECTED_HEADERS.length) values.push('');

    const sourceTime = cleanCell(values[0]);
    const title = cleanCell(values[1]);
    if (!title) throw new Error(`Row ${rowIndex + 2} has an empty topic.`);
    if (titles.has(title)) throw new Error(`Duplicate topic: ${title}`);
    titles.add(title);

    const chair = parsePerson(values[2], `Row ${rowIndex + 2} chair`, { required: true });
    const speakers = values
      .slice(3, 7)
      .map((value, speakerIndex) => parsePerson(value, `Row ${rowIndex + 2} speaker ${speakerIndex + 1}`))
      .filter(Boolean);

    const speakerKeys = speakers.map((speaker) => `${speaker.name}\u0000${speaker.affiliation ?? ''}`);
    if (new Set(speakerKeys).size !== speakerKeys.length) {
      throw new Error(`Row ${rowIndex + 2} contains a duplicate speaker.`);
    }

    return { sourceTime, title, chair, speakers };
  });

  return sessions;
}

function assertHeaders(headers) {
  if (headers.length !== EXPECTED_HEADERS.length) {
    throw new Error(`Expected ${EXPECTED_HEADERS.length} headers, found ${headers.length}.`);
  }

  for (let index = 0; index < EXPECTED_HEADERS.length; index += 1) {
    if (headers[index] !== EXPECTED_HEADERS[index]) {
      throw new Error(
        `Header ${index + 1} must be "${EXPECTED_HEADERS[index]}", found "${headers[index]}".`,
      );
    }
  }
}

export function semanticHash(sessions) {
  return createHash('sha256').update(JSON.stringify(sessions)).digest('hex');
}

export function renderProgramModule(sessions) {
  const source = {
    url: TENCENT_PROGRAM_URL,
    tabId: TENCENT_PROGRAM_TAB_ID,
    sheetName: TENCENT_PROGRAM_SHEET_NAME,
    sourceHash: semanticHash(sessions),
    sessions,
  };

  return `// Generated by scripts/sync-tencent-program.mjs. Do not edit manually.\n` +
    `\n` +
    `export type Conference2026ProgramPerson = {\n` +
    `  readonly name: string;\n` +
    `  readonly affiliation?: string;\n` +
    `};\n` +
    `\n` +
    `export type Conference2026ProgramSourceSession = {\n` +
    `  readonly sourceTime: string;\n` +
    `  readonly title: string;\n` +
    `  readonly chair: Conference2026ProgramPerson;\n` +
    `  readonly speakers: readonly Conference2026ProgramPerson[];\n` +
    `};\n` +
    `\n` +
    `export const conference2026ProgramSource = ${JSON.stringify(source, null, 2)} as const satisfies {\n` +
    `  readonly url: string;\n` +
    `  readonly tabId: string;\n` +
    `  readonly sheetName: string;\n` +
    `  readonly sourceHash: string;\n` +
    `  readonly sessions: readonly Conference2026ProgramSourceSession[];\n` +
    `};\n` +
    `\n` +
    `export const conference2026ProgramSessions = conference2026ProgramSource.sessions;\n`;
}

function readGeneratedSessions(content) {
  if (!content.trim()) return null;

  const sourceMatch = content.match(
    /export const conference2026ProgramSource = ([\s\S]*?) as const satisfies \{/u,
  );
  if (!sourceMatch) {
    throw new Error('Existing generated program file has an unexpected format.');
  }

  let source;
  try {
    source = JSON.parse(sourceMatch[1]);
  } catch {
    throw new Error('Existing generated program data is not valid JSON.');
  }

  if (!Array.isArray(source.sessions)) {
    throw new Error('Existing generated program data has no sessions array.');
  }
  return source.sessions;
}

export function assertSafeAutomatedUpdate(previousSessions, nextSessions) {
  const removedSessionCount = previousSessions.length - nextSessions.length;
  if (removedSessionCount > MAX_AUTOMATED_SESSION_DELETIONS) {
    throw new Error(
      `Refusing to remove ${removedSessionCount} sessions automatically; ` +
        `the limit is ${MAX_AUTOMATED_SESSION_DELETIONS}. Review the source and rerun with ` +
        '`--allow-large-change` if the deletion is intentional.',
    );
  }
}

export async function syncProgramFromCsv(
  csvPath,
  outputPath = DEFAULT_OUTPUT,
  { allowLargeChange = false } = {},
) {
  const csv = await readFile(csvPath, 'utf8');
  const sessions = parseProgramCsv(csv);
  const nextContent = renderProgramModule(sessions);
  const currentContent = await readFile(outputPath, 'utf8').catch(() => '');

  if (currentContent && !allowLargeChange) {
    const previousSessions = readGeneratedSessions(currentContent);
    assertSafeAutomatedUpdate(previousSessions, sessions);
  }

  if (nextContent === currentContent) {
    return { changed: false, outputPath, sessionCount: sessions.length };
  }

  await writeFile(outputPath, nextContent, 'utf8');
  return { changed: true, outputPath, sessionCount: sessions.length };
}

function parseArguments(argv) {
  let csvPath = '';
  let outputPath = DEFAULT_OUTPUT;
  let allowLargeChange = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--csv') {
      csvPath = argv[index + 1] ?? '';
      index += 1;
    } else if (argument === '--output') {
      outputPath = argv[index + 1] ?? '';
      index += 1;
    } else if (argument === '--allow-large-change') {
      allowLargeChange = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!csvPath) throw new Error('Usage: npm run schedule:sync -- --csv /absolute/path/to/program.csv');
  if (!path.isAbsolute(csvPath)) throw new Error('--csv must be an absolute path.');
  if (!path.isAbsolute(outputPath)) throw new Error('--output must be an absolute path.');
  return { csvPath, outputPath, allowLargeChange };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const { csvPath, outputPath, allowLargeChange } = parseArguments(process.argv.slice(2));
    const result = await syncProgramFromCsv(csvPath, outputPath, { allowLargeChange });
    console.log(
      result.changed
        ? `Updated ${result.outputPath} with ${result.sessionCount} sessions.`
        : `No schedule changes found across ${result.sessionCount} sessions.`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
