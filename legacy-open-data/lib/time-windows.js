/**
 * Standard time windows for NYC Open Data queries
 *
 * These windows ensure comparable outputs across all datasets.
 * All tools should use these functions to maintain consistency.
 */

/**
 * Get a standard time window
 * @param {string} windowType - Either '90d' (default) or '12m'
 * @returns {Object} { start: ISO date string, end: ISO date string, days: number }
 */
export function getTimeWindow(windowType = '90d') {
  const end = new Date();
  end.setHours(23, 59, 59, 999); // End of today

  const start = new Date(end);

  switch (windowType) {
    case '90d':
      start.setDate(start.getDate() - 90);
      break;
    case '12m':
    case '365d':
      start.setDate(start.getDate() - 365);
      break;
    default:
      throw new Error(`Invalid window type: ${windowType}. Use '90d' or '12m'`);
  }

  start.setHours(0, 0, 0, 0); // Start of that day

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    days: Math.ceil((end - start) / (1000 * 60 * 60 * 24)),
    type: windowType
  };
}

/**
 * Get a custom time window based on number of days
 * @param {number} days - Number of days to look back
 * @returns {Object} { start: ISO date string, end: ISO date string, days: number }
 */
export function getCustomWindow(days) {
  if (!Number.isInteger(days) || days <= 0) {
    throw new Error(`Days must be a positive integer, got: ${days}`);
  }

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date(end);
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    days,
    type: 'custom'
  };
}

/**
 * Standard window defaults
 */
export const DEFAULT_WINDOWS = {
  SHORT: '90d',    // 90 days - for recent trends, quality-of-life analysis
  LONG: '12m',     // 12 months - for annual patterns, year-over-year comparisons
};

/**
 * Default days for each window type
 */
export const WINDOW_DAYS = {
  '90d': 90,
  '12m': 365,
};

/**
 * Format window for display
 * @param {Object} window - Window object from getTimeWindow
 * @returns {string} Human-readable string
 */
export function formatWindow(window) {
  const startDate = new Date(window.start).toLocaleDateString();
  const endDate = new Date(window.end).toLocaleDateString();
  return `${startDate} to ${endDate} (${window.days} days)`;
}
