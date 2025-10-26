/**
 * Reliability primitives for NYC MCP
 *
 * Priority 4: Pagination, retries, caching
 * - Auto-pagination for non-aggregated queries
 * - Exponential backoff for 429/5xx errors
 * - Query signature caching with TTL
 * - Rate limit hygiene
 */

import crypto from 'crypto';

/**
 * Query cache with TTL
 * Key: query signature (hash of params)
 * Value: { data, timestamp, ttl }
 */
const queryCache = new Map();

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000,  // 5 minutes
  SHORT_TTL: 60 * 1000,         // 1 minute for volatile data
  LONG_TTL: 30 * 60 * 1000,     // 30 minutes for stable data
  MAX_SIZE: 1000                // Max cached queries
};

/**
 * Rate limit configuration
 */
export const RATE_LIMITS = {
  // Socrata API limits
  WITHOUT_TOKEN: {
    requests_per_day: 1000,
    burst_limit: 10  // Conservative estimate
  },
  WITH_TOKEN: {
    requests_per_day: 50000,
    burst_limit: 100
  },

  // Our hard caps to prevent hitting limits
  HARD_CAPS: {
    max_days: 365,
    max_limit: 10000,         // Max records per query
    max_aggregated_limit: 50000,  // Higher for server-side aggregation
    default_limit: 100,
    prefer_aggregation_over: 1000  // Suggest aggregation if expecting >1000 records
  }
};

/**
 * Retry configuration
 */
const RETRY_CONFIG = {
  max_attempts: 3,
  base_delay: 1000,      // 1 second
  max_delay: 30000,      // 30 seconds
  exponential_base: 2,
  jitter: 0.1            // 10% random jitter
};

/**
 * Request tracking for rate limiting
 */
let requestCount = 0;
let requestWindow = Date.now();
const REQUEST_WINDOW = 60 * 1000; // 1 minute window

/**
 * Generate cache key from query parameters
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Query parameters
 * @returns {string} Cache key
 */
export function getCacheKey(endpoint, params) {
  const sortedParams = JSON.stringify(params, Object.keys(params).sort());
  const hash = crypto.createHash('md5').update(`${endpoint}:${sortedParams}`).digest('hex');
  return hash;
}

/**
 * Get cached query result
 * @param {string} cacheKey - Cache key
 * @returns {Object|null} Cached data or null
 */
export function getCached(cacheKey) {
  const cached = queryCache.get(cacheKey);

  if (!cached) {
    return null;
  }

  // Check if expired
  const age = Date.now() - cached.timestamp;
  if (age > cached.ttl) {
    queryCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

/**
 * Cache query result
 * @param {string} cacheKey - Cache key
 * @param {Object} data - Data to cache
 * @param {number} ttl - Time to live in milliseconds
 */
export function setCache(cacheKey, data, ttl = CACHE_CONFIG.DEFAULT_TTL) {
  // Implement simple LRU: if cache is full, remove oldest entry
  if (queryCache.size >= CACHE_CONFIG.MAX_SIZE) {
    const firstKey = queryCache.keys().next().value;
    queryCache.delete(firstKey);
  }

  queryCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl
  });
}

/**
 * Clear the query cache
 */
export function clearCache() {
  queryCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;

  queryCache.forEach((value) => {
    const age = now - value.timestamp;
    if (age > value.ttl) {
      expiredEntries++;
    } else {
      validEntries++;
    }
  });

  return {
    total: queryCache.size,
    valid: validEntries,
    expired: expiredEntries,
    max_size: CACHE_CONFIG.MAX_SIZE
  };
}

/**
 * Execute request with exponential backoff retry
 * @param {Function} requestFn - Async function that makes the request
 * @param {Object} options - Retry options
 * @returns {Promise} Request result
 */
export async function withRetry(requestFn, options = {}) {
  const {
    maxAttempts = RETRY_CONFIG.max_attempts,
    baseDelay = RETRY_CONFIG.base_delay,
    maxDelay = RETRY_CONFIG.max_delay,
    exponentialBase = RETRY_CONFIG.exponential_base,
    jitter = RETRY_CONFIG.jitter
  } = options;

  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Track request rate
      trackRequest();

      // Execute request
      const result = await requestFn();
      return result;

    } catch (error) {
      lastError = error;
      const status = error.response?.status;

      // Don't retry on 4xx errors (except 429)
      if (status && status >= 400 && status < 500 && status !== 429) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxAttempts - 1) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const exponentialDelay = Math.min(
        baseDelay * Math.pow(exponentialBase, attempt),
        maxDelay
      );

      // Add random jitter
      const jitterAmount = exponentialDelay * jitter * (Math.random() - 0.5) * 2;
      const delay = exponentialDelay + jitterAmount;

      // Log retry attempt
      console.warn(`Request failed (attempt ${attempt + 1}/${maxAttempts}), retrying in ${Math.round(delay)}ms...`, {
        status,
        message: error.message
      });

      // Wait before retry
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Execute request with caching
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Query parameters
 * @param {Function} requestFn - Async function that makes the request
 * @param {Object} options - Caching options
 * @returns {Promise} Request result with cache metadata
 */
export async function withCache(endpoint, params, requestFn, options = {}) {
  const {
    ttl = CACHE_CONFIG.DEFAULT_TTL,
    skipCache = false
  } = options;

  const cacheKey = getCacheKey(endpoint, params);

  // Check cache first
  if (!skipCache) {
    const cached = getCached(cacheKey);
    if (cached) {
      return {
        data: cached,
        cached: true,
        cacheKey
      };
    }
  }

  // Execute request
  const data = await requestFn();

  // Cache result
  setCache(cacheKey, data, ttl);

  return {
    data,
    cached: false,
    cacheKey
  };
}

