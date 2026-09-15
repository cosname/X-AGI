import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  parsePosterResearchCsv,
  posterSubmissionKey,
  renderPosterResearchModule,
} from './sync-poster-research.mjs';

const headers = [
  '订单号', '邮箱', '手机', '微信号', '门票类型', '姓名', '学校/单位',
  '海报标题（需要和论文标题一致）', '您的文章线上地址', '审核状态',
  '论文PDF', '论文录用证明', '简历',
];

function submission(overrides = {}) {
  return {
    订单号: 'private-order-314159',
    邮箱: 'private-applicant@example.invalid',
    手机: '13812345678',
    微信号: 'private-wechat-314159',
    门票类型: 'Rising Stars Poster',
    姓名: '研究者甲',
    '学校/单位': '公开大学',
    '海报标题（需要和论文标题一致）': 'Public Paper One',
    您的文章线上地址: 'https://arxiv.org/abs/2601.00001',
    审核状态: '审核通过',
    论文PDF: 'https://files.bagevent.com/uploads/private-paper-314159.pdf?token=secret',
    论文录用证明: 'https://files.bagevent.com/uploads/private-proof-314159.pdf',
    简历: 'https://files.bagevent.com/uploads/private-resume-314159.pdf',
    ...overrides,
  };
}

function key(record) {
  return posterSubmissionKey(
    record.姓名,
    record['海报标题（需要和论文标题一致）'],
    record.您的文章线上地址,
  );
}

function reviewed(record, overrides = {}) {
  return {
    sourceKey: key(record),
    id: 'poster-public-paper-one',
    title: 'Public Paper One',
    venue: 'ACL 2026',
    href: 'https://aclanthology.org/2026.acl-long.1/',
    evidence: ['https://aclanthology.org/2026.acl-long.1/'],
    verification: 'primary-source',
    ...overrides,
  };
}

function csv(records, columns = headers) {
  const cell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return `${[columns, ...records.map(record => columns.map(column => record[column]))]
    .map(row => row.map(cell).join(',')).join('\n')}\n`;
}

function curation(entries, exclusions = []) {
  return { schemaVersion: 1, entries, exclusions };
}

describe('Poster registration public projection', () => {
  it('emits only the reviewed public fields and never registration attachments or contact data', () => {
    const record = submission({
      '学校/单位': '公开大学, 统计学院',
      海报标题备注: 'private-extra-column-value',
    });
    const review = reviewed(record, {
      internalNote: 'private-review-note-314159',
      proofUrl: record.论文录用证明,
    });
    const result = parsePosterResearchCsv(csv([record], [...headers, '海报标题备注']), curation([review]));
    assert.deepEqual(result.papers, [{
      id: review.id,
      title: review.title,
      applicantName: record.姓名,
      affiliation: record['学校/单位'],
      venue: review.venue,
      href: review.href,
    }]);
    const rendered = renderPosterResearchModule(result);
    const serialized = JSON.stringify(result);
    for (const value of [
      record.订单号, record.邮箱, record.手机, record.微信号,
      record.论文PDF, record.论文录用证明, record.简历,
      record.海报标题备注, review.internalNote,
    ]) {
      assert.equal(serialized.includes(value), false, `parsed output must omit ${value}`);
      assert.equal(rendered.includes(value), false, `generated module must omit ${value}`);
    }
    for (const field of ['订单号', '邮箱', '手机', '微信号', '论文PDF', '论文录用证明', '简历', 'proofUrl', 'internalNote']) {
      assert.equal(rendered.includes(field), false, `generated module must omit private field ${field}`);
    }
    assert.match(rendered, /"status": "registration"/);
    assert.doesNotMatch(rendered, /"status": "accepted"/);
  });

  it('keeps the public source hash unchanged when only private input fields change', () => {
    const first = submission();
    const second = submission({
      订单号: 'another-private-order', 邮箱: 'another-private@example.invalid',
      手机: '13987654321', 微信号: 'another-private-wechat',
      论文PDF: 'https://files.bagevent.com/another-paper.pdf',
      论文录用证明: 'https://files.bagevent.com/another-proof.pdf',
      简历: 'https://files.bagevent.com/another-resume.pdf',
    });
    const review = curation([reviewed(first)]);
    const a = parsePosterResearchCsv(csv([first]), review);
    const b = parsePosterResearchCsv(csv([second]), review);
    assert.deepEqual(a, b);
    assert.equal(renderPosterResearchModule(a), renderPosterResearchModule(b));
  });

  it('excludes an explicitly curated test record without emitting its contents', () => {
    const valid = submission();
    const test = submission({
      姓名: '测试报名', '海报标题（需要和论文标题一致）': 'Testing only, never publish',
      您的文章线上地址: 'https://example.invalid/test', 审核状态: '未审核',
    });
    const result = parsePosterResearchCsv(csv([valid, test]), curation(
      [reviewed(valid)], [{ sourceKey: key(test), reason: 'Known test registration.' }],
    ));
    assert.equal(result.excludedCount, 1);
    assert.equal(result.papers.length, 1);
    assert.equal(renderPosterResearchModule(result).includes(test.姓名), false);
    assert.equal(renderPosterResearchModule(result).includes(test['海报标题（需要和论文标题一致）']), false);
  });

  it('requires an explicit reason before excluding a record', () => {
    const record = submission();
    assert.throws(() => parsePosterResearchCsv(csv([record]), curation(
      [], [{ sourceKey: key(record), reason: '' }],
    )), /exclusions require a reason/i);
  });
});

