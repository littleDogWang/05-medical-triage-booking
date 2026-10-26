export interface ScenarioConfig {
  id: string;
  title: string;
  role: string;
  workflow: string;
  guardrails: string;
  greeting: string;
  fixtureSummary?: string;
}
