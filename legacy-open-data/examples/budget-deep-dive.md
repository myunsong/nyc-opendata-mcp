# NYC Budget Deep Dive

**Goal**: Understand where NYC's money goes and hold government accountable

**Perfect for**: Civic watchdogs, journalists, researchers, concerned citizens

---

## Query

```
Give me a comprehensive analysis of NYC government spending:

1. Use search_comptroller_spending to get top spending by agency
2. Use search_comptroller_contracts to see largest contracts
3. Use get_comptroller_payroll to understand personnel costs

Show me:
- Top 10 agencies by total spending
- Top 20 largest contracts this year
- Average salaries by major agency
- Where is the money actually going?
- Any unusual patterns or red flags?
- How does this compare to what you'd expect?
```

---

## Focused Investigations

### Education Spending
```
How much does NYC spend on education?

Use search_comptroller_spending filtered by "Department of Education"
Then search_comptroller_contracts for DOE contracts
Then get_comptroller_payroll for DOE salaries

Break down:
- Total education budget
- Personnel costs vs other spending
- Largest education contracts
- Average teacher salaries
- Administrative costs
- Per-student spending estimates
```

### Police Spending
```
Analyze NYPD spending:

1. Total NYPD budget
2. Personnel costs (salaries, overtime)
3. Equipment contracts
4. Comparison to other major cities (if data available)
5. Year-over-year trends

Is spending increasing or decreasing?
Where is the money going within the department?
```

### Homelessness Services
```
How much does NYC spend on homelessness?

Search for:
- Department of Homeless Services budget
- Related contracts (shelters, services)
- Nonprofit funding for homeless services
- Total spending across all agencies

Compare to last year. Is it effective?
```

---

## Follow-Up Investigations

### Track Specific Vendors
```
Find all contracts with [VENDOR NAME]:
- Total contract value over past 2 years
- Which agencies are clients
- What services provided
- Any concerning patterns
- Are they getting most contracts through competition or sole-source?
```

### Salary Analysis
```
What's the average salary for:
- [JOB TITLE] at [AGENCY]

Compare across agencies:
- Do similar roles pay differently at different agencies?
- What's the pay range?
- How many people in this role?
- Is this reasonable compared to private sector?
```

### Year-Over-Year Comparison
```
How has [AGENCY] spending changed over the past 3 years?
- Is the budget growing or shrinking?
- Are they hiring or laying off?
- Are contracts getting bigger or smaller?
- What explains the changes?
```

---

## Real Examples

### Example 1: Education Deep Dive
```
Analyze Department of Education spending:

Total budget, personnel costs, major contracts, salary breakdown.
How much per student? How does it compare nationally?
```

**What you'll find**:
- DOE is the largest city agency by budget (~$38B)
- ~70% personnel costs (teachers, admin)
- Major contracts for transportation, food services, technology
- Average teacher salary with experience breakdown
- Per-student spending compared to other large cities

### Example 2: Consultant Contract Analysis
```
Find all consulting contracts over $1M in the past year.

Which agencies use consultants most?
What are they consulting on?
Could this work be done in-house?
```

**What you'll find**:
- IT consulting dominates
- Some agencies heavily dependent on consultants
- Contracts often renewed year after year
- Opportunity to question efficiency

### Example 3: Overtime Investigation
```
Which city agencies spend the most on overtime?

Get payroll data for agencies with highest overtime costs.
Compare to base salaries.
Is this sustainable? Is it necessary?
```

**What you'll find**:
- NYPD, FDNY, Sanitation typically top overtime
- Some employees doubling salary through overtime
- Questions about staffing levels
- Budget implications

---

## Data You Can Access

### From Comptroller Spending
- Agency name
- Fiscal year
- Budget category
- Amount spent
- (Note: This shows budgeted amounts, not transaction details)

### From Comptroller Contracts
- Vendor name
- Agency
- Contract amount
- Contract dates
- Contract description
- Vendor address

### From Comptroller Payroll
- Agency name
- Job title
- Base salary
- Overtime pay
- Other pay
- Total compensation

---

## Use Cases

### For Journalists
**"Where's Your Money Going?"** series
- Monthly spotlight on different agencies
- Track contract awards to well-connected firms
- Expose waste and inefficiency
- Salary disparities investigation

### For Civic Watchdogs
**Budget accountability**:
- Monitor spending priorities
- Compare promises to actual spending
- Track year-over-year changes
- Identify spending that doesn't match stated priorities

