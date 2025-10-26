/**
 * Insights generator for NYC MCP
 *
 * Priority 6: Headlines + takeaways in every response
 * - Generate plain-English headlines from data
 * - Extract 2-3 concise takeaway bullets
 * - Make meaning immediately visible
 */

/**
 * Generate headline and takeaways for 311 search results
 * @param {Object} data - Processed result data
 * @returns {Object} { headline, takeaways[] }
 */
export function generate311SearchInsights(data) {
  const { count, window, meta } = data;
  const borough = meta.filters?.borough || 'NYC';
  const days = window?.days || 0;
  const topType = meta.top_complaint_types?.[0];

  // Generate headline
  let headline = `Found ${count.toLocaleString()} complaints in ${borough}`;
  if (days > 0) {
    headline += ` over ${days} days`;
  }
  if (topType) {
    headline += ` — "${topType.type}" leads with ${topType.count} reports`;
  }

  // Generate takeaways
  const takeaways = [];

  // Takeaway 1: Volume and trend
  if (count > 0) {
    const perDay = days > 0 ? (count / days).toFixed(1) : count;
    takeaways.push(`${perDay} complaints per day on average`);
  }

  // Takeaway 2: Top issue
  if (topType) {
    const pct = ((topType.count / count) * 100).toFixed(0);
    takeaways.push(`${pct}% of complaints are "${topType.type}"`);
  }

  // Takeaway 3: Geographic coverage
  if (meta.nta_coverage) {
    const coverage = meta.nta_coverage.coverage_percent;
    const ntaCount = meta.top_ntas?.length || 0;
    if (coverage >= 95) {
      takeaways.push(`Geographic data available for ${coverage}% of records across ${ntaCount} neighborhoods`);
    } else {
      takeaways.push(`${coverage}% geographic coverage (${ntaCount} neighborhoods identified)`);
    }
  }

  return { headline, takeaways };
}

/**
 * Generate headline and takeaways for 311 trend analysis
 * @param {Object} data - Trend analysis result
 * @returns {Object} { headline, takeaways[] }
 */
export function generate311TrendsInsights(data) {
  const { count, window, meta } = data;
  const trend = meta.trend;
  const groupBy = meta.group_by || 'day';
  const borough = meta.borough || 'NYC';

  // Generate headline
  let headline = `${count.toLocaleString()} complaints in ${borough}`;
  if (trend) {
    const direction = trend.direction === 'increasing' ? '↑' : trend.direction === 'decreasing' ? '↓' : '→';
    headline += ` ${direction} ${trend.direction} by ${Math.abs(parseFloat(trend.percentage_change))}%`;
  }

  // Generate takeaways
  const takeaways = [];

  // Takeaway 1: Trend direction
  if (trend) {
    const recent = trend.recent_avg;
    const previous = trend.previous_avg;
    if (trend.direction === 'increasing') {
      takeaways.push(`Volume rising from ${previous} to ${recent} complaints per ${groupBy}`);
    } else if (trend.direction === 'decreasing') {
      takeaways.push(`Volume falling from ${previous} to ${recent} complaints per ${groupBy}`);
    } else {
      takeaways.push(`Stable at ~${recent} complaints per ${groupBy}`);
    }
  }

  // Takeaway 2: Top issue
  if (meta.top_types?.[0]) {
    const top = meta.top_types[0];
    const pct = ((top.count / count) * 100).toFixed(0);
    takeaways.push(`"${top.type}" accounts for ${pct}% (${top.count.toLocaleString()} complaints)`);
  }

  // Takeaway 3: Time coverage
  const periods = meta.periods_returned || 0;
  if (periods > 0) {
    takeaways.push(`${periods} ${groupBy} periods analyzed using server-side aggregation`);
  }

  return { headline, takeaways };
}

/**
 * Generate headline and takeaways for HPD violations
 * @param {Object} data - HPD violations result
 * @returns {Object} { headline, takeaways[] }
 */
