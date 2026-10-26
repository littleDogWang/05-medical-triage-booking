import { randomUUID } from 'node:crypto';
import clinic from './clinic.json';
import { triageIntent } from './triage';

export class ClinicError extends Error {
  constructor(message: string, public status = 409) { super(message); }
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  is_new: boolean;
}

interface Slot {
  slot_id: string;
  doctor_id: string;
  doctor_name: string;
  date: string;
  time: string;
}

interface Appointment extends Slot {
  appointment_id: string;
  patient_id: string;
  visit_type: string;
  reason: string;
  status: 'booked' | 'cancelled';
}

interface ClinicSession {
  id: string;
  now: Date;
  expires_at: number;
  patients: Patient[];
  slots: Slot[];
  appointments: Appointment[];
  verified_patient_id?: string;
  offered_slot_ids: string[];
  escalated: boolean;
}

const runtime = globalThis as typeof globalThis & {
  medicalClinicSessions?: Map<string, ClinicSession>;
};
const sessions = (runtime.medicalClinicSessions ??= new Map<string, ClinicSession>());

export function clinicClock(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: clinic.timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const value = (type: string) => parts.find((p) => p.type === type)!.value;
  return { date: `${value('year')}-${value('month')}-${value('day')}`, time: `${value('hour')}:${value('minute')}` };
}

function addDays(date: string, days: number) {
  const day = new Date(`${date}T12:00:00Z`);
  day.setUTCDate(day.getUTCDate() + days);
  return day.toISOString().slice(0, 10);
}

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(`${value}T12:00:00Z`)) &&
    new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
}

export function createClinicSession(now = new Date()) {
  for (const [id, item] of sessions) {
    if (item.expires_at <= Date.now()) sessions.delete(id);
  }
  const clock = clinicClock(now);
  const slots: Slot[] = [];
  for (let offset = 0; offset < 14; offset++) {
    const date = addDays(clock.date, offset);
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    for (const doctor of clinic.doctors) {
      for (const time of clinic.appointment_times) {
        if (date === clock.date && time <= clock.time) continue;
        slots.push({ slot_id: `${doctor.id}-${date}-${time}`, doctor_id: doctor.id, doctor_name: doctor.name, date, time });
      }
    }
  }
  const patients: Patient[] = clinic.patients.map((p) => ({ ...p, is_new: false }));
  const existing = slots.find((s) => s.doctor_id === 'maya-bennett' && s.date > clock.date)!;
  const session: ClinicSession = {
    id: randomUUID(), now, expires_at: Date.now() + 2 * 60 * 60 * 1000,
    patients, slots,
    appointments: [{ ...existing, appointment_id: 'APT-1001', patient_id: patients[0].id, visit_type: 'follow_up', reason: 'Routine follow-up', status: 'booked' }],
    offered_slot_ids: [], escalated: false,
  };
  sessions.set(session.id, session);
  return { session_id: session.id, ...clock, timezone: clinic.timezone };
}

export function deleteClinicSession(id: string) { sessions.delete(id); }

function getSession(id: string) {
  const session = sessions.get(id);
  if (!session || session.expires_at <= Date.now()) {
    sessions.delete(id);
    throw new ClinicError('This clinic session expired. Start a new call.', 404);
  }
  return session;
}

function text(body: Record<string, unknown>, key: string, optional = false) {
  const value = body[key];
  if (typeof value !== 'string' || value.length > 500 || (!optional && !value.trim())) {
    throw new ClinicError(`${key} must be ${optional ? 'a string' : 'a non-empty string'}.`, 400);
  }
  return value.trim();
}

function patient(session: ClinicSession) {
  if (session.escalated) throw new ClinicError('An emergency was escalated. Do not continue scheduling; direct the caller to local emergency services.');
  const record = session.patients.find((p) => p.id === session.verified_patient_id);
  if (!record) throw new ClinicError('Identify the patient by their full name and date of birth first.', 403);
  return record;
}

function ageOn(dob: string, date: string) {
  return Number(date.slice(0, 4)) - Number(dob.slice(0, 4)) - (date.slice(5) < dob.slice(5) ? 1 : 0);
}

