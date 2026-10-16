import type { LlmTool } from 'agora-agents';
import { ClinicError } from './08-medical-triage-booking/clinic';

type Properties = Record<string, Record<string, unknown>>;
const string = (description: string) => ({ type: 'string', description });
const choice = (values: string[], description: string) => ({ type: 'string', enum: values, description });

export function getToolBaseUrl(value = process.env.TOP_TEN_SCENARIO_TOOL_BASE_URL): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    const localHost = (!host.includes('.') && !host.startsWith('[')) || /(^|\.)(localhost|local|internal)$/.test(host) ||
      /^(0\.|10\.|127\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(host) ||
      /^(\[::|\[f[cd]|\[fe[89ab])/.test(host);
    if (url.protocol !== 'https:' || localHost || url.username || url.password || url.search || url.hash) return null;
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

export function clinicToolOrigin(baseUrl = process.env.TOP_TEN_SCENARIO_TOOL_BASE_URL): string {
  const origin = getToolBaseUrl(baseUrl);
  if (!origin) throw new ClinicError('TOP_TEN_SCENARIO_TOOL_BASE_URL must be a public HTTPS URL without credentials, query or fragment.', 503);
  return origin;
}

export function getScenarioTools(_scenarioId: string, sessionId: string, baseUrl?: string): LlmTool[] {
  const origin = getToolBaseUrl(baseUrl);
  if (!origin) return [];
  const tool = (name: string, description: string, properties: Properties): LlmTool => ({
    type: 'function',
    function: { name, description, parameters: { type: 'object', properties, required: Object.keys(properties), additionalProperties: false } },
    server: {
      method: 'POST',
      url: `${origin}/api/scenarios/08-medical-triage-booking/sessions/${encodeURIComponent(sessionId)}/${name}`,
      body: Object.fromEntries(Object.keys(properties).map((key) => [key, `{{args.${key}}}`])),
    },
  });
  return [
    tool('read_clinic_information', 'Read clinic hours, policies, timezone and the doctor roster. Does not require patient identity. Never read IDs aloud.', {}),
    tool('identify_patient', 'Identify an established patient or register a new patient for this simulated call. Ask for the full name and date of birth. A failed established lookup needs correction, never invented identity.', {
      patient_status: choice(['new', 'established'], 'Whether the caller says the patient has visited before.'),
      first_name: string('Patient first name, exactly as the caller provided it.'),
      last_name: string('Patient last name, exactly as the caller provided it.'),
      date_of_birth: string('Full date of birth in YYYY-MM-DD format.'),
    }),
    tool('find_open_times', 'Search openings for the identified patient. Enforces adult/pediatric routing and new-patient panels. Search again after a preference changes. Only offer returned slots; explain when they are alternatives.', {
      preferred_date: string('Requested date in clinic time, YYYY-MM-DD. Empty string if no date was requested.'),
      preferred_time: string('Exact requested local time, HH:mm. Empty string if flexible.'),
      doctor_id: choice(['', 'maya-bennett', 'daniel-brooks', 'sofia-patel'], 'Preferred doctor ID or empty string for any eligible doctor.'),
      time_of_day: choice(['any', 'morning', 'afternoon'], 'Keep the caller\'s other preferences when one preference changes.'),
    }),
    tool('book_appointment', 'Book an opening returned by find_open_times after the caller selects it. Only a successful result permits saying it is booked. Repeating the same booking does not create a duplicate.', {
      slot_id: string('Exact slot_id from the latest search. Never invent it or speak it aloud.'),
      visit_type: choice(['general_consultation', 'follow_up'], 'General consultation for a new concern, follow-up for a recheck.'),
      reason: string('Brief reason in the caller\'s own words. Never diagnose.'),
      confirmed: { type: 'boolean', description: 'True only when the caller selected this returned opening.' },
    }),
    tool('manage_appointment', 'List, cancel or reschedule appointments belonging to the identified patient. List first to get an appointment ID. Rescheduling needs a fresh search and the caller selecting a new opening.', {
      action: choice(['list', 'cancel', 'reschedule'], 'Operation requested by the caller.'),
      appointment_id: string('ID returned by listing; empty string for list. Never speak IDs aloud.'),
      new_slot_id: string('Slot ID from the latest search for reschedule; otherwise empty string.'),
      confirmed: { type: 'boolean', description: 'True only after the caller confirms cancellation or selects the replacement opening. False for list.' },
    }),
    tool('record_emergency_escalation', 'Record an emergency and stop ordinary scheduling. Call before identity for severe symptoms, immediate danger or self-harm. This records guidance only: it does not call or transfer anyone.', {
      reported_symptoms: string('The urgent symptoms or immediate danger described by the caller.'),
    }),
  ];
}