describe('Poster paper identity and affiliation', () => {
  it('merges repeat registrations for one curated paper and retains the first supplied affiliation', () => {
    const first = submission();
    const repeat = submission({
      '学校/单位': '第二次填报单位',
      '海报标题（需要和论文标题一致）': 'Public Paper One (preprint title)',
      您的文章线上地址: 'https://arxiv.org/pdf/2601.00001',
    });
    const result = parsePosterResearchCsv(csv([first, repeat]), curation([
      reviewed(first), reviewed(repeat),
    ]));
    assert.equal(result.papers.length, 1);
    assert.equal(result.mergedCount, 1);
    assert.equal(result.papers[0].affiliation, first['学校/单位']);
    assert.equal(result.papers[0].title, 'Public Paper One');
  });

  it('retains distinct papers from the same applicant instead of merging by name', () => {
    const first = submission();
    const second = submission({
      '学校/单位': '第二篇论文填报单位',
      '海报标题（需要和论文标题一致）': 'Public Paper Two',
      您的文章线上地址: 'https://arxiv.org/abs/2601.00002',
    });
    const result = parsePosterResearchCsv(csv([first, second]), curation([
      reviewed(first), reviewed(second, {
        id: 'poster-public-paper-two', title: 'Public Paper Two',
        href: 'https://arxiv.org/abs/2601.00002',
      }),
    ]));
    assert.equal(result.mergedCount, 0);
    assert.deepEqual(result.papers.map(paper => paper.id), ['poster-public-paper-one', 'poster-public-paper-two']);
    assert.deepEqual(result.papers.map(paper => paper.affiliation), ['公开大学', '第二篇论文填报单位']);
  });

  it('applies an explicit reviewed affiliation only to its curated submission', () => {
    const first = submission({ '学校/单位': '香港大学（个人阶段备注）' });
    const repeat = submission({
      '学校/单位': '西北工业大学（个人阶段备注）',
      您的文章线上地址: 'https://arxiv.org/pdf/2601.00001',
    });
    const otherPaper = submission({
      '学校/单位': '另一公开大学（原文应保留）',
      '海报标题（需要和论文标题一致）': 'Public Paper Two',
      您的文章线上地址: 'https://arxiv.org/abs/2601.00002',
    });
    const affiliation = '香港大学 / 西北工业大学';
    const result = parsePosterResearchCsv(csv([first, repeat, otherPaper]), curation([
      reviewed(first, { affiliation }), reviewed(repeat, { affiliation }),
      reviewed(otherPaper, { id: 'poster-public-paper-two', title: 'Public Paper Two', href: 'https://arxiv.org/abs/2601.00002' }),
    ]));
    assert.equal(result.mergedCount, 1);
    assert.equal(result.papers.length, 2);
    assert.equal(result.papers[0].affiliation, affiliation);
    assert.equal(result.papers[1].affiliation, otherPaper['学校/单位']);
    assert.equal(renderPosterResearchModule(result).includes('个人阶段备注'), false);
  });

  for (const conflict of ['name', 'title', 'href']) {
    it(`rejects reuse of one paper ID with a conflicting ${conflict}`, () => {
      const first = submission();
      const second = submission({
        姓名: conflict === 'name' ? '研究者乙' : first.姓名,
        您的文章线上地址: 'https://arxiv.org/abs/2601.00002',
      });
      const secondReview = reviewed(second, {
        ...(conflict === 'title' ? { title: 'A Different Paper' } : {}),
        ...(conflict === 'href' ? { href: 'https://arxiv.org/abs/2601.00002' } : {}),
      });
      assert.throws(() => parsePosterResearchCsv(csv([first, second]), curation([
        reviewed(first), secondReview,
      ])), /identity collision/i);
    });
  }
});

