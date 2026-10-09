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
    assert.deepEqual(parsePerson('曹原（港大）', 'speaker'), {
      name: '曹原',
      affiliation: '香港大学',
    });
    assert.deepEqual(parsePerson('研究者（Example Lab）：A confirmed talk', 'speaker'), {
      name: '研究者',
      affiliation: 'Example Lab',
      talkTitle: 'A confirmed talk',
    });
    assert.deepEqual(parsePerson('周沛劼(北京大学) A confirmed talk', 'speaker'), {
      name: '周沛劼',
      affiliation: '北京大学',
      talkTitle: 'A confirmed talk',
    });
    assert.deepEqual(parsePerson('闫宇坤（启元）：', 'speaker'), {
      name: '闫宇坤',
      affiliation: '启元',
    });
    assert.deepEqual(parsePerson('张华清（清华）：TBD', 'speaker'), {
      name: '张华清',
      affiliation: '清华大学',
    });
    assert.deepEqual(parsePerson('姚金哥（）：TBD', 'speaker'), {
      name: '姚金哥',
    });
    assert.deepEqual(parsePerson('研究者（ ）：PilotDeck \u2014 Agent OS', 'speaker'), {
      name: '研究者',
      talkTitle: 'PilotDeck - Agent OS',
    });
    assert.throws(() => parsePerson('（）：TBD', 'speaker'), /empty name/u);
    assert.throws(
      () => parsePerson('研究者（Example Lab）unexpected text', 'speaker'),
      /malformed text after its affiliation/u,
    );
    assert.equal(parsePerson('TBD', 'speaker'), null);
    assert.equal(parsePerson('---', 'speaker'), null);
  });

  it('parses half-day program rows and excludes internal planning columns', () => {
    const csv = [
      header,
      '10.17下午,AI + Math & Theory,4,100%,刘方辉（上交）、谢超（清华）,罗涛（上海交通大学）：A confirmed talk,,,',
    ].join('\n');
    const sessions = parseProgramCsv(csv);

    assert.deepEqual(sessions, [
      {
        sourceTime: '10.17下午',
        title: 'AI + Math & Theory',
        chairs: [
          { name: '刘方辉', affiliation: '上海交通大学' },
          { name: '谢超', affiliation: '清华大学' },
        ],
        speakers: [
          { name: '罗涛', affiliation: '上海交通大学', talkTitle: 'A confirmed talk' },
        ],
      },
    ]);
    assert.doesNotMatch(renderProgramModule(sessions), /计划人数|完成度|100%/u);
  });

  it('fails closed on header drift, invalid time slots, duplicate topics, and malformed people', () => {
    assert.throws(
      () => parseProgramCsv(`${header.replace('时间', '日期')}\n10.17下午,主题,4,100%,主席（单位）,,,,`),
      /Header 1/u,
    );
    assert.throws(
      () => parseProgramCsv(`${header.replace('演讲题目完成度', '完成度')}\n10.17下午,主题,4,100%,主席（单位）,,,,`),
      /Header 4/u,
    );
    assert.throws(
      () => parseProgramCsv(`${header}\n10.17,主题,4,100%,主席（单位）,,,,`),
      /time must be/u,
    );
    assert.throws(
      () => parseProgramCsv(`${header}\n10.17下午,主题,4,100%,主席（单位）,,,,\n10.18上午,主题,4,100%,主席（单位）,,,,`),
      /Duplicate topic/u,
    );
    assert.throws(
      () => parseProgramCsv(`${header}\n10.17下午,主题,4,100%,主席（单位,,,,`),
      /malformed parentheses/u,
    );
  });

  it('imports rooms and confirmed livestreams while discarding internal progress', () => {
    const headers = [...EXPECTED_HEADERS];
    headers.splice(4, 0, '摘要完成情况');
    headers.push('会场安排', '是否直播');
    const sessions = parseProgramCsv([
      headers.join(','),
      '10.18上午,语言模型基础,4,100%,internal-only,胡天阳（港中深）,刘华斌（蚂蚁集团）：New talk,王淏楠（腾讯混元）：,,,7会,直播',
      '10.18下午,另一专题,4,100%,internal-only,主席（单位）,嘉宾（单位）,,,,4会,',
    ].join('\n'));
    assert.equal(sessions[0].venue, '7会');
    assert.equal(sessions[0].livestream, true);
    assert.equal(sessions[1].venue, '4会');
    assert.equal('livestream' in sessions[1], false);
    assert.equal(sessions[0].speakers[1].name, '王淏楠');
    assert.equal(sessions[0].speakers[1].talkTitle, undefined);
    assert.doesNotMatch(renderProgramModule(sessions), /internal-only|计划人数|完成度|摘要完成情况/u);
    assert.throws(() => parseProgramCsv(`${headers.join(',')}\n10.18上午,专题,,,internal,主席（单位）,,,,,7会,未知`), /unknown livestream/u);
    assert.throws(() => parseProgramCsv(`${header},会场安排,会场安排\n10.18上午,专题,,,主席（单位）,,,,,`), /Duplicate program header/u);
  });

  it('fails closed on unexpectedly large session deletions', () => {
    const previousSessions = Array.from({ length: 13 }, (_, index) => ({ title: `Topic ${index}` }));

    assert.doesNotThrow(() => assertSafeAutomatedUpdate(previousSessions, previousSessions.slice(0, 11)));
    assert.throws(
      () => assertSafeAutomatedUpdate(previousSessions, previousSessions.slice(0, 10)),
      /Refusing to remove 3 sessions automatically/u,
    );
    assert.throws(
      () => assertSafeAutomatedUpdate(previousSessions, [
        ...previousSessions.slice(0, 10),
        { title: 'Replacement 1' },
        { title: 'Replacement 2' },
        { title: 'Replacement 3' },
      ]),
      /Refusing to remove 3 sessions automatically/u,
    );
  });
});
