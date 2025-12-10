/**
 * Input validation utilities with friendly error messages
 *
 * Priority 1: Eliminate brittle failures and unclear 400s
 *
 * All validation functions return { valid: boolean, error?: object }
 */

import { createErrorEnvelope, ERROR_TYPES } from './standard-envelope.js';

/**
 * Valid borough codes/names
 */
export const VALID_BOROUGHS = {
  codes: ['1', '2', '3', '4', '5'],
  names: ['MANHATTAN', 'BRONX', 'BROOKLYN', 'QUEENS', 'STATEN ISLAND'],
  mapping: {
    '1': 'MANHATTAN',
    '2': 'BRONX',
    '3': 'BROOKLYN',
    '4': 'QUEENS',
    '5': 'STATEN ISLAND',
    'M': 'MANHATTAN',
    'X': 'BRONX',
    'K': 'BROOKLYN',
    'Q': 'QUEENS',
    'R': 'STATEN ISLAND'
  }
};

/**
 * Validate borough input
 * @param {string} borough - Borough code or name
 * @returns {Object} { valid: boolean, normalized?: string, error?: object }
 */
export function validateBorough(borough) {
  if (!borough) {
    return { valid: true }; // Optional parameter
  }

  const upper = borough.toString().toUpperCase();

  // Check if it's a valid code
  if (VALID_BOROUGHS.codes.includes(upper)) {
    return { valid: true, normalized: upper };
  }

  // Check if it's a valid name
  if (VALID_BOROUGHS.names.includes(upper)) {
    return { valid: true, normalized: upper };
  }

  // Check if it's in the mapping
  if (VALID_BOROUGHS.mapping[upper]) {
    return { valid: true, normalized: VALID_BOROUGHS.mapping[upper] };
  }

  return {
    valid: false,
    error: createErrorEnvelope({
      type: ERROR_TYPES.INVALID_INPUT,
      message: `Invalid borough: '${borough}'. Must be one of: ${VALID_BOROUGHS.names.join(', ')} or codes 1-5`,
      details: {
        provided: borough,
        valid_names: VALID_BOROUGHS.names,
        valid_codes: VALID_BOROUGHS.codes
      },
      guidance: 'Use borough names (e.g., "MANHATTAN") or numeric codes (1-5)'
    })
  };
}

/**
 * Validate days parameter
 * @param {number} days - Number of days
 * @param {Object} options - Validation options { min, max, required }
 * @returns {Object} { valid: boolean, error?: object }
 */
export function validateDays(days, options = {}) {
  const { min = 1, max = 365, required = false } = options;

  if (days === undefined || days === null) {
    if (required) {
      return {
        valid: false,
        error: createErrorEnvelope({
          type: ERROR_TYPES.INVALID_INPUT,
          message: 'Parameter "days" is required',
          guidance: `Provide a number of days between ${min} and ${max}`
        })
      };
    }
    return { valid: true }; // Optional and not provided
  }

  if (!Number.isInteger(days)) {
    return {
      valid: false,
      error: createErrorEnvelope({
        type: ERROR_TYPES.INVALID_INPUT,
        message: `Parameter "days" must be an integer, got: ${days} (${typeof days})`,
        details: { provided: days, type: typeof days },
        guidance: `Provide an integer between ${min} and ${max}`
      })
    };
  }

  if (days < min || days > max) {
    return {
      valid: false,
      error: createErrorEnvelope({
        type: ERROR_TYPES.INVALID_INPUT,
        message: `Parameter "days" must be between ${min} and ${max}, got: ${days}`,
        details: { provided: days, valid_range: { min, max } },
        guidance: `Use a value between ${min} and ${max} days`
      })
    };
  }

  return { valid: true };
}

/**
 * Validate enum parameter
 * @param {string} value - Value to validate
 * @param {Array} validValues - Array of valid values
 * @param {string} paramName - Parameter name for error messages
 * @param {boolean} required - Whether the parameter is required
 * @returns {Object} { valid: boolean, normalized?: string, error?: object }
 */
export function validateEnum(value, validValues, paramName = 'parameter', required = false) {
  if (value === undefined || value === null || value === '') {
    if (required) {
      return {
        valid: false,
        error: createErrorEnvelope({
          type: ERROR_TYPES.INVALID_INPUT,
          message: `Parameter "${paramName}" is required`,
          details: { valid_options: validValues },
          guidance: `Provide one of: ${validValues.join(', ')}`
        })
      };
    }
    return { valid: true }; // Optional and not provided
  }

  const normalized = value.toString().toLowerCase();
  const validNormalized = validValues.map(v => v.toLowerCase());

  if (!validNormalized.includes(normalized)) {
    return {
      valid: false,
      error: createErrorEnvelope({
        type: ERROR_TYPES.INVALID_INPUT,
        message: `Invalid ${paramName}: '${value}'. Must be one of: ${validValues.join(', ')}`,
        details: {
          provided: value,
          valid_options: validValues
        },
        guidance: `Use one of the valid options: ${validValues.join(', ')}`
      })
    };
  }

  // Return the original casing from validValues
  const originalIndex = validNormalized.indexOf(normalized);
  return { valid: true, normalized: validValues[originalIndex] };
}

