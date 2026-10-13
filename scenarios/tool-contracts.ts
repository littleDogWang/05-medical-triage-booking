import type { LlmTool } from 'agora-agents';
type Property = Record<string, unknown>;
function tool(baseUrl: string, name: string, description: string, method: 'GET' | 'POST', path: string, properties: Property, required: string[], body?: Record<string, unknown>): LlmTool {
  return { type: 'function', function: { name, description, parameters: { type: 'object', properties, required } }, server: { method, url: `${baseUrl.replace(/\/$/, '')}${path}`, ...(body ? { body } : {}) } };
}
export function getScenarioTools(_scenarioId: string, baseUrl = process.env.TOP_TEN_SCENARIO_TOOL_BASE_URL): LlmTool[] {
  if (!baseUrl) return [];
  const stringProperty = { type: 'string' };
  const integerProperty = { type: 'integer' };
  return [
        tool(baseUrl, 'submit_appointment_request', 'Submit a human appointment request and escalate urgent symptoms.', 'POST', '/api/scenarios/08-medical-triage-booking/appointment-request', { request_id: stringProperty, description: stringProperty, details: { type: 'object' } }, ['request_id', 'description', 'details'], { request_id: '{{args.request_id}}', description: '{{args.description}}', details: '{{args.details}}' }),
      ];
}
