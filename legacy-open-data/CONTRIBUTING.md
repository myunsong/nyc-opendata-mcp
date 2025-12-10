# Contributing to NYC Open Data MCP Server

Thank you for your interest in contributing! This project provides AI-powered access to NYC's open data ecosystem.

---

## Quick Links

- **Report a bug**: [GitHub Issues](../../issues/new?template=bug_report.md)
- **Request a feature**: [GitHub Issues](../../issues/new?template=feature_request.md)
- **Ask a question**: [GitHub Discussions](../../discussions)

---

## How to Contribute

### 1. Report Bugs

**Before reporting**:
- Check [existing issues](../../issues) to avoid duplicates
- Test with the latest version
- Include reproduction steps

**Bug reports should include**:
- NYC MCP version (`git rev-parse HEAD`)
- Node.js version (`node --version`)
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Error messages (if any)

### 2. Suggest Features

**Good feature requests**:
- Explain the use case (why you need it)
- Describe the desired behavior
- Provide examples
- Consider backward compatibility

**Note**: We prioritize features that benefit many users. Niche features may be declined.

### 3. Submit Pull Requests

**Process**:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`) - **must pass**
5. Commit with clear messages
6. Push to your fork
7. Open a Pull Request

**PR Requirements**:
- ✅ All tests pass (`npm test` shows 64/64 passing)
- ✅ Code follows existing style
- ✅ Commit messages are descriptive
- ✅ Changes are focused (one feature/fix per PR)
- ✅ Documentation updated (if needed)

---

## Development Setup

### Prerequisites

- Node.js 18+
- Git
- NYC Open Data API token (optional but recommended)

### Initial Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/nyc-mcp.git
cd nyc-mcp

# Install dependencies
npm install

# Run tests
npm test
# Should see: 64 tests passing

# Test locally with Claude
node index.js
```

### Get API Token

1. Go to: https://data.cityofnewyork.us/profile/app_tokens
2. Create token (free, 2 minutes)
3. Add to `.env`:
   ```bash
   cp .env.example .env
   # Edit .env and add: SOCRATA_APP_TOKEN=your-token-here
   ```

---

## Project Structure

```
nyc-mcp/
├── index.js                    # Main MCP server (tool routing)
├── lib/                        # Shared utilities
│   ├── reliability.js         # Caching, retry, pagination
│   ├── input-validation.js    # SQL injection protection, validation
│   ├── time-windows.js        # Standard time windows (90d, 12m)
│   ├── standard-envelope.js   # Response format
│   ├── geography.js           # Borough → NTA mapping
│   └── insights.js            # Plain-English summaries
├── mcps/                       # Tool implementations
│   ├── nyc-311/tools/         # 4 tools (complaints, trends, health)
│   ├── nyc-hpd/tools/         # 4 tools (violations, health)
│   ├── nyc-comptroller/tools/ # 3 tools (spending, contracts, payroll)
│   ├── nyc-dot/tools/         # 3 tools (closures, violations, traffic)
│   └── nyc-events/tools/      # 3 tools (search, upcoming, impact)
├── test/                       # 64 comprehensive tests
│   ├── test-runner.js
│   ├── window-bounds.test.js
│   ├── trend-calculations.test.js
│   ├── enum-validation.test.js
│   └── deduplication.test.js
└── docs/                       # Documentation
```

---

## Adding a New Tool

### 1. Create Tool File

```bash
# Example: Add subway delays tool
mkdir -p mcps/nyc-mta/tools
touch mcps/nyc-mta/tools/get_subway_delays.js
```

### 2. Implement Tool

```javascript
// mcps/nyc-mta/tools/get_subway_delays.js
import axios from 'axios';

/**
 * Get current subway delays across all lines
 * @param {Object} params - Query parameters
 * @param {string} [params.line] - Specific subway line (optional)
 * @returns {Object} Subway delay data
 */
export default async function getSubwayDelays(params) {
  const { line } = params;

  // Build query
  const query = {
    // ... query parameters
  };

  // Fetch data
  const response = await axios.get(ENDPOINT, { params: query });

  // Return standard envelope
  return {
    success: true,
    count: response.data.length,
    delays: response.data,
    meta: {
      source: 'NYC MTA',
      timestamp: new Date().toISOString()
    }
  };
}
```

### 3. Register Tool in index.js

```javascript
// Import tool
import getSubwayDelays from './mcps/nyc-mta/tools/get_subway_delays.js';

// Add to TOOLS array
{
  name: 'get_subway_delays',
  description: 'Get current subway delays across all lines',
  inputSchema: {
    type: 'object',
    properties: {
      line: {
        type: 'string',
        description: 'Specific subway line (e.g., "A", "L", "7")'
      }
    }
  }
}

// Add to switch statement
case 'get_subway_delays':
  return await getSubwayDelays(params);
```

### 4. Add Tests (Optional but Recommended)

