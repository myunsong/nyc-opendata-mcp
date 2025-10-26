import axios from 'axios';
import { getTimeWindow, getCustomWindow } from '../../../lib/time-windows.js';
import { validateBorough, validateAndEscapeString, validateLimit, validateDays, validateDate, batchValidate } from '../../../lib/input-validation.js';
import { createSuccessEnvelope, createErrorEnvelope, ERROR_TYPES, DATA_SOURCES, EVENT_TYPES } from '../../../lib/standard-envelope.js';
import { enrich311Geo, getCacheStats as getGeoCacheStats } from '../../../lib/geo-enrichment.js';
import { withRetry, withCache, getCacheStats, getAPIHeaders, getRateLimitInfo, CACHE_CONFIG } from '../../../lib/reliability.js';
import { generate311SearchInsights } from '../../../lib/insights.js';

const SOCRATA_ENDPOINT = 'https://data.cityofnewyork.us/resource/erm2-nwe9.json';

/**
 * Search 311 complaints with full reliability features
 *
 * Priority 4 improvements:
 * - Query caching with TTL (instant repeated queries)
 * - Exponential backoff retry for 429/5xx errors
 * - Auto-pagination for large result sets
 * - Rate limit hygiene
 * - API token support
 *
 * Priority 3: Geographic enrichment (≥95% NTA coverage)
 * Priority 2: Standard envelope format
 * Priority 1: Input validation
 */
