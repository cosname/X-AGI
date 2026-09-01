import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  PUBLIC_ATTENDEE_HEADERS,
  parseAttendeePeopleCsv,
  renderPeopleModule,
} from './sync-attendee-people.mjs';

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\r\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csv(rows) {
  return `${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

const headers = ['订单号', '邮箱', ...PUBLIC_ATTENDEE_HEADERS, '微信号'];

function row({
  order = 'private-order',
  email = 'private@example.invalid',
  ticket = '演讲嘉宾',
  name,
  affiliation,
  department = '',
  bio = '',
  avatar = '',
  title = '',
  abstract = '',
  wechat = 'private-wechat',
}) {
  return [
    order,
    email,
    ticket,
    name,
    affiliation,
    department,
    bio,
    avatar,
    title,
    abstract,
    wechat,
  ];
}

describe('attendee people public projection', () => {
  it('keeps only public fields and merges a person with two roles', () => {
    const people = parseAttendeePeopleCsv(csv([
      headers,
      row({
        name: '从鑫',
        affiliation: '清华大学',
        department: '统计与数据科学系',
        bio: '公开简介',
        avatar: 'https://example.invalid/cong.jpg',
        title: '公开报告',
        abstract: '公开摘要',
      }),
      row({
        ticket: '论坛主席',
        name: '从鑫',
        affiliation: '清华大学',
        department: '统计与数据科学系',
        bio: '公开简介',
        avatar: 'https://example.invalid/cong.jpg',
      }),
    ]));

    assert.equal(people.length, 1);
    assert.deepEqual(people[0].roles, ['speaker', 'chair']);
    assert.equal(people[0].talkTitle, '公开报告');
    assert.equal(people[0].hasSubmittedPortrait, true);

    const rendered = renderPeopleModule(people);
    for (const privateValue of ['private-order', 'private@example.invalid', 'private-wechat']) {
      assert.equal(rendered.includes(privateValue), false);
    }
    assert.equal(rendered.includes('https://example.invalid/cong.jpg'), false);
  });

  it('normalizes placeholders, aliases, standalone profile URLs, and a known title typo', () => {
    const people = parseAttendeePeopleCsv(csv([
      headers,
      row({
        name: '张元',
        affiliation: '上海财经大学',
        bio: '公开简介',
        avatar: 'https://example.invalid/yuan.jpg',
        title: 'Large\u2014Deep Factor Models',
        abstract: 'TBD',
      }),
      row({
        ticket: '论坛主席',
        name: '陈思明',
        affiliation: '复旦大学',
        department: '大数据学院',
        bio: 'Http://fduvis.net',
      }),
      row({
        ticket: '论坛主席',
        name: '周默',
        affiliation: '北京大学',
        department: '数学科学学院',
        bio: '周默，北京大学数学科学学院助力教授，研究方向为机器学习与控制论',
      }),
    ]));

    assert.deepEqual(people[0].aliases, ['Yuan Zhang']);
    assert.equal(people[0].talkTitle, 'Large - Deep Factor Models');
    assert.equal(people[0].abstract, undefined);
    assert.equal(people[1].bio, undefined);
    assert.equal(people[1].profileUrl, 'http://fduvis.net/');
    assert.match(people[2].bio, /助理教授/u);
    assert.doesNotMatch(people[2].bio, /助力教授/u);
  });

  it('fails closed when a required public header is missing', () => {
    const incompleteHeaders = headers.filter((header) => header !== '个人介绍');
    assert.throws(
      () => parseAttendeePeopleCsv(csv([incompleteHeaders, incompleteHeaders.map(() => '')])),
      /Missing required public attendee headers: 个人介绍/u,
    );
  });

  it('requires a configured stable id before publishing a person', () => {
    assert.throws(
      () => parseAttendeePeopleCsv(csv([
        headers,
        row({ name: '未配置人物', affiliation: '示例单位' }),
      ])),
      /No stable public profile id is configured/u,
    );
  });
});
