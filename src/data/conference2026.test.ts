import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  conference2026,
  conference2026DiamondSponsorDisplayOrder,
  conference2026GoldSponsorDisplayOrder,
  conference2026OrganizerDisplayOrder,
  conference2026PartnerDisplayGroups,
} from './conference2026.ts';
import { conference2026ProgramSource } from './conference2026-program.generated.ts';
import { partnerLogoByName } from './partner-logo-assets-2026.ts';

const scheduleCategories = new Set(['arrival', 'keynote', 'parallel', 'poster']);

describe('conference schedule contracts', () => {
  it('classifies every published session explicitly', () => {
    for (const day of conference2026.schedule) {
      for (const session of day.sessions) {
        assert.ok(
          scheduleCategories.has(session.category),
          `${session.id} has an unsupported category: ${session.category}`,
        );
      }
    }
  });

  it('omits retired explanatory copy from the schedule data', () => {
    assert.equal('scheduleNotice' in conference2026, false);
    assert.equal('note' in conference2026.programPreview, false);
    assert.match(conference2026.programPreview.status, /持续更新中/u);
  });

  it('keeps reserved talk slots fully blank until details are confirmed', () => {
    let reservedTalkCount = 0;

    for (const day of conference2026.schedule) {
      for (const session of day.sessions) {
        for (const talk of session.talks ?? []) {
          const fields = [
            talk.time,
            talk.title,
            talk.speaker,
            talk.affiliation,
            talk.abstract,
            talk.bio,
            talk.slides,
          ];

          if (fields.every((value) => !value?.trim())) reservedTalkCount += 1;
        }
      }
    }

    assert.ok(reservedTalkCount > 0, 'the fill-ready schedule must retain reserved talk slots');
  });

  it('publishes a valid, normalized program snapshot', () => {
    assert.equal(
      conference2026ProgramSource.url,
      'https://docs.qq.com/sheet/DUnZzaE5Ia2pVRHRj?tab=BB08J2',
    );
    assert.equal(conference2026ProgramSource.tabId, 'BB08J2');
    assert.equal(conference2026ProgramSource.sheetName, '工作表1');
    assert.match(conference2026ProgramSource.sourceHash, /^[a-f0-9]{64}$/u);
    assert.equal(conference2026.programPreview.sessions, conference2026ProgramSource.sessions);
    assert.ok(conference2026ProgramSource.sessions.length > 0);

    const expectedTimeSlots = new Map([
      ['10.17上午', 1],
      ['10.17下午', 6],
      ['10.18上午', 5],
      ['10.18下午', 2],
    ]);
    const actualTimeSlots = new Map<string, number>();

    const titles = new Set<string>();
    for (const session of conference2026ProgramSource.sessions) {
      assert.match(session.sourceTime, /^10\.(?:17|18)(?:上午|下午)$/u);
      actualTimeSlots.set(session.sourceTime, (actualTimeSlots.get(session.sourceTime) ?? 0) + 1);
      assert.ok(session.title.trim(), 'a program topic is empty');
      assert.equal(titles.has(session.title), false, `duplicate program topic: ${session.title}`);
      titles.add(session.title);

      assert.ok(session.chairs.length > 0, `${session.title} has no chair`);
      for (const chair of session.chairs) {
        assert.ok(chair.name.trim(), `${session.title} has an empty chair`);
      }
      const speakerKeys = session.speakers.map(
        (speaker) => `${speaker.name}\u0000${speaker.affiliation ?? ''}`,
      );
      assert.equal(
        new Set(speakerKeys).size,
        speakerKeys.length,
        `${session.title} contains duplicate speakers`,
      );
      for (const speaker of session.speakers) {
        assert.ok(speaker.name.trim(), `${session.title} has an empty speaker`);
      }
    }

    assert.deepEqual(actualTimeSlots, expectedTimeSlots);
  });
});

