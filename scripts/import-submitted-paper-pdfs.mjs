import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { parseCsv } from './sync-tencent-program.mjs';
import { posterSubmissionKey, readWorkbookCsv } from './sync-poster-research.mjs';
import { posterResearchPapers } from '../src/data/poster-research.generated.ts';

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const run = promisify(execFile);
const sourcePath = 'src/data/paper-preview-sources.json';
const requiredHeaders = ['门票类型', '姓名', '海报标题（需要和论文标题一致）', '您的文章线上地址', '审核状态', '论文PDF'];

// Attachment URLs are used only in memory, never in the public manifest or logs.
export function collectSubmittedPaperPdfs(csv, curation, papers = posterResearchPapers) {
  const [headers = [], ...rows] = parseCsv(csv);
  for (const header of requiredHeaders) {
    if (headers.filter((value) => value === header).length !== 1) throw new Error(`Missing or duplicated column: ${header}`);
  }
  const reviewedByKey = new Map(curation.entries.map((entry) => [entry.sourceKey, entry]));
  const excluded = new Set(curation.exclusions.map((entry) => entry.sourceKey));
  const byId = new Map();
  for (const row of rows) {
    const cell = (header) => (row[headers.indexOf(header)] ?? '').trim();
    if (cell('门票类型') !== 'Rising Stars Poster') continue;
    const submissionKey = posterSubmissionKey(cell('姓名'), cell('海报标题（需要和论文标题一致）'), cell('您的文章线上地址'));
    if (excluded.has(submissionKey)) continue;
    const reviewed = reviewedByKey.get(submissionKey);
    if (!reviewed) throw new Error('Unreviewed Poster submission; update the paper directory first.');
    const paper = papers.find((entry) => entry.id === reviewed.id);
    if (!paper || paper.title !== reviewed.title || paper.applicantName !== cell('姓名')) throw new Error(`Stale paper identity: ${reviewed.id}`);
    if (cell('审核状态') !== '审核通过') throw new Error(`Submission is not approved: ${paper.id}`);
    // Match the directory importer: retain the first registration of a duplicate paper.
    if (byId.has(paper.id)) continue;
    let url;
    try { url = new URL(cell('论文PDF')); } catch { throw new Error(`Missing or invalid submitted PDF: ${paper.id}`); }
    if (url.protocol !== 'https:' || url.hostname !== 'cdn-img.bagevent.com' || url.username || url.password || url.port || url.hash) {
      throw new Error(`Unexpected submitted PDF host: ${paper.id}`);
    }
    byId.set(paper.id, {
      id: paper.id, title: paper.title, submissionKey, attachmentUrl: url.href,
      ...(reviewed.submittedPdfTitle ? { pdfTitle: reviewed.submittedPdfTitle } : {}),
    });
  }
  return papers.map((paper) => {
    if (!byId.has(paper.id)) throw new Error(`Missing submitted PDF: ${paper.id}`);
    return byId.get(paper.id);
  });
}

export async function importSubmittedPaperPdfs(workbook, cache) {
  const cachePath = path.resolve(cache);
  const ignoredOutput = path.resolve('output') + path.sep;
  if (!cachePath.startsWith(ignoredOutput)) throw new Error('Submitted PDFs must remain in the ignored output directory.');
  const workbookSha256 = digest(await readFile(workbook));
  const curation = JSON.parse(await readFile('src/data/poster-research-curation.json', 'utf8'));
  const submissions = collectSubmittedPaperPdfs(await readWorkbookCsv(workbook), curation);
  await mkdir(cachePath, { recursive: true });
  const sources = new Array(submissions.length);
  let next = 0;
  const downloads = await Promise.allSettled(Array.from({ length: 3 }, async () => {
    while (next < submissions.length) {
      const index = next++;
      const { attachmentUrl, ...source } = submissions[index];
      const file = path.join(cachePath, `${source.id}.pdf`);
      const receipt = `${file}.source.json`;
      const attachmentHash = digest(attachmentUrl);
      const previous = JSON.parse(await readFile(receipt, 'utf8').catch(() => '{}'));
      let bytes = await readFile(file).catch(() => null);
      if (!bytes || previous.attachmentHash !== attachmentHash || previous.pdfSha256 !== digest(bytes)) {
        const temporary = `${file}.part`;
        try {
          await run('curl', ['--fail', '--location', '--silent', '--show-error', '--proto', '=https', '--proto-redir', '=https', '--max-time', '90', '--retry', '2', '--max-filesize', '104857600', '--output', temporary, '--', attachmentUrl], { timeout: 300_000 });
          bytes = await readFile(temporary);
          if (bytes.subarray(0, 5).toString() !== '%PDF-') throw new Error('Not a PDF');
          await rename(temporary, file);
        } catch {
          throw new Error(`Unable to download a valid submitted PDF: ${source.id}`);
        } finally {
          await rm(temporary, { force: true });
        }
      }
      if (bytes.subarray(0, 5).toString() !== '%PDF-') throw new Error(`Invalid cached PDF: ${source.id}`);
      const pdfSha256 = digest(bytes);
      await writeFile(receipt, JSON.stringify({ attachmentHash, pdfSha256 }), { mode: 0o600 });
      sources[index] = { ...source, pdfSha256 };
      console.log(`${source.id}: submitted PDF cached`);
    }
  }));
  const failure = downloads.find((result) => result.status === 'rejected');
  if (failure) throw failure.reason;
  if (digest(await readFile(workbook)) !== workbookSha256) throw new Error('Workbook changed during import.');
  const manifest = {
    generatedBy: 'scripts/import-submitted-paper-pdfs.mjs', sourceKind: 'attendee-submitted-pdf',
    checkedOn: new Date().toISOString().slice(0, 10), workbookSha256, papers: sources,
  };
  await writeFile(sourcePath, `${JSON.stringify(manifest, null, 2)}\n`);
  return { paperCount: sources.length, workbookSha256 };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const [flag, workbook, cache, ...extra] = process.argv.slice(2);
  if (flag !== '--workbook' || !workbook || !path.isAbsolute(workbook) || !cache || extra.length) {
    throw new Error('Usage: node scripts/import-submitted-paper-pdfs.mjs --workbook <absolute-workbook-path> <output/cache-directory>');
  }
  console.log(JSON.stringify(await importSubmittedPaperPdfs(workbook, cache)));
}
