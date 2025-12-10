# NYC MCP Tool Contracts

Complete reference for all 17 tools across 5 data sources.

---

## 📞 311 Service Requests (4 tools)

### `search_311_complaints`

**Purpose**: Search for individual 311 service requests

**Inputs**:
- `complaint_type` (optional): Specific complaint type (e.g., "Noise - Residential")
- `borough` (optional): MANHATTAN, BRONX, BROOKLYN, QUEENS, or STATEN ISLAND
- `days` (optional): Number of days to look back (1-365, default: 90)
- `start_date` (optional): Start date (YYYY-MM-DD format)
- `end_date` (optional): End date (YYYY-MM-DD format)
- `limit` (optional): Max records to return (1-10000, default: 100)
- `use_cache` (optional): Enable caching (default: true)

**Outputs** (Standard Envelope):
```javascript
{
  success: true,
  source: "311_service_requests",
  event_type: "search",
  window: { start, end, days, type },
  count: 100,
  records: [
    {
      ts: "2025-10-20T01:36:01.000",
      geo: {
        borough: "BROOKLYN",
        borough_id: "3",
        cd: "314",
        cd_numeric: "14",
        nta: "BK42",
        bbl: "3076747502",
        lat: 40.615,
        lon: -73.954
      },
      topic: "Noise - Residential",
      value: 1,
      details: { unique_key, status, agency, ... }
    }
  ],
  insights: {
    headline: "Found 100 complaints in BROOKLYN over 7 days — \"Noise - Residential\" leads with 26 reports",
    takeaways: [
      "14.3 complaints per day on average",
      "26% of complaints are \"Noise - Residential\"",
      "Geographic data available for 99% of records across 10 neighborhoods"
    ]
  },
  meta: {
    top_complaint_types: [...],
    nta_coverage: { coverage_percent: 99, meets_target: true },
    top_ntas: [...],
    reliability: { cached, request_time_ms, ... }
  }
}
```

**Example**:
```javascript
// Recent noise complaints in Brooklyn
const result = await mcp.callTool('search_311_complaints', {
  complaint_type: 'Noise - Residential',
  borough: 'brooklyn',
  days: 7,
  limit: 100
});
```

**Caveats**:
- NTA coverage: ~99% (some records missing community_board field)
- Caching: Repeated queries are instant (5-minute TTL)
- Rate limits: 10,000 max records per query

---

### `analyze_311_trends`

**Purpose**: Analyze 311 complaint trends over time with server-side aggregation

**Inputs**:
- `complaint_type` (optional): Filter by specific type
- `borough` (optional): Filter by borough
- `group_by` (optional): "day", "week", or "month" (default: "day")
- `days` (optional): Time window (1-365, default: 90)

**Outputs**:
```javascript
{
  success: true,
  source: "311_service_requests",
  event_type: "trend_analysis",
  window: { ... },
  count: 3499464,  // Total complaints
  records: [
    {
      period: "2025-10-14T00:00:00.000",
      count: 10739,
      top_types: [...]
    }
  ],
  insights: {
    headline: "3,499,464 complaints in NYC ↑ increasing by 5.23%",
    takeaways: [
      "Volume rising from 17324.12 to 18234.50 complaints per day",
      "\"Illegal Parking\" accounts for 16% (561,222 complaints)",
      "13 day periods analyzed using server-side aggregation"
    ]
  },
  meta: {
    trend: {
      direction: "increasing",
      percentage_change: "5.23",
      recent_avg: 18234.50,
      previous_avg: 17324.12
    },
    top_types: [...],
    periods_returned: 13,
    aggregation: "server_side"
  }
}
```

**Example**:
```javascript
// 12-month trends, grouped by month
const result = await mcp.callTool('analyze_311_trends', {
  group_by: 'month',
  days: 365
});
```

**Caveats**:
- Server-side aggregation: Returns ≤200 rows for 12-month citywide
- Divide-by-zero guard: Handles periods with zero complaints
- Best for: Time series, dashboards, trend detection

---

## 🏠 HPD Housing (4 tools)

### `search_hpd_violations`

**Purpose**: Search housing code violations with severity analysis

**Inputs**:
- `borough` (optional): Filter by borough
- `status` (optional): Violation status (e.g., "Open", "Close")
- `days` (optional): Time window (1-365, default: 365)
- `limit` (optional): Max records (1-10000, default: 100)
- `aggregated` (optional): Use server-side aggregation (default: true)

