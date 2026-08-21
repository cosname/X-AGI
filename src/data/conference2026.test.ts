import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { conference2026 } from './conference2026.ts';

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

  it('does not publish blank talk scaffolding', () => {
    for (const day of conference2026.schedule) {
      for (const session of day.sessions) {
        for (const talk of session.talks ?? []) {
          assert.ok(
            [
              talk.time,
              talk.title,
              talk.speaker,
              talk.affiliation,
              talk.abstract,
              talk.bio,
              talk.slides,
            ].some((value) => value?.trim()),
            `${session.id} contains an empty talk placeholder`,
          );
        }
      }
    }
  });

  it('keeps unconfirmed AI Infra speakers unpublished', () => {
    const session = conference2026.programPreview.sessions.find(
      (candidate) => candidate.title === 'AI Infra',
    );

    assert.ok(session, 'AI Infra is missing from the program preview');
    assert.deepEqual(session.speakers, []);
  });
});

describe('goal preview content contracts', () => {
  it('publishes complete metadata for every archive image', () => {
    assert.equal(conference2026.history.gallery.length, 5);

    const images = new Set<string>();
    for (const item of conference2026.history.gallery) {
      assert.ok(item.image.startsWith('/2026/history/'));
      assert.ok(item.width > 0 && item.height > 0);
      assert.ok(item.alt.trim().length > 0);
      assert.ok(item.caption.trim().length > 0);
      assert.match(item.sourceUrl, /^https:\/\//);
      assert.equal(images.has(item.image), false, `duplicate archive image: ${item.image}`);
      images.add(item.image);
    }
  });

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

  it('retains the audited Rising Stars Poster ticket wording', () => {
    const expected = '报名参加 Rising Stars Poster 即赠专业票。';

    assert.ok(conference2026.registration.notes.includes(expected));
    assert.ok(conference2026.tickets.notes.includes(expected));
  });
});
