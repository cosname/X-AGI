import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  EXPECTED_HEADERS,
  assertSafeAutomatedUpdate,
  parseCsv,
  parsePerson,
  parseProgramCsv,
  renderProgramModule,
} from './sync-tencent-program.mjs';

const header = EXPECTED_HEADERS.join(',');

describe('Tencent program CSV parser', () => {
  it('parses quoted CSV fields and UTF-8 BOM input', () => {
    assert.deepEqual(parseCsv('\uFEFFa,b\r\n"one, two","three"\r\n'), [
      ['a', 'b'],
      ['one, two', 'three'],
    ]);
  });

  it('normalizes approved affiliation aliases without guessing new ones', () => {
    assert.deepEqual(parsePerson('刘方辉（上交）', 'chair', { required: true }), {
      name: '刘方辉',
      affiliation: '上海交通大学',
    });
    assert.deepEqual(parsePerson('研究者（Example Lab）', 'speaker'), {
      name: '研究者',
      affiliation: 'Example Lab',
    });
  });

  it('parses program rows and excludes the private coordination column', () => {
    const csv = [
      header,
      '10.17下午,AI + Math & Theory,刘方辉（上交）,罗涛（上海交通大学）,,,,内部对接人',
    ].join('\n');
    const sessions = parseProgramCsv(csv);

    assert.deepEqual(sessions, [
      {
        sourceTime: '10.17下午',
        title: 'AI + Math & Theory',
        chair: { name: '刘方辉', affiliation: '上海交通大学' },
        speakers: [{ name: '罗涛', affiliation: '上海交通大学' }],
      },
    ]);
    assert.doesNotMatch(renderProgramModule(sessions), /内部对接人/u);
  });

  it('fails closed on header drift, duplicate topics, and malformed people', () => {
    assert.throws(
      () => parseProgramCsv(`${header.replace('时间', '日期')}\n10.17下午,主题,主席（单位）,,,,,`),
      /Header 1/u,
    );
    assert.throws(
      () => parseProgramCsv(`${header}\n,主题,主席（单位）,,,,,\n,主题,主席（单位）,,,,,`),
      /Duplicate topic/u,
    );
    assert.throws(
      () => parseProgramCsv(`${header}\n,主题,主席（单位,,,,,`),
      /malformed parentheses/u,
    );
  });

  it('fails closed on unexpectedly large session deletions', () => {
    const previousSessions = Array.from({ length: 13 }, (_, index) => ({ title: `Topic ${index}` }));

    assert.doesNotThrow(() => assertSafeAutomatedUpdate(previousSessions, previousSessions.slice(0, 11)));
    assert.throws(
      () => assertSafeAutomatedUpdate(previousSessions, previousSessions.slice(0, 10)),
      /Refusing to remove 3 sessions automatically/u,
    );
  });
});