**Outputs**:
```javascript
{
  success: true,
  source: "hpd_violations",
  event_type: "aggregation",
  window: { ... },
  count: 909151,
  records: [...],  // By violation class
  insights: {
    headline: "909,151 housing violations — Moderate severity (mixed classes)",
    takeaways: [
      "70% are hazardous (Class B: 39%, Class C: 30%)",
      "Hazard index: 64.32/100 — moderate severity (mixed classes)",
      "BRONX has 36% of violations (326,791)"
    ]
  },
  meta: {
    severity_mix: {
      A: { count: 208975, percentage: 22.99, severity: "Non-hazardous" },
      B: { count: 358309, percentage: 39.41, severity: "Hazardous" },
      C: { count: 276229, percentage: 30.38, severity: "Immediately hazardous" }
    },
    hazard_index: 64.32,
    hazard_interpretation: "Moderate severity (mixed classes)",
    borough_breakdown: [...],
    nta_table: null  // Pending BBL→NTA lookup
  }
}
```

**Example**:
```javascript
// Brooklyn housing violations, last 90 days
const result = await mcp.callTool('search_hpd_violations', {
  borough: 'brooklyn',
  days: 90,
  aggregated: true
});
```

**Caveats**:
- No 403 errors (uses public dataset)
- NTA/CD: Not available without BBL→NTA lookup
- Hazard index: 0-100 score (weighted by severity class)

---

## 🚧 DOT Transportation (3 tools)

### `search_dot_street_closures`

**Purpose**: Find street closures with de-duplication

**Inputs**:
- `borough` (optional): Filter by borough
- `work_type` (optional): Filter by purpose (partial match)
- `limit` (optional): Max records (1-5000, default: 1000)
- `active_only` (optional): Only active closures (default: true)

**Outputs**:
```javascript
{
  success: true,
  source: "dot_street_closures",
  event_type: "search",
  window: { ... },
  count: 618,  // After de-duplication
  records: [
    {
      ts: "2025-09-11T00:00:00.000",
      geo: { borough, lat, lon, ... },
      topic: "Street closure: FREEDOM AVENUE",
      value: 52,  // Duration in days
      details: {
        segment_id: "4932",
        on_street: "FREEDOM AVENUE",
        purposes: ["DOT IN-HOUSE PAVING"],
        is_active: true,
        days_remaining: 10
      }
    }
  ],
  insights: {
    headline: "584 active street closures (618 total after de-duplication)",
    takeaways: [
      "Removed 382 duplicates (38% de-duplication rate)",
      "\"DOT IN-HOUSE PAVING\" is the leading reason (313 closures)",
      "Affecting 5 boroughs — STATEN ISLAND has most (203)"
    ]
  },
  meta: {
    active_closures: 584,
    raw_api_count: 1000,
    duplicates_removed: 382,
    deduplication_rate: 38.2,
    deduplication_key: "segment_id + start_date + end_date"
  }
}
```

**Example**:
```javascript
// Active closures in Manhattan
const result = await mcp.callTool('search_dot_street_closures', {
  borough: 'manhattan',
  active_only: true
});
```

**Caveats**:
- De-duplication: 38-45% of raw records are duplicates
- NTA/CD: Requires lat/lon→CD geocoding
- Active status: Based on current date vs work dates

---

## 🎉 NYC Events (3 tools)

### `search_events`

**Purpose**: Search city-sponsored events

**Inputs**:
- `borough` (optional): Filter by borough
- `event_type` (optional): Type of event
- `start_date` (optional): Events after this date (YYYY-MM-DD)
- `end_date` (optional): Events before this date (YYYY-MM-DD)
- `limit` (optional): Max records (1-10000, default: 100)

**Outputs**:
```javascript
{
  success: true,
  source: "nyc_events",
  event_type: "search",
  count: 50,
  records: [...],
  insights: { headline, takeaways },
  meta: { ... }
}
```

**Example**:
```javascript
// Upcoming events in Brooklyn
const result = await mcp.callTool('search_events', {
  borough: 'brooklyn',
  start_date: '2025-10-22',
  end_date: '2025-10-29'
});
```

---

## 💰 Comptroller Financial Data (3 tools)

### `search_comptroller_spending`

**Purpose**: Search NYC budget/spending data

**Inputs**:
- `agency` (optional): Agency name (e.g., "Department of Education")
- `fiscal_year` (optional): Fiscal year (e.g., "2024")
- `min_amount` (optional): Minimum amount
- `max_amount` (optional): Maximum amount
- `limit` (optional): Max records (1-10000, default: 100)

