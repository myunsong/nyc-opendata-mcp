/**
 * Test runner for NYC MCP
 * Priority 7: Confidence & observability
 *
 * Usage: node test/test-runner.js
 */

import { test } from 'node:test';
import assert from 'node:assert';

// Import all test modules
import './window-bounds.test.js';
import './trend-calculations.test.js';
import './enum-validation.test.js';
import './deduplication.test.js';

console.log('🧪 Running NYC MCP Test Suite...\n');

// Test runner will execute all imported tests
