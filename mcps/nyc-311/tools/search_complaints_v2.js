import axios from 'axios';
import { getTimeWindow, getCustomWindow } from '../../../lib/time-windows.js';
import { validateBorough, validateAndEscapeString, validateLimit, validateDays, validateDate, batchValidate } from '../../../lib/input-validation.js';
import { createSuccessEnvelope, createErrorEnvelope, ERROR_TYPES, DATA_SOURCES, EVENT_TYPES } from '../../../lib/standard-envelope.js';
import { enrich311Geo, getCacheStats } from '../../../lib/geo-enrichment.js';

const SOCRATA_ENDPOINT = 'https://data.cityofnewyork.us/resource/erm2-nwe9.json';

/**
 * Search 311 complaints with geographic enrichment
 *
 * Priority 3 improvements:
 * - Enriches every record with NTA, CD, borough data
 * - In-memory caching for performance
 * - Standard envelope format
 * - Full validation
 * - Target: ≥95% NTA coverage
 */
export default async function searchComplaints(params) {
  const {
    complaint_type,
    borough,
    start_date,
    end_date,
    days,
    limit = 100
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
    // Custom date range
    window = {
      start: new Date(start_date).toISOString(),
      end: new Date(end_date).toISOString(),
      days: Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24)),
      type: 'custom'
    };
  } else if (days) {
    // Days-based window
    window = days === 90 ? getTimeWindow('90d') :
             days === 365 ? getTimeWindow('12m') :
             getCustomWindow(days);
  } else {
    // Default to 90 days
    window = getTimeWindow('90d');
  }

  try {
    // Build SoQL query with window
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

    // Select fields including geo fields for enrichment
    const query = {
      $select: 'unique_key,created_date,complaint_type,descriptor,borough,community_board,bbl,latitude,longitude,incident_address,status,agency,resolution_description',
      $where: whereConditions.join(' AND '),
      $order: 'created_date DESC',
      $limit: normalized.limit
    };

    const headers = {};
    if (process.env.SOCRATA_APP_TOKEN || process.env.NYC_OPEN_DATA_APP_TOKEN) {
      headers['X-App-Token'] = process.env.SOCRATA_APP_TOKEN || process.env.NYC_OPEN_DATA_APP_TOKEN;
    }

    const response = await axios.get(SOCRATA_ENDPOINT, {
      params: query,
      headers
    });

    // Enrich each record with geographic data
    let ntaCoverage = 0;
    const records = response.data.map(complaint => {
      // Perform geo enrichment
      const geo = enrich311Geo(complaint);

      // Count NTA coverage
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
        value: 1,  // Each complaint counts as 1
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

    // Calculate NTA coverage percentage
    const ntaCoveragePercent = records.length > 0 ?
      ((ntaCoverage / records.length) * 100).toFixed(2) : 0;

    // Get complaint type breakdown
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

    return createSuccessEnvelope({
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
          cache_stats: getCacheStats()
        },
        filters: {
          complaint_type: normalized.complaint_type || 'ALL',
          borough: normalized.borough || 'ALL'
        }
      }
    });

  } catch (error) {
    return createErrorEnvelope({
      type: ERROR_TYPES.API_ERROR,
      message: error.response?.data?.message || error.message,
      details: { status: error.response?.status },
      guidance: 'Check your query parameters. If the error persists, the Socrata API may be experiencing issues.'
    });
  }
}
