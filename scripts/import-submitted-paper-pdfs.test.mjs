import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { collectSubmittedPaperPdfs } from './import-submitted-paper-pdfs.mjs';
import { posterSubmissionKey } from './sync-poster-research.mjs';

const headers = ['门票类型', '姓名', '海报标题（需要和论文标题一致）', '您的文章线上地址', '审核状态', '论文PDF', '论文录用证明'];
const paper = { id: 'poster-example', title: 'Example Paper', applicantName: 'Researcher' };
const registration = ['Rising Stars Poster', paper.applicantName, paper.title, 'https://example.org/paper', '审核通过', 'https://cdn-img.bagevent.com/paper.pdf', 'https://cdn-img.bagevent.com/proof.pdf'];
const key = posterSubmissionKey(...registration.slice(1, 4));
const curation = { entries: [{ id: paper.id, title: paper.title, sourceKey: key }], exclusions: [] };
const csv = (rows, columns = headers) => [columns, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
const collect = (rows, columns = headers) => collectSubmittedPaperPdfs(csv(rows, columns), curation, [paper]);

describe('submitted paper PDF selection', () => {
  it('selects the paper attachment, excludes non-Poster tickets and keeps the directory duplicate policy', () => {
    const result = collect([
      ['普通门票', 'Someone', '', '', '', '', ''],
      registration,
      [...registration.slice(0, 5), 'https://cdn-img.bagevent.com/duplicate.pdf', registration[6]],
    ]);
    assert.equal(result.length, 1);
    assert.equal(result[0].attachmentUrl, registration[5]);
    assert.equal(result[0].submissionKey, key);
    assert.equal(JSON.stringify(result).includes('proof.pdf'), false);
  });
  it('does not use a proof attachment when the paper PDF is missing', () => {
    assert.throws(() => collect([[...registration.slice(0, 5), '', registration[6]]]), /Missing or invalid submitted PDF/);
  });
  it('requires each current paper and rejects unknown or unapproved registrations', () => {
    assert.throws(() => collect([]), /Missing submitted PDF/);
    assert.throws(() => collect([[registration[0], 'Other', ...registration.slice(2)]]), /Unreviewed Poster submission/);
    assert.throws(() => collect([[...registration.slice(0, 4), '待审核', ...registration.slice(5)]]), /not approved/);
  });
  it('rejects ambiguous columns and unexpected attachment locations without exposing URLs', () => {
    assert.throws(() => collect([registration], [...headers, '论文PDF']), /Missing or duplicated column/);
    for (const url of ['https://example.org/paper.pdf?token=private', 'http://cdn-img.bagevent.com/paper.pdf', 'https://cdn-img.bagevent.com.evil.example/paper.pdf', 'https://private:secret@cdn-img.bagevent.com/paper.pdf']) {
      assert.throws(() => collect([[...registration.slice(0, 5), url, registration[6]]]), (error) => {
        assert.equal(error.message, `Unexpected submitted PDF host: ${paper.id}`);
        return true;
      });
    }
  });
});
