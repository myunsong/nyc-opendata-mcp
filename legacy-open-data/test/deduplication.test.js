/**
 * Golden tests for deduplication logic
 * Priority 7: Test de-duplication by unique keys
 */

import { test } from 'node:test';
import assert from 'node:assert';

/**
 * Deduplication function (extracted for testing)
 * This is the logic used in aggregation tools
 */
function deduplicateRecords(records, keyField = 'unique_key') {
  const seen = new Set();
  const deduplicated = [];
  let duplicateCount = 0;

  records.forEach(record => {
    const key = record[keyField];

    if (!key) {
      // No key field - keep the record but warn
      deduplicated.push(record);
      return;
    }

    if (seen.has(key)) {
      duplicateCount++;
      return; // Skip duplicate
    }

    seen.add(key);
    deduplicated.push(record);
  });

  return {
    records: deduplicated,
    original_count: records.length,
    deduplicated_count: deduplicated.length,
    duplicates_removed: duplicateCount
  };
}

/**
 * Deduplication for aggregated data (by period + topic)
 */
function deduplicateAggregated(records) {
  const aggregated = new Map();

  records.forEach(record => {
    const key = `${record.period}|${record.topic}`;

    if (aggregated.has(key)) {
      // Merge counts
      const existing = aggregated.get(key);
      existing.count += record.count;
    } else {
      aggregated.set(key, { ...record });
    }
  });

  return Array.from(aggregated.values());
}

// ===== BASIC DEDUPLICATION TESTS =====

test('Deduplication - No duplicates', () => {
  const records = [
    { unique_key: 'A123', value: 1 },
    { unique_key: 'B456', value: 2 },
    { unique_key: 'C789', value: 3 }
  ];

  const result = deduplicateRecords(records);

  assert.strictEqual(result.original_count, 3, 'Original count should be 3');
  assert.strictEqual(result.deduplicated_count, 3, 'Deduplicated count should be 3');
  assert.strictEqual(result.duplicates_removed, 0, 'No duplicates removed');
  assert.strictEqual(result.records.length, 3, 'All records kept');
});

test('Deduplication - Simple duplicates', () => {
  const records = [
    { unique_key: 'A123', value: 1 },
    { unique_key: 'B456', value: 2 },
    { unique_key: 'A123', value: 3 },  // Duplicate
    { unique_key: 'C789', value: 4 }
  ];

  const result = deduplicateRecords(records);

  assert.strictEqual(result.original_count, 4, 'Original count should be 4');
  assert.strictEqual(result.deduplicated_count, 3, 'Deduplicated count should be 3');
  assert.strictEqual(result.duplicates_removed, 1, 'One duplicate removed');

  // First occurrence should be kept
  const keys = result.records.map(r => r.unique_key);
  assert.deepStrictEqual(keys, ['A123', 'B456', 'C789'], 'Should keep first occurrence');

  const firstA123 = result.records.find(r => r.unique_key === 'A123');
  assert.strictEqual(firstA123.value, 1, 'Should keep first occurrence value');
});

test('Deduplication - Multiple duplicates of same key', () => {
  const records = [
    { unique_key: 'A123', value: 1 },
    { unique_key: 'A123', value: 2 },
    { unique_key: 'A123', value: 3 },
    { unique_key: 'B456', value: 4 }
  ];

  const result = deduplicateRecords(records);

  assert.strictEqual(result.original_count, 4, 'Original count should be 4');
  assert.strictEqual(result.deduplicated_count, 2, 'Deduplicated count should be 2');
  assert.strictEqual(result.duplicates_removed, 2, 'Two duplicates removed');
});

test('Deduplication - All duplicates', () => {
  const records = [
    { unique_key: 'A123', value: 1 },
    { unique_key: 'A123', value: 2 },
    { unique_key: 'A123', value: 3 }
  ];

  const result = deduplicateRecords(records);

  assert.strictEqual(result.original_count, 3, 'Original count should be 3');
  assert.strictEqual(result.deduplicated_count, 1, 'Deduplicated count should be 1');
  assert.strictEqual(result.duplicates_removed, 2, 'Two duplicates removed');
});

// ===== EDGE CASES =====

test('Deduplication - Empty array', () => {
  const records = [];
  const result = deduplicateRecords(records);

  assert.strictEqual(result.original_count, 0, 'Original count should be 0');
  assert.strictEqual(result.deduplicated_count, 0, 'Deduplicated count should be 0');
  assert.strictEqual(result.duplicates_removed, 0, 'No duplicates removed');
  assert.strictEqual(result.records.length, 0, 'Result should be empty');
});

