# NYC MCP Query Examples

Ready-to-use queries that showcase what's possible with this tool. Copy any of these directly into Claude!

---

## 🏡 For Residents

### "Is my neighborhood safe?"
```
Analyze quality of life in [YOUR NEIGHBORHOOD] over the past 90 days.
Show me:
1. Top complaint types and trends
2. Housing code violations
3. How it compares to the rest of the borough
4. What's improving vs getting worse
```

### "Should I move here?"
```
I'm considering moving to [NEIGHBORHOOD]. Give me a comprehensive report on:
- Recent 311 complaints (past 6 months)
- Housing violations in the area
- Upcoming community events
- How it compares to similar neighborhoods
- Red flags I should know about
```

### "Is my landlord neglecting the building?"
```
Search for all HPD violations and 311 complaints at [YOUR ADDRESS] for the past year.
Compare to nearby buildings. Is this normal or concerning?
```

---

## 📰 For Journalists

### "Which neighborhoods are declining?"
```
For each NYC borough, analyze:
1. 311 complaint trends (past 12 months)
2. Housing violation rates (increasing/decreasing)
3. Response times by city agencies
4. Identify neighborhoods with deteriorating conditions

Show me the 5 neighborhoods with the most concerning trends.
```

### "Where's the money going?"
```
How much did NYC spend on homelessness services this year vs last year?
Break down by:
- Total spending
- Major contracts
- Agencies involved
- Year-over-year change
- Spending per capita
```

### "Slumlord investigation"
```
Find the 20 buildings in [BOROUGH] with the most open housing violations.
For each building:
- Total violations
- Most serious violations
- How long they've been open
- 311 complaints from tenants
- Owner information (if available)

This is for a story on housing code enforcement.
```

---

## 📊 For Researchers

### "Civic engagement patterns"
```
Analyze civic engagement across all 5 boroughs:
- 311 complaints per capita (last 90 days)
- Response times by borough
- Most common complaint types per borough
- Community event attendance (proxy via events count)
- Which boroughs have highest/lowest engagement
```

### "Service delivery efficiency"
```
Compare city service efficiency across boroughs:
- Average 311 response times by complaint type
- HPD violation resolution rates
- Which agencies are fastest/slowest
- Correlation between spending and outcomes (if data available)
```

### "Housing crisis indicators"
```
Create a housing stress index for NYC:
- HPD violations per 1000 housing units (by borough)
- 311 housing complaints per capita
- Violation severity breakdown (A, B, C class)
- Trend over time (past 12 months)
- Identify neighborhoods in crisis
```

---

## 🏙️ For Urban Planners

### "Transportation pain points"
```
Identify transportation problems across NYC:
- Street closures by borough (past 30 days)
- Traffic volume patterns on major roads
- Parking violation hotspots
- 311 street/traffic complaints
- Where should we focus infrastructure improvements?
```

### "Event impact analysis"
```
Analyze how city events affect neighborhoods:
- Upcoming events by borough (next 30 days)
- Event density map (which areas are busiest)
- Historical event patterns
- 311 noise complaints during event times
```

### "Neighborhood transformation tracking"
```
Track neighborhood change over time in [NEIGHBORHOOD]:
- 311 complaint trends (12-month view)
- Housing quality trends
- New violations vs resolved violations
- Community event participation
- Is this neighborhood improving or declining?
```

---

## 💰 For Civic Watchdogs

### "Budget analysis"
```
Where does NYC's money go?
- Top 10 city agencies by spending
- Largest contracts this year
- Average salaries by agency and title
- Year-over-year budget changes
- Spending per resident
```

### "Government accountability check"
```
How well is the city responding to 311 complaints?
- Average response times by agency
- Resolution rates by complaint type
- Which agencies are fastest/slowest
- Trends over time
- Where is the city failing residents?
```

### "Contract transparency"
```
Find all contracts with [VENDOR NAME] over the past 2 years.
- Total contract value
- Agencies involved
- Services provided
- Any red flags or unusual patterns
```

---

## 🎓 For Students

### "Learn about your neighborhood"
```
I'm a student learning about [YOUR NEIGHBORHOOD]. Help me understand:
- What are the main quality-of-life issues?
- How does the city respond to problems?
- What community events are happening?
- How does it compare to other neighborhoods?
- What's getting better? What's getting worse?
```

### "Civic tech research project"
```
I'm doing a research project on open data. Show me:
- What kinds of data are available about NYC
- How to analyze trends in city services
- Examples of insights from 311 data
- How this data could improve city governance
```

---

## 🏗️ For Developers

### "Fork and customize"
```
I want to add a new data source to this MCP server. Show me:
- How existing tools are structured
- The standard query pattern
- How to add input validation
- How to write tests
- How to document the new tool
```

### "API exploration"
```
Show me examples of each tool in action:
- search_311_complaints with different filters
- analyze_311_trends with different groupings
- get_neighborhood_health for each borough
- What parameters does each tool accept?
```

---

## 🔍 Advanced Queries

### "Cross-dataset analysis"
```
Compare housing quality and civic engagement:
1. Get neighborhood health scores (311 data)
2. Get housing health scores (HPD data)
3. Identify neighborhoods with high complaints but low violations (engaged communities)
4. Identify neighborhoods with low complaints but high violations (disengaged/vulnerable)
5. What does this tell us about different neighborhoods?
```

### "Temporal pattern discovery"
```
Analyze 311 complaint patterns over the past year:
- Day of week patterns (are weekends different?)
- Monthly trends (seasonal patterns?)
- Complaint type evolution (what's increasing/decreasing?)
- Borough-specific trends
- Predict next month's top issues
```

### "Government spending investigation"
```
Deep dive into [AGENCY] spending:
- Total budget this year
- Top 20 contracts
- Average salaries by job title
- How many employees
- Spending trends over past 3 years
- How does this compare to other agencies?
```

---

## 💡 Pro Tips

### Get specific with locations
Instead of: "Show me Brooklyn data"
Try: "Show me data for Williamsburg, Brooklyn over the past 90 days"

### Combine multiple tools
"Use search_311_complaints AND search_hpd_violations to create a comprehensive report"

### Ask for comparisons
"Compare [NEIGHBORHOOD] to the borough average and citywide average"

### Request visualizations
"Present this data as a table/list/summary"

### Follow up questions
After the first response, ask: "Now show me just the most serious violations" or "Which of these has gotten worse over time?"

---

## 🚀 Getting Started

1. **Install** the NYC MCP server (see [QUICKSTART.md](../docs/QUICKSTART.md))
2. **Copy** any query above
3. **Paste** into Claude
4. **Customize** with your neighborhood/borough/topic
5. **Ask follow-ups** to dig deeper

---

## 📚 Learn More

- **All available tools**: [TOOL-REFERENCE.md](../docs/TOOL-REFERENCE.md)
- **How it works**: [PRODUCTION.md](../docs/PRODUCTION.md)
- **Add your own queries**: [CONTRIBUTING.md](../CONTRIBUTING.md)

---

**Have a great query example?**

Submit a PR! Add your example to this file or create a new one in `examples/`. Help others discover what's possible.

---

**Built with ❤️ for NYC residents, journalists, researchers, and civic technologists**
