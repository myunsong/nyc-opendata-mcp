# NYC Buildings MCP Server

Streamable HTTP MCP server for NYC building datasets: GeoSearch address resolution, PLUTO parcels, DOB job applications and violations, FISP filings, landmark status, and building footprints.

## Run locally
- Requirements: Node.js 18+
- `npm install`
- `npm run dev` (builds then starts the HTTP MCP server)
- `npm start` (after a build) to run directly from `dist/`
- Set `PORT` if you want something other than the default `3001`
- Optional: set `ALLOWED_HOSTS` (comma-separated, no ports) to enforce Host header validation. Leave unset for container platforms where the hostname is dynamic.
- Optional: set `AUTH_TOKEN` to require `x-api-key` on all requests (returns 401 otherwise).
- MCP endpoint: `http://localhost:3001/mcp` (Streamable HTTP transport)

## Tools
- `resolve_address` — GeoSearch lookup returning BBL/BIN candidates
- `get_pluto` — PLUTO record by borough, block, lot
- `get_dob_job_applications` — DOB job application filings by BIN
- `get_dob_violations` — DOB violations by BIN
- `get_fisp_filings` — DOB NOW: Safety facade filings by BIN (optional cycle)
- `get_landmark_status` — Landmark status by BIN
- `get_building_footprint` — Building footprint geometry by BIN

## Deploy in a container
```bash
docker build -t nyc-buildings-mcp .
docker run -p 3001:3001 nyc-buildings-mcp
```

## Repo layout
- `src/` TypeScript source for the building MCP server (Streamable HTTP)
- `dist/` compiled output (`npm run build` regenerates)
- `legacy-open-data/` archived multi-domain NYC Open Data server (311/HPD/DOT/Events/Comptroller) kept only for reference