function eligible(session: ClinicSession, record: Patient, slot: Slot) {
  const doctor = clinic.doctors.find((d) => d.id === slot.doctor_id)!;
  const age = ageOn(record.date_of_birth, slot.date);
  return age >= doctor.minimum_age && age <= doctor.maximum_age && (!record.is_new || doctor.accepting_new_patients);
}

function available(session: ClinicSession, slot: Slot) {
  const clock = clinicClock(new Date(Math.max(session.now.getTime(), Date.now())));
  return `${slot.date} ${slot.time}` > `${clock.date} ${clock.time}` &&
    !session.appointments.some((a) => a.slot_id === slot.slot_id && a.status === 'booked');
}

function publicAppointment(appointment: Appointment) {
  const { patient_id: _patientId, ...result } = appointment;
  return result;
}

export function runClinicTool(sessionId: string, action: string, body: Record<string, unknown>) {
  const session = getSession(sessionId);
  if (action === 'record_emergency_escalation') {
    text(body, 'reported_symptoms');
    session.escalated = true;
    session.offered_slot_ids = [];
    return { status: 'emergency_escalated', message: 'Stop ordinary clinic work. Ask the caller to contact local emergency services now. No emergency call or human transfer has been placed.' };
  }
  if (session.escalated) throw new ClinicError('An emergency was escalated. Do not continue ordinary clinic work.');
  if (action === 'read_clinic_information') {
    return { ...clinic, patients: undefined, appointment_times: undefined, current_date: clinicClock(session.now).date, timezone: clinic.timezone, scheduling_days: 14, scope: 'Appointments update only this simulated clinic session. No real clinic, prescription, payment or human transfer is connected.' };
  }
  if (action === 'identify_patient') {
    // A failed lookup must revoke the previous identity too.
    session.verified_patient_id = undefined;
    session.offered_slot_ids = [];
    const first = text(body, 'first_name');
    const last = text(body, 'last_name');
    const dob = text(body, 'date_of_birth');
    const status = text(body, 'patient_status');
    const today = clinicClock(session.now).date;
    if (!validDate(dob) || dob > today || ageOn(dob, today) > 120) throw new ClinicError('Provide a valid date of birth in YYYY-MM-DD format.', 400);
    if (!['new', 'established'].includes(status)) throw new ClinicError('patient_status must be new or established.', 400);
    let record = session.patients.find((p) => p.first_name.toLowerCase() === first.toLowerCase() && p.last_name.toLowerCase() === last.toLowerCase() && p.date_of_birth === dob);
    if (!record && status === 'established') throw new ClinicError('No matching patient. Ask the caller to recheck their full name and date of birth; do not invent a record.', 404);
    if (!record) {
      record = { id: randomUUID(), first_name: first, last_name: last, date_of_birth: dob, is_new: true };
      session.patients.push(record);
    }
    session.verified_patient_id = record.id;
    return { status: record.is_new ? 'new_patient_identified' : 'patient_verified', first_name: record.first_name, patient_status: record.is_new ? 'new' : 'established', age: ageOn(dob, today), message: 'Identity recorded for this simulated call. Search openings before offering a time.' };
  }
  if (action === 'find_open_times') {
    const record = patient(session);
    const date = text(body, 'preferred_date', true);
    const time = text(body, 'preferred_time', true);
    const doctorId = text(body, 'doctor_id', true);
    const period = text(body, 'time_of_day');
    if (date && (!validDate(date) || date < clinicClock(session.now).date)) throw new ClinicError('Search from today or a future date in YYYY-MM-DD format.', 400);
    if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new ClinicError('preferred_time must be HH:mm or an empty string.', 400);
    if (!['any', 'morning', 'afternoon'].includes(period)) throw new ClinicError('time_of_day must be any, morning or afternoon.', 400);
    if (doctorId && !clinic.doctors.some((d) => d.id === doctorId)) throw new ClinicError('Choose a doctor returned by read_clinic_information.', 400);
    const open = session.slots.filter((s) => eligible(session, record, s) && available(session, s));
    const inPeriod = (s: Slot) => period === 'any' || (period === 'morning' ? s.time < '12:00' : s.time >= '12:00');
    const matches = open.filter((s) => (!date || s.date === date) && (!time || s.time === time) && (!doctorId || s.doctor_id === doctorId) && inPeriod(s));
    const alternatives = open.filter((s) => (!date || s.date >= date) && (!doctorId || s.doctor_id === doctorId) && inPeriod(s));
    const fallback = alternatives.length ? alternatives : open.filter((s) => (!date || s.date >= date) && inPeriod(s));
    const offered = (matches.length ? matches : fallback).slice(0, 6);
    session.offered_slot_ids = offered.map((s) => s.slot_id);
    return { requested_time_available: matches.length > 0, slots: offered, timezone: clinic.timezone, message: matches.length ? 'Offer only these returned openings. The caller selecting an opening authorizes booking.' : 'The requested combination is unavailable or the doctor is not eligible for this patient. Explain this and offer the returned alternatives; do not claim they match the original request.' };
  }
  if (action === 'book_appointment') {
    const record = patient(session);
    const slotId = text(body, 'slot_id');
    const reason = text(body, 'reason');
    const visitType = text(body, 'visit_type');
    if (body.confirmed !== true) throw new ClinicError('Ask the caller to choose an offered opening before booking.');
    if (!clinic.appointmentTypes.includes(visitType)) throw new ClinicError('Choose general_consultation or follow_up.', 400);
    if (triageIntent(reason) === 'emergency_escalation') {
      session.escalated = true;
      throw new ClinicError('Urgent symptoms require local emergency services. No appointment was booked.');
    }
    const previous = session.appointments.find((a) => a.patient_id === record.id && a.slot_id === slotId && a.status === 'booked');
    if (previous) return { status: 'booked', duplicate: true, appointment: publicAppointment(previous) };
    const slot = session.slots.find((s) => s.slot_id === slotId);
    if (!slot || !session.offered_slot_ids.includes(slotId) || !eligible(session, record, slot) || !available(session, slot)) throw new ClinicError('That opening is unavailable or was not offered. Search again before booking.');
    const appointment: Appointment = { ...slot, appointment_id: randomUUID(), patient_id: record.id, visit_type: visitType, reason, status: 'booked' };
    session.appointments.push(appointment);
    return { status: 'booked', duplicate: false, appointment: publicAppointment(appointment), message: 'Appointment booked in this simulated clinic. State the doctor, date and time in one natural sentence.' };
  }
  if (action === 'manage_appointment') {
    const record = patient(session);
    const operation = text(body, 'action');
    if (operation === 'list') return { appointments: session.appointments.filter((a) => a.patient_id === record.id).map(publicAppointment) };
    if (!['cancel', 'reschedule'].includes(operation)) throw new ClinicError('action must be list, cancel or reschedule.', 400);
    if (body.confirmed !== true) throw new ClinicError('Confirm the requested change with the caller before changing the appointment.');
    const appointmentId = text(body, 'appointment_id');
    const appointment = session.appointments.find((a) => a.appointment_id === appointmentId && a.patient_id === record.id);
    if (!appointment) throw new ClinicError('Appointment not found for the verified patient. List their appointments again.', 404);
    if (operation === 'cancel') {
      const duplicate = appointment.status === 'cancelled';
      appointment.status = 'cancelled';
      return { status: 'cancelled', duplicate, appointment: publicAppointment(appointment) };
    }
    if (appointment.status === 'cancelled') throw new ClinicError('This appointment was cancelled. Search openings to book a new appointment.');
    const slotId = text(body, 'new_slot_id');
    if (appointment.slot_id === slotId) return { status: 'booked', duplicate: true, appointment: publicAppointment(appointment) };
    const slot = session.slots.find((s) => s.slot_id === slotId);
    if (!slot || !session.offered_slot_ids.includes(slotId) || !eligible(session, record, slot) || !available(session, slot)) throw new ClinicError('The new opening is unavailable or was not offered. The original appointment is unchanged. Search again.');
    // Validation and mutation are synchronous: a failed move never releases the original slot.
    Object.assign(appointment, slot);
    return { status: 'rescheduled', appointment: publicAppointment(appointment) };
  }
  throw new ClinicError('Unknown clinic tool.', 404);
}
