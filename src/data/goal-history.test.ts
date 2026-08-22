import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';

import {
  goalHistoryEvents,
  goalHistoryPhotoCount,
  goalHistoryPhotoRoles,
} from './goal-history.ts';

const expectedEventIds = [
  'e08-2015-beijing',
  'e09-2016-beijing',
  'e09-2016-guangzhou',
  'e10-2017-beijing',
  'e10-2017-hefei',
  'e10-2017-lanzhou',
  'e10-2017-shanghai',
  'e11-2018-beijing',
  'e11-2018-guangzhou',
  'e11-2018-shanghai',
  'e12-2019-beijing',
  'e13-2020-beijing',
  'e14-2021-beijing',
  'e15-2022-beijing',
  'e16-2023-beijing-xagi',
  'e17-2024-beijing-xagi-ifods',
  'e18-2025-beijing-xagi',
];

const sortedNumbers = (values: Iterable<number>) => [...new Set(values)].sort((a, b) => a - b);
const sortedStrings = (values: Iterable<string>) => [...new Set(values)].sort();

test('history data covers the approved 17-event chronology', () => {
  assert.equal(goalHistoryEvents.length, 17);
  assert.equal(goalHistoryPhotoCount, 51);
  assert.deepEqual(goalHistoryEvents.map((event) => event.id), expectedEventIds);
  assert.deepEqual(sortedNumbers(goalHistoryEvents.map((event) => event.edition)), [
    8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
  ]);
  assert.deepEqual(sortedNumbers(goalHistoryEvents.map((event) => event.year)), [
    2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025,
  ]);
  assert.deepEqual(sortedStrings(goalHistoryEvents.map((event) => event.city)), [
    '上海', '兰州', '北京', '合肥', '广州',
  ]);
  assert.equal(
    goalHistoryEvents.filter((event) => event.id === 'e10-2017-shanghai').length,
    1,
  );
});

test('rendered history begins with editions 18, 17, and 16', () => {
  const renderedEditions = [...goalHistoryEvents]
    .reverse()
    .slice(0, 3)
    .map((event) => event.edition);

  assert.deepEqual(renderedEditions, [18, 17, 16]);
});

test('every event has three complete and traceable photographs', () => {
  const eventIds = new Set<string>();
  const photoIds = new Set<string>();
  const basenames = new Set<string>();
  const provenance = new Set<string>();
  const supportedRoles = new Set<string>(goalHistoryPhotoRoles);

  for (const event of goalHistoryEvents) {
    assert.equal(eventIds.has(event.id), false, `duplicate event id: ${event.id}`);
    eventIds.add(event.id);
    assert.equal(event.photos.length, 3, `${event.id} must contain exactly three photos`);
    assert.match(event.dates.start, /^20\d{2}-\d{2}-\d{2}$/);
    assert.match(event.dates.end, /^20\d{2}-\d{2}-\d{2}$/);
    assert.ok(event.dates.start <= event.dates.end);
    assert.ok(event.venue.trim().length > 0);
    assert.equal(event.sourceFile.includes('/'), false, `${event.id} sourceFile must be a basename`);

    for (const photo of event.photos) {
      const sourceKey = `${event.sourceFile}#${photo.sourceImageIndex}`;
      assert.equal(photoIds.has(photo.id), false, `duplicate photo id: ${photo.id}`);
      assert.equal(basenames.has(photo.basename), false, `duplicate basename: ${photo.basename}`);
      assert.equal(provenance.has(sourceKey), false, `duplicate provenance: ${sourceKey}`);
      photoIds.add(photo.id);
      basenames.add(photo.basename);
      provenance.add(sourceKey);

      assert.match(photo.basename, /^goal-history-[a-z0-9-]+\.(?:jpe?g|png|webp)$/);
      assert.ok(photo.alt.trim().length > 0);
      assert.notEqual(photo.alt.trim().toLowerCase(), 'image');
      assert.ok(photo.caption.trim().length > 0);
      assert.ok(supportedRoles.has(photo.role), `unsupported role: ${photo.role}`);
      assert.ok(photo.sourceImageIndex > 0);
      assert.match(photo.sourceUrl, /^https:\/\/mmbiz\.qpic\.cn\//);
      assert.ok(photo.focalPoint.x >= 0 && photo.focalPoint.x <= 100);
      assert.ok(photo.focalPoint.y >= 0 && photo.focalPoint.y <= 100);
      assert.equal(photo.rightsStatus, 'official-recap-approved-for-publication');

      const assetUrl = new URL(`../assets/2026/goal-history/${photo.basename}`, import.meta.url);
      assert.equal(existsSync(assetUrl), true, `missing local asset: ${photo.basename}`);
    }
  }
});

test('the 2018 Shanghai event preserves the 2009 and 2018 comparison', () => {
  const event = goalHistoryEvents.find((candidate) => candidate.id === 'e11-2018-shanghai');
  assert.ok(event);
  assert.deepEqual(event.photos.map((photo) => photo.role), [
    'historical-comparison',
    'venue',
    'historical-comparison',
  ]);
  assert.equal(event.photos[0].depictedYear, undefined);
  assert.equal(event.photos[2].depictedYear, 2009);
});