describe('published 2026 content contracts', () => {
  it('keeps the English conference name as the brand and the Chinese name in body copy', () => {
    assert.equal(conference2026.nameEn, '2026 X-AGI Conference');
    assert.equal(conference2026.nameZhOfficial, '第19届交叉智能大会暨中国R会议');
    assert.equal(conference2026.sloganZh, '交叉智能 计算未来');
    assert.match(
      conference2026.introduction[0],
      /2026 X-AGI Conference（第19届交叉智能大会暨中国R会议）/u,
    );
  });

  it('keeps organization roles distinct and names unique', () => {
    assert.equal(conference2026.initiators.length, 2);
    assert.equal(conference2026.organizers.length, 4);
    assert.equal(conference2026.coOrganizers.length, 2);
    assert.equal(conference2026.strategicPartners.length, 1);
    assert.equal(conference2026.sponsors.length, 6);

    const organizations = [
      ...conference2026.initiators,
      ...conference2026.organizers,
      ...conference2026.coOrganizers,
      ...conference2026.strategicPartners,
      ...conference2026.sponsors,
    ];
    const names = organizations.map((organization) => organization.name);

    assert.equal(new Set(names).size, names.length, 'an organization appears in multiple roles');
  });

  it('publishes the approved compact organization display order', () => {
    assert.deepEqual(
      conference2026PartnerDisplayGroups.map((group) => group.organizations.length),
      [6, 2, 1, 5, 1],
    );
    assert.deepEqual(
      conference2026PartnerDisplayGroups.map((group) => group.label),
      ['主办单位', '协办单位', '战略合作伙伴', '钻石赞助', '黄金赞助'],
    );
    assert.deepEqual(
      conference2026PartnerDisplayGroups[0].organizations.map((organization) => organization.name),
      conference2026OrganizerDisplayOrder,
    );
    assert.deepEqual(
      conference2026PartnerDisplayGroups[2].organizations.map((organization) => organization.name),
      ['黄大年茶思屋科技网站'],
    );
    assert.deepEqual(
      conference2026PartnerDisplayGroups[3].organizations.map((organization) => organization.name),
      conference2026DiamondSponsorDisplayOrder,
    );
    assert.deepEqual(
      conference2026PartnerDisplayGroups[4].organizations.map((organization) => organization.name),
      conference2026GoldSponsorDisplayOrder,
    );

    const displayNames = conference2026PartnerDisplayGroups.flatMap((group) => (
      group.organizations.map((organization) => organization.name)
    ));
    assert.equal(new Set(displayNames).size, displayNames.length);
  });

  it('links organizations to their verified official websites', () => {
    const organizationUrls = new Map(
      [
        ...conference2026.organizers,
        ...conference2026.strategicPartners,
        ...conference2026.sponsors,
      ]
        .map((organization) => [organization.name, organization.url]),
    );
    const expectedUrls = new Map([
      ['中国人民大学应用统计科学研究中心', 'https://cfas.ruc.edu.cn/'],
      ['中国人民大学统计学院', 'https://stat.ruc.edu.cn/'],
      ['明汯投资', 'https://www.mhfunds.com/'],
      ['宽德投资', 'https://www.wizardquant.com/'],
      ['Will', 'https://wq-will.com/'],
      ['黄大年茶思屋科技网站', 'https://www.chaspark.com/'],
      ['澎峰科技（PerfXLab）', 'https://www.perfxlab.cn/'],
    ]);

    for (const [name, url] of expectedUrls) {
      assert.equal(organizationUrls.get(name), url);
    }
  });

  it('keeps one selected 2026 logo for every published organization', () => {
    const organizations = [
      ...conference2026.initiators,
      ...conference2026.organizers,
      ...conference2026.coOrganizers,
      ...conference2026.strategicPartners,
      ...conference2026.sponsors,
    ];
    const selectedPaths = organizations.map((organization) => {
      const logo = partnerLogoByName[organization.name];
      assert.ok(logo, `missing selected logo for ${organization.name}`);
      assert.match(logo.src, /^\/2026\/logos\/[a-z0-9-]+\.(?:png|svg)$/);
      assert.equal(
        existsSync(new URL(`../../public${logo.src}`, import.meta.url)),
        true,
        `missing public logo: ${logo.src}`,
      );
      return logo.src;
    });

    assert.equal(new Set(selectedPaths).size, selectedPaths.length);

    const publishedFiles = readdirSync(new URL('../../public/2026/logos/', import.meta.url)).sort();
    const selectedFiles = selectedPaths.map((src) => src.split('/').at(-1) ?? '').sort();
    assert.deepEqual(publishedFiles, selectedFiles);
  });

  it('retains the audited Rising Stars Poster ticket wording', () => {
    const expected = '报名参加 Rising Stars Poster 即赠专业票。';

    assert.ok(conference2026.registration.notes.includes(expected));
    assert.ok(conference2026.tickets.notes.includes(expected));
  });
});
