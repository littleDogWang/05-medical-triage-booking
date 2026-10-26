# 08 Clinic reception and appointments

A single voice agent handles a fictional Agora Family Clinic: identify a patient,
search actual openings in the fixture, book, list, move and cancel appointments.
All clinic code and data live in this repository. No hospital, calendar or EHR
account is needed.

## Run locally

- `pnpm dev` starts the local app and simulated APIs. Run `pnpm run verify:scenario`
  to exercise the complete appointment workflow without Agora credentials or a tunnel.
- `pnpm dev:clinic` starts Next.js with a temporary HTTPS relay, using an installed
  `cloudflared` binary. This is needed for Agora's cloud agent to call the six REST
  tools on your local machine. The relay allows only those tools, not token,
  invite or session creation endpoints. Stop the existing dev server first.
  Ctrl+C stops Next.js and the relay. No env file is rewritten.
- For an already deployed app, set `TOP_TEN_SCENARIO_TOOL_BASE_URL` to its public
  HTTPS origin and use the usual start command to enable appointment tools.
  Without it, pnpm run dev starts local-information conversation without tools.

The clinic itself is local and simulated; a temporary relay still requires
internet access. Creating the relay does not deploy the app or connect a real
clinic. Deployment to a stateless/multi-worker environment needs shared storage;
this version uses one Node process.

## Fixture and example calls

Clinic time is America/New_York. Slots roll over the next 14 calendar days,
Monday-Friday at 09:30, 11:00, 14:00 and 15:00. Past openings are not offered.

| Doctor | Patients | New patients |
| --- | --- | --- |
| Dr. Maya Bennett | Adults | Accepted |
| Dr. Daniel Brooks | Adults | Existing patients only |
| Dr. Sofia Patel | Children under 18 | Accepted |

Fictional existing identities:

- Alex Morgan, April 12, 1988. Has a follow-up with Dr. Maya Bennett on the next
  weekday after the call's clinic date, at 09:30.
- Jamie Rivera, September 8, 2016. Has no appointment.
- A new caller can provide their own fictional name and date of birth.

Try: "I'm Alex Morgan, born April 12, 1988. I'd like to move my appointment."
Then choose an opening returned by the agent, ask it to list the appointment,
and cancel it. Or register a new adult and ask for Dr. Daniel Brooks: the search
must explain his closed panel and offer an eligible doctor. A child must receive
pediatric openings.

## Tools

All six tools are POST endpoints under
`/api/scenarios/08-medical-triage-booking/sessions/{sessionId}/{toolName}`.
The server embeds the opaque session ID in each tool URL; the LLM cannot choose
another call's scope.

| Tool | Required JSON arguments |
| --- | --- |
| `read_clinic_information` | `{}` |
| `identify_patient` | `patient_status` (`new` or `established`), `first_name`, `last_name`, `date_of_birth` (`YYYY-MM-DD`) |
| `find_open_times` | `preferred_date` (`YYYY-MM-DD` or `""`), `preferred_time` (`HH:mm` or `""`), `doctor_id` (roster ID or `""`), `time_of_day` (`any`, `morning`, `afternoon`) |
| `book_appointment` | `slot_id`, `visit_type` (`general_consultation` or `follow_up`), `reason`, `confirmed` |
| `manage_appointment` | `action` (`list`, `cancel`, `reschedule`), `appointment_id`, `new_slot_id`, `confirmed`; use empty IDs and false for listing |
| `record_emergency_escalation` | `reported_symptoms` |

For direct local HTTP testing, POST to
`/api/scenarios/08-medical-triage-booking/sessions` to create a fictional call.
It returns `session_id`, the clinic date/time and timezone. Use this ID in the
paths above. This local testing endpoint never creates an Agora agent.

## State and boundaries

Calls have isolated process-local state and expire after two hours. A process
restart resets all fictional records. Bookings occupy a slot; cancellation
releases it; a successful move releases the original slot. A failed move leaves
the original appointment intact. Retrying an active booking, cancellation or
move does not create duplicate records.

The caller must be identified before searching or accessing appointments.
Identity changes revoke the previous patient's offered slots; a failed lookup
also revokes the previous identity. The model may only book an opening returned
by its latest search, after the caller chooses it. Special notes and internal
IDs are never intended as spoken output.

Emergency escalation records the state of this call and stops ordinary work.
It does not place an emergency call, send a message or transfer to a person.
The agent does not diagnose, prescribe, process payments or claim to book a
real-world medical appointment. New calls start with fresh fixture data.

## References

- Original scope: [LiveKit Medical Office Triage](https://github.com/livekit-examples/python-agents-examples/tree/main/complex-agents/medical_office_triage).
- Concrete single-agent workflow: [SpaceXAI patient intake](https://docs.livekit.io/reference/recipes/spacexai-patient-intake/).
- Stateful fixture comparison: [Healthcare Agent](https://github.com/livekit/agents/tree/main/examples/healthcare).

These references informed the workflow; this implementation uses Agora's
existing SDK and RTC/RTM lifecycle.


## Local conversation and optional tools

Run pnpm run dev for a conversation using clinic.json public facts (hours, policies, doctor roster, eligibility and example appointment times). Patient fixtures are excluded. The assistant collects appointment intent and gives emergency guidance without a callback URL; it cannot verify identity, check actual openings, save records, book, move or cancel appointments. A public HTTPS tool origin enables the existing six session-bound tools. Tool failures never fall back to sample openings or booking success. The existing relay command is optional and is not started by ordinary development.

TOP_TEN_SCENARIO_TOOL_BASE_URL is optional. Only an explicitly configured public HTTPS endpoint enables tools; malformed, HTTP, localhost and local/private origins leave tools disabled. URL validation does not prove network reachability. No tunnel, knowledge base or database is needed for the default conversation. Local checks do not establish live speech or cloud callback acceptance.

## U.S. example data

The fictional clinic address is in Boston, Massachusetts, and appointment times use `America/New_York`. Dr. Maya Bennett is the configured family-medicine doctor; doctor IDs remain consistent across fixtures, seeded appointments and tool schemas.

## Source locations

This guide lives in documentation; executable code uses the standalone Next.js
Quickstart layout. Agent instructions and prompt assembly are in
[lib/agent-config.ts](../../lib/agent-config.ts), optional tool contracts are in
[lib/agent-tools.ts](../../lib/agent-tools.ts), and presentation content is in
[lib/presentation.ts](../../lib/presentation.ts). Business modules and fixtures
live in [lib/medical-triage-booking/](../../lib/medical-triage-booking/). File basenames in this guide
refer to these source locations, not to files next to this document.