/**
 * Auto-paginate Socrata query
 * @param {Function} requestFn - Function that makes request with offset
 * @param {Object} options - Pagination options
 * @returns {Promise<Array>} All records
 */
export async function autoPaginate(requestFn, options = {}) {
  const {
    maxRecords = RATE_LIMITS.HARD_CAPS.max_limit,
    pageSize = 1000,
    maxPages = 10  // Safety limit
  } = options;

  const allRecords = [];
  let offset = 0;
  let page = 0;

  while (page < maxPages && allRecords.length < maxRecords) {
    // Request with offset
    const records = await requestFn(offset, pageSize);

    // No more records
    if (!records || records.length === 0) {
      break;
    }

    allRecords.push(...records);
    offset += pageSize;
    page++;

    // Reached max records
    if (allRecords.length >= maxRecords) {
      break;
    }

    // Last page was partial (no more records)
    if (records.length < pageSize) {
      break;
    }
  }

  return allRecords.slice(0, maxRecords);
}

/**
 * Track request for rate limiting
 */
function trackRequest() {
  const now = Date.now();

  // Reset counter if window expired
  if (now - requestWindow > REQUEST_WINDOW) {
    requestCount = 0;
    requestWindow = now;
  }

  requestCount++;
}

/**
 * Get current request rate
 * @returns {Object} Request rate stats
 */
export function getRequestRate() {
  const now = Date.now();
  const windowAge = now - requestWindow;

  return {
    count: requestCount,
    window_ms: windowAge,
    requests_per_minute: windowAge > 0 ? (requestCount / windowAge) * 60000 : 0
  };
}

/**
 * Check if we should use aggregation instead of raw query
 * @param {number} estimatedRecords - Estimated number of records
 * @returns {boolean} Whether to suggest aggregation
 */
export function shouldUseAggregation(estimatedRecords) {
  return estimatedRecords > RATE_LIMITS.HARD_CAPS.prefer_aggregation_over;
}

/**
 * Validate query parameters against hard caps
 * @param {Object} params - Query parameters
 * @returns {Object} { valid: boolean, errors?: Array }
 */
export function validateRateLimits(params) {
  const errors = [];

  if (params.days && params.days > RATE_LIMITS.HARD_CAPS.max_days) {
    errors.push({
      param: 'days',
      value: params.days,
      max: RATE_LIMITS.HARD_CAPS.max_days,
      message: `Days parameter exceeds maximum of ${RATE_LIMITS.HARD_CAPS.max_days}`
    });
  }

  if (params.limit && params.limit > RATE_LIMITS.HARD_CAPS.max_limit) {
    errors.push({
      param: 'limit',
      value: params.limit,
      max: RATE_LIMITS.HARD_CAPS.max_limit,
      message: `Limit parameter exceeds maximum of ${RATE_LIMITS.HARD_CAPS.max_limit}`
    });
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get API token from environment
 * @returns {string|null} API token or null
 */
export function getAPIToken() {
  return process.env.SOCRATA_APP_TOKEN ||
         process.env.NYC_OPEN_DATA_APP_TOKEN ||
         process.env.NYC_APP_TOKEN ||
         null;
}

/**
 * Check if API token is configured
 * @returns {boolean} Whether token is available
 */
export function hasAPIToken() {
  return getAPIToken() !== null;
}

/**
 * Get current rate limit tier info
 * @returns {Object} Rate limit information
 */
export function getRateLimitInfo() {
  const hasToken = hasAPIToken();
  const limits = hasToken ? RATE_LIMITS.WITH_TOKEN : RATE_LIMITS.WITHOUT_TOKEN;

  return {
    has_token: hasToken,
    requests_per_day: limits.requests_per_day,
    burst_limit: limits.burst_limit,
    recommendation: hasToken ?
      'You have an API token configured. Higher rate limits are available.' :
      'No API token detected. Get a free token at https://data.cityofnewyork.us/profile/app_tokens for 50x higher rate limits.'
  };
}

/**
 * Build headers with API token if available
 * @returns {Object} Headers object
 */
export function getAPIHeaders() {
  const headers = {};
  const token = getAPIToken();

  if (token) {
    headers['X-App-Token'] = token;
  }

  return headers;
}

/**
 * Comprehensive request wrapper with all reliability features
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Query parameters
 * @param {Function} requestFn - Request function
 * @param {Object} options - Options
 * @returns {Promise} Result with metadata
 */
export async function reliableRequest(endpoint, params, requestFn, options = {}) {
  const {
    useCache = true,
    cacheTTL = CACHE_CONFIG.DEFAULT_TTL,
    useRetry = true,
    usePagination = false,
    maxRecords = RATE_LIMITS.HARD_CAPS.max_limit
  } = options;

  // Wrapper that combines retry + pagination
  const executeRequest = async () => {
    if (usePagination) {
      return await autoPaginate(requestFn, { maxRecords });
    } else if (useRetry) {
      return await withRetry(requestFn);
    } else {
      return await requestFn();
    }
  };

  // Add caching if requested
  if (useCache) {
    return await withCache(endpoint, params, executeRequest, { ttl: cacheTTL });
  } else {
    const data = await executeRequest();
    return { data, cached: false };
  }
}

/**
 * Export cache config for reference
 */
export { CACHE_CONFIG };
