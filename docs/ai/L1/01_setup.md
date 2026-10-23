# 01 Setup

> Setup and verification for Clinic Reception & Appointments.

## Prerequisites

Node.js 22+, pnpm 9.15.9 and repository access. A running Docker engine is needed for container checks. Live speech requires an Agora project with RTC, Signaling and Conversational AI, internet access and microphone permission. Agora CLI is optional for manual setup; use its readiness probe before binding.

## Environment

The tracked schema is `env.local.example`; the local file is `.env.local`. Keep existing credentials when reusing a clone. Docker's public App ID is a build argument and must match the runtime App ID; its certificate is runtime-only.

| Variable | Required | Owner / exposure | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_AGORA_APP_ID` | Required | Next.js build and runtime; public | App ID from the selected Agora project; Docker must receive the same value at build and runtime. |
| `NEXT_AGORA_APP_CERTIFICATE` | Required | Next.js server runtime; secret | Signs RTC/RTM credentials and authenticates managed Agent operations; never a build argument. |
| `TOP_TEN_SCENARIO_TOOL_BASE_URL` | Optional | Next.js server; non-secret | This same app's public HTTPS origin. Omit for default conversation; enabling tools requires actual cloud reachability. |

## Setup

```bash
git clone https://github.com/littleDogWang/08-medical-triage-booking.git
cd 08-medical-triage-booking
pnpm install --frozen-lockfile
cp env.local.example .env.local
```

Fill the two required Agora values in `.env.local`, then run `pnpm run doctor` and `pnpm run dev`. Keep an existing env file instead of overwriting it. With a ready Agora CLI, use `agora quickstart env write . --template nextjs --project <your-project> --json` to write template-aware keys for an existing authorized project. Check `agora version` and `agora doctor --json` first; do not create or change a remote project without authorization.

## Development

Run `pnpm run dev` and open http://localhost:3000. Use the scenario-specific entry and persistent identity; starting voice requires a user action.

For local tool-enabled development only, install cloudflared separately and run `pnpm run dev:clinic` instead of the ordinary dev server. Stop an existing dev server first. This command starts a temporary tools-only HTTPS relay, writes no env file and stops both processes on Ctrl+C. It is optional, requires internet access and does not deploy the app.

## Verification

Run `pnpm run verify` for pnpm run doctor && pnpm run verify:template && pnpm run lint && pnpm run typecheck && pnpm run verify:api && pnpm run verify:scenario && pnpm run build. Run `pnpm run verify:docker` separately for image build, non-root startup and a synthetic scenario route. Follow [README deployment](../../../README.md#deployment) for native/Docker commands.

## Verification Safety

Template, lint, type, mocked API and scenario checks do not prove live speech. Doctor/full verify needs a populated local env file; CI uses synthetic values. Docker tests use synthetic credentials and do not start an Agora Agent. Cloud callback reachability and a complete spoken business flow require separate real acceptance.

## Related Deep Dives

- [Lifecycle](L2/conversation_lifecycle.md)
- [Tokens](L2/token_model.md)
- [Agent configuration](L2/invite_agent_config.md)
