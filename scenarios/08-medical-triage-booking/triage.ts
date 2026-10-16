export type TriageOutcome = 'emergency_escalation' | 'appointment_request';

const urgentPhrases = [
  'chest pain',
  'difficulty breathing',
  'cannot breathe',
  'severe bleeding',
  'unconscious',
  'stroke',
  'suicidal',
];

export function triageIntent(description: string): TriageOutcome {
  const normalized = description.toLowerCase();
  return urgentPhrases.some((phrase) => normalized.includes(phrase))
    ? 'emergency_escalation'
    : 'appointment_request';
}
