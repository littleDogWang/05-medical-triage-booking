# Clinic reception and appointment design

## Positioning

Priority P8. A controlled, single-agent simulation with a concrete clinic,
named doctors, patient identities and bookable openings. Real medical systems
and medical safety review remain prerequisites for a production service.

## Workflow

Identify a new or established patient by full name and date of birth. Search
openings for the patient's age, requested doctor and scheduling preferences.
Offer returned slots, book after the caller chooses, and report the tool result.
Existing appointments can be listed, moved or cancelled. Policy questions can
interrupt the task without losing its context. Emergencies take priority before
identity; after escalation, ordinary scheduling is blocked.

## Implementation

`clinic.json` contains fixed practice information and fictional records.
`clinic.ts` owns call-isolated state in a process-global Map, following scenario
04's single-process session model. Slots roll across 14 days in clinic time.
Each session lasts two hours and resets on a process restart. No database or
external business service is required.

Six REST tools share a route handler. The invite route creates a session and
embeds its opaque ID in the tool URLs; it never asks the LLM to supply a session
ID. Patient identity and slot ownership are checked by the backend. Synchronous
validation and mutation prevent duplicate slot use in the supported single Node
process. Booking retries return the active record, cancellation releases the
slot, and failed rescheduling preserves the original record.

A missing tool origin blocks agent creation. `pnpm dev:clinic` can supply an
ephemeral HTTPS relay to these six local tools. The relay excludes all other app
routes and changes no env files. Direct local API verification needs no relay.

## Voice behavior

The model must call a tool before describing a successful action, use returned
doctor/date/time values, ask one question per turn, and speak natural sentences
without brackets, Markdown notes, internal IDs or stage directions. Simulation
boundaries remain truthful, without repeating a request disclaimer after an
actual simulated booking.

## Exclusions

No diagnosis, prescription, real patient system, payments, outbound messages,
real human handoff or emergency dispatch. The emergency tool records a local
escalation and directs the caller to local emergency services. Multi-worker and
stateless deployments require replacing the process-local store.