**Outputs**:
```javascript
{
  success: true,
  source: "comptroller_spending",
  event_type: "search",
  count: 100,
  records: [...],
  insights: { headline, takeaways },
  meta: { ... }
}
```

**Example**:
```javascript
// Education spending over $1M
const result = await mcp.callTool('search_comptroller_spending', {
  agency: 'Department of Education',
  min_amount: 1000000,
  fiscal_year: '2024'
});
```

**Caveats**:
- Shows budgeted amounts, not transaction-level spending
- Fiscal year required for accurate results

---

## Standard Envelope Fields

All tools return this structure:

```javascript
{
  success: boolean,
  source: string,  // Data source identifier
  event_type: string,  // Type of query
  window: {  // Time window (when applicable)
    start: "ISO 8601 date",
    end: "ISO 8601 date",
    days: number,
    type: "90d" | "12m" | "custom"
  },
  count: number,  // Total records
  records: [  // Array of standardized records
    {
      ts: "ISO timestamp",  // When the event occurred
      period: "YYYY-MM-DD",  // For aggregated data
      geo: {  // Geographic data
        borough: "BROOKLYN",
        borough_id: "3",
        cd: "314",
        cd_numeric: "14",
        nta: "BK42",
        bbl: "3076747502",
        lat: 40.615,
        lon: -73.954
      },
      topic: "What this record is about",
      value: number,  // Numeric value or count
      details: { ... }  // Tool-specific fields
    }
  ],
  insights: {  // Priority 6: Plain-English summary
    headline: "Main finding",
    takeaways: [
      "Key point 1",
      "Key point 2",
      "Key point 3"
    ]
  },
  meta: {  // Tool-specific metadata
    ...
  }
}
```

---

## Error Format

```javascript
{
  success: false,
  error: {
    type: "INVALID_INPUT" | "API_ERROR" | "RATE_LIMIT" | ...,
    message: "Human-readable error",
    details: { ... },
    guidance: "How to fix this"
  },
  insights: {
    headline: "Error: INVALID_INPUT",
    takeaways: [
      "Error message",
      "Guidance for resolution"
    ]
  }
}
```

---

## Common Patterns

### Filtering by Geography
```javascript
// Borough-level
{ borough: 'brooklyn' }

// NTA-level (311 only, post-query filter)
const results = await search_311_complaints({ ... });
const filtered = results.records.filter(r => r.geo.nta === 'BK42');
```

### Time Windows
```javascript
// Standard windows
{ days: 90 }   // Last 90 days
{ days: 365 }  // Last 12 months

// Custom date range
{ start_date: '2025-01-01', end_date: '2025-01-31' }
```

### Caching
```javascript
// Use cache (default)
await tool({ ... });

// Force fresh data
await tool({ ..., skip_cache: true });
```

### Rate Limiting
- Without token: 1,000 requests/day
- With token: 50,000 requests/day
- See: `.env.example` and `docs/API-TOKEN-SETUP.md`

---

## Performance Notes

**Server-side aggregation (311 trends)**:
- Returns ≤200 rows for 12-month citywide
- 99.999% smaller payload vs raw data
- Single API call

**Caching (search tools)**:
- First call: ~500ms
- Repeat call: ~0ms (495x faster)
- 5-minute TTL by default

**De-duplication (DOT closures)**:
- 38-45% duplicate removal
- Stable counts under repeated queries

---

## Known Issues & Limitations

**311**:
- ✅ 99% NTA coverage (Priority 3 complete)
- Some records missing community_board field

**HPD**:
- ⚠️ No NTA/CD without BBL→NTA lookup
- Borough-level analysis only
- No lat/lon in dataset

**DOT**:
- ⚠️ No NTA/CD without lat/lon→CD geocoding
- Has lat/lon (100% coverage)
- Borough-level works

**All tools**:
- Rate limits apply (get free API token for 50x more)
- Caching helps reduce API calls

---

## Quick Reference: Tool Selection

**Want individual records?** → `search_*` tools
**Want trends/aggregation?** → `analyze_*` or `aggregated=true`
**Want geographic analysis?** → Use 311 (has NTA)
**Want housing quality?** → `search_hpd_violations` (hazard index)
**Want city spending?** → `search_comptroller_spending`
**Want infrastructure impact?** → `search_dot_street_closures`

---

*For setup instructions, see: `README.md` and `.env.example`*
*For API token guide, see: `docs/API-TOKEN-SETUP.md`*
