import axios from 'axios';
import { getTimeWindow } from '../../../lib/time-windows.js';
import { validateBorough, validateAndEscapeString, validateLimit, batchValidate } from '../../../lib/input-validation.js';
import { createSuccessEnvelope, createErrorEnvelope, ERROR_TYPES, DATA_SOURCES, EVENT_TYPES } from '../../../lib/standard-envelope.js';
import { enrichDOTGeo } from '../../../lib/geo-enrichment.js';

const SOCRATA_ENDPOINT = 'https://data.cityofnewyork.us/resource/i6b5-j7bu.json';

/**
 * Search DOT Street Closures with de-duplication
 *
 * Priority 2 improvements:
 * - De-duplicates by (segment_id, start_date, end_date)
 * - Merges multiple purposes for same segment
 * - Attaches borough/CD when available
 * - Standard envelope format
 * - Stable counts under repeats
 */
export default async function searchStreetClosures(params) {
  const {
    borough,
    work_type,
    limit = 1000,  // Higher limit for de-duplication
    active_only = true  // Only show currently active closures
  } = params;

  // Validate inputs
  const validation = batchValidate({
    borough: validateBorough(borough),
    work_type: validateAndEscapeString(work_type, { maxLength: 100, paramName: 'work_type' }),
    limit: validateLimit(limit, { min: 1, max: 5000, defaultValue: 1000 })
  });

  if (!validation.valid) {
    return validation.error;
  }

  const { normalized } = validation;

  try {
    const whereConditions = [];

    if (normalized.borough) {
      // Map borough names to codes (DOT uses M/X/B/Q/S)
      const boroughCode = normalized.borough === 'MANHATTAN' ? 'M' :
                          normalized.borough === 'BRONX' ? 'X' :
                          normalized.borough === 'BROOKLYN' ? 'B' :
                          normalized.borough === 'QUEENS' ? 'Q' :
                          normalized.borough === 'STATEN ISLAND' ? 'S' : normalized.borough;
      whereConditions.push(`borough_code = '${boroughCode}'`);
    }

    if (normalized.work_type) {
      whereConditions.push(`purpose LIKE '%${normalized.work_type}%'`);
    }

    if (active_only) {
      const today = new Date().toISOString().split('T')[0];
      whereConditions.push(`work_start_date <= '${today}T23:59:59.999'`);
      whereConditions.push(`work_end_date >= '${today}T00:00:00.000'`);
    }

    const query = {
      $limit: normalized.limit
    };

    if (whereConditions.length > 0) {
      query.$where = whereConditions.join(' AND ');
    }

    const headers = {};
    if (process.env.SOCRATA_APP_TOKEN || process.env.NYC_OPEN_DATA_APP_TOKEN) {
      headers['X-App-Token'] = process.env.SOCRATA_APP_TOKEN || process.env.NYC_OPEN_DATA_APP_TOKEN;
    }

    const response = await axios.get(SOCRATA_ENDPOINT, {
      params: query,
      headers
    });

    // DE-DUPLICATE by (segmentid, work_start_date, work_end_date)
    const closureMap = new Map();

    response.data.forEach(closure => {
      // Create unique key for this closure
      const key = `${closure.segmentid}|${closure.work_start_date}|${closure.work_end_date}`;

      if (closureMap.has(key)) {
        // Merge purposes for duplicate segments
        const existing = closureMap.get(key);
        if (closure.purpose && !existing.purposes.includes(closure.purpose)) {
          existing.purposes.push(closure.purpose);
          existing.purpose_merged = existing.purposes.join('; ');
        }
      } else {
        // New closure
        closureMap.set(key, {
          segment_id: closure.segmentid,
          work_start_date: closure.work_start_date,
          work_end_date: closure.work_end_date,
          on_street: closure.onstreetname,
          from_street: closure.fromstreetname,
          to_street: closure.tostreetname,
          borough_code: closure.borough_code,
          borough: mapBoroughCode(closure.borough_code),
          purposes: closure.purpose ? [closure.purpose] : [],
          purpose_merged: closure.purpose || 'Unknown',
          cd: null,  // Will be added in Priority 3 (geo enrichment)
          geometry: closure.the_geom,
          unique_id: closure.uniqueid
        });
      }
    });

    // Convert to array and calculate active status
    const today = new Date();
    const dedupedClosures = Array.from(closureMap.values()).map(closure => {
      const startDate = new Date(closure.work_start_date);
      const endDate = new Date(closure.work_end_date);
      const isActive = today >= startDate && today <= endDate;
      const daysRemaining = isActive ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) : 0;

      return {
        ...closure,
        is_active: isActive,
        days_remaining: daysRemaining,
        duration_days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
      };
    });

    // Sort by end date (soonest first)
    dedupedClosures.sort((a, b) =>
      new Date(a.work_end_date) - new Date(b.work_end_date)
    );

    // Create standard records with geo enrichment
    const records = dedupedClosures.map(closure => {
      // Enrich geo data
      const geo = enrichDOTGeo({
        borough_code: closure.borough_code,
        the_geom: closure.geometry
      });

      return {
        ts: closure.work_start_date,
        period: null,
        geo: {
          borough: geo.borough,
          borough_id: geo.borough_id,
          cd: geo.cd,
          nta: geo.nta,
          bbl: geo.bbl,
          lat: geo.lat,
          lon: geo.lon
        },
        topic: `Street closure: ${closure.on_street}`,
        value: closure.duration_days,
        details: {
          segment_id: closure.segment_id,
          on_street: closure.on_street,
          from_street: closure.from_street,
          to_street: closure.to_street,
          purposes: closure.purposes,
          purpose_merged: closure.purpose_merged,
          work_start_date: closure.work_start_date,
          work_end_date: closure.work_end_date,
          is_active: closure.is_active,
          days_remaining: closure.days_remaining,
          duration_days: closure.duration_days
        }
      };
    });

    // Calculate summary stats
    const totalClosures = dedupedClosures.length;
    const activeClosures = dedupedClosures.filter(c => c.is_active).length;
    const rawCount = response.data.length;
    const duplicatesRemoved = rawCount - totalClosures;
    const dedupeRate = rawCount > 0 ? ((duplicatesRemoved / rawCount) * 100).toFixed(2) : 0;

    // Borough breakdown
    const boroughCounts = {};
    dedupedClosures.forEach(c => {
      boroughCounts[c.borough] = (boroughCounts[c.borough] || 0) + 1;
    });

    // Purpose breakdown (count unique purposes across all closures)
    const purposeCounts = {};
    dedupedClosures.forEach(c => {
      c.purposes.forEach(p => {
        purposeCounts[p] = (purposeCounts[p] || 0) + 1;
      });
    });

    const topPurposes = Object.entries(purposeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([purpose, count]) => ({ purpose, count }));

    // Create time window for metadata (using min/max dates from results)
    const dates = dedupedClosures.map(c => new Date(c.work_start_date));
    const window = {
      start: dates.length > 0 ? new Date(Math.min(...dates)).toISOString() : new Date().toISOString(),
      end: dates.length > 0 ? new Date(Math.max(...dedupedClosures.map(c => new Date(c.work_end_date)))).toISOString() : new Date().toISOString(),
      days: null,
      type: 'custom'
    };

    return createSuccessEnvelope({
      source: DATA_SOURCES.DOT_CLOSURES,
      eventType: EVENT_TYPES.SEARCH,
      window,
      count: totalClosures,
      records,
      meta: {
        total_closures: totalClosures,
        active_closures: activeClosures,
        inactive_closures: totalClosures - activeClosures,
        raw_api_count: rawCount,
        duplicates_removed: duplicatesRemoved,
        deduplication_rate: parseFloat(dedupeRate),
        deduplication_key: 'segment_id + start_date + end_date',
        borough_breakdown: Object.entries(boroughCounts).map(([borough, count]) => ({ borough, count })),
        top_purposes: topPurposes,
        active_only_filter: active_only,
        work_type_filter: normalized.work_type || 'ALL'
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

/**
 * Map borough code to full name
 */
function mapBoroughCode(code) {
  const mapping = {
    'M': 'MANHATTAN',
    'X': 'BRONX',
    'B': 'BROOKLYN',
    'Q': 'QUEENS',
    'S': 'STATEN ISLAND'
  };
  return mapping[code] || code;
}
