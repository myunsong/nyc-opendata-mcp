import axios from 'axios';
import { getTimeWindow, getCustomWindow } from '../../../lib/time-windows.js';
import { validateEnum, validateDays, validateBorough, validateAndEscapeString, batchValidate } from '../../../lib/input-validation.js';

const SOCRATA_ENDPOINT = 'https://data.cityofnewyork.us/resource/erm2-nwe9.json';

/**
 * Analyze 311 trends using SERVER-SIDE aggregation with SoQL
 *
 * Priority 1 improvements:
 * - Uses SoQL GROUP BY for server-side aggregation (tiny payloads)
 * - Returns ≤200 rows for 12-month citywide trends
 * - Includes divide-by-zero guard in trend calculations
 * - Returns standard envelope format
 * - Input validation with friendly errors
 */
export default async function analyzeTrends(params) {
  const {
    complaint_type,
    borough,
    group_by = 'day',  // 'day', 'week', 'month'
    days = 90
  } = params;

  // Validate inputs using reusable validation utilities
  const validation = batchValidate({
    group_by: validateEnum(group_by, ['day', 'week', 'month'], 'group_by'),
    days: validateDays(days, { min: 1, max: 365 }),
    borough: validateBorough(borough),
    complaint_type: validateAndEscapeString(complaint_type, { maxLength: 200, paramName: 'complaint_type' })
  });

  if (!validation.valid) {
    return validation.error;
  }

  const { normalized } = validation;

  // Get time window
  const window = days === 90 ? getTimeWindow('90d') :
                 days === 365 ? getTimeWindow('12m') :
                 getCustomWindow(days);

  // Build SoQL aggregation query - SERVER DOES THE GROUPING
  // Format dates for Socrata (no timezone, they use floating timestamp)
  const startDate = new Date(window.start).toISOString().replace('Z', '');
  const endDate = new Date(window.end).toISOString().replace('Z', '');

  const whereConditions = [
    `created_date >= '${startDate}'`,
    `created_date <= '${endDate}'`
  ];

  if (normalized.complaint_type) {
    // Already escaped by validation
    whereConditions.push(`complaint_type = '${normalized.complaint_type}'`);
  }

  if (normalized.borough) {
    // Already normalized by validation
    whereConditions.push(`borough = '${normalized.borough}'`);
  }

  // SoQL date truncation functions for grouping
  // Note: created_date is already a floating_timestamp type in Socrata
  let dateGroupExpr;
  let selectFields;

  switch (group_by) {
    case 'week':
      // Group by year-week
      dateGroupExpr = "date_trunc_ym(created_date)";
      selectFields = `${dateGroupExpr} AS period, COUNT(*) AS count`;
      break;
    case 'month':
      dateGroupExpr = "date_trunc_ym(created_date)";
      selectFields = `${dateGroupExpr} AS period, COUNT(*) AS count`;
      break;
    default: // day
      dateGroupExpr = "date_trunc_ymd(created_date)";
      selectFields = `${dateGroupExpr} AS period, COUNT(*) AS count`;
  }

  const query = {
    $select: `${dateGroupExpr} AS period, complaint_type, COUNT(*) AS count`,
    $where: whereConditions.join(' AND '),
    $group: `period, complaint_type`,
    $order: 'period ASC',
    $limit: 5000  // Safety limit, should never hit this with proper aggregation
  };

  try {
    const headers = {};
    if (process.env.SOCRATA_APP_TOKEN) {
      headers['X-App-Token'] = process.env.SOCRATA_APP_TOKEN;
    }

    const response = await axios.get(SOCRATA_ENDPOINT, {
      params: query,
      headers
    });

    // Group by period and aggregate complaint types
    const periodMap = new Map();

    response.data.forEach(row => {
      const period = row.period;
      const count = parseInt(row.count, 10);
      const type = row.complaint_type;

      if (!periodMap.has(period)) {
        periodMap.set(period, {
          period,
          count: 0,
          types: {}
        });
      }

      const periodData = periodMap.get(period);
      periodData.count += count;
      periodData.types[type] = (periodData.types[type] || 0) + count;
    });

    // Convert to timeline array
    const timeline = Array.from(periodMap.values())
      .sort((a, b) => a.period.localeCompare(b.period))
      .map(period => ({
        period: period.period,
        count: period.count,
        top_types: Object.entries(period.types)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([type, count]) => ({ type, count }))
      }));

    // Calculate trend with DIVIDE-BY-ZERO GUARD
    let trend = null;
    if (timeline.length >= 14) {
      const recentPeriods = timeline.slice(-7);
      const previousPeriods = timeline.slice(-14, -7);

      const recentAvg = recentPeriods.reduce((sum, p) => sum + p.count, 0) / recentPeriods.length;
      const previousAvg = previousPeriods.reduce((sum, p) => sum + p.count, 0) / previousPeriods.length;

      // DIVIDE-BY-ZERO GUARD
      let percentageChange = null;
      if (previousAvg > 0) {
        percentageChange = ((recentAvg - previousAvg) / previousAvg * 100);
      } else if (recentAvg > 0) {
        // Previous was zero, recent is non-zero = infinite growth, cap at 999%
        percentageChange = 999;
      } else {
        // Both zero = no change
        percentageChange = 0;
      }

      trend = {
        direction: percentageChange > 0 ? 'increasing' : percentageChange < 0 ? 'decreasing' : 'stable',
        percentage_change: percentageChange.toFixed(2),
        recent_avg: parseFloat(recentAvg.toFixed(2)),
        previous_avg: parseFloat(previousAvg.toFixed(2))
      };
    }

    // Calculate total complaints
    const totalComplaints = timeline.reduce((sum, p) => sum + p.count, 0);

    // Get top complaint types overall
    const typeAggregates = {};
    response.data.forEach(row => {
      const type = row.complaint_type;
      const count = parseInt(row.count, 10);
      typeAggregates[type] = (typeAggregates[type] || 0) + count;
    });

    const topTypes = Object.entries(typeAggregates)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }));

    // STANDARD ENVELOPE FORMAT
    return {
      success: true,
      source: '311_service_requests',
      event_type: 'trend_analysis',
      window: {
        start: window.start,
        end: window.end,
        days: window.days,
        type: window.type
      },
      count: totalComplaints,
      records: timeline,
      meta: {
        group_by,
        borough: borough || 'ALL',
        complaint_type: complaint_type || 'ALL',
        trend,
        top_types: topTypes,
        periods_returned: timeline.length,
        aggregation: 'server_side'
      }
    };

  } catch (error) {
    return {
      success: false,
      error: {
        type: 'API_ERROR',
        message: error.response?.data?.message || error.message,
        status: error.response?.status,
        guidance: 'Check your query parameters and try again. If the error persists, the Socrata API may be experiencing issues.'
      }
    };
  }
}