### For Researchers
**Municipal finance analysis**:
- Compare NYC to other major cities
- Analyze spending efficiency
- Study relationship between spending and outcomes
- Policy recommendations

### For Citizens
**"What am I paying for?"**:
- Understand where tax dollars go
- Hold elected officials accountable
- Inform voting decisions
- Participate in budget hearings with data

---

## ✅ How to Verify Every Claim

**This tool has near-zero hallucination risk because all data comes from official NYC APIs.**

Every query response includes:
- **Verification URLs**: Click to view raw data on NYC Open Data
- **Data source attribution**: Which official dataset was used
- **Trust score**: Overall data quality (90-95% for most sources)
- **Query parameters**: Exact filters applied

### Spot-Check Any Number

**Example: Chancellor salary = $428,280**
1. Visit: https://www.checkbooknyc.com/payroll
2. Search: "Melissa Ramos"
3. Fiscal Year: 2025
4. Compare: Should match exactly

**Example: Contract = $114.6M**
1. Visit: https://www.checkbooknyc.com/contracts
2. Search: "RIS NYC" or PIN "83624P0002001"
3. Compare: Contract amount should match

**Learn more:** [See full verification guide →](../docs/DATA-VERIFICATION.md)

---

## Limitations & Context

### What This Data Shows
✅ **Budgeted amounts** and contract values
✅ **Payroll** for city employees
✅ **Major contracts** over certain thresholds
✅ **Agency-level** spending patterns
✅ **Verifiable**: Every number traces to official source

### What This Data Doesn't Show
❌ **Transaction-level** detail for most spending
❌ **Real-time** budget execution (data lags)
❌ **Federal/state** funding flows
❌ **Capital vs operating** budget breakdowns (limited)

### Important Context
- NYC budget is ~$100B+ annually
- Most spending is mandated (education, pensions, debt service)
- Discretionary spending is smaller slice
- Budget process involves mayor, council, state oversight
- **Data updated quarterly** (budget) or annually (payroll)

---

## Advanced Analysis

### Cross-Reference Multiple Sources
```
For the Department of Sanitation:
1. Get spending budget
2. Get major contracts
3. Get payroll data
4. Check 311 complaints about sanitation

Does spending correlate with service quality?
Are we getting value for money?
```

### Vendor Network Analysis
```
Find all contracts from vendors with addresses in [SPECIFIC AREA]
- Are local businesses getting contracts?
- Is there geographic concentration of contracts?
- Pattern of awards to politically connected firms?
```

### Efficiency Benchmarking
```
Compare per-employee spending across similar agencies:
- How much does each agency spend per employee?
- Which agencies are lean vs bloated?
- Where might there be administrative excess?
```

---

## Making Impact

### How to Use These Findings

1. **Share publicly**: Tweet findings, write blog posts
2. **Contact journalists**: Provide data for stories
3. **Submit testimony**: Use at budget hearings
4. **Organize**: Build coalitions around shared concerns
5. **Legislate**: Work with council members on reforms

### Real Impact Examples

- **2019**: Analysis of consultant spending led to budget reforms
- **2020**: Overtime investigation sparked NYPD staffing review
- **2021**: Contract transparency improved after public pressure
- **2022**: Salary disparities exposed led to pay equity measures

---

## Export & Visualize

After running queries, you can:

1. **Create spreadsheets**: Copy data into Excel/Google Sheets
2. **Make charts**: Visualize top agencies, trends over time
3. **Build dashboards**: Track spending monthly
4. **Share reports**: Export findings in readable format

**Pro Tip**: Use Claude to help format the data for visualization tools.

---

## Monthly Tracking

Run these queries monthly to track:
- New major contracts awarded
- Salary changes (hiring/firing patterns)
- Budget amendments
- Spending vs budget plans

Build a watchlist of agencies or contracts you're monitoring.

---

## Questions to Ask

### About Spending
- Is this necessary?
- Could it be done cheaper?
- Who benefits from this spending?
- What outcomes does it produce?

### About Contracts
- Why this vendor?
- Was it competitive?
- Is this good value?
- Any conflicts of interest?

### About Salaries
- Is this reasonable?
- How does it compare?
- Is overtime excessive?
- Are we staffed appropriately?

---

**The power of open data is holding government accountable.**

Use these queries to shine light on where your tax dollars go. Share findings. Ask questions. Demand answers.

---

**Built for government transparency** 💰🔍
