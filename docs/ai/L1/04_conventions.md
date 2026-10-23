# 04 Conventions

> Runtime and change rules for this independent scenario.

## Code Style

Use English TypeScript/documentation and existing ESLint conventions. Keep examples fictional and U.S.-based, with explicit IANA time zones and date-correct offsets. Use pinned pnpm 9.15.9; do not rewrite the lockfile with another major.

## Runtime Patterns

Keep StrictMode `isReady` and stable RTC client ownership. Hook cleanup owns leave, microphone closing and publication. Toolkit initialization follows RTC join/RTM readiness. Preserve local-user UID remap and interrupted turns. Tailwind 4 scans actual components through app/globals.css; do not recreate old HSL-channel wrappers.

The tools are `read_clinic_information`, `identify_patient`, `find_open_times`, `book_appointment`, `manage_appointment` and `record_emergency_escalation`. Each uses `POST /api/scenarios/08-medical-triage-booking/sessions/{sessionId}/{toolName}` with the call ID fixed by the server. Only a slot from the latest search can be booked. A failed move preserves the original appointment.

All patients, slots and bookings are fictional. The assistant does not diagnose, prescribe, contact a nurse, place an emergency call or create a real medical appointment. Use fictional identity details when trying the demo.

## Testing Patterns

Use mocked API/scenario checks for deterministic contracts and isolated temporary storage for writes. `pnpm run verify` is canonical; `pnpm run verify:docker` separately checks image/startup/route behavior. Real speech and cloud callbacks remain independent. For UI changes, render and inspect actual desktop/mobile states; do not infer visuals from source.

## Documentation Changes

Synchronize README, AGENTS, ARCHITECTURE, public/internal recipes and affected L1/L2 files when workflows, environment, state or interfaces change. Update L0's review date. Every L1 file ends in Related Deep Dives. Use conventional commits only when explicitly requested; remote writes need their own authorization.

## Related Deep Dives

- [StrictMode](L2/strict_mode_lifecycle.md)
- [Transcript pipeline](L2/transcript_pipeline.md)
