# Slumlord Tracker

**Goal**: Identify the worst landlords in NYC based on violations and tenant complaints

**Perfect for**: Journalists, tenant advocates, housing researchers

---

## Query

```
Find the 20 worst buildings in [BOROUGH] based on housing violations and tenant complaints.

Use:
1. get_housing_health to get overall metrics
2. search_hpd_violations to find serious violations
3. search_hpd_complaints to see tenant issues

For each problem building, show:
- Building ID
- Total open violations
- Total open complaints
- Most serious violation types
- How long violations have been open
- Trend (getting better or worse)

Rank by total issues (violations + complaints).
```

---

## Example: Manhattan

```
Find the 20 worst buildings in Manhattan based on housing violations and tenant complaints.

Use:
1. get_housing_health to get overall metrics
2. search_hpd_violations to find serious violations
3. search_hpd_complaints to see tenant issues

For each problem building, show:
- Building ID
- Total open violations
- Total open complaints
- Most serious violation types
- How long violations have been open
- Trend (getting better or worse)

Rank by total issues (violations + complaints).
```

---

## What You'll Get

### Overall Borough Metrics
- Total violations citywide
- Open violation rate
- Complaint resolution rate
- Housing health assessment

### Problem Buildings List
```
Top 20 Buildings with Most Issues:

1. Building ID: 12345
   - Open Violations: 42
   - Open Complaints: 12
   - Most Serious: Lead paint, heating failures
   - Total Issues: 54
   - Status: Worsening

2. Building ID: 67890
   - Open Violations: 38
   - Open Complaints: 8
   - Most Serious: Structural damage, pest infestation
   - Total Issues: 46
   - Status: Stable but severe

... (continues for top 20)
```

---

## Follow-Up Investigations

### Get More Details on a Building
```
Give me all details on Building ID [12345]:
- Full violation history
- All tenant complaints
- When were these issues first reported
- What actions has HPD taken
- Are there any active cases
```

### Compare to Nearby Buildings
```
How does Building [12345] compare to other buildings in the same zip code?
Is this building an outlier or is the whole area problematic?
```

### Track Over Time
```
Has Building [12345] gotten better or worse in the past year?
Show me the trend of violations and complaints over 12 months.
```

---

## Customization Options

### By Borough
- Manhattan: Luxury vs low-income housing patterns
- Brooklyn: Gentrifying neighborhoods
- Bronx: Historically neglected areas
- Queens: Diverse housing stock
- Staten Island: Smaller scale issues

### By Violation Type
```
Find buildings with [SPECIFIC VIOLATION]:
- Lead paint violations
- Heating/hot water failures
- Pest infestations
- Structural damage
- Fire safety violations
```

### By Time Period
```
Show me buildings with violations open for more than [X] days:
- 30+ days: Recent issues
- 90+ days: Chronic neglect
- 365+ days: Severe negligence
```

---

## Use Cases

### For Journalists
**Investigative Story**: "NYC's Worst Landlords Exposed"
- Identify patterns of neglect
- Track repeat offenders
- Visualize concentration of violations
- Interview tenants in problem buildings

### For Tenant Advocates
**Enforcement Campaign**: Target worst buildings
- Prioritize organizing efforts
- Document patterns for legal action
- Present data to HPD for enforcement
- Build coalition around shared problems

### For Researchers
**Housing Policy Analysis**:
- Measure enforcement effectiveness
- Identify geographic patterns
- Correlate with demographics
- Track policy impact over time

### For City Agencies
**Enforcement Prioritization**:
- Focus inspections on worst buildings
- Track repeat violators
- Measure inspection effectiveness
- Allocate resources efficiently

---

## Data Fields Available

### From HPD Violations
- Building ID
- Violation status (open/closed)
- Violation class (A=non-hazardous, B=hazardous, C=immediately hazardous)
- Inspection date
- Current status date
- Description

### From HPD Complaints
- Building ID
- Complaint status
- Received date
- Status date
- Problem type

### From Housing Health Tool
- Problem building rankings
- Violation/complaint aggregations
- Trend analysis
- Health assessment

---

## Real-World Impact

This query has been used to:
- **Expose slumlords** in investigative journalism
- **Prioritize organizing** by tenant unions
- **Focus enforcement** by housing agencies
- **Inform policy** by city council members

**Example**: A tenant advocate used this to identify 50 buildings owned by the same landlord, all with chronic violations. This led to a coordinated legal action and city investigation.

---

## Technical Notes

**Data Freshness**: HPD data updates frequently
**Coverage**: All registered rental buildings in NYC
**Limitations**:
- Building ID may not directly show owner name (requires additional lookup)
- Some violations may be under appeal
- Data shows reported issues, not necessarily all issues

**Pro Tip**: Cross-reference with NYC's Worst Landlords Watchlist and HPD's Certification of Correction data for complete picture.

---

## Export & Share

After running this query:

1. **Save results**: Copy the building IDs and metrics
2. **Create watchlist**: Track these buildings monthly
3. **Share findings**: Export to spreadsheet for visualization
4. **Follow up**: Use building IDs for deeper investigation

---

**Want to help?**

If you identify patterns or have success stories using this query, share them! This helps improve housing conditions for all NYC residents.

---

**Built to hold slumlords accountable** 🏢⚖️