describe('Poster review gates', () => {
  it('fails the import when any non-excluded source record has no review entry', () => {
    const reviewedRecord = submission();
    const unreviewed = submission({ 姓名: '未核对申请人', 您的文章线上地址: 'https://arxiv.org/abs/2601.00002' });
    assert.throws(() => parsePosterResearchCsv(csv([reviewedRecord, unreviewed]), curation([
      reviewed(reviewedRecord),
    ])), /Unreviewed poster submission/);
  });

  for (const status of ['', '未审核', '审核中', '审核未通过']) {
    it(`requires the exact approved registration status, rejecting ${JSON.stringify(status)}`, () => {
      const record = submission({ 审核状态: status });
      assert.throws(() => parsePosterResearchCsv(csv([record]), curation([reviewed(record)])), /review needs confirmation/i);
    });
  }

  it('rejects missing or duplicated source columns instead of reading shifted private cells', () => {
    const record = submission();
    const missing = headers.filter(header => header !== '姓名');
    assert.throws(() => parsePosterResearchCsv(csv([record], missing), curation([reviewed(record)])), /Missing or duplicated poster column: 姓名/);
    assert.throws(() => parsePosterResearchCsv(csv([record], [...headers, '审核状态']), curation([reviewed(record)])), /Missing or duplicated poster column: 审核状态/);
  });

  it('requires public evidence and a supported verification type', () => {
    const record = submission();
    for (const overrides of [{ evidence: [] }, { verification: 'unresolved' }]) {
      assert.throws(() => parsePosterResearchCsv(csv([record]), curation([reviewed(record, overrides)])), /Incomplete poster curation/);
    }
  });
});

describe('Public paper URL boundary', () => {
  for (const href of [
    'javascript:alert(1)', 'data:application/pdf;base64,cHJpdmF0ZQ==',
    'file:' + '///private-paper.pdf', 'http://arxiv.org/abs/2601.00001',
    'https://private-user:private-password@arxiv.org/abs/2601.00001',
    'https://localhost/paper.pdf', 'https://preview.localhost/paper.pdf',
    'https://127.0.0.1/paper.pdf', 'https://127.1/paper.pdf',
    'https://10.0.0.1/paper.pdf', 'https://172.16.0.1/paper.pdf',
    'https://192.168.1.1/paper.pdf', 'https://169.254.169.254/paper.pdf',
    'https://[::1]/paper.pdf',
    'https://bagevent.com/uploads/private-proof.pdf',
    'https://files.bagevent.com/uploads/private-proof.pdf?token=private-token',
    'https://files.bagevent.com./uploads/private-proof.pdf',
  ]) {
    it(`rejects an unsafe or registration attachment URL: ${href}`, () => {
      const record = submission();
      assert.throws(() => parsePosterResearchCsv(csv([record]), curation([reviewed(record, { href })])), /public paper URL|Invalid URL/i);
    });
  }

  it('retains a public author-hosted PDF without allowing registration attachments through', () => {
    const record = submission();
    const href = 'https://research.example.org/papers/public-paper.pdf';
    const result = parsePosterResearchCsv(csv([record]), curation([reviewed(record, { href })]));
    assert.equal(result.papers[0].href, href);
    assert.equal(renderPosterResearchModule(result).includes(record.论文PDF), false);
    assert.equal(renderPosterResearchModule(result).includes(record.论文录用证明), false);
  });
});
