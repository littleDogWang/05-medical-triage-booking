import assert from 'node:assert/strict';
import { POST } from '../app/api/scenarios/08-medical-triage-booking/sessions/[sessionId]/[action]/route';
import { createClinicSession, deleteClinicSession } from '../lib/medical-triage-booking/clinic';
import { clinicToolOrigin, getScenarioTools } from '../lib/agent-tools';

export async function verifyClinicWorkflow() {
  // A future Monday makes dates deterministic without patching the wall clock.
  const session = createClinicSession(new Date('2030-10-14T12:00:00Z'));
  const other = createClinicSession(new Date('2030-10-14T12:00:00Z'));
  const call = async (action: string, body: unknown, sessionId = session.session_id, expected = 200) => {
    const response = await POST(new Request('http://localhost/clinic', { method: 'POST', body: JSON.stringify(body) }), {
      params: Promise.resolve({ sessionId, action }),
    });
    const result = await response.json();
    assert.equal(response.status, expected, JSON.stringify(result));
    return result;
  };
  const identify = (status = 'established', first = 'Alex', last = 'Morgan', dob = '1988-04-12', sessionId = session.session_id, expected = 200) =>
    call('identify_patient', { patient_status: status, first_name: first, last_name: last, date_of_birth: dob }, sessionId, expected);
  const search = (overrides = {}, sessionId = session.session_id) =>
    call('find_open_times', { preferred_date: '', preferred_time: '', doctor_id: '', time_of_day: 'any', ...overrides }, sessionId);
  const manage = (action: string, appointmentId = '', newSlotId = '', confirmed = false, expected = 200) =>
    call('manage_appointment', { action, appointment_id: appointmentId, new_slot_id: newSlotId, confirmed }, session.session_id, expected);
  const book = (slotId: string, overrides = {}, expected = 200) =>
    call('book_appointment', { slot_id: slotId, visit_type: 'general_consultation', reason: 'Routine checkup', confirmed: true, ...overrides }, session.session_id, expected);
  try {
    const info = await call('read_clinic_information', {});
    assert.equal(info.doctors.length, 3);
    assert.equal(info.patients, undefined, 'Public practice information must not expose patients');
    await call('manage_appointment', { action: 'list' }, session.session_id, 403);
    await identify('established', 'Wrong', 'Name', '1988-04-12', session.session_id, 404);
    await identify('established', 'Alex', 'Morgan', '1988-02-31', session.session_id, 400);
    await identify();
    const initial = await manage('list');
    assert.equal(initial.appointments.length, 1);
    assert.equal(initial.appointments[0].appointment_id, 'APT-1001');
    const openings = await search({ preferred_date: '2030-10-15', preferred_time: '15:00', doctor_id: 'maya-bennett' });
    assert.equal(openings.requested_time_available, true);
    assert.equal(openings.slots.length, 1);
    const slot = openings.slots[0];
    await book(slot.slot_id, { confirmed: false }, 409);
    await book('invented-slot', {}, 409);
    const booked = await book(slot.slot_id);
    assert.equal(booked.status, 'booked');
    const retry = await book(slot.slot_id);
    assert.equal(retry.duplicate, true);
    assert.equal(retry.appointment.appointment_id, booked.appointment.appointment_id);
    const listed = await manage('list');
    assert.equal(listed.appointments.filter((a: { status: string }) => a.status === 'booked').length, 2);
    const occupied = await search({ preferred_date: slot.date, preferred_time: slot.time, doctor_id: slot.doctor_id });
    assert.equal(occupied.requested_time_available, false);
    assert(!occupied.slots.some((s: { slot_id: string }) => s.slot_id === slot.slot_id));
    await manage('reschedule', booked.appointment.appointment_id, 'missing', true, 409);
    const unchanged = await manage('list');
    assert.equal(unchanged.appointments.find((a: { appointment_id: string }) => a.appointment_id === booked.appointment.appointment_id).slot_id, slot.slot_id);
    const alternatives = await search({ preferred_date: '2030-10-16', preferred_time: '11:00', doctor_id: 'maya-bennett' });
    const target = alternatives.slots[0];
    await manage('reschedule', booked.appointment.appointment_id, target.slot_id, false, 409);
    const moved = await manage('reschedule', booked.appointment.appointment_id, target.slot_id, true);
    assert.equal(moved.status, 'rescheduled');
    const movedAgain = await manage('reschedule', booked.appointment.appointment_id, target.slot_id, true);
    assert.equal(movedAgain.duplicate, true);
    assert.equal((await search({ preferred_date: slot.date, preferred_time: slot.time, doctor_id: slot.doctor_id })).requested_time_available, true, 'Moving releases the old slot');
    await manage('cancel', booked.appointment.appointment_id, '', false, 409);
    assert.equal((await manage('cancel', booked.appointment.appointment_id, '', true)).status, 'cancelled');
    assert.equal((await manage('cancel', booked.appointment.appointment_id, '', true)).duplicate, true);
    assert.equal((await search({ preferred_date: target.date, preferred_time: target.time, doctor_id: target.doctor_id })).requested_time_available, true, 'Cancellation releases the slot');
    await manage('reschedule', booked.appointment.appointment_id, slot.slot_id, true, 409);

    await identify('new', 'Taylor', 'Reed', '1995-06-20');
    assert.equal((await manage('list')).appointments.length, 0);
    await manage('cancel', 'APT-1001', '', true, 404);
    const newPatient = await search({ doctor_id: 'daniel-brooks' });
    assert.equal(newPatient.requested_time_available, false);
    assert(newPatient.slots.every((s: { doctor_id: string }) => s.doctor_id === 'maya-bennett'), 'Closed panels and pediatric doctors are excluded');
    const newSlot = newPatient.slots[0];
    const concurrent = await Promise.all([book(newSlot.slot_id), book(newSlot.slot_id)]);
    assert.equal(concurrent[0].appointment.appointment_id, concurrent[1].appointment.appointment_id, 'Repeated concurrent requests do not double-book');
    await identify();
    await search();
    await book(newSlot.slot_id, {}, 409);
    await identify('established', 'Alex', 'Wrong', '1988-04-12', session.session_id, 404);
    await call('manage_appointment', { action: 'list' }, session.session_id, 403);

    await identify('established', 'Jamie', 'Rivera', '2016-09-08');
    const child = await search({ doctor_id: 'maya-bennett' });
    assert.equal(child.requested_time_available, false);
    assert(child.slots.every((s: { doctor_id: string }) => s.doctor_id === 'sofia-patel'));
    const weekend = await search({ preferred_date: '2030-10-19' });
    assert.equal(weekend.requested_time_available, false);
    assert(weekend.slots.every((s: { date: string }) => s.date >= '2030-10-21'));
    const exact = await search({ preferred_time: '07:00', time_of_day: 'afternoon' });
    assert.equal(exact.requested_time_available, false);
    assert(exact.slots.every((s: { time: string }) => s.time >= '12:00'));
    await call('find_open_times', { preferred_date: '2030-02-31', preferred_time: '', doctor_id: '', time_of_day: 'any' }, session.session_id, 400);

    await identify('established', 'Alex', 'Morgan', '1988-04-12', other.session_id);
    assert.equal((await search({ preferred_date: newSlot.date, preferred_time: newSlot.time, doctor_id: newSlot.doctor_id }, other.session_id)).requested_time_available, true, 'Calls have isolated slots');
    await call('read_clinic_information', {}, 'invalid-session', 404);
    await call('read_clinic_information', null, session.session_id, 400);
    const malformed = await POST(new Request('http://localhost/clinic', { method: 'POST', body: '{' }), { params: Promise.resolve({ sessionId: session.session_id, action: 'read_clinic_information' }) });
    assert.equal(malformed.status, 400);
    await call('unknown', {}, session.session_id, 404);
    await call('record_emergency_escalation', { reported_symptoms: 'Heavy pressure in my chest spreading down my arm' }, other.session_id);
    await call('identify_patient', { patient_status: 'established', first_name: 'Alex', last_name: 'Morgan', date_of_birth: '1988-04-12' }, other.session_id, 409);
    await call('manage_appointment', { action: 'list' }, other.session_id, 409);
    await call('read_clinic_information', {}, other.session_id, 409);

    const tools = getScenarioTools('08', session.session_id, 'https://clinic.example.com');
    assert.equal(tools.length, 6);
    assert(tools.every((t) => t.server?.url.includes(`/sessions/${session.session_id}/`)));
    assert(tools.every((t) => !JSON.stringify(t.function.parameters).includes('session_id')), 'The model cannot choose the call scope');
    assert.throws(() => clinicToolOrigin('http://localhost:3000'));
    const originalOrigin = process.env.TOP_TEN_SCENARIO_TOOL_BASE_URL;
    delete process.env.TOP_TEN_SCENARIO_TOOL_BASE_URL;
    try { assert.throws(() => clinicToolOrigin(), /public HTTPS/); }
    finally { if (originalOrigin !== undefined) process.env.TOP_TEN_SCENARIO_TOOL_BASE_URL = originalOrigin; }
    console.log('Clinic workflow passed: identity, search, book, list, reschedule, cancel, retries, isolation and emergency handling');
  } finally {
    deleteClinicSession(session.session_id);
    deleteClinicSession(other.session_id);
  }
}
