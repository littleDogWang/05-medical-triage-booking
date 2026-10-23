# Contributing To Clinic Reception & Appointments

## Development Setup

Follow [README setup](README.md#run-it) with Node.js 22+ and pnpm 9.15.9. Use `env.local.example` as the tracked schema and `.env.local` for local credentials. Keep existing credentials private. Install Docker separately only for the container check.

## Development Workflow

Use a scoped branch, preserve unrelated local work and make the smallest complete change. Read [AGENTS.md](AGENTS.md), the AI repo card and the internal recipe before changing lifecycle or contracts. Run focused checks while editing and the canonical checks before delivery. Local edits, commits, pushes and remote review operations have separate authorization boundaries; do not publish as a side effect of local verification.

## Coding Standards

Use English TypeScript/documentation and the existing ESLint configuration. Keep the StrictMode guard, hook ownership, RTM-capable tokens, transcript UID remap and interrupted turns. Log diagnostic context without credentials or business capability IDs. Return explicit validation errors; never turn a failed tool or disk operation into success. Use U.S. fictional data with explicit, date-correct time zones.

## Testing

`pnpm run verify` runs pnpm run doctor && pnpm run verify:template && pnpm run lint && pnpm run typecheck && pnpm run verify:api && pnpm run verify:scenario && pnpm run build. Focused checks are listed in [README commands](README.md#commands).

`pnpm run verify:docker` separately builds the production image and checks startup plus a scenario route with synthetic credentials. A running Docker engine is required. No real Agora session is started by this check. Run a real microphone and cloud-tool session for speech acceptance; the scenarios' [acceptance matrix](scenarios/08-medical-triage-booking/acceptance.md) defines the cases.

## Pull Requests

Describe the changed behavior, relevant checks and actual evidence level. Keep screenshots, logs and synthetic acceptance records local unless explicitly requested. Synchronize README, architecture, AGENTS, public/internal recipes and affected L1/L2 files for interface or runtime changes. Update L0's review date. Use conventional commit descriptions, preserve attribution and do not bypass hooks.

## Security Reports

Send security reports privately to security@agora.io. Do not include secrets in public issues, images, screenshots or logs. Rotate exposed values with the credential owner.
