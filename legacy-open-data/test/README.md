# NYC MCP Test Suite

Comprehensive unit tests for NYC Open Data MCP server.

## Quick Start

```bash
# Run all tests
npm test

# Or directly
node test/test-runner.js

# Run specific test file
node test/window-bounds.test.js
node test/trend-calculations.test.js
node test/enum-validation.test.js
node test/deduplication.test.js
```

## Test Coverage

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `window-bounds.test.js` | 8 | Time window calculations, inclusive ranges, boundaries |
| `trend-calculations.test.js` | 11 | Trend analysis, divide-by-zero guards, edge cases |
| `enum-validation.test.js` | 26 | Input validation, SQL injection protection, enums |
| `deduplication.test.js` | 19 | Duplicate removal, aggregation, performance |
| **Total** | **64** | **All critical logic paths** |

## Test Results

```
# tests 64
# pass 64
# fail 0
# duration_ms ~60ms
```

## What's Tested

### ✅ Time Window Calculations
- 90-day and 12-month windows
- Custom time windows
- Inclusive ranges (start 00:00 to end 23:59:59)
- Midnight boundaries
- Invalid inputs

### ✅ Trend Calculations
- Normal trends (increasing, decreasing, stable)
- **Divide-by-zero guards**:
  - Previous = 0, Recent > 0 → Caps at 999%
  - Both = 0 → Returns 0% (no change)
  - Recent = 0 → Returns -100% (complete decline)
- Insufficient data handling
- Large numbers (no overflow)

### ✅ Input Validation
- Borough validation (case-insensitive, short codes)
- Limit validation (boundaries, defaults)
- Days validation (range checks)
- **SQL injection protection**: String escaping (`'` → `''`)
- Type checking
- Optional parameters

### ✅ Deduplication Logic
- Record-level deduplication (by unique_key)
- Aggregated deduplication (by period + topic)
- Missing key handling
- Performance (10,000 records in <5ms)
- Real-world scenarios

## Test Framework

**Node.js built-in test runner** (zero dependencies)
- Uses `node:test` and `node:assert`
- TAP output format
- Fast execution
- No external dependencies required

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
```

### Pre-commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit
npm test || exit 1
```

## Writing New Tests

### Basic Test Structure
```javascript
import { test } from 'node:test';
import assert from 'node:assert';

test('Description of what is tested', () => {
  const result = functionUnderTest(input);

  assert.strictEqual(result.value, expectedValue, 'Error message if fails');
  assert.ok(result.valid, 'Should be valid');
});
```

### Testing Edge Cases
```javascript
test('Edge case - divide by zero', () => {
  const timeline = [
    { period: '2025-10-01', count: 0 },  // Previous = 0
    { period: '2025-10-02', count: 100 } // Recent = 100
  ];

  const trend = calculateTrend(timeline);

  // Should cap at 999% instead of infinity
  assert.strictEqual(trend.percentage_change, '999.00');
});
```

## Common Patterns

### Inclusive Time Ranges
Time windows are inclusive (start 00:00:00 to end 23:59:59), which means:
- 90-day window = 90-91 calendar days (depending on exact hours)
- Use range checks: `assert.ok(days >= 90 && days <= 91)`

### SQL Injection Protection
All string inputs are escaped:
```javascript
"O'Malley's" → "O''Malley''s"  // Single quote doubled
```

### Performance Tests
For performance-sensitive operations:
```javascript
const startTime = Date.now();
const result = heavyOperation();
const duration = Date.now() - startTime;

assert.ok(duration < 100, `Should complete in <100ms (took ${duration}ms)`);
```

## Documentation

See [docs/priority-7-complete.md](../docs/priority-7-complete.md) for full details on test implementation and rationale.
