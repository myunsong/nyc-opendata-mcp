# Neighborhood Quality Scorecard

**Goal**: Get a comprehensive quality-of-life report for any NYC neighborhood

**Time**: 2-3 minutes

---

## Query

```
Create a comprehensive quality scorecard for [NEIGHBORHOOD], [BOROUGH].

Use these tools:
1. get_neighborhood_health for civic engagement metrics
2. search_311_complaints to see recent issues
3. get_housing_health to check building quality
4. get_upcoming_events to see community activity

For the analysis period: past 90 days

Present findings as:
- Overall health score (out of 10)
- Top 3 concerns
- Top 3 positives
- Comparison to borough average
- Trend (improving/declining/stable)
- Key recommendations
```

---

## Example: Brooklyn Heights

```
Create a comprehensive quality scorecard for Brooklyn Heights, Brooklyn.

Use these tools:
1. get_neighborhood_health for civic engagement metrics
2. search_311_complaints to see recent issues
3. get_housing_health to check building quality
4. get_upcoming_events to see community activity

For the analysis period: past 90 days
```

**Expected Output**:
- Service responsiveness score
- Complaint density per capita
- Housing violation rates
- Top complaint types
- Event participation
- Trend analysis
- Health assessment

---

## Customize It

Replace `[NEIGHBORHOOD]` and `[BOROUGH]` with:
- **Manhattan**: Upper West Side, Greenwich Village, Harlem, etc.
- **Brooklyn**: Williamsburg, Park Slope, Bedford-Stuyvesant, etc.
- **Queens**: Astoria, Flushing, Long Island City, etc.
- **Bronx**: Fordham, Riverdale, Mott Haven, etc.
- **Staten Island**: St. George, Tottenville, etc.

---

## Follow-Up Questions

After getting the scorecard:

1. **"What's the worst problem?"**
   - Drills into the top issue

2. **"How does this compare to last year?"**
   - Historical comparison

3. **"Show me the specific buildings with violations"**
   - Get actionable data

4. **"What neighborhoods are similar?"**
   - Find comparable areas

---

## Use Cases

### For Residents
- Deciding whether to move to an area
- Understanding your current neighborhood
- Comparing multiple neighborhoods

### For Journalists
- Quick background research
- Identifying story angles
- Data-driven reporting

### For Researchers
- Standardized neighborhood comparison
- Longitudinal analysis
- Quality-of-life metrics

---

## Technical Details

**Tools Used**:
- `get_neighborhood_health` (311 civic engagement)
- `search_311_complaints` (recent issues)
- `get_housing_health` (HPD violations)
- `get_upcoming_events` (community activity)

**Data Sources**:
- NYC 311 Service Requests
- HPD Housing Violations
- HPD Tenant Complaints
- NYC Events Calendar

**Analysis Period**: 90 days (customizable)

---

**Pro Tip**: Run this monthly to track your neighborhood over time!
