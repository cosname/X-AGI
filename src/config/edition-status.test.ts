import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { conference2026 } from '../data/conference2026.ts';
import { editionNavigation, editionPages } from './navigation.ts';
import { currentEdition, editionPath } from './site.ts';
import {
  CURRENT_EDITION_ACTION_PAGES,
  currentEditionActionPaths,
  currentEditionPageCopy,
  isRegistrationOpen,
  statusDescribesClosedOffering,
} from './edition-status.ts';

describe('current edition destinations', () => {
  it('exposes schedule, poster, and register through shipped edition helpers', () => {
    const pages = editionPages(currentEdition);
    const actions = currentEditionActionPaths(currentEdition);

    for (const page of CURRENT_EDITION_ACTION_PAGES) {
      assert.ok(pages.includes(page), `editionPages() is missing ${page}`);
      assert.equal(actions[page], editionPath(currentEdition, page));
      assert.match(editionPath(currentEdition, page), new RegExp(`/${page}/$`));
    }
  });

  it('treats 2026 register as a peer of the other header destinations', () => {
    const items = editionNavigation(currentEdition);
    assert.deepEqual(items.at(-1), { page: 'register', label: '立即报名' });
    assert.equal(items.filter((item) => item.page === 'register').length, 1);
    assert.equal(editionPages(currentEdition).filter((page) => page === 'register').length, 1);
  });
});

describe('live registration and poster status', () => {
  it('does not describe register or poster as closed while registration is open', () => {
    assert.equal(
      Boolean(conference2026.registration.url),
      true,
      'live conference data publishes a registration URL',
    );
    assert.equal(
      statusDescribesClosedOffering(conference2026.registration.status),
      false,
      'live registration.status cannot describe a closed offering while a signup URL is published',
    );
    assert.equal(isRegistrationOpen(conference2026), true);

    for (const page of ['register', 'poster'] as const) {
      const copy = currentEditionPageCopy(page, conference2026, currentEdition);
      assert.equal(
        statusDescribesClosedOffering(copy.status),
        false,
        `${page} status cannot describe a closed offering while registration is open`,
      );
      assert.equal(
        statusDescribesClosedOffering(copy.description),
        false,
        `${page} description cannot describe a closed offering while registration is open`,
      );
    }
  });

  it('keeps next-step destinations on the shipped edition paths', () => {
    const actions = currentEditionActionPaths(currentEdition);

    assert.equal(currentEditionPageCopy('about').next.href, actions.schedule);
    assert.equal(currentEditionPageCopy('schedule').next.href, actions.poster);
    assert.equal(currentEditionPageCopy('register').next.href, actions.schedule);

    if (isRegistrationOpen(conference2026)) {
      assert.equal(currentEditionPageCopy('poster').next.href, actions.register);
      assert.equal(currentEditionPageCopy('guide').next.href, actions.register);
    }
  });
});