/**
 * Validate and escape string input to prevent SQL injection
 * @param {string} value - String to validate and escape
 * @param {Object} options - Validation options { maxLength, pattern, required }
 * @returns {Object} { valid: boolean, escaped?: string, error?: object }
 */
export function validateAndEscapeString(value, options = {}) {
  const { maxLength = 1000, pattern = null, required = false, paramName = 'parameter' } = options;

  if (value === undefined || value === null || value === '') {
    if (required) {
      return {
        valid: false,
        error: createErrorEnvelope({
          type: ERROR_TYPES.INVALID_INPUT,
          message: `Parameter "${paramName}" is required`,
          guidance: 'Provide a non-empty string value'
        })
      };
    }
    return { valid: true }; // Optional and not provided
  }

  const str = value.toString();

  if (str.length > maxLength) {
    return {
      valid: false,
      error: createErrorEnvelope({
        type: ERROR_TYPES.INVALID_INPUT,
        message: `Parameter "${paramName}" exceeds maximum length of ${maxLength} characters`,
        details: { provided_length: str.length, max_length: maxLength },
        guidance: `Shorten your input to ${maxLength} characters or less`
      })
    };
  }

  if (pattern && !pattern.test(str)) {
    return {
      valid: false,
      error: createErrorEnvelope({
        type: ERROR_TYPES.INVALID_INPUT,
        message: `Parameter "${paramName}" contains invalid characters`,
        details: { provided: str, pattern: pattern.toString() },
        guidance: 'Use only alphanumeric characters and basic punctuation'
      })
    };
  }

  // Escape single quotes for Socrata SoQL (double the quote)
  const escaped = str.replace(/'/g, "''");

  return { valid: true, escaped };
}

/**
 * Validate limit parameter
 * @param {number} limit - Result limit
 * @param {Object} options - Validation options { min, max, default }
 * @returns {Object} { valid: boolean, normalized?: number, error?: object }
 */
export function validateLimit(limit, options = {}) {
  const { min = 1, max = 1000, defaultValue = 100 } = options;

  if (limit === undefined || limit === null) {
    return { valid: true, normalized: defaultValue };
  }

  if (!Number.isInteger(limit)) {
    return {
      valid: false,
      error: createErrorEnvelope({
        type: ERROR_TYPES.INVALID_INPUT,
        message: `Parameter "limit" must be an integer, got: ${limit}`,
        details: { provided: limit, type: typeof limit },
        guidance: `Provide an integer between ${min} and ${max}`
      })
    };
  }

  if (limit < min || limit > max) {
    return {
      valid: false,
      error: createErrorEnvelope({
        type: ERROR_TYPES.INVALID_INPUT,
        message: `Parameter "limit" must be between ${min} and ${max}, got: ${limit}`,
        details: { provided: limit, valid_range: { min, max } },
        guidance: `Use a value between ${min} and ${max}`
      })
    };
  }

  return { valid: true, normalized: limit };
}

/**
 * Validate date string (ISO 8601 format)
 * @param {string} date - Date string
 * @param {string} paramName - Parameter name for error messages
 * @param {boolean} required - Whether the parameter is required
 * @returns {Object} { valid: boolean, parsed?: Date, error?: object }
 */
export function validateDate(date, paramName = 'date', required = false) {
  if (!date) {
    if (required) {
      return {
        valid: false,
        error: createErrorEnvelope({
          type: ERROR_TYPES.INVALID_INPUT,
          message: `Parameter "${paramName}" is required`,
          guidance: 'Provide a date in YYYY-MM-DD format'
        })
      };
    }
    return { valid: true };
  }

  const parsed = new Date(date);

  if (isNaN(parsed.getTime())) {
    return {
      valid: false,
      error: createErrorEnvelope({
        type: ERROR_TYPES.INVALID_INPUT,
        message: `Invalid date format for "${paramName}": ${date}`,
        details: { provided: date },
        guidance: 'Use ISO 8601 format: YYYY-MM-DD (e.g., "2025-01-15")'
      })
    };
  }

  return { valid: true, parsed };
}

/**
 * Batch validate multiple parameters
 * @param {Object} validations - Object with parameter names as keys and validation results as values
 * @returns {Object} { valid: boolean, errors?: Array, normalized?: Object }
 */
export function batchValidate(validations) {
  const errors = [];
  const normalized = {};

  for (const [param, result] of Object.entries(validations)) {
    if (!result.valid) {
      errors.push({ param, ...result.error.error });
    } else if (result.normalized !== undefined) {
      normalized[param] = result.normalized;
    } else if (result.escaped !== undefined) {
      normalized[param] = result.escaped;
    } else if (result.parsed !== undefined) {
      normalized[param] = result.parsed;
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      error: createErrorEnvelope({
        type: ERROR_TYPES.VALIDATION_ERROR,
        message: `Validation failed for ${errors.length} parameter(s)`,
        details: { errors },
        guidance: 'Fix the validation errors listed above'
      })
    };
  }

  return { valid: true, normalized };
}
