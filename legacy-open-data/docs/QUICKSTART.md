# NYC MCP Server - Quick Start Guide

Get up and running in 5 minutes.

---

## Prerequisites

- **Node.js 18+** (check with `node --version`)
- **Claude Code** or **Claude Desktop**
- **Git** (to clone the repository)

---

## Step 1: Install

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/nyc-mcp.git
cd nyc-mcp

# Install dependencies
npm install
```

---

## Step 2: (Optional) Get API Token

**Recommended for production use** - Increases rate limit from 1k to 50k requests/day (50x more!)

### Get Your Free Token

1. Go to: https://data.cityofnewyork.us/profile/app_tokens
2. Click **"Create New App Token"**
3. Fill in:
   - Application Name: `nyc-mcp` (or any name)
   - Description: (optional)
4. Click **Create** and copy your token

### Add Token to Project

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your token
# Replace 'your-token-here' with your actual token
SOCRATA_APP_TOKEN=your-actual-token-here
```

**Setup time**: 2 minutes | **Cost**: Free forever

**Rate Limits**:
- WITHOUT token: 1,000 requests/day
- WITH token: 50,000 requests/day (**50x more!**)

---

## Step 3: Configure Claude

### For Claude Code

Edit `~/.config/claude/config.json`:

```json
{
  "mcpServers": {
    "nyc-open-data": {
      "command": "node",
      "args": ["/FULL/PATH/TO/nyc-mcp/index.js"]
    }
  }
}
```

**Important**: Replace `/FULL/PATH/TO/nyc-mcp` with your actual path. Use absolute path, not `~/`.

**Example**:
```json
"args": ["/Users/yourname/projects/nyc-mcp/index.js"]
```

### For Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "nyc-open-data": {
      "command": "node",
      "args": ["/FULL/PATH/TO/nyc-mcp/index.js"]
    }
  }
}
```

---

## Step 4: Restart Claude

**Claude Code**:
- Completely quit VS Code (⌘+Q on Mac, not just close window)
- Reopen VS Code

**Claude Desktop**:
- Quit the Claude app completely
- Reopen Claude

---

## Step 5: Test It!

Ask Claude:

> "What are the top 5 complaint types in Brooklyn this month?"

> "Show me housing violations in Manhattan"

> "What events are happening this weekend in NYC?"

If you see data about NYC, **it's working!** 🎉

---

## Quick Reference

### Example Queries

**Neighborhood Analysis**:
```
"Analyze quality of life issues in Queens over the past 90 days"
"Compare housing conditions across all five boroughs"
"What are the biggest problems in the Bronx right now?"
```

**Housing Research**:
```
"Show me buildings with serious safety violations in Brooklyn"
"What are the most common housing code violations?"
"Find all lead paint violations in zip code 10001"
```

**Government Spending**:
```
"How much did NYC spend on education this year?"
"Show me the city's largest contracts"
"What's the average salary for NYPD officers?"
```

**Transportation**:
```
"What streets are closed for construction in Manhattan?"
"Show me traffic volume patterns on the BQE"
"Where are the most parking violations issued?"
```

**Events**:
```
"What events are happening this weekend?"
"Show me all sports events in Queens this month"
"Find free concerts in Central Park"
```

---

## Troubleshooting

### "No MCP servers showing up in Claude"

**Check 1**: Verify config path is correct
- Use **full absolute path**, not `~/`
- Example: `/Users/yourname/projects/nyc-mcp/index.js`

**Check 2**: Make sure you **completely quit** Claude
- ⌘+Q on Mac (don't just close window)
- Windows: Quit from system tray

**Check 3**: Verify JSON syntax
- Use a JSON validator: https://jsonlint.com/
- Common mistake: Missing comma between sections

**Check 4**: Test the server directly
```bash
node /FULL/PATH/TO/nyc-mcp/index.js
```
Should start without errors.

### "Module not found" errors

```bash
# Make sure you're in the project directory
cd nyc-mcp

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### "Rate limiting" or "Too many requests"

**Without token**: 1,000 requests/day limit
**Solution**: Get free API token (see Step 2)

**With token**: 50,000 requests/day limit
**Solution**: Wait for daily reset, or reduce query frequency

### Still stuck?

1. Check Node.js version: `node --version` (must be 18+)
2. Check project structure:
   ```bash
   ls /FULL/PATH/TO/nyc-mcp/
   # Should see: index.js, package.json, mcps/, lib/, etc.
   ```
3. Check logs in Claude for error messages
4. Try running tests: `npm test` (should see 64 tests pass)

---

## What's Next?

### Learn the Tools

See [TOOL-REFERENCE.md](./TOOL-REFERENCE.md) for complete API documentation of all 17 tools.

### Production Features

See [PRODUCTION.md](./PRODUCTION.md) to learn about:
- Caching (495x speedup)
- Retry logic (95% success rate)
- Rate limiting (prevents API abuse)
- Security features (SQL injection protection)
- Testing (64 tests, all passing)

### Common Patterns

**Trend Analysis**:
```
"Show me 311 complaint trends in Brooklyn over 90 days"
```

**Cross-Source Analysis**:
```
"Compare neighborhood health and housing quality in the Bronx"
```

**Problem Identification**:
```
"Find the worst landlords in Manhattan based on violations"
```

**Government Accountability**:
```
"How much did NYC spend on homelessness services compared to last year?"
```

---

## Performance Tips

1. **Use specific date ranges** - Reduces result size
2. **Filter by borough** - Faster queries
3. **Set reasonable limits** - Default is 100 records
4. **Enable caching** - Enabled by default, 495x speedup
5. **Get API token** - 50x more daily requests

---

## Getting Help

- **Documentation**: Start with [README.md](../README.md)
- **Tool Reference**: See [TOOL-REFERENCE.md](./TOOL-REFERENCE.md)
- **Production Guide**: See [PRODUCTION.md](./PRODUCTION.md)
- **GitHub Issues**: Report bugs or request features
- **NYC Open Data**: https://opendata.cityofnewyork.us/

---

**Ready to explore NYC data! 🗽**
