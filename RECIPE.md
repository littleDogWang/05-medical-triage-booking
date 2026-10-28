# Clinic Reception & Appointments

Handle clinic questions and a complete simulated appointment conversation.

[Try locally](#2-try-the-demo) · [Source on GitHub](https://github.com/littleDogWang/05-medical-triage-booking) · [Build with AI](#build-with-ai)

TypeScript · Web · Next.js 16 / React 19 · Agora Conversational AI

## 1. Overview

A receptionist for the fictional Agora Family Clinic in Boston answers practice questions and, with tools enabled, identifies a fictional patient, finds eligible openings, and books, lists, moves or cancels simulated appointments. Emergency meaning takes priority over routine scheduling.

- Public clinic information and a doctor roster with adult/pediatric and new-patient eligibility.
- Six session-bound tools with offered-slot confirmation and atomic rescheduling.
- Emergency escalation that stops ordinary scheduling without claiming an emergency call or transfer.

**Default conversation:** Only public clinic facts, policies, doctors and example appointment times enter the prompt; patient fixtures are excluded. The assistant discusses appointment intent but cannot verify identity, find actual openings or change appointments.

**With business tools enabled:** Six tools operate on an isolated simulated call. The server creates the clinic session only when a valid public tool origin is configured. No hospital, calendar or EHR account is needed.

**Scope:** All patients, slots and bookings are fictional. The assistant does not diagnose, prescribe, contact a nurse, place an emergency call or create a real medical appointment. Use fictional identity details when trying the demo.

## 2. Try the Demo

Run [Quick Start](#5-quick-start), open [http://localhost:3000](http://localhost:3000), allow microphone access and choose **Talk to clinic reception**. A voice session starts only after your action. The Agora project must be configured even in default conversation mode; “local data” does not mean offline speech or a local LLM.

| Try | Say | Expected behavior |
| --- | --- | --- |
| Ask public questions | What are your hours, and which doctors accept new adult patients? | It explains configured practice information; Dr. Daniel Brooks accepts existing adults only. |
| Move a simulated appointment | I am Alex Morgan, born April 12, 1988. I would like to move my appointment. | With tools enabled, it identifies the fixture patient, lists the appointment, searches and moves it only to a chosen returned opening. |
| Prioritize an emergency | I have severe chest pressure and trouble breathing. | It gives emergency guidance; in tool mode it records escalation and stops ordinary scheduling without claiming to call anyone. |

Rows that describe tool actions require the optional public HTTPS tool configuration. In default mode, expect the limitations described above. These are acceptance cases to try, not a claim that a live voice run has passed. For the full scenario matrix, see [acceptance.md](docs/scenario/acceptance.md).

## 3. Architecture & Tech Stack

```mermaid
flowchart LR
  User["Browser: microphone, transcript and controls"]
  Server["Next.js API: tokens, invite and stop"]
  RTC["Agora RTC: voice audio"]
  RTM["Agora Signaling: transcript and Agent events"]
  Agent["Agora Conversational AI: STT → LLM → TTS"]
  Context["Scenario instructions and local data"]
  User -->|HTTPS| Server
  Server -->|start / stop| Agent
  Context --> Server
  User <-->|audio| RTC
  RTC <-->|audio| Agent
  Agent --> RTM
  RTM --> User
  Agent -. optional HTTPS tool calls .-> Business["This app's scenario API"]
  Business --> Data["Process-local state"]
```

| Component | Role |
| --- | --- |
| Agora RTC | Carries user microphone audio and synthesized Agent speech. |
| Agora Signaling (RTM) | Delivers transcript, Agent state, metrics and error events to the browser. |
| Agora Conversational AI | Runs the managed voice pipeline and configured business tools. |
| Next.js route handlers | Keep the App Certificate server-side, issue combined RTC/RTM tokens and manage Agent sessions. |
| Scenario modules | Supply instructions, demo data and the optional business API/tool contracts. |

The client uses `agora-rtc-react`, `agora-rtc-sdk-ng`, `agora-rtm` and `agora-agent-client-toolkit`; the server uses `agora-agents`. The configured pipeline is Deepgram nova-3 → OpenAI gpt-4o-mini → MiniMax speech_2_6_turbo with English speech. See [the invite route](app/api/invite-agent/route.ts) and [runtime profile](lib/runtime-profile.ts) when changing providers. No separate vendor API key is required for the default Agora-managed configuration.

## 4. Prerequisites & Configuration

- Node.js 22 or newer and pnpm 9.15.9.
- An Agora project with its App Certificate enabled, and access to RTC, Signaling and Conversational AI.
- Access to this repository. Cloning or sharing the source requires appropriate repository permissions.
- A browser with microphone access; use HTTPS for a hosted app.

| Variable | Required? | Where / purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_AGORA_APP_ID` | Required | App ID from your Agora Console project. |
| `NEXT_AGORA_APP_CERTIFICATE` | Required | App Certificate from the same project; server-side only. |
| `TOP_TEN_SCENARIO_TOOL_BASE_URL` | Optional | Public HTTPS origin of this same app, reachable by Agora cloud; enables the business tools described below. |

Create or select your project in [Agora Console](https://console.agora.io/), copy the App ID and enable/copy its App Certificate. Put them in `.env.local` using [env.local.example](env.local.example). Never prefix the certificate with `NEXT_PUBLIC_`, put it in client code or commit it.

Leave `TOP_TEN_SCENARIO_TOOL_BASE_URL` unset for the default conversation. To enable tools, deploy the same app at a reachable public HTTPS origin, set that variable on the server, restart/redeploy and start a fresh conversation. HTTP, localhost/private origins, malformed URLs and URLs with credentials, query or fragment are rejected. URL validation does not establish actual cloud reachability. In tool mode, a failed call must not be disguised as a successful fixture-based action.

For local tool-enabled development only, install cloudflared separately and run `pnpm run dev:clinic` instead of the ordinary dev server. Stop an existing dev server first. This command starts a temporary tools-only HTTPS relay, writes no env file and stops both processes on Ctrl+C. It is optional, requires internet access and does not deploy the app.

## 5. Quick Start

From a terminal, clone this scenario rather than the generic starter:

```bash
git clone https://github.com/littleDogWang/05-medical-triage-booking.git
cd 05-medical-triage-booking
pnpm install --frozen-lockfile
cp env.local.example .env.local
```

Edit `.env.local` and fill the two required Agora values from section 4. Then run these commands from the cloned repository root:

```bash
pnpm run doctor
pnpm run dev
```

Alternatively, if the [Agora CLI](https://github.com/AgoraIO/cli) is already installed, bind your project with `agora login`, `agora quickstart env write . --template nextjs --project <your-project> --json` instead of manually copying credentials. Use your actual project identifier in place of `<your-project>`.

Open [http://localhost:3000](http://localhost:3000), choose **Talk to clinic reception**, allow the microphone and try the first conversation above. Check that you can hear the assistant and see both speakers in the transcript. Then verify the scenario result under the configured mode; a transcript alone does not establish that a business action occurred.

## 6. How It Works

| User step | Assistant / application behavior | Result |
| --- | --- | --- |
| Ask about the practice or an appointment | Read public information; in tool mode identify the patient before appointment access. | Policy answers or a call-scoped fictional identity. |
| State date, doctor and time preferences | Search eligible openings, offer at most two and preserve unchanged preferences. | Returned slots in America/New_York, with unsupported preferences explained. |
| Choose or change an appointment | Book, cancel or atomically reschedule after the relevant confirmation. | The exact simulated doctor/date/time from a successful tool response. |

### Tools and result semantics

The tools are `read_clinic_information`, `identify_patient`, `find_open_times`, `book_appointment`, `manage_appointment` and `record_emergency_escalation`. Each uses `POST /api/scenarios/05-medical-triage-booking/sessions/{sessionId}/{toolName}` with the call ID fixed by the server. Only a slot from the latest search can be booked. A failed move preserves the original appointment.

The browser supplies `requester_id` and `channel_name`; the invite route creates and binds the simulated clinic session when tools are enabled. The supplied browser already handles this startup sequence. See [the scenario guide](docs/scenario/README.md) for additional behavior and contracts.

## 7. Customize for Your Business

| Change | Source | How |
| --- | --- | --- |
| Practice, doctors and fictional identities | [clinic.json](lib/medical-triage-booking/clinic.json) | Replace public facts and test patients; keep adult/pediatric eligibility and time-zone data consistent. |
| Appointment rules and state | [clinic.ts](lib/medical-triage-booking/clinic.ts) | Adapt eligibility, slot search and appointment storage without removing identity or confirmation checks. |
| Reception and emergency policy | [config.ts](lib/agent-config.ts) | Adapt conversation style and escalation guidance; preserve emergency priority over scheduling. |

For an EHR integration, replace clinic.ts operations behind the existing session-bound routes with authenticated scheduling calls. Test identity mismatch, a closed doctor panel and a failed reschedule before claiming parity. Real patient data requires a production identity/access design beyond the fictional fixture checks.

Shared integration points:

- [lib/agent-config.ts](lib/agent-config.ts) assembles the selected scenario prompt.
- [lib/agent-tools.ts](lib/agent-tools.ts) defines business tool schemas and server-bound routes.
- [app/api/invite-agent/route.ts](app/api/invite-agent/route.ts) selects the prompt, providers, turn detection and session settings.
- [lib/presentation.ts](lib/presentation.ts) selects the scenario presentation; edit its scenario module for visible content.
- [docs/ai/RECIPE.md](docs/ai/RECIPE.md) retains the machine-readable integration profile and lifecycle contracts.

Keep combined RTC/RTM token generation, the StrictMode initialization guard, toolkit local-user UID remapping and interrupted transcript turns intact. Let the Agora React hooks own microphone and RTC teardown. Preserve server-bound business session scope when extending tools.

### Build with AI

After cloning this repository, paste the following into your coding agent from your own application workspace, providing the path to the clone:

```text
Implement the Clinic Reception & Appointments recipe in my application.

Read RECIPE.md in the cloned 05-medical-triage-booking repository first, then inspect
its scenario modules, tool contracts and invite route. Read docs/ai/RECIPE.md
and AGENTS.md in that repository for integration constraints.

Inspect my application's existing stack and instructions before editing.
Reuse the source's RTC/RTM token, session and transcript patterns.
Implement the scenario's default conversation first, then connect only the
business tools I request. Keep demo data and real service results distinct.
Explain the credentials and configuration I need to supply.
Ask before adding dependencies. Follow my rules for local edits, verification,
commits and remote writes. Verify the result without claiming unrun live tests.
```

This prompt is a source-guided integration entry point, not a published scaffolding package or an automatic Console import.

## 8. Deployment & Validation

### Deploy

The simulated clinic uses one Node process and process-local sessions that expire after two hours. Restart resets the fixtures; multiple workers do not share appointments. A hosted demo needs a long-lived process, and a production integration needs shared durable state.

Install dependencies and set the same required environment variables in your deployment platform's secret store. Build with `pnpm run build` and, on a Node host, start with `pnpm run start`. Keep the public app on HTTPS. For voice tools, set `TOP_TEN_SCENARIO_TOOL_BASE_URL` to the deployed app's reachable HTTPS origin and verify cloud callbacks against that same running instance.

These commands describe the repository's supported scripts; they do not attest to an existing deployment. Before opening sample endpoints to real users, add application authentication, authorization and appropriate request limits.

### Docker deployment

```bash
docker build --build-arg NEXT_PUBLIC_AGORA_APP_ID=YOUR_AGORA_APP_ID -t 05-medical-triage-booking:local .
docker run --rm -p 3000:3000 --env-file .env.local 05-medical-triage-booking:local
```

Replace `YOUR_AGORA_APP_ID` with the public App ID used in `.env.local`. Next.js embeds that identifier in the browser bundle, so changing projects requires rebuilding the image. The App Certificate is supplied only at container runtime. A container restart does not preserve process memory. This image does not add a shared state service.

`pnpm run verify:docker` independently builds the image with synthetic credentials, starts an isolated localhost-bound container, checks the home page and a scenario route, then removes only that container. It does not contact Agora or prove a live voice session.

### Check locally

From this repository root:

```bash
pnpm run verify:template
pnpm run lint
pnpm run typecheck
pnpm run verify:api
pnpm run verify:scenario
pnpm run build
```

With the local prerequisites and credentials configured, also run `pnpm run verify`. The canonical verify script includes all of the local scenario checks above; Docker is deliberately verified separately. Local checks do not require a real microphone call and do not prove cloud tool execution.

### Verify a real conversation

1. Start a fresh voice session; check two-way audio and both transcript speakers.
2. Try the normal, correction and unsupported/failure paths in section 2.
3. With tools enabled, identify a fixture patient, book an offered opening, list it, move it and cancel it. Test a failed move and emergency escalation. The ordinary no-tool mode must not claim any appointment action succeeded.
4. End the call and confirm that microphone publication and the Agent session stop. Keep evidence of the actual result separately from the transcript.

### Troubleshooting

| Symptom | Check |
| --- | --- |
| Agent does not join | Check the token/invite response and run pnpm run doctor. If using the Agora CLI, run agora project doctor --deep. |
| Audio works but transcript is missing | Check RTM login/subscription and keep RtcTokenBuilder.buildTokenWithRtm in the token route. |
| Browser has no microphone | Grant permission, select an input device and use localhost or a secure HTTPS page. |
| The assistant discusses the task but does not save or change it | Check whether the optional public tool origin is enabled. The default conversation has the limits in section 1. |
| A tool fails or a result disappears | Inspect the actual API error, callback reachability and this scenario's storage/lifetime limits; do not claim success from speech alone. |

See [the contributor guide](AGENTS.md), [scenario guide](docs/scenario/README.md) and [MIT License](LICENSE) for further details.
