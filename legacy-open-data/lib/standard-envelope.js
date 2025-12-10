/**
 * Standard output envelope for all NYC MCP tools
 *
 * Why: Makes cross-dataset joins trivial - all tools return the same field names
 *
 * Every tool should return this structure for consistent, composable outputs.
 */

/**
 * Create a standard success envelope
 *
 * @param {Object} params
 * @param {string} params.source - Data source identifier (e.g., '311_service_requests', 'hpd_violations')
 * @param {string} params.eventType - Type of analysis (e.g., 'search', 'trend_analysis', 'aggregation')
 * @param {Object} params.window - Time window { start, end, days, type }
 * @param {number} params.count - Total number of records/events in the result
 * @param {Array} params.records - Array of result records with standardized fields
 * @param {Object} params.meta - Additional metadata specific to this tool/query
 * @returns {Object} Standard envelope
 */
export function createSuccessEnvelope({ source, eventType, window, count, records, meta = {} }) {
  return {
    success: true,
    source,
    event_type: eventType,
    window: {
      start: window.start,
      end: window.end,
      days: window.days,
      type: window.type
    },
    count,
    records,
    meta
  };
}

/**
 * Create a standard error envelope
 *
 * @param {Object} params
 * @param {string} params.type - Error type (e.g., 'INVALID_INPUT', 'API_ERROR', 'NOT_FOUND')
 * @param {string} params.message - Human-readable error message
 * @param {Object} params.details - Additional error details (optional)
 * @param {string} params.guidance - Helpful guidance for fixing the error (optional)
 * @returns {Object} Error envelope
 */
export function createErrorEnvelope({ type, message, details = {}, guidance = null }) {
  const envelope = {
    success: false,
    error: {
      type,
      message,
      ...details
    }
  };

  if (guidance) {
    envelope.error.guidance = guidance;
  }

  return envelope;
}

/**
 * Standard record format for event-based data (311, HPD complaints, etc.)
 *
 * Each record should have:
 * - ts: ISO timestamp of the event
 * - period: Optional period identifier (for aggregated data)
 * - geo: Geographic information { borough, cd, nta, lat, lon }
 * - topic: What the record is about (complaint_type, violation_class, etc.)
 * - value: Numeric value or count
 * - details: Additional fields specific to this record type
 */
export const STANDARD_RECORD_SCHEMA = {
  ts: 'ISO timestamp',
  period: 'Period identifier for aggregated data (YYYY-MM-DD, YYYY-MM, etc.)',
  geo: {
    borough: 'Borough name or code',
    cd: 'Community District (optional)',
    nta: 'Neighborhood Tabulation Area (optional)',
    lat: 'Latitude (optional)',
    lon: 'Longitude (optional)'
  },
  topic: 'Subject of the record (complaint_type, violation_class, etc.)',
  value: 'Numeric value or count',
  details: 'Additional fields specific to this record type (optional)'
};

/**
 * Data source identifiers
 */
export const DATA_SOURCES = {
  NYC_311: '311_service_requests',
  HPD_VIOLATIONS: 'hpd_violations',
  HPD_COMPLAINTS: 'hpd_complaints',
  HPD_REGISTRATIONS: 'hpd_registrations',
  DOT_CLOSURES: 'dot_street_closures',
  DOT_PARKING: 'dot_parking_violations',
  DOT_TRAFFIC: 'dot_traffic_volume',
  EVENTS: 'nyc_events',
  COMPTROLLER_SPENDING: 'comptroller_spending',
  COMPTROLLER_CONTRACTS: 'comptroller_contracts',
  COMPTROLLER_PAYROLL: 'comptroller_payroll'
};

/**
 * Event types
 */
export const EVENT_TYPES = {
  SEARCH: 'search',
  TREND_ANALYSIS: 'trend_analysis',
  AGGREGATION: 'aggregation',
  HEALTH_SCORE: 'health_score',
  COMPARISON: 'comparison',
  FORECAST: 'forecast'
};

/**
 * Error types
 */
export const ERROR_TYPES = {
  INVALID_INPUT: 'INVALID_INPUT',
  API_ERROR: 'API_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT: 'RATE_LIMIT',
  TIMEOUT: 'TIMEOUT',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
};

/**
 * Validate envelope structure
 * @param {Object} envelope - Envelope to validate
 * @returns {boolean} True if valid
 */
export function validateEnvelope(envelope) {
  if (!envelope.success) {
    // Error envelope
    return envelope.error && envelope.error.type && envelope.error.message;
  }

  // Success envelope
  return (
    envelope.source &&
    envelope.event_type &&
    envelope.window &&
    envelope.window.start &&
    envelope.window.end &&
    typeof envelope.count === 'number' &&
    Array.isArray(envelope.records) &&
    envelope.meta !== undefined
  );
}