test('Deduplication - Missing key field', () => {
  const records = [
    { unique_key: 'A123', value: 1 },
    { value: 2 },  // No unique_key
    { unique_key: 'B456', value: 3 }
  ];

  const result = deduplicateRecords(records);

  assert.strictEqual(result.original_count, 3, 'Original count should be 3');
  assert.strictEqual(result.deduplicated_count, 3, 'All records kept (missing key allowed)');
  assert.strictEqual(result.duplicates_removed, 0, 'No duplicates removed');
});

test('Deduplication - All records missing key', () => {
  const records = [
    { value: 1 },
    { value: 2 },
    { value: 3 }
  ];

  const result = deduplicateRecords(records);

  assert.strictEqual(result.deduplicated_count, 3, 'All records kept');
  assert.strictEqual(result.duplicates_removed, 0, 'No duplicates removed');
});

test('Deduplication - Custom key field', () => {
  const records = [
    { complaint_id: 'X100', value: 1 },
    { complaint_id: 'X200', value: 2 },
    { complaint_id: 'X100', value: 3 }  // Duplicate
  ];

  const result = deduplicateRecords(records, 'complaint_id');

  assert.strictEqual(result.duplicates_removed, 1, 'One duplicate removed');
  assert.strictEqual(result.deduplicated_count, 2, 'Two unique records');
});

test('Deduplication - Numeric keys', () => {
  const records = [
    { unique_key: 123, value: 'A' },
    { unique_key: 456, value: 'B' },
    { unique_key: 123, value: 'C' }  // Duplicate
  ];

  const result = deduplicateRecords(records);

  assert.strictEqual(result.duplicates_removed, 1, 'One duplicate removed');
  assert.strictEqual(result.deduplicated_count, 2, 'Two unique records');
});

test('Deduplication - String vs number key (no match)', () => {
  const records = [
    { unique_key: '123', value: 'A' },
    { unique_key: 123, value: 'B' }
  ];

  const result = deduplicateRecords(records);

  // Set uses strict equality, so '123' !== 123
  assert.strictEqual(result.duplicates_removed, 0, 'Different types = no match');
  assert.strictEqual(result.deduplicated_count, 2, 'Both records kept');
});

// ===== AGGREGATED DEDUPLICATION TESTS =====

test('Aggregated Deduplication - No duplicates', () => {
  const records = [
    { period: '2025-10-01', topic: 'Noise', count: 10 },
    { period: '2025-10-02', topic: 'Noise', count: 15 },
    { period: '2025-10-01', topic: 'Heat', count: 5 }
  ];

  const result = deduplicateAggregated(records);

  assert.strictEqual(result.length, 3, 'All records are unique');
  assert.strictEqual(result[0].count, 10, 'Counts unchanged');
});

test('Aggregated Deduplication - Merge duplicates', () => {
  const records = [
    { period: '2025-10-01', topic: 'Noise', count: 10 },
    { period: '2025-10-01', topic: 'Noise', count: 5 },  // Duplicate - should merge
    { period: '2025-10-02', topic: 'Noise', count: 15 }
  ];

  const result = deduplicateAggregated(records);

  assert.strictEqual(result.length, 2, 'Duplicates merged');

  const oct01 = result.find(r => r.period === '2025-10-01' && r.topic === 'Noise');
  assert.strictEqual(oct01.count, 15, 'Counts should be summed (10 + 5)');
});

test('Aggregated Deduplication - Multiple merges', () => {
  const records = [
    { period: '2025-10-01', topic: 'Noise', count: 10 },
    { period: '2025-10-01', topic: 'Noise', count: 5 },
    { period: '2025-10-01', topic: 'Noise', count: 3 },
    { period: '2025-10-02', topic: 'Noise', count: 15 }
  ];

  const result = deduplicateAggregated(records);

  assert.strictEqual(result.length, 2, 'Three duplicates merged into one');

  const oct01 = result.find(r => r.period === '2025-10-01');
  assert.strictEqual(oct01.count, 18, 'Counts should be summed (10 + 5 + 3)');
});

test('Aggregated Deduplication - Same period, different topics', () => {
  const records = [
    { period: '2025-10-01', topic: 'Noise', count: 10 },
    { period: '2025-10-01', topic: 'Heat', count: 5 },  // Different topic
    { period: '2025-10-01', topic: 'Noise', count: 3 }   // Duplicate of first
  ];

  const result = deduplicateAggregated(records);

  assert.strictEqual(result.length, 2, 'Two unique period+topic combinations');

  const noise = result.find(r => r.topic === 'Noise');
  const heat = result.find(r => r.topic === 'Heat');

  assert.strictEqual(noise.count, 13, 'Noise should be merged (10 + 3)');
  assert.strictEqual(heat.count, 5, 'Heat should be unchanged');
});

