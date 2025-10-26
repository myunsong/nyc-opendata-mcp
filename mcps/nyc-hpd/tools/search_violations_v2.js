import axios from 'axios';
import { getTimeWindow, getCustomWindow } from '../../../lib/time-windows.js';
import { validateBorough, validateAndEscapeString, validateLimit, batchValidate, validateDays } from '../../../lib/input-validation.js';
import { createSuccessEnvelope, createErrorEnvelope, ERROR_TYPES, DATA_SOURCES, EVENT_TYPES } from '../../../lib/standard-envelope.js';
import { enrichHPDGeo } from '../../../lib/geo-enrichment.js';

const SOCRATA_ENDPOINT = 'https://data.cityofnewyork.us/resource/wvxf-dwi5.json';

/**
 * Search HPD Housing Violations with server-side aggregation
 *
 * Priority 2 improvements:
 * - Uses public HPD violations dataset (no 403 errors)
 * - Server-side aggregation by violation class (A/B/C)
 * - Computes severity mix percentages
 * - Returns counts by borough/community district
 * - Standard envelope format
 * - 12-month default window
 */
export default async function searchViolations(params) {
  const {
    borough,
    status,
    days = 365,  // Default to 12-month window
    limit = 100,
    aggregated = true  // Toggle server-side aggregation
  } = params;

  // Validate inputs
  const validation = batchValidate({
    borough: validateBorough(borough),
    status: validateAndEscapeString(status, { maxLength: 50, paramName: 'status' }),
    days: validateDays(days, { min: 1, max: 365 }),
    limit: validateLimit(limit, { min: 1, max: 10000, defaultValue: 100 })
  });

  if (!validation.valid) {
    return validation.error;
  }

  const { normalized } = validation;

  // Get time window (default to 12-month for housing data)
  const window = days === 365 ? getTimeWindow('12m') :
                 days === 90 ? getTimeWindow('90d') :
                 getCustomWindow(days);

  try {
    if (aggregated) {
      return await getAggregatedViolations({ normalized, window, status });
    } else {
      return await getRawViolations({ normalized, window, limit: normalized.limit, status });
    }
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
 * Get aggregated violations with severity mix
 */
async function getAggregatedViolations({ normalized, window, status }) {
  // Format dates for Socrata
  const startDate = new Date(window.start).toISOString().replace('Z', '');
  const endDate = new Date(window.end).toISOString().replace('Z', '');

  const whereConditions = [
    `inspectiondate >= '${startDate}'`,
    `inspectiondate <= '${endDate}'`
  ];

  if (normalized.borough) {
    whereConditions.push(`boroid = '${normalized.borough === 'MANHATTAN' ? '1' :
                                      normalized.borough === 'BRONX' ? '2' :
                                      normalized.borough === 'BROOKLYN' ? '3' :
                                      normalized.borough === 'QUEENS' ? '4' :
                                      normalized.borough === 'STATEN ISLAND' ? '5' : normalized.borough}'`);
  }

  if (normalized.status) {
    whereConditions.push(`violationstatus = '${normalized.status}'`);
  }

  // Query 1: Get counts by violation class (A/B/C severity)
  const classQuery = {
    $select: 'class, COUNT(*) AS count',
    $where: whereConditions.join(' AND '),
    $group: 'class',
    $order: 'count DESC',
    $limit: 10
  };

  // Query 2: Get counts by borough
  const boroughQuery = {
    $select: 'boroid, boro, COUNT(*) AS count',
    $where: whereConditions.join(' AND '),
    $group: 'boroid, boro',
    $order: 'count DESC',
    $limit: 10
  };

  const headers = {};
  if (process.env.SOCRATA_APP_TOKEN || process.env.NYC_OPEN_DATA_APP_TOKEN) {
    headers['X-App-Token'] = process.env.SOCRATA_APP_TOKEN || process.env.NYC_OPEN_DATA_APP_TOKEN;
  }

  // Execute both queries in parallel
  const [classResponse, boroughResponse] = await Promise.all([
    axios.get(SOCRATA_ENDPOINT, { params: classQuery, headers }),
    axios.get(SOCRATA_ENDPOINT, { params: boroughQuery, headers })
  ]);

  // Calculate severity mix
  const totalViolations = classResponse.data.reduce((sum, row) => sum + parseInt(row.count, 10), 0);

  const severityMix = {};
  const classBreakdown = [];

  classResponse.data.forEach(row => {
    const count = parseInt(row.count, 10);
    const percentage = totalViolations > 0 ? (count / totalViolations * 100).toFixed(2) : 0;

    severityMix[row.class] = {
      count,
      percentage: parseFloat(percentage),
      severity: row.class === 'A' ? 'Non-hazardous' :
                row.class === 'B' ? 'Hazardous' :
                row.class === 'C' ? 'Immediately hazardous' :
                'Other'
    };

    classBreakdown.push({
      class: row.class,
      severity: severityMix[row.class].severity,
      count,
      percentage: parseFloat(percentage)
    });
  });

  // Calculate hazard index (weighted severity: C=3, B=2, A=1, I=0)
  const hazardScore = classResponse.data.reduce((score, row) => {
    const count = parseInt(row.count, 10);
    const weight = row.class === 'C' ? 3 : row.class === 'B' ? 2 : row.class === 'A' ? 1 : 0;
    return score + (count * weight);
  }, 0);

  const maxPossibleScore = totalViolations * 3; // All C violations
  const hazardIndex = maxPossibleScore > 0 ? (hazardScore / maxPossibleScore * 100).toFixed(2) : 0;

  // Borough breakdown
  const boroughBreakdown = boroughResponse.data.map(row => ({
    borough_id: row.boroid,
    borough_name: row.boro,
    count: parseInt(row.count, 10),
    percentage: totalViolations > 0 ? parseFloat((parseInt(row.count, 10) / totalViolations * 100).toFixed(2)) : 0
  }));

  // Build records array (one per class) with basic geo enrichment
  const BOROUGH_TO_ID = { 'MANHATTAN': '1', 'BRONX': '2', 'BROOKLYN': '3', 'QUEENS': '4', 'STATEN ISLAND': '5' };
  const records = classBreakdown.map(item => {
    // Create a mock record for geo enrichment
    const mockRecord = { boroid: normalized.borough ? BOROUGH_TO_ID[normalized.borough] : null };
    const geo = enrichHPDGeo(mockRecord);

    return {
      period: `${window.start.split('T')[0]} to ${window.end.split('T')[0]}`,
      geo: {
        borough: geo.borough || normalized.borough || 'ALL',
        borough_id: geo.borough_id,
        cd: null,  // HPD data lacks CD info without BBL→CD lookup
        nta: null,  // HPD data lacks NTA info without BBL→NTA lookup
        bbl: null
      },
      topic: `Class ${item.class} - ${item.severity}`,
      value: item.count,
      details: {
        class: item.class,
        severity: item.severity,
        percentage: item.percentage
      }
    };
  });

  return createSuccessEnvelope({
    source: DATA_SOURCES.HPD_VIOLATIONS,
    eventType: EVENT_TYPES.AGGREGATION,
    window,
    count: totalViolations,
    records,
    meta: {
      aggregation: 'server_side',
      severity_mix: severityMix,
      class_breakdown: classBreakdown,
      borough_breakdown: boroughBreakdown,
      hazard_index: parseFloat(hazardIndex),
      hazard_interpretation: parseFloat(hazardIndex) < 33 ? 'Low severity (mostly Class A)' :
                             parseFloat(hazardIndex) < 66 ? 'Moderate severity (mixed classes)' :
                             'High severity (many Class B/C violations)',
      status_filter: normalized.status || 'ALL',
      // NTA table will be added in Priority 3
      nta_table: null
    }
  });
}

/**
 * Get raw violations (non-aggregated)
 */
async function getRawViolations({ normalized, window, limit, status }) {
  const startDate = new Date(window.start).toISOString().replace('Z', '');
  const endDate = new Date(window.end).toISOString().replace('Z', '');

  const whereConditions = [
    `inspectiondate >= '${startDate}'`,
    `inspectiondate <= '${endDate}'`
  ];

  if (normalized.borough) {
    const boroughId = normalized.borough === 'MANHATTAN' ? '1' :
                      normalized.borough === 'BRONX' ? '2' :
                      normalized.borough === 'BROOKLYN' ? '3' :
                      normalized.borough === 'QUEENS' ? '4' :
                      normalized.borough === 'STATEN ISLAND' ? '5' : normalized.borough;
    whereConditions.push(`boroid = '${boroughId}'`);
  }

  if (normalized.status) {
    whereConditions.push(`violationstatus = '${normalized.status}'`);
  }

  const query = {
    $where: whereConditions.join(' AND '),
    $order: 'inspectiondate DESC',
    $limit: limit
  };

  const headers = {};
  if (process.env.SOCRATA_APP_TOKEN || process.env.NYC_OPEN_DATA_APP_TOKEN) {
    headers['X-App-Token'] = process.env.SOCRATA_APP_TOKEN || process.env.NYC_OPEN_DATA_APP_TOKEN;
  }

  const response = await axios.get(SOCRATA_ENDPOINT, {
    params: query,
    headers
  });

  const records = response.data.map(v => ({
    ts: v.inspectiondate,
    geo: {
      borough: v.boro,
      cd: null,  // Will be added in Priority 3
      nta: null,
      lat: null,
      lon: null
    },
    topic: `Class ${v.class} - ${v.novdescription?.substring(0, 100) || 'N/A'}`,
    value: 1,
    details: {
      violation_id: v.violationid,
      building_id: v.buildingid,
      bin: v.bin,
      class: v.class,
      address: `${v.housenumber} ${v.streetname}, ${v.boro}`,
      apartment: v.apartment,
      inspection_date: v.inspectiondate,
      status: v.violationstatus,
      description: v.novdescription,
      nov_issued_date: v.novissueddate
    }
  }));

  return createSuccessEnvelope({
    source: DATA_SOURCES.HPD_VIOLATIONS,
    eventType: EVENT_TYPES.SEARCH,
    window,
    count: response.data.length,
    records,
    meta: {
      aggregation: 'raw',
      limit,
      status_filter: normalized.status || 'ALL'
    }
  });
}
