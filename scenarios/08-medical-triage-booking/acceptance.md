# Clinic appointment acceptance criteria

## Automated checks

`pnpm run verify:scenario` and `pnpm run verify:api` exercise the actual route
handler with fictional calls. They must verify:

- Identity is required; failed lookups revoke any previous identity.
- Impossible dates and unknown doctors are rejected.
- New adults cannot book a closed panel or a pediatric doctor; children receive pediatric openings.
- Searches honor date, exact time and time of day, returning clearly identified alternatives for unavailable combinations and weekends.
- Only returned openings can be booked, after the caller's confirmation.
- A successful booking appears in later queries and occupies its slot.
- Repeated/concurrent booking requests produce one appointment.
- Appointment access and changes stay within the verified patient's records.
- A successful reschedule releases the original slot; a failed move leaves the original appointment unchanged.
- Cancellation releases the slot; retries return the cancelled record.
- Calls have isolated patient/appointment/slot state.
- Emergency escalation works before identity and blocks further ordinary work.
- Invalid JSON, invalid sessions and unknown tools return explicit errors.
- Invite configuration includes all six tools with a server-bound call scope and the clinic clock.
- A missing public tool origin does not start a tool-less agent.

## Voice acceptance

Run a real Agora conversation with reachable tools and check:

1. New-patient booking: collect identity and reason, search, choose a named doctor's opening, then book.
2. Existing patient: list, move, list again, cancel, and verify the returned state.
3. Ask for a weekend, an unavailable exact time or a doctor who does not accept new patients.
4. Ask a policy question mid-booking; the agent answers and resumes without losing preferences.
5. Describe an emergency before giving identity; ordinary scheduling stops.
6. Tool failure does not produce a success claim.
7. Spoken responses contain no bracketed notes, internal IDs or stage directions.

Automated route checks do not establish live model behavior, audio quality or
cloud reachability. Record real voice acceptance separately when performed.
