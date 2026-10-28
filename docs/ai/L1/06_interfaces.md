# 06 Interfaces

> Actual scenario API, event and configuration boundaries.

## Browser Or User-Facing APIs

- `GET /api/generate-agora-token`: optional uid/channel; returns `{ token, uid, channel }`; server credential/configuration errors return failure.
- `POST /api/invite-agent`: requester/channel are required. The browser supplies `requester_id` and `channel_name`; the invite route creates and binds the simulated clinic session when tools are enabled. Returns Agent ID, creation time and state; input and runtime failures are reported explicitly.
- `POST /api/stop-conversation`: requires agent_id; already-stopping/not-found handling is idempotent.
- `POST /api/chat/completions`: optional custom-LLM proxy, not used by the default managed pipeline.

The tools are `read_clinic_information`, `identify_patient`, `find_open_times`, `book_appointment`, `manage_appointment` and `record_emergency_escalation`. Each uses `POST /api/scenarios/05-medical-triage-booking/sessions/{sessionId}/{toolName}` with the call ID fixed by the server. Only a slot from the latest search can be booked. A failed move preserves the original appointment.

Only public clinic facts, policies, doctors and example appointment times enter the prompt; patient fixtures are excluded. The assistant discusses appointment intent but cannot verify identity, find actual openings or change appointments.

Six tools operate on an isolated simulated call. The server creates the clinic session only when a valid public tool origin is configured. No hospital, calendar or EHR account is needed.

Use the scenario-specific entry and persistent identity; starting voice requires a user action.



See [scenario guide](../../scenario/README.md) and the scenario source for exact business request shapes, validation errors and ownership rules.

## Events And Media

RTC carries microphone and synthesized audio. RTM/toolkit provides TRANSCRIPT_UPDATED, AGENT_STATE_CHANGED, AGENT_METRICS, completed-turn, error and SAL events where reported. Normalize toolkit local uid zero before display and retain interrupted turns. Preserve missing metric fields and data provenance; Inspector outcomes are manually confirmed.

## Environment Contract

Local Next.js reads `.env.local` from tracked `env.local.example`. Hosted/Docker servers inject runtime values; the public App ID must also be supplied to the browser build.

| Variable | Required | Owner / exposure | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_AGORA_APP_ID` | Required | Next.js build and runtime; public | App ID from the selected Agora project; Docker must receive the same value at build and runtime. |
| `NEXT_AGORA_APP_CERTIFICATE` | Required | Next.js server runtime; secret | Signs RTC/RTM credentials and authenticates managed Agent operations; never a build argument. |
| `TOP_TEN_SCENARIO_TOOL_BASE_URL` | Optional | Next.js server; non-secret | This same app's public HTTPS origin. Omit for default conversation; enabling tools requires actual cloud reachability. |

## External Services

The server uses agora-agents with the configured managed STT/LLM/TTS providers. The browser uses RTC, Signaling and the Agent Client Toolkit. Optional business tools call this same app over public HTTPS, and their returned success is required before reporting an action complete. Provider BYOK blocks are opt-in, server-only and require separate verification.

## Related Deep Dives

- [Tokens](L2/token_model.md)
- [Transcript pipeline](L2/transcript_pipeline.md)
- [Agent configuration](L2/invite_agent_config.md)