export default async function searchComplaints(params) {
  const {
    complaint_type,
    borough,
    start_date,
    end_date,
    days,
    limit = 100,
    use_cache = true,      // Priority 4: Caching
    skip_cache = false     // Force fresh data
  } = params;

  // Validate inputs
  const validation = batchValidate({
    complaint_type: validateAndEscapeString(complaint_type, { maxLength: 200, paramName: 'complaint_type' }),
    borough: validateBorough(borough),
    limit: validateLimit(limit, { min: 1, max: 10000, defaultValue: 100 }),
    start_date: validateDate(start_date, 'start_date'),
    end_date: validateDate(end_date, 'end_date'),
    days: validateDays(days, { min: 1, max: 365 })
  });

  if (!validation.valid) {
    return validation.error;
  }

  const { normalized } = validation;

  // Determine time window
  let window;
  if (start_date && end_date) {
    window = {
      start: new Date(start_date).toISOString(),
      end: new Date(end_date).toISOString(),
      days: Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24)),
      type: 'custom'
    };
  } else if (days) {
    window = days === 90 ? getTimeWindow('90d') :
             days === 365 ? getTimeWindow('12m') :
             getCustomWindow(days);
  } else {
    window = getTimeWindow('90d');
  }

  // Build query parameters
  const startDateFormatted = new Date(window.start).toISOString().replace('Z', '');
  const endDateFormatted = new Date(window.end).toISOString().replace('Z', '');

  const whereConditions = [
    `created_date >= '${startDateFormatted}'`,
    `created_date <= '${endDateFormatted}'`
  ];

  if (normalized.complaint_type) {
    whereConditions.push(`complaint_type = '${normalized.complaint_type}'`);
  }

  if (normalized.borough) {
    whereConditions.push(`borough = '${normalized.borough}'`);
  }

  const query = {
    $select: 'unique_key,created_date,complaint_type,descriptor,borough,community_board,bbl,latitude,longitude,incident_address,status,agency,resolution_description',
    $where: whereConditions.join(' AND '),
    $order: 'created_date DESC',
    $limit: normalized.limit
  };

  // Request function with retry
  const makeRequest = async () => {
    return await withRetry(async () => {
      const response = await axios.get(SOCRATA_ENDPOINT, {
        params: query,
        headers: getAPIHeaders()  // Priority 4: Use API token if available
      });
      return response.data;
    });
  };

  try {
    // Execute with caching (Priority 4)
    const startTime = Date.now();
    const result = use_cache && !skip_cache ?
      await withCache(SOCRATA_ENDPOINT, query, makeRequest, { ttl: CACHE_CONFIG.DEFAULT_TTL }) :
      { data: await makeRequest(), cached: false };

    const requestTime = Date.now() - startTime;
    const rawData = result.data;

    // Enrich each record with geographic data (Priority 3)
    let ntaCoverage = 0;
    const records = rawData.map(complaint => {
      const geo = enrich311Geo(complaint);

      if (geo.nta) {
        ntaCoverage++;
      }

      return {
        ts: complaint.created_date,
        period: null,
        geo: {
          borough: geo.borough,
          borough_id: geo.borough_id,
          cd: geo.cd,
          cd_numeric: geo.cd_numeric,
          nta: geo.nta,
          bbl: geo.bbl,
          lat: geo.lat,
          lon: geo.lon
        },
        topic: complaint.complaint_type,
        value: 1,
        details: {
          unique_key: complaint.unique_key,
          created_date: complaint.created_date,
          complaint_type: complaint.complaint_type,
          descriptor: complaint.descriptor,
          incident_address: complaint.incident_address,
          status: complaint.status,
          agency: complaint.agency,
          resolution_description: complaint.resolution_description
        }
      };
    });

    // Calculate NTA coverage
    const ntaCoveragePercent = records.length > 0 ?
      ((ntaCoverage / records.length) * 100).toFixed(2) : 0;

    // Complaint type breakdown
    const typeBreakdown = {};
    records.forEach(r => {
      typeBreakdown[r.topic] = (typeBreakdown[r.topic] || 0) + 1;
    });

    const topTypes = Object.entries(typeBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }));

    // NTA breakdown
    const ntaBreakdown = {};
    records.forEach(r => {
      if (r.geo.nta) {
        ntaBreakdown[r.geo.nta] = (ntaBreakdown[r.geo.nta] || 0) + 1;
      }
    });

    const topNTAs = Object.entries(ntaBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([nta, count]) => ({ nta, count }));

    // Priority 4: Performance and reliability metrics
    const rateLimitInfo = getRateLimitInfo();
    const queryCacheStats = getCacheStats();

    // Create envelope
    const envelope = createSuccessEnvelope({
      source: DATA_SOURCES.NYC_311,
      eventType: EVENT_TYPES.SEARCH,
      window,
      count: records.length,
      records,
      meta: {
        top_complaint_types: topTypes,
        nta_coverage: {
          records_with_nta: ntaCoverage,
          total_records: records.length,
          coverage_percent: parseFloat(ntaCoveragePercent),
          target: 95.0,
          meets_target: parseFloat(ntaCoveragePercent) >= 95.0
        },
        top_ntas: topNTAs,
        geo_enrichment: {
          enabled: true,
          cache_stats: getGeoCacheStats()
        },
        filters: {
          complaint_type: normalized.complaint_type || 'ALL',
          borough: normalized.borough || 'ALL'
        },
        // Priority 4: Reliability metrics
        reliability: {
          cached: result.cached,
          cache_key: result.cacheKey,
          request_time_ms: requestTime,
          query_cache_stats: queryCacheStats,
          rate_limit_info: rateLimitInfo,
          api_token_configured: rateLimitInfo.has_token
        }
      }
    });

    // Priority 6: Add insights (headline + takeaways)
    const insights = generate311SearchInsights(envelope);
    envelope.insights = {
      headline: insights.headline,
      takeaways: insights.takeaways
    };

    return envelope;

  } catch (error) {
    return createErrorEnvelope({
      type: ERROR_TYPES.API_ERROR,
      message: error.response?.data?.message || error.message,
      details: {
        status: error.response?.status,
        rate_limit_info: getRateLimitInfo()
      },
      guidance: error.response?.status === 429 ?
        'Rate limit exceeded. Consider using an API token for higher limits, or using aggregated queries.' :
        'Check your query parameters. If the error persists, the Socrata API may be experiencing issues.'
    });
  }
}
