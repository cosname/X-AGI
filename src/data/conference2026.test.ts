import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  conference2026,
  conference2026OrganizerDisplayOrder,
  conference2026PartnerDisplayGroups,
} from './conference2026.ts';
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

  it('announces that the detailed schedule will be published soon', () => {
    assert.equal(conference2026.scheduleNotice, '具体日程即将发布');
    assert.doesNotMatch(conference2026.scheduleNotice, /TBD/i);
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

  it('keeps unconfirmed AI Infra speakers unpublished', () => {
    const session = conference2026.programPreview.sessions.find(
      (candidate) => candidate.title === 'AI Infra',
    );

    assert.ok(session, 'AI Infra is missing from the program preview');
    assert.deepEqual(session.speakers, []);
  });
});

describe('published 2026 content contracts', () => {
  it('keeps organization roles distinct and names unique', () => {
    assert.equal(conference2026.initiators.length, 2);
    assert.equal(conference2026.organizers.length, 4);
    assert.equal(conference2026.coOrganizers.length, 2);
    assert.equal(conference2026.sponsors.length, 5);

    const organizations = [
      ...conference2026.initiators,
      ...conference2026.organizers,
      ...conference2026.coOrganizers,
      ...conference2026.sponsors,
    ];
    const names = organizations.map((organization) => organization.name);

    assert.equal(new Set(names).size, names.length, 'an organization appears in multiple roles');
  });

  it('publishes the approved compact organization display order', () => {
    assert.deepEqual(
      conference2026PartnerDisplayGroups.map((group) => group.organizations.length),
      [6, 2, 5],
    );
    assert.deepEqual(
      conference2026PartnerDisplayGroups[0].organizations.map((organization) => organization.name),
      conference2026OrganizerDisplayOrder,
    );

    const displayNames = conference2026PartnerDisplayGroups.flatMap((group) => (
      group.organizations.map((organization) => organization.name)
    ));
    assert.equal(new Set(displayNames).size, displayNames.length);
  });

  it('keeps one selected 2026 logo for every published organization', () => {
    const organizations = [
      ...conference2026.initiators,
      ...conference2026.organizers,
      ...conference2026.coOrganizers,
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
