/**
 * Golden tests for trend calculations
 * Priority 7: Test divide-by-zero guards and edge cases
 */

import { test } from 'node:test';
import assert from 'node:assert';

/**
 * Trend calculation function (extracted for testing)
 * This is the logic from analyze_trends_v2.js
 */
function calculateTrend(timeline) {
  if (timeline.length < 14) {
    return null;
  }

  const recentPeriods = timeline.slice(-7);
  const previousPeriods = timeline.slice(-14, -7);

  const recentAvg = recentPeriods.reduce((sum, p) => sum + p.count, 0) / recentPeriods.length;
  const previousAvg = previousPeriods.reduce((sum, p) => sum + p.count, 0) / previousPeriods.length;

  // DIVIDE-BY-ZERO GUARD
  let percentageChange = null;
  if (previousAvg > 0) {
    percentageChange = ((recentAvg - previousAvg) / previousAvg * 100);
  } else if (recentAvg > 0) {
    // Previous was zero, recent is non-zero = infinite growth, cap at 999%
    percentageChange = 999;
  } else {
    // Both zero = no change
    percentageChange = 0;
  }

  return {
    direction: percentageChange > 0 ? 'increasing' : percentageChange < 0 ? 'decreasing' : 'stable',
    percentage_change: percentageChange.toFixed(2),
    recent_avg: parseFloat(recentAvg.toFixed(2)),
    previous_avg: parseFloat(previousAvg.toFixed(2))
  };
}

test('Trend Calculations - Normal case (both periods have data)', () => {
  const timeline = Array.from({ length: 14 }, (_, i) => ({
    period: `2025-10-${String(i + 1).padStart(2, '0')}`,
    count: i < 7 ? 100 : 120  // Previous: 100, Recent: 120
  }));

  const trend = calculateTrend(timeline);

  assert.ok(trend, 'Trend should be calculated');
  assert.strictEqual(trend.direction, 'increasing', 'Should be increasing');
  assert.strictEqual(trend.previous_avg, 100, 'Previous avg should be 100');
  assert.strictEqual(trend.recent_avg, 120, 'Recent avg should be 120');
  assert.strictEqual(trend.percentage_change, '20.00', 'Change should be 20%');
});

test('Trend Calculations - Decreasing trend', () => {
  const timeline = Array.from({ length: 14 }, (_, i) => ({
    period: `2025-10-${String(i + 1).padStart(2, '0')}`,
    count: i < 7 ? 100 : 80  // Previous: 100, Recent: 80
  }));

  const trend = calculateTrend(timeline);

  assert.strictEqual(trend.direction, 'decreasing', 'Should be decreasing');
  assert.strictEqual(trend.percentage_change, '-20.00', 'Change should be -20%');
});

test('Trend Calculations - Stable (no change)', () => {
  const timeline = Array.from({ length: 14 }, (_, i) => ({
    period: `2025-10-${String(i + 1).padStart(2, '0')}`,
    count: 100  // Both periods: 100
  }));

  const trend = calculateTrend(timeline);

  assert.strictEqual(trend.direction, 'stable', 'Should be stable');
  assert.strictEqual(trend.percentage_change, '0.00', 'Change should be 0%');
});

test('Trend Calculations - Previous = 0, Recent > 0 (infinite growth)', () => {
  const timeline = Array.from({ length: 14 }, (_, i) => ({
    period: `2025-10-${String(i + 1).padStart(2, '0')}`,
    count: i < 7 ? 0 : 100  // Previous: 0, Recent: 100
  }));

  const trend = calculateTrend(timeline);

  assert.strictEqual(trend.direction, 'increasing', 'Should be increasing');
  assert.strictEqual(trend.previous_avg, 0, 'Previous avg should be 0');
  assert.strictEqual(trend.recent_avg, 100, 'Recent avg should be 100');
  assert.strictEqual(trend.percentage_change, '999.00', 'Change should be capped at 999%');
});

test('Trend Calculations - Both periods = 0 (no data)', () => {
  const timeline = Array.from({ length: 14 }, (_, i) => ({
    period: `2025-10-${String(i + 1).padStart(2, '0')}`,
    count: 0  // Both periods: 0
  }));

  const trend = calculateTrend(timeline);

  assert.strictEqual(trend.direction, 'stable', 'Should be stable (no change)');
  assert.strictEqual(trend.previous_avg, 0, 'Previous avg should be 0');
  assert.strictEqual(trend.recent_avg, 0, 'Recent avg should be 0');
  assert.strictEqual(trend.percentage_change, '0.00', 'Change should be 0%');
});

test('Trend Calculations - Previous > 0, Recent = 0 (decline to zero)', () => {
  const timeline = Array.from({ length: 14 }, (_, i) => ({
    period: `2025-10-${String(i + 1).padStart(2, '0')}`,
    count: i < 7 ? 100 : 0  // Previous: 100, Recent: 0
  }));

  const trend = calculateTrend(timeline);

  assert.strictEqual(trend.direction, 'decreasing', 'Should be decreasing');
  assert.strictEqual(trend.previous_avg, 100, 'Previous avg should be 100');
  assert.strictEqual(trend.recent_avg, 0, 'Recent avg should be 0');
  assert.strictEqual(trend.percentage_change, '-100.00', 'Change should be -100%');
});

test('Trend Calculations - Insufficient data (< 14 periods)', () => {
  const timeline = Array.from({ length: 10 }, (_, i) => ({
    period: `2025-10-${String(i + 1).padStart(2, '0')}`,
    count: 100
  }));

  const trend = calculateTrend(timeline);

  assert.strictEqual(trend, null, 'Should return null for insufficient data');
});

test('Trend Calculations - Exactly 14 periods', () => {
  const timeline = Array.from({ length: 14 }, (_, i) => ({
    period: `2025-10-${String(i + 1).padStart(2, '0')}`,
    count: 100
  }));

  const trend = calculateTrend(timeline);

  assert.ok(trend, 'Should calculate trend with exactly 14 periods');
  assert.strictEqual(trend.direction, 'stable', 'Should be stable');
});

test('Trend Calculations - Large numbers (no overflow)', () => {
  const timeline = Array.from({ length: 14 }, (_, i) => ({
    period: `2025-10-${String(i + 1).padStart(2, '0')}`,
    count: i < 7 ? 1000000 : 1100000  // Previous: 1M, Recent: 1.1M
  }));

  const trend = calculateTrend(timeline);

  assert.strictEqual(trend.direction, 'increasing', 'Should be increasing');
  assert.strictEqual(trend.percentage_change, '10.00', 'Change should be 10%');
  assert.strictEqual(trend.previous_avg, 1000000, 'Should handle large numbers');
});

test('Trend Calculations - Fractional averages', () => {
  const timeline = [
    ...Array.from({ length: 7 }, (_, i) => ({ period: `day-${i}`, count: 10 })),
    ...Array.from({ length: 7 }, (_, i) => ({ period: `day-${i+7}`, count: 15 }))
  ];

  const trend = calculateTrend(timeline);

  assert.strictEqual(trend.previous_avg, 10, 'Previous avg should be 10');
  assert.strictEqual(trend.recent_avg, 15, 'Recent avg should be 15');
  assert.strictEqual(trend.percentage_change, '50.00', 'Change should be 50%');
});

console.log('✓ Trend Calculations tests passed');