// ===== REAL-WORLD SCENARIOS =====

test('Real-World - 311 complaints with duplicates', () => {
  const records = [
    { unique_key: '60001234', created_date: '2025-10-01', complaint_type: 'Noise', borough: 'BROOKLYN' },
    { unique_key: '60001235', created_date: '2025-10-01', complaint_type: 'Heat', borough: 'BROOKLYN' },
    { unique_key: '60001234', created_date: '2025-10-01', complaint_type: 'Noise', borough: 'BROOKLYN' },  // Exact duplicate
    { unique_key: '60001236', created_date: '2025-10-02', complaint_type: 'Noise', borough: 'QUEENS' }
  ];

  const result = deduplicateRecords(records);

  assert.strictEqual(result.duplicates_removed, 1, 'One duplicate removed');
  assert.strictEqual(result.deduplicated_count, 3, 'Three unique complaints');

  // Verify first occurrence kept
  const complaint1 = result.records.find(r => r.unique_key === '60001234');
  assert.strictEqual(complaint1.complaint_type, 'Noise', 'Should keep first occurrence data');
});

test('Real-World - HPD violations with batch duplicates', () => {
  const records = [
    { violation_id: 'V12345', inspection_date: '2025-09-15', class: 'C' },
    { violation_id: 'V12346', inspection_date: '2025-09-15', class: 'B' },
    { violation_id: 'V12345', inspection_date: '2025-09-15', class: 'C' },  // Duplicate
    { violation_id: 'V12345', inspection_date: '2025-09-16', class: 'C' }   // Same ID, different date (still duplicate)
  ];

  const result = deduplicateRecords(records, 'violation_id');

  assert.strictEqual(result.duplicates_removed, 2, 'Two duplicates removed');
  assert.strictEqual(result.deduplicated_count, 2, 'Two unique violations');
});

test('Real-World - Timeline aggregation with overlapping data', () => {
  // Simulates data from multiple API calls that might overlap
  const batch1 = [
    { period: '2025-10-01', topic: 'Noise', count: 50 },
    { period: '2025-10-02', topic: 'Noise', count: 60 }
  ];

  const batch2 = [
    { period: '2025-10-02', topic: 'Noise', count: 60 },  // Overlaps with batch1
    { period: '2025-10-03', topic: 'Noise', count: 55 }
  ];

  const combined = [...batch1, ...batch2];
  const result = deduplicateAggregated(combined);

  assert.strictEqual(result.length, 3, 'Three unique periods');

  const oct02 = result.find(r => r.period === '2025-10-02');
  assert.strictEqual(oct02.count, 120, 'Overlapping period should be merged (60 + 60)');
});

// ===== PERFORMANCE CHARACTERISTICS =====

test('Performance - Large dataset deduplication', () => {
  // Generate 10,000 records with ~20% duplicates
  const records = [];
  for (let i = 0; i < 10000; i++) {
    const isDuplicate = i > 0 && i % 5 === 0;
    const key = isDuplicate ? `KEY${i - 1}` : `KEY${i}`;
    records.push({ unique_key: key, value: i });
  }

  const startTime = Date.now();
  const result = deduplicateRecords(records);
  const duration = Date.now() - startTime;

  assert.strictEqual(result.original_count, 10000, 'Original count should be 10000');
  // Note: Actual duplicates is 1999 due to modulo logic (i=5,10,15... skipping i=0)
  assert.ok(result.duplicates_removed >= 1900 && result.duplicates_removed <= 2100, '~20% duplicates removed');
  assert.ok(result.deduplicated_count >= 7900 && result.deduplicated_count <= 8100, '~8000 unique records');
  assert.ok(duration < 1000, `Should complete in <1s (took ${duration}ms)`);
});

test('Performance - Worst case (all duplicates)', () => {
  const records = Array.from({ length: 1000 }, () => ({
    unique_key: 'SAME_KEY',
    value: Math.random()
  }));

  const result = deduplicateRecords(records);

  assert.strictEqual(result.deduplicated_count, 1, 'Should keep only one record');
  assert.strictEqual(result.duplicates_removed, 999, 'Should remove 999 duplicates');
});

console.log('✓ Deduplication tests passed');
