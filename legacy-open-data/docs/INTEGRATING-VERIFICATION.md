# How to Integrate Verification Into All Tools

**Quick guide for adding verification metadata to the remaining 16 tools**

---

## Current Status

✅ **Completed:** `search_comptroller_spending` (1/17 tools)
⏳ **Remaining:** 16 tools need integration

---

## 3-Step Integration

### Step 1: Import the library

Add to the top of each tool file:

```javascript
import { enrichWithVerification } from '../../../lib/verification.js';
```

**Files to update:**
- `mcps/nyc-311/tools/*.js` (4 files)
- `mcps/nyc-comptroller/tools/*.js` (2 remaining files)
- `mcps/nyc-hpd/tools/*.js` (4 files)
- `mcps/nyc-dot/tools/*.js` (3 files)
- `mcps/nyc-events/tools/*.js` (3 files)

---

### Step 2: Wrap the return statement

**Before:**
```javascript
return {
  success: true,
  count: response.data.length,
  complaints: response.data.map(...)
};
```

**After:**
```javascript
const result = {
  success: true,
  count: response.data.length,
  complaints: response.data.map(...)
};

return enrichWithVerification(result, 'data-source-id', params);
```

---

### Step 3: Use the correct data source ID

| Tool File | Data Source ID |
|-----------|----------------|
| `nyc-311/tools/search_complaints.js` | `'311'` |
| `nyc-311/tools/get_response_times.js` | `'311'` |
| `nyc-311/tools/analyze_trends.js` | `'311'` |
| `nyc-311/tools/get_neighborhood_health.js` | `'311'` |
| `nyc-comptroller/tools/search_spending.js` | `'comptroller-spending'` ✅ |
| `nyc-comptroller/tools/search_contracts.js` | `'comptroller-contracts'` |
| `nyc-comptroller/tools/get_payroll.js` | `'comptroller-payroll'` |
| `nyc-hpd/tools/search_violations.js` | `'hpd-violations'` |
| `nyc-hpd/tools/search_complaints.js` | `'hpd-complaints'` |
| `nyc-hpd/tools/get_registrations.js` | `'hpd-registrations'` (needs to be added to verification.js) |
| `nyc-hpd/tools/get_housing_health.js` | `'hpd-violations'` (uses violations dataset) |
| `nyc-dot/tools/search_street_closures.js` | `'dot-closures'` |
| `nyc-dot/tools/get_parking_violations.js` | `'dot-violations'` (needs to be added) |
| `nyc-dot/tools/get_traffic_volume.js` | `'dot-traffic'` (needs to be added) |
| `nyc-events/tools/search_events.js` | `'events'` |
| `nyc-events/tools/get_upcoming_events.js` | `'events'` |
| `nyc-events/tools/analyze_event_impact.js` | `'events'` |

---

## Missing Data Sources

These need to be added to `lib/verification.js` in the `getDataSourceInfo()` function:

### HPD Registrations
```javascript
'hpd-registrations': {
  name: 'HPD Building Registrations',
  authority: 'NYC Department of Housing Preservation & Development',
  update_frequency: 'Daily',
  api_type: 'Socrata Open Data API',
  credibility: 'Official City Housing Data',
  dataset_id: 'tesw-yqqr'
}
```

### DOT Parking Violations
```javascript
'dot-violations': {
  name: 'DOT Parking Violations',
  authority: 'NYC Department of Transportation',
  update_frequency: 'Daily',
  api_type: 'Socrata Open Data API',
  credibility: 'Official City Transportation Data',
  dataset_id: 'nc67-uf89'
}
```

### DOT Traffic Volume
```javascript
'dot-traffic': {
  name: 'DOT Traffic Volume Counts',
  authority: 'NYC Department of Transportation',
  update_frequency: 'Annually',
  api_type: 'Socrata Open Data API',
  credibility: 'Official City Transportation Data',
  dataset_id: 'btm5-ppia'
}
```

---

## Full Example: Integrating into search_311_complaints.js

### Original Code:
```javascript
import axios from 'axios';

const SOCRATA_ENDPOINT = 'https://data.cityofnewyork.us/resource/erm2-nwe9.json';

export default async function searchComplaints(params) {
  const { complaint_type, borough, start_date, end_date, limit = 100 } = params;

  // Build query...
  const query = { $limit: limit, $order: 'created_date DESC' };

  try {
    const response = await axios.get(SOCRATA_ENDPOINT, { params: query });

    return {
      success: true,
      count: response.data.length,
      complaints: response.data.map(complaint => ({
        unique_key: complaint.unique_key,
        created_date: complaint.created_date,
        complaint_type: complaint.complaint_type,
        descriptor: complaint.descriptor,
        borough: complaint.borough,
        location: {
          address: complaint.incident_address,
          latitude: complaint.latitude,
          longitude: complaint.longitude
        },
        status: complaint.status,
        agency: complaint.agency,
        resolution_description: complaint.resolution_description
      }))
    };
  } catch (error) {
    throw new Error(`Failed to search complaints: ${error.message}`);
  }
}
```