export function generateHPDViolationsInsights(data) {
  const { count, meta } = data;
  const severityMix = meta.severity_mix || {};
  const hazardIndex = meta.hazard_index || 0;
  const hazardLevel = meta.hazard_interpretation || 'Unknown';

  // Generate headline
  const headline = `${count.toLocaleString()} housing violations — ${hazardLevel}`;

  // Generate takeaways
  const takeaways = [];

  // Takeaway 1: Severity breakdown
  const classC = severityMix.C?.percentage || 0;
  const classB = severityMix.B?.percentage || 0;
  const classA = severityMix.A?.percentage || 0;

  if (classC > 0 || classB > 0) {
    const serious = classC + classB;
    takeaways.push(`${serious.toFixed(0)}% are hazardous (Class B: ${classB.toFixed(0)}%, Class C: ${classC.toFixed(0)}%)`);
  }

  // Takeaway 2: Hazard index interpretation
  takeaways.push(`Hazard index: ${hazardIndex}/100 — ${hazardLevel.toLowerCase()}`);

  // Takeaway 3: Top borough
  if (meta.borough_breakdown?.[0]) {
    const top = meta.borough_breakdown[0];
    takeaways.push(`${top.borough_name} has ${top.percentage.toFixed(0)}% of violations (${top.count.toLocaleString()})`);
  }

  return { headline, takeaways };
}

/**
 * Generate headline and takeaways for DOT street closures
 * @param {Object} data - DOT closures result
 * @returns {Object} { headline, takeaways[] }
 */
export function generateDOTClosuresInsights(data) {
  const { count, meta } = data;
  const active = meta.active_closures || 0;
  const dedupeRate = meta.deduplication_rate || 0;

  // Generate headline
  const headline = `${active} active street closures (${count} total after de-duplication)`;

  // Generate takeaways
  const takeaways = [];

  // Takeaway 1: De-duplication impact
  if (dedupeRate > 0) {
    const removed = meta.duplicates_removed || 0;
    takeaways.push(`Removed ${removed} duplicates (${dedupeRate.toFixed(0)}% de-duplication rate)`);
  }

  // Takeaway 2: Top purpose
  if (meta.top_purposes?.[0]) {
    const top = meta.top_purposes[0];
    takeaways.push(`"${top.purpose}" is the leading reason (${top.count} closures)`);
  }

  // Takeaway 3: Geographic distribution
  if (meta.borough_breakdown?.length > 0) {
    const boroughCount = meta.borough_breakdown.length;
    const topBorough = meta.borough_breakdown[0];
    takeaways.push(`Affecting ${boroughCount} boroughs — ${topBorough.borough} has most (${topBorough.count})`);
  }

  return { headline, takeaways };
}

/**
 * Generate generic insights when specific generator not available
 * @param {Object} data - Generic result data
 * @param {string} dataType - Type of data (for headline)
 * @returns {Object} { headline, takeaways[] }
 */
export function generateGenericInsights(data, dataType = 'results') {
  const { count, success } = data;

  const headline = success ?
    `Found ${count?.toLocaleString() || 0} ${dataType}` :
    `Query failed`;

  const takeaways = [];

  if (success && count > 0) {
    takeaways.push(`${count} records returned`);

    // Try to extract any useful metadata
    if (data.meta) {
      const metaKeys = Object.keys(data.meta);
      if (metaKeys.length > 0) {
        takeaways.push(`Includes: ${metaKeys.slice(0, 3).join(', ')}`);
      }
    }
  } else if (!success) {
    takeaways.push('Check error details for resolution guidance');
  }

  return { headline, takeaways };
}

/**
 * Add insights to envelope
 * @param {Object} envelope - Standard envelope
 * @param {Function} insightsGenerator - Function to generate insights
 * @returns {Object} Envelope with insights added
 */
export function addInsights(envelope, insightsGenerator) {
  if (!envelope.success) {
    // For errors, create simple insights
    return {
      ...envelope,
      insights: {
        headline: `Error: ${envelope.error?.type || 'Unknown error'}`,
        takeaways: [
          envelope.error?.message || 'An error occurred',
          envelope.error?.guidance || 'Check query parameters and try again'
        ]
      }
    };
  }

  // Generate insights from data
  const insights = insightsGenerator(envelope);

  return {
    ...envelope,
    insights: {
      headline: insights.headline,
      takeaways: insights.takeaways
    }
  };
}

/**
 * Format insights for display
 * @param {Object} insights - Insights object { headline, takeaways }
 * @returns {string} Formatted string
 */
export function formatInsights(insights) {
  let output = `📊 ${insights.headline}\n\n`;

  if (insights.takeaways && insights.takeaways.length > 0) {
    output += 'Key Takeaways:\n';
    insights.takeaways.forEach((takeaway, i) => {
      output += `  ${i + 1}. ${takeaway}\n`;
    });
  }

  return output;
}
