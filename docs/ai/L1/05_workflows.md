# 05 Workflows

> Complete development and delivery workflows.

## First Success

```bash
git clone https://github.com/littleDogWang/05-medical-triage-booking.git
cd 05-medical-triage-booking
pnpm install --frozen-lockfile
cp env.local.example .env.local
```

Fill the two required Agora values in `.env.local`, then run `pnpm run doctor` and `pnpm run dev`. Keep an existing env file instead of overwriting it. With a ready Agora CLI, use `agora quickstart env write . --template nextjs --project <your-project> --json` to write template-aware keys for an existing authorized project. Check `agora version` and `agora doctor --json` first; do not create or change a remote project without authorization.

Open http://localhost:3000 and start the scenario. Confirm actual two-way audio and both transcript roles; use [the public guide](../../../RECIPE.md#2-try-the-demo) for concrete cases. Only public clinic facts, policies, doctors and example appointment times enter the prompt; patient fixtures are excluded. The assistant discusses appointment intent but cannot verify identity, find actual openings or change appointments.

## Modify The Agent Or Core Flow

Edit `lib/agent-config.ts` and the selected data/rules, then inspect prompt assembly in lib/agent-config.ts and provider/turn detection in the invite route. Preserve the internal recipe invariants. Run scenario/API checks and canonical verify; repeat real speech cases for timing or behavior changes.

## Modify The Client Or UI

Use scenario presentation and existing components. Preserve the initial Dialog, persistent identity, real toolkit/Glass callbacks and RTC/RTM ownership. Use the scenario-specific entry and persistent identity; starting voice requires a user action. Render desktop/mobile and inspect real states before delivery.

## Change An Interface

Update the owning route/types, browser consumer, tool schema, matching checks and docs together. The browser supplies `requester_id` and `channel_name`; the invite route creates and binds the simulated clinic session when tools are enabled. Never introduce caller-selectable business scope or imply a successful write from a verbal summary.

## Deploy

Local development runs one Next.js process at http://localhost:3000 using `.env.local`. Native production uses `pnpm run build` then `pnpm run start`. Docker runs the same app as non-root UID 1001 on port 3000, without a reverse proxy inside the image. The simulated clinic uses one Node process and process-local sessions that expire after two hours. Restart resets the fixtures; multiple workers do not share appointments. A hosted demo needs a long-lived process, and a production integration needs shared durable state.

Follow [README Docker](../../../README.md#docker): public App ID at build, both Agora values at runtime, port 3000, and a persistent .scenario-data volume where required. Run `pnpm run verify:docker`; test live cloud tool calls independently.

## Diagnose A Failure

Inspect the exact failing token, invite, RTM or business API response. Separate setup, transport, provider and tool failures. Reproduce one narrow case, compare the documented contract with its source, then run the matching check. A local URL does not prove public callback reachability, and a built image does not prove speech.

## Related Deep Dives

- [Lifecycle](L2/conversation_lifecycle.md)
- [Agent configuration](L2/invite_agent_config.md)
