# Repository Guidelines

## Project Structure & Module Organization
- Entry point: `src/server.ts` (compiled to `dist/server.js`) registers the Streamable HTTP MCP server.
- Building tools live in `src/tools/*.ts` (GeoSearch, PLUTO, DOB jobs/violations, FISP, landmarks, footprints); shared helpers in `src/utils/`.
- `legacy-open-data/` holds the old multi-domain NYC Open Data server (311/HPD/DOT/Events/Comptroller) for reference only.

## Build, Test, and Development Commands
- `npm install` — install dependencies (Node ≥18).
- `npm run dev` — build then start the HTTP MCP server on `PORT` (default `3001`).
- `npm run build` — TypeScript compile to `dist/`.
- `npm start` — run the compiled server from `dist/`.
- No automated test suite is wired up yet; add `node:test` coverage alongside new logic.

## Coding Style & Naming Conventions
- TypeScript + ES modules (NodeNext), 2-space indentation.
- Keep tool files snake_case to mirror tool ids; helpers in `src/utils/`.
- Small, focused functions with explicit defaults; add comments only for non-obvious logic paths.

## Environment
- Optional: `PORT` to change the HTTP port (default `3001`).

## Commit & Pull Request Guidelines
- Short, imperative subjects (e.g., `Add footprint tool`, `Tighten DOB validation`).
- Describe tool input/output changes and any verification steps (build/run notes).
- Keep diffs minimal and reuse helpers before introducing new utilities.
