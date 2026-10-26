---
recipe_version: 0.2.0
recipe_status: draft
extension_points:
  - id: prompts.system
    name: Scenario role, workflow, guardrails and greeting
  - id: scenario.data
    name: Local business knowledge and fixtures
  - id: api.routes
    name: Scenario routes and optional server-bound tools
  - id: pipeline.providers
    name: Managed speech, model, voice and turn detection
  - id: ui.conversation
    name: Scenario presentation and real session evidence
invariants:
  - id: tokens.rtc-rtm
    summary: Keep combined RTC and RTM token privileges and server-only certificates
  - id: lifecycle.strict-mode
    summary: Preserve the initialization guard and hook-owned cleanup
  - id: transcript.uid-remap
    summary: Remap local user UID zero and retain interrupted turns
  - id: scenario.outcome
    summary: Report business success only from the corresponding successful result
stable_contracts:
  - id: env.required
    summary: Use NEXT_PUBLIC_AGORA_APP_ID and server-only NEXT_AGORA_APP_CERTIFICATE in .env.local
  - id: api.token
    summary: GET /api/generate-agora-token returns token, uid and channel
  - id: api.invite-agent
    summary: Preserve this scenario's startup fields and server-bound tool scope
  - id: api.stop-conversation
    summary: POST /api/stop-conversation accepts agent_id
  - id: verification.canonical
    summary: pnpm run verify covers local contracts and build; Docker and live speech are separate
---

# Quickstart Recipe Profile

For the eight-part user guide, read [Clinic Reception & Appointments](../../RECIPE.md).

## Recipe Role

- Role: `base` standalone scenario recipe, derived from the official Agora Next.js voice quickstart.
- Audience: developers running or integrating Clinic Reception & Appointments.
- Reuse: inspect this source, configure the documented project, verify default conversation, then enable requested business tools.

## Recipe Scope

A receptionist for the fictional Agora Family Clinic in Boston answers practice questions and, with tools enabled, identifies a fictional patient, finds eligible openings, and books, lists, moves or cancels simulated appointments. Emergency meaning takes priority over routine scheduling.

Default conversation: Only public clinic facts, policies, doctors and example appointment times enter the prompt; patient fixtures are excluded. The assistant discusses appointment intent but cannot verify identity, find actual openings or change appointments.

Optional tools: Six tools operate on an isolated simulated call. The server creates the clinic session only when a valid public tool origin is configured. No hospital, calendar or EHR account is needed.

Limits: All patients, slots and bookings are fictional. The assistant does not diagnose, prescribe, contact a nurse, place an emergency call or create a real medical appointment. Use fictional identity details when trying the demo.

## Baseline Implementation Guidance

The optional custom-LLM endpoint keeps HTTP wiring in `app/api/chat/completions/route.ts`
and its reusable/testable SSE handler in `lib/chat-completions.ts`, following the
official Next.js starter. This does not enable custom LLM mode by default.

