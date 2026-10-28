# 07 Gotchas

> High-impact setup and business-state pitfalls.

## Setup Pitfalls

- pnpm 8 does not match lockfile 9; use declared pnpm 9.15.9.
- Missing .env.local values fail doctor; do not log or paste credentials.
- Docker needs a running engine and the public App ID at build time. A runtime-only ID cannot repair an already-built client bundle.
- A private/localhost callback URL cannot be used as a cloud business-tool origin.

## Runtime Pitfalls

Only public clinic facts, policies, doctors and example appointment times enter the prompt; patient fixtures are excluded. The assistant discusses appointment intent but cannot verify identity, find actual openings or change appointments.

All patients, slots and bookings are fictional. The assistant does not diagnose, prescribe, contact a nurse, place an emergency call or create a real medical appointment. Use fictional identity details when trying the demo.

The simulated clinic uses one Node process and process-local sessions that expire after two hours. Restart resets the fixtures; multiple workers do not share appointments. A hosted demo needs a long-lived process, and a production integration needs shared durable state.

Keep combined token privileges, StrictMode initialization, toolkit readiness and hook-owned cleanup. A missing transcript is an RTM/event question, not evidence that the model never responded. Tool failures cannot silently fall back to fixture success.

## Documentation Or Contract Drift

The repository identity must be `littleDogWang/05-medical-triage-booking`, while upstream attribution remains separate. Keep invite fields, data paths, time zones, Docker volume behavior and pnpm/verification commands synchronized. Run `pnpm run verify:template` for structure/link drift and the canonical checks for source behavior.

## Related Deep Dives

- [Lifecycle](L2/conversation_lifecycle.md)
- [Transcript pipeline](L2/transcript_pipeline.md)
