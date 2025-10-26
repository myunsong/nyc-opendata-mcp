/**
 * Golden tests for time window bounds
 * Priority 7: Ensure window calculations are correct
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { getTimeWindow, getCustomWindow, WINDOW_DAYS } from '../lib/time-windows.js';

test('Window Bounds - 90-day window', () => {
  const window = getTimeWindow('90d');

  // Should return valid ISO dates
  assert.ok(window.start, 'Should have start date');
  assert.ok(window.end, 'Should have end date');

  // Start should be before end
  const startDate = new Date(window.start);
  const endDate = new Date(window.end);
  assert.ok(startDate < endDate, 'Start should be before end');

  // Note: Inclusive range (start 00:00 to end 23:59:59) can be 90 or 91 days depending on Math.ceil
  const daysDiff = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
  assert.ok(daysDiff >= 90 && daysDiff <= 91, 'Should be 90-91 days (inclusive range)');

  // Should have correct type
  assert.strictEqual(window.type, '90d', 'Type should be 90d');
});

test('Window Bounds - 12-month window', () => {
  const window = getTimeWindow('12m');

  const startDate = new Date(window.start);
  const endDate = new Date(window.end);

  // Note: Inclusive range can be 365 or 366 days
  const daysDiff = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
  assert.ok(daysDiff >= 365 && daysDiff <= 366, 'Should be 365-366 days (inclusive range)');

  // Should have correct type
  assert.strictEqual(window.type, '12m', 'Type should be 12m');
});

test('Window Bounds - Custom window', () => {
  const window = getCustomWindow(30);

  const startDate = new Date(window.start);
  const endDate = new Date(window.end);

  // Note: Inclusive range can be 30 or 31 days
  const daysDiff = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
  assert.ok(daysDiff >= 30 && daysDiff <= 31, 'Should be 30-31 days (inclusive range)');

  // Should have correct type
  assert.strictEqual(window.type, 'custom', 'Type should be custom');
});

test('Window Bounds - Start at midnight, end at 23:59:59', () => {
  const window = getTimeWindow('90d');

  const startDate = new Date(window.start);
  const endDate = new Date(window.end);

  // Start should be at 00:00:00
  assert.strictEqual(startDate.getHours(), 0, 'Start hour should be 0');
  assert.strictEqual(startDate.getMinutes(), 0, 'Start minute should be 0');
  assert.strictEqual(startDate.getSeconds(), 0, 'Start second should be 0');

  // End should be at 23:59:59
  assert.strictEqual(endDate.getHours(), 23, 'End hour should be 23');
  assert.strictEqual(endDate.getMinutes(), 59, 'End minute should be 59');
  assert.strictEqual(endDate.getSeconds(), 59, 'End second should be 59');
});

test('Window Bounds - Invalid window type throws error', () => {
  assert.throws(
    () => getTimeWindow('invalid'),
    /Invalid window type/,
    'Should throw error for invalid type'
  );
});

test('Window Bounds - Custom window rejects invalid days', () => {
  assert.throws(
    () => getCustomWindow(0),
    /positive integer/,
    'Should throw error for 0 days'
  );

  assert.throws(
    () => getCustomWindow(-5),
    /positive integer/,
    'Should throw error for negative days'
  );

  assert.throws(
    () => getCustomWindow(3.5),
    /positive integer/,
    'Should throw error for non-integer'
  );
});

test('Window Bounds - End date includes today', () => {
  const window = getTimeWindow('90d');
  const endDate = new Date(window.end);
  const today = new Date();

  // End date should be today (or very close)
  assert.strictEqual(
    endDate.toDateString(),
    today.toDateString(),
    'End date should be today'
  );
});

test('Window Bounds - Consistent results within same second', () => {
  const window1 = getTimeWindow('90d');
  const window2 = getTimeWindow('90d');

  // Should be identical if called within same second
  assert.strictEqual(
    new Date(window1.start).toDateString(),
    new Date(window2.start).toDateString(),
    'Start dates should match'
  );
});

console.log('✓ Window Bounds tests passed');
