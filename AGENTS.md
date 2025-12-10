# Repository Guidelines

## Project Structure & Module Organization
- Entry point `index.js` registers the MCP server and all tool definitions.
- Domain tools live in `mcps/<domain>/tools/*.js` (311, HPD, DOT, events, comptroller); tool ids stay snake_case to match handler filenames.
- Shared helpers in `lib/` (`input-validation.js`, `time-windows.js`, `verification.js`, `standard-envelope.js`, etc.) handle Socrata safety, envelopes, and scoring—reuse before adding new utilities.
- Reference docs sit in `docs/` (verification, production, changelog), canned prompts in `examples/`, generated fixtures in `outputs/`, and the node:test suite in `test/`.

## Build, Test, and Development Commands
- `npm install` — install dependencies (Node ≥18).
- `npm start` or `node index.js` — run the MCP server locally over stdio.
- `npm test` or `node test/test-runner.js` — execute the 64-node:test suite; use `node test/<file>.test.js` to focus.
- `npx @forest723/nyc-mcp` — smoke-check the published package without cloning.
- Copy `.env.example` to `.env` and set `SOCRATA_APP_TOKEN` for higher Socrata limits; keep tokens out of commits.

## Coding Style & Naming Conventions
- ES modules, 2-space indentation, semicolons, single quotes, and `const`/`let` only; keep functions small with early returns and explicit defaults.
- Tool files stay snake_case to mirror tool ids; shared libraries use kebab-case filenames. Export defaults for tools; prefer named helpers in `lib/`.
- Keep request schemas strict (enum validation, bounds) and escape user strings via `lib/input-validation.js`; add comments only for non-obvious logic paths.

## Testing Guidelines
- Tests use `node:test` + `node:assert`. Mirror production logic with small fixtures; avoid network calls in tests.
- Add new coverage under `test/*.test.js` using existing patterns (e.g., `trend-calculations.test.js`). Name tests for the behavior they guard and keep them deterministic.
- Run `npm test` before pushing; include failures and fixes in the same change.

## Commit & Pull Request Guidelines
- Follow the repo history: short, imperative subject lines (e.g., `Add borough validation guard`, `Prepare for npm publish`). Keep to ~72 chars.
- PRs should describe the NYC data domains touched, note any tool input/output changes, link relevant issues, and paste `npm test` output. Update `docs/` or `examples/` when behavior shifts.
- Keep diffs minimal: prefer reusing `lib/` utilities instead of duplicating logic; add telemetry or verification messaging consistent with existing envelopes.