The upstream baseline is [AgoraIO-Conversational-AI/agent-quickstart-nextjs](https://github.com/AgoraIO-Conversational-AI/agent-quickstart-nextjs). This repository is its scenario derivative, not a replacement identity for upstream. Use current source and the [code map](L1/03_code_map.md); do not recreate SDK schemas, tokens or lifecycle from memory. [Bootstrap guidance](L1/L2/from_scratch_bootstrap.md) documents the copy map.

## Extension Points

| Surface | Source | Verification |
| --- | --- | --- |
| Practice, doctors and fictional identities | `lib/medical-triage-booking/clinic.json` | pnpm run verify:scenario; verify the relevant acceptance case |
| Appointment rules and state | `lib/medical-triage-booking/clinic.ts` | pnpm run verify:scenario; verify the relevant acceptance case |
| Reception and emergency policy | `lib/agent-config.ts` | pnpm run verify:scenario; verify the relevant acceptance case |

- `lib/agent-config.ts`: default/tool prompt assembly.
- `lib/agent-tools.ts`: available REST tools and parameter/call scope.
- `app/api/invite-agent/route.ts`: providers, turn detection and managed Agent lifecycle.
- `lib/presentation.ts` and scenario presentation: visible identity, start action and developer paths.
- `components/ScenarioInspector.tsx`, `lib/inspection.ts`: reported session evidence. Preserve missing values and manual outcome provenance.

## Invariants

- Keep `RtcTokenBuilder.buildTokenWithRtm` and the common Agent UID in `lib/agora.ts`.
- Preserve the StrictMode `isReady` guard and toolkit initialization after RTC join.
- Let `useJoin`, `useLocalMicrophoneTrack` and `usePublish` own leave, track cleanup and publication.
- Remap toolkit `uid="0"` to the local user; retain interrupted transcript turns.
- Keep certificates/provider keys on the server and business tools scoped to the appropriate call.
- Never infer a saved result from transcript text or replace failed tools with fixture success.
- All patients, slots and bookings are fictional. The assistant does not diagnose, prescribe, contact a nurse, place an emergency call or create a real medical appointment. Use fictional identity details when trying the demo.

## Stable Contracts

- `GET /api/generate-agora-token` returns `{ token, uid, channel }`.
- `POST /api/invite-agent` starts the scenario Agent. The browser supplies `requester_id` and `channel_name`; the invite route creates and binds the simulated clinic session when tools are enabled.
- `POST /api/stop-conversation` accepts `{ agent_id }`; already-stopping states are idempotent.
- The tools are `read_clinic_information`, `identify_patient`, `find_open_times`, `book_appointment`, `manage_appointment` and `record_emergency_escalation`. Each uses `POST /api/scenarios/08-medical-triage-booking/sessions/{sessionId}/{toolName}` with the call ID fixed by the server. Only a slot from the latest search can be booked. A failed move preserves the original appointment.
- Local environment: `env.local.example` → `.env.local`; required keys are the public App ID and server-only App Certificate. [All variables](L1/01_setup.md) include optional business-tool/storage paths.
- Node.js 22+, pnpm 9.15.9; canonical checks are `pnpm run verify`. `pnpm run verify:docker` is a separate image/startup/scenario-route check.
- The simulated clinic uses one Node process and process-local sessions that expire after two hours. Restart resets the fixtures; multiple workers do not share appointments. A hosted demo needs a long-lived process, and a production integration needs shared durable state.

## Internal / Subject To Change

Component layout, presentation copy, model/provider defaults, UI diagnostics and internal storage implementation are not stable external APIs. Inspect source rather than importing undocumented internals.

## Consumer Onboarding Recipe

1. Clone `https://github.com/littleDogWang/08-medical-triage-booking.git` and change into `08-medical-triage-booking`.
2. With Node.js 22+ and pnpm 9.15.9, run `pnpm install --frozen-lockfile`.
3. Copy `env.local.example` to `.env.local` only on a clean clone; fill the two Agora project credentials. Alternatively use the ready CLI's template-aware `agora quickstart env write . --template nextjs --project <your-project> --json`.
4. Run `pnpm run doctor`, then `pnpm run dev`. Open http://localhost:3000 and choose the scenario start action.
5. Verify two-way speech/transcript with a real call. Only public clinic facts, policies, doctors and example appointment times enter the prompt; patient fixtures are excluded. The assistant discusses appointment intent but cannot verify identity, find actual openings or change appointments.
6. If requested, configure this same app's public HTTPS business-tool origin and start a fresh conversation; verify actual callbacks and result state.
7. Run `pnpm run verify`. For containers, follow [README Docker](../../README.md#docker) and run `pnpm run verify:docker`.
8. Customize only supported surfaces, synchronize this contract and the public guide, and repeat relevant checks. Repository edits do not register or publish a recipe automatically.
