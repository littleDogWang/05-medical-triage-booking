# Scenario Agent Configuration

> Read when changing Clinic Reception & Appointments's prompt, tools, provider chain or turn detection.

## Source Files

- `lib/agent-config.ts`: role, workflow, guardrails and greeting.
- `lib/agent-config.ts`: selected prompt and default/tool mode context.
- `lib/agent-tools.ts`: optional tool origin validation, schemas and server-bound scope.
- `app/api/invite-agent/route.ts`: actual SDK builder and session options.
- `lib/runtime-profile.ts`: non-secret configured provider/model display.

There are no generic Ada/ADA_PROMPT constants to edit. Use the scenario config and prompt assembly actually imported by the invite route.

## Request And Startup

The browser supplies `requester_id` and `channel_name`; the invite route creates and binds the simulated clinic session when tools are enabled.

The server reads the App ID and App Certificate, builds AgoraClient with the selected area, and creates an Agent. The configured pipeline is Deepgram nova-3, OpenAI gpt-4o-mini and MiniMax speech_2_6_turbo. Copy the route's current builder pattern and createSession options; do not add an extra client argument or reproduce older SDK signatures.

The browser and invite route share DEFAULT_AGENT_UID. RTM, transcript/error delivery and metrics remain enabled. Session startup returns the Agent ID, creation timestamp and state; ending uses that same Agent ID.

## Prompt And Tools

Default behavior: Only public clinic facts, policies, doctors and example appointment times enter the prompt; patient fixtures are excluded. The assistant discusses appointment intent but cannot verify identity, find actual openings or change appointments.

Tool behavior: Six tools operate on an isolated simulated call. The server creates the clinic session only when a valid public tool origin is configured. No hospital, calendar or EHR account is needed.

The tools are `read_clinic_information`, `identify_patient`, `find_open_times`, `book_appointment`, `manage_appointment` and `record_emergency_escalation`. Each uses `POST /api/scenarios/05-medical-triage-booking/sessions/{sessionId}/{toolName}` with the call ID fixed by the server. Only a slot from the latest search can be booked. A failed move preserves the original appointment.

All patients, slots and bookings are fictional. The assistant does not diagnose, prescribe, contact a nurse, place an emergency call or create a real medical appointment. Use fictional identity details when trying the demo.

## Provider And Turn Detection Changes

Edit the actual constructor blocks and turnDetection.config fields in the invite route. Provider BYOK examples are opt-in; keys stay server-side and are not part of the default two-key environment contract. For recruitment, preserve the configured 1,500 ms end-of-speech pause and 50-message LLM history unless intentionally changing interview pacing.

## Verification

Run `pnpm run verify:api`, `pnpm run verify:scenario` and canonical `pnpm run verify`. Real microphone pacing, interruptions and cloud HTTP execution require separate acceptance; mock Agent startup cannot establish those outcomes.

## See Also

- [Interfaces](../06_interfaces.md)
- [Workflows](../05_workflows.md)
- [Token model](token_model.md)
