import assert from 'node:assert/strict';
import test from 'node:test';

import {
  claimInitialization,
  countVisibleScheduleItems,
  formatGalleryStatus,
  formatScheduleStatus,
  galleryMovement,
  matchesScheduleFilters,
  nearestSlideIndex,
  releaseInitialization,
  wrapGalleryIndex,
  type InitializationDataset,
} from './goal-home-lower-state.ts';

test('goal widgets claim initialization once and can initialize again after cleanup', () => {
  const dataset: InitializationDataset = {};

  assert.equal(claimInitialization(dataset, 'galleryInitialized'), true);
  assert.equal(dataset.galleryInitialized, 'true');
  assert.equal(claimInitialization(dataset, 'galleryInitialized'), false);

  releaseInitialization(dataset, 'galleryInitialized');

  assert.equal(dataset.galleryInitialized, undefined);
  assert.equal(claimInitialization(dataset, 'galleryInitialized'), true);
});

test('gallery index wrapping is stable in both directions', () => {
  assert.equal(wrapGalleryIndex(0, 5), 0);
  assert.equal(wrapGalleryIndex(5, 5), 0);
  assert.equal(wrapGalleryIndex(-1, 5), 4);
  assert.equal(wrapGalleryIndex(-6, 5), 4);
  assert.equal(wrapGalleryIndex(3, 0), 0);
});

test('gallery movement is instant for wraps and reduced motion', () => {
  assert.deepEqual(galleryMovement(2, 5, false), {
    targetIndex: 2,
    moveInstantly: false,
  });
  assert.deepEqual(galleryMovement(2, 5, true), {
    targetIndex: 2,
    moveInstantly: true,
  });
  assert.deepEqual(galleryMovement(5, 5, false), {
    targetIndex: 0,
    moveInstantly: true,
  });
  assert.deepEqual(galleryMovement(-1, 5, false), {
    targetIndex: 4,
    moveInstantly: true,
  });
});

test('gallery status follows the slide nearest the viewport center', () => {
  const slideCenters = [180, 540, 900, 1_260, 1_620];

  assert.equal(nearestSlideIndex(slideCenters, 180), 0);
  assert.equal(nearestSlideIndex(slideCenters, 690), 1);
  assert.equal(nearestSlideIndex(slideCenters, 760), 2);
  assert.equal(nearestSlideIndex(slideCenters, 1_510), 4);
  assert.equal(nearestSlideIndex([], 400), 0);
  assert.equal(formatGalleryStatus(2, 5), '第 3 张，共 5 张');
});

test('schedule filters combine date and category with AND semantics', () => {
  const item = { date: '2026-10-17', category: 'poster' };

  assert.equal(matchesScheduleFilters(item, { date: 'all', category: 'all' }), true);
  assert.equal(matchesScheduleFilters(item, { date: '2026-10-17', category: 'poster' }), true);
  assert.equal(matchesScheduleFilters(item, { date: '2026-10-18', category: 'poster' }), false);
  assert.equal(matchesScheduleFilters(item, { date: '2026-10-17', category: 'parallel' }), false);
});

test('schedule counts and live status cover matching and empty results', () => {
  const items = [
    { date: '2026-10-16', category: 'arrival' },
    { date: '2026-10-17', category: 'keynote' },
    { date: '2026-10-17', category: 'parallel' },
    { date: '2026-10-17', category: 'poster' },
    { date: '2026-10-18', category: 'parallel' },
  ];

  const parallelCount = countVisibleScheduleItems(items, {
    date: 'all',
    category: 'parallel',
  });
  const emptyCount = countVisibleScheduleItems(items, {
    date: '2026-10-16',
    category: 'poster',
  });

  assert.equal(parallelCount, 2);
  assert.equal(formatScheduleStatus(parallelCount), '当前显示 2 项安排');
  assert.equal(emptyCount, 0);
  assert.equal(formatScheduleStatus(emptyCount), '当前筛选下暂无安排');
});
