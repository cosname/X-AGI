import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_HEADER_SCROLL_THRESHOLD,
  resolveHeaderScrollState,
} from './header-scroll-state.ts';

test('header remains transparent through the configured threshold', () => {
  assert.equal(resolveHeaderScrollState(0), 'top');
  assert.equal(resolveHeaderScrollState(DEFAULT_HEADER_SCROLL_THRESHOLD), 'top');
});

test('header gains its surface after the configured threshold', () => {
  assert.equal(resolveHeaderScrollState(DEFAULT_HEADER_SCROLL_THRESHOLD + 0.5), 'scrolled');
  assert.equal(resolveHeaderScrollState(120, 80), 'scrolled');
});

test('header state safely handles invalid and negative positions', () => {
  assert.equal(resolveHeaderScrollState(-40), 'top');
  assert.equal(resolveHeaderScrollState(Number.NaN), 'top');
  assert.equal(resolveHeaderScrollState(51, Number.NaN), 'scrolled');
});
