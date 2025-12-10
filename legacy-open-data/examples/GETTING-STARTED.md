# Getting Started with NYC MCP

**Never used this before? Start here!**

This guide walks you through your first queries and shows you what's possible.

---

## Step 1: Install (5 minutes)

Follow the [QUICKSTART guide](../docs/QUICKSTART.md):
1. Clone the repo
2. Run `npm install`
3. Configure Claude
4. (Optional) Get API token

---

## Step 2: Your First Query (30 seconds)

Once installed, open Claude and try:

```
What are the top 5 complaint types in Brooklyn this month?
```

If you see data about NYC 311 complaints, **it's working!** 🎉

---

## Step 3: Explore What's Possible

Try these progressively more complex queries:

### Level 1: Simple Search
```
Show me recent housing violations in Manhattan
```

### Level 2: With Filters
```
Show me noise complaints in Queens over the past 30 days
```

### Level 3: Trend Analysis
```
Analyze 311 complaint trends in Brooklyn over the past 90 days.
What's increasing? What's decreasing?
```

### Level 4: Cross-Source Analysis
```
Compare neighborhood health and housing quality in the Bronx.
Which neighborhoods have the most issues?
```

### Level 5: Deep Investigation
```
Find the 20 buildings with the most housing violations in Manhattan.
Show me the severity and how long they've been open.
```

---

## Step 4: Use Query Recipes

We've created ready-to-use queries for common tasks:

### For Residents
📍 **[Neighborhood Quality Scorecard](./neighborhood-quality-scorecard.md)**
- Should I move here?
- How's my neighborhood doing?
- What are the problems?

### For Journalists
📰 **[Slumlord Tracker](./slumlord-tracker.md)**
- Find the worst landlords
- Identify patterns of neglect
- Data-driven investigations

### For Civic Watchdogs
💰 **[Budget Deep Dive](./budget-deep-dive.md)**
- Where does the money go?
- Track contracts and spending
- Hold government accountable

### More Examples
📚 **[All Query Examples](./README.md)**
- 30+ ready-to-use queries
- Organized by user type
- Copy and paste into Claude

---

## Step 5: Learn the Tools

You have 17 tools across 5 data sources:

### 311 Service Requests (Civic Issues)
- `search_311_complaints` - Find complaints by type, borough, date
- `get_311_response_times` - How fast does the city respond?
- `analyze_311_trends` - What's trending up/down?
- `get_neighborhood_health` - Overall civic health metrics

### HPD Housing (Building Quality)
- `search_hpd_violations` - Housing code violations
- `search_hpd_complaints` - Tenant complaints
- `get_hpd_registrations` - Building registration info
- `get_housing_health` - Overall housing quality metrics

### Comptroller (Government Money)
- `search_comptroller_spending` - City budget and spending
- `search_comptroller_contracts` - Government contracts
- `get_comptroller_payroll` - City employee salaries

### DOT (Transportation)
- `search_dot_street_closures` - Construction and closures
- `get_dot_parking_violations` - Parking tickets
- `get_dot_traffic_volume` - Traffic patterns

### NYC Events (Community Activity)
- `search_events` - Find city-sponsored events
- `get_upcoming_events` - What's happening soon
- `analyze_event_impact` - Event patterns and density

**Full API Reference**: [TOOL-REFERENCE.md](../docs/TOOL-REFERENCE.md)

---

## Pro Tips

### 1. Be Specific with Locations
❌ **Vague**: "Show me data"
✅ **Specific**: "Show me noise complaints in Williamsburg, Brooklyn for the past 90 days"

### 2. Ask for Comparisons
```
Compare [NEIGHBORHOOD] to the borough average and citywide average
```

### 3. Request Specific Formats
```
Present this as a table
or
Give me the top 10 as a numbered list
or
Summarize the key findings
```

### 4. Combine Multiple Tools
```
Use search_311_complaints AND get_housing_health to create a comprehensive neighborhood report
```