```javascript
// test/mta-delays.test.js
import { test } from 'node:test';
import assert from 'node:assert';

test('Subway delays - validate line parameter', () => {
  // Test validation logic
});
```

### 5. Update Documentation

Add tool to `docs/TOOL-REFERENCE.md`:

```markdown
### get_subway_delays

**Description**: Get current subway delays

**Parameters**:
- `line` (optional): Specific subway line

**Example**:
\`\`\`
get_subway_delays({ line: "A" })
\`\`\`
```

---

## Coding Standards

### Style

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Line length**: Aim for 100 characters
- **ES Modules**: Use `import/export`, not `require()`

### Naming Conventions

```javascript
// Functions: camelCase
function getSubwayDelays() {}

// Constants: UPPER_SNAKE_CASE
const API_ENDPOINT = 'https://...';

// Variables: camelCase
const responseData = await fetch();

// Files: kebab-case
// get-subway-delays.js (NOT getSubwayDelays.js)
```

### Error Handling

```javascript
// Always wrap API calls in try/catch
try {
  const response = await axios.get(endpoint);
  return response.data;
} catch (error) {
  // Return standard error envelope
  return {
    success: false,
    error: {
      type: 'API_ERROR',
      message: `Failed to fetch data: ${error.message}`,
      guidance: 'Check API endpoint and parameters'
    }
  };
}
```

### Input Validation

```javascript
import { validateBorough, validateDays, batchValidate } from '../../../lib/input-validation.js';

// Always validate user inputs
const validation = batchValidate({
  borough: validateBorough(params.borough),
  days: validateDays(params.days, { min: 1, max: 365 })
});

if (!validation.valid) {
  return validation.error;
}
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
node test/window-bounds.test.js
```

### Writing Tests

We use **Node.js built-in test runner** (no Jest needed):

```javascript
import { test } from 'node:test';
import assert from 'node:assert';

test('Description of what is tested', () => {
  const result = functionUnderTest(input);

  assert.strictEqual(result.value, expectedValue);
  assert.ok(result.valid, 'Should be valid');
});
```

### Test Coverage Focus

We prioritize **critical logic** over **coverage percentage**:

✅ **DO test**:
- Math that could break (divide-by-zero, calculations)
- Security critical (SQL injection, validation)
- Complex algorithms (deduplication, time windows)

❌ **DON'T test**:
- HTTP fetching (stable, low risk)
- JSON parsing (built-in, reliable)
- Simple wrappers (no logic to break)

---

## Commit Messages

### Format

```
<type>: <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Adding/updating tests
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `chore`: Maintenance tasks

### Examples

**Good**:
```
feat: Add subway delay tracking tool

Implements MTA real-time feed integration for subway delays.
Includes validation, caching, and error handling.

Closes #42
```

**Bad**:
```
fixed stuff
```

---

## Adding a Data Source

### 1. Research the API

- Find the Socrata endpoint
- Understand the data structure
- Test queries manually
- Check rate limits

### 2. Create Directory

```bash
mkdir -p mcps/nyc-newsource/tools
```

### 3. Implement Tools

Create 2-4 related tools (search, analyze, health check, etc.)

### 4. Add Tests

Focus on critical calculations and validation.

### 5. Document

- Add tools to TOOL-REFERENCE.md
- Update README.md with new data source
- Add examples

---

## Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Creating a Release

1. Update version in `package.json`
2. Update `docs/CHANGELOG.md`
3. Commit: `git commit -m "chore: Release v1.2.0"`
4. Tag: `git tag v1.2.0`
5. Push: `git push --tags`

---

## Code of Conduct

### Our Standards

✅ **Be respectful**: Treat everyone with respect and kindness
✅ **Be constructive**: Provide helpful, actionable feedback
✅ **Be inclusive**: Welcome contributors of all backgrounds
✅ **Be professional**: Keep discussions focused on the project

❌ **Don't**:
- Use offensive language
- Attack people personally
- Post spam or off-topic content
- Share others' private information

### Enforcement

Violations will result in:
1. Warning
2. Temporary ban
3. Permanent ban

Report violations to: [maintainer email]

---

## Getting Help

### Documentation

- **Quick Start**: [docs/QUICKSTART.md](docs/QUICKSTART.md)
- **Tool Reference**: [docs/TOOL-REFERENCE.md](docs/TOOL-REFERENCE.md)
- **Production Guide**: [docs/PRODUCTION.md](docs/PRODUCTION.md)

### Community

- **GitHub Discussions**: Ask questions, share ideas
- **GitHub Issues**: Report bugs, request features
- **NYC Open Data Forum**: Learn about data sources

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## Questions?

**Not sure where to start?**
- Look for issues labeled `good first issue`
- Ask in GitHub Discussions
- Read existing code to understand patterns

**Want to propose a major change?**
- Open an issue first to discuss
- Get feedback before investing time
- Consider backward compatibility

---

**Thank you for contributing to NYC Open Data accessibility!** 🗽

*Every contribution, no matter how small, makes a difference.*