### Updated Code:
```javascript
import axios from 'axios';
import { enrichWithVerification } from '../../../lib/verification.js';  // ← ADD THIS

const SOCRATA_ENDPOINT = 'https://data.cityofnewyork.us/resource/erm2-nwe9.json';

export default async function searchComplaints(params) {
  const { complaint_type, borough, start_date, end_date, limit = 100 } = params;

  // Build query...
  const query = { $limit: limit, $order: 'created_date DESC' };

  try {
    const response = await axios.get(SOCRATA_ENDPOINT, { params: query });

    const result = {  // ← CAPTURE RESULT
      success: true,
      count: response.data.length,
      complaints: response.data.map(complaint => ({
        unique_key: complaint.unique_key,
        created_date: complaint.created_date,
        complaint_type: complaint.complaint_type,
        descriptor: complaint.descriptor,
        borough: complaint.borough,
        location: {
          address: complaint.incident_address,
          latitude: complaint.latitude,
          longitude: complaint.longitude
        },
        status: complaint.status,
        agency: complaint.agency,
        resolution_description: complaint.resolution_description
      }))
    };

    // ← ADD VERIFICATION
    return enrichWithVerification(result, '311', params);
  } catch (error) {
    throw new Error(`Failed to search complaints: ${error.message}`);
  }
}
```

**Changes:**
1. Added import
2. Captured result in a variable
3. Called `enrichWithVerification()` with data source `'311'`

---

## Testing After Integration

### 1. Run the tool:
```bash
node -e "
  import('./mcps/nyc-311/tools/search_complaints.js')
    .then(mod => mod.default({ borough: 'BROOKLYN', limit: 5 }))
    .then(result => console.log(JSON.stringify(result, null, 2)))
"
```

### 2. Check the output includes:
```json
{
  "success": true,
  "count": 5,
  "complaints": [...],

  "_verification": {
    "data_source": {
      "name": "NYC 311 Service Requests",
      "authority": "NYC Department of Information Technology & Telecommunications",
      ...
    },
    "verification_urls": {
      "main_portal": "https://data.cityofnewyork.us/",
      "dataset_specific": "https://data.cityofnewyork.us/Social-Services/311-Service-Requests/erm2-nwe9"
    },
    "trust_score": { "overall": 95, ... }
  },

  "_how_to_verify": {
    "message": "Every number in this response comes from NYC Open Data APIs...",
    "spot_check_instructions": [...],
    "hallucination_risk": "Near-zero (<1%)"
  }
}
```

### 3. Verify the URLs work:
- Click `dataset_specific` URL
- Should open NYC Open Data
- Should show the 311 Service Requests dataset

---

## Batch Update Script

Want to update all files at once? Use this:

```bash
#!/bin/bash

# Add import to all tool files
find mcps/*/tools/*.js -type f | while read file; do
  if ! grep -q "enrichWithVerification" "$file"; then
    # Add import after first import
    sed -i '' "1a\\
import { enrichWithVerification } from '../../../lib/verification.js';
" "$file"
    echo "✅ Updated: $file"
  fi
done

echo "Import added to all files. Now manually update each return statement."
```

**Note:** You'll still need to manually update the return statements since they vary by tool.

---

## Common Pitfalls

### ❌ Wrong:
```javascript
// Don't inline the enrichWithVerification call if you need the original result
return enrichWithVerification({
  success: true,
  data: processData(response)  // processData runs twice if logging result!
}, '311', params);
```

### ✅ Right:
```javascript
const result = {
  success: true,
  data: processData(response)  // processData runs once
};

return enrichWithVerification(result, '311', params);
```

---

### ❌ Wrong:
```javascript
// Don't forget to pass params
return enrichWithVerification(result, '311');  // Missing params!
```

### ✅ Right:
```javascript
return enrichWithVerification(result, '311', params);  // Params included
```

---

### ❌ Wrong:
```javascript
// Don't use wrong data source ID
return enrichWithVerification(result, 'nyc-311', params);  // Should be '311'
```

### ✅ Right:
```javascript
return enrichWithVerification(result, '311', params);  // Matches getDataSourceInfo()
```

---

## Verification URL Customization

Some tools may benefit from query-specific verification URLs:

### Example: Payroll search by name
```javascript
// In lib/verification.js, getVerificationUrls():

if (dataSource === 'comptroller-payroll' && params.last_name) {
  urls.search_query = `https://www.checkbooknyc.com/payroll?q=${encodeURIComponent(params.last_name)}`;
}
```

This generates a direct search link for the user.

---

## Next Steps

1. **Update `lib/verification.js`**: Add missing data sources (HPD registrations, DOT violations, DOT traffic)
2. **Integrate verification**: Update all 16 remaining tool files
3. **Test**: Run each tool and verify `_verification` field appears
4. **Update tests**: Add verification checks to test suite
5. **Deploy**: Push changes and update MCP server

---

## Estimated Time

- **Per tool**: ~5 minutes
- **Total for 16 tools**: ~90 minutes
- **Adding missing data sources**: ~15 minutes
- **Testing**: ~30 minutes

**Total**: ~2.5 hours for full integration

---

## Questions?

Refer to:
- [DATA-VERIFICATION.md](DATA-VERIFICATION.md) - User-facing verification guide
- [VERIFICATION-SUMMARY.md](VERIFICATION-SUMMARY.md) - Technical overview
- [lib/verification.js](../lib/verification.js) - Implementation

---

**Once complete, every query will have built-in verification - making this the most trustworthy civic data tool available.** 🔍✅