### 5. Follow Up with Questions
After the first response:
- "Show me just the most serious issues"
- "Which of these has gotten worse over time?"
- "How does this compare to last year?"

---

## Common Use Cases

### "Should I move here?"
```
I'm considering moving to [NEIGHBORHOOD]. Give me:
- Recent 311 complaints
- Housing violations
- Community events
- How it compares to similar neighborhoods
- Any red flags
```

### "Is my landlord neglecting the building?"
```
Search for all HPD violations and 311 complaints at [ADDRESS] for the past year.
Is this normal or concerning?
```

### "Where's the city spending money?"
```
How much does NYC spend on [DEPARTMENT/ISSUE]?
Show me contracts, salaries, and budget trends.
```

### "What's happening in my neighborhood?"
```
Analyze [NEIGHBORHOOD] over the past 90 days:
- Top complaints
- Housing quality
- Upcoming events
- Trend (improving/declining)
```

---

## Understanding the Data

### Where It Comes From
All data is from **NYC Open Data** - the city's official open data platform:
- **311 Service Requests**: Citizen complaints and service requests
- **HPD**: Department of Housing Preservation & Development
- **Comptroller**: City's financial data (budgets, contracts, payroll)
- **DOT**: Department of Transportation
- **Events**: City-sponsored events calendar

### How Fresh Is It?
- **311 data**: Updates continuously (usually within hours)
- **HPD data**: Updates daily
- **Comptroller data**: Updates monthly/quarterly
- **DOT data**: Varies by dataset
- **Events data**: Updates as events are scheduled

### What You Can Trust
✅ **Counts and trends**: Very reliable (comes from city systems)
✅ **Relative comparisons**: Reliable (same data source for all)
✅ **Official records**: Reliable (legal/regulatory data)

⚠️ **Context matters**:
- More complaints doesn't always mean worse neighborhood (could mean more engaged residents)
- Open violations might be under appeal
- Budget data shows what's allocated, not always what's spent

---

## Troubleshooting

### "No data returned"
Try:
- Broader date range (past 90 days instead of 7 days)
- Check spelling of borough/complaint type
- Try citywide instead of specific neighborhood

### "Too much data"
Try:
- Narrower date range
- Add more filters (specific complaint type, borough)
- Ask for "top 10" or summary instead of all data

### "Error message"
- Check that the MCP server is running
- Verify you followed [QUICKSTART.md](../docs/QUICKSTART.md) correctly
- Run `npm test` to verify installation
- See [QUICKSTART troubleshooting section](../docs/QUICKSTART.md#troubleshooting)

---

## Next Steps

### Explore More
- Browse **[all query examples](./README.md)**
- Try **[neighborhood scorecard](./neighborhood-quality-scorecard.md)**
- Check **[tool reference](../docs/TOOL-REFERENCE.md)** for all options

### Go Deeper
- Read **[PRODUCTION.md](../docs/PRODUCTION.md)** to understand how it works
- Learn about **[reliability features](../docs/PRODUCTION.md#reliability-features)**
- See **[testing approach](../docs/PRODUCTION.md#testing)**

### Contribute
- **[Fork the repo](../CONTRIBUTING.md#how-to-contribute)** and add features
- **[Submit query examples](../CONTRIBUTING.md)** you found useful
- **[Report bugs](../.github/ISSUE_TEMPLATE/bug_report.md)** if something doesn't work
- **[Request features](../.github/ISSUE_TEMPLATE/feature_request.md)** you'd like to see

---

## Have Fun! 🎉

This tool gives you superpowers to understand your city. Use it to:
- Make better decisions (where to live, how to advocate)
- Tell important stories (journalism, research)
- Hold power accountable (civic watchdogging)
- Improve your community (organizing, activism)

**The data is yours. Use it wisely!**

---

**Questions?** Open an issue or check the [full documentation](../docs/).

**Built with ❤️ for NYC** 🗽
