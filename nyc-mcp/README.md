# NYC Building Data MCP Server

This project exposes NYC building datasets over the Model Context Protocol (MCP) via Streamable HTTP. It includes tools for address resolution, PLUTO records, DOB job applications and violations, FISP filings, landmark status, and building footprints.

## Quick start

```bash
npm install
npm run dev   # builds then runs compiled server (HTTP transport)
# or run explicitly
npm run build
npm start
```

The server runs over MCP Streamable HTTP on `PORT` (default `3001`) at the `/mcp` route. Session headers are optional (server runs stateless with JSON responses enabled).

## Deploying to Azure (container)

1) Build and push the image (example):

```bash
docker build -t <registry>/nyc-mcp:latest .
docker push <registry>/nyc-mcp:latest
```

2) Create an Azure Container App or App Service pointing to the image. Set environment variable `PORT=3001` (App Service may also need `WEBSITES_PORT=3001`). Expose port 3001.

3) After deploy, your MCP endpoint is `https://<app-host>/mcp`. Point your MCP-capable client to that URL using the Streamable HTTP transport.

The MCP server listens on port 3001 by default.

## Tools

- `resolve_address`: GeoSearch lookup returning BBL/BIN candidates.
- `get_pluto`: PLUTO record by borough, block, lot.
- `get_dob_job_applications`: DOB job application filings by BIN.
- `get_dob_violations`: DOB violations by BIN.
- `get_fisp_filings`: DOB NOW: Safety facade filings by BIN (optional cycle).
- `get_landmark_status`: Landmark status by BIN.
- `get_building_footprint`: Building footprint geometry by BIN.

## Building a container

```bash
docker build -t nyc-mcp .
docker run -p 3001:3001 nyc-mcp
```
