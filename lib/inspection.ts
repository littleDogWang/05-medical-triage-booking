import type { AgentSignalState } from './agent-signal';

export interface ModuleMetric {
  type: string;
  name: string;
  value: number;
  timestamp: number;
}
export interface TurnMeasurement {
  agentId: string;
  turnId: number;
  timestamp: number;
  e2e: number | null;
  segments: {
    processing: number | null;
    asr: number | null;
    llm: number | null;
    transport: number | null;
    tts: number | null;
  };
  source: 'raw' | 'sdk';
}
export interface InspectionEvent {
  id: string;
  time: number;
  kind: 'state' | 'transport' | 'turn' | 'interruption' | 'error';
  label: string;
  detail?: string;
}
export interface InspectionMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  createdAt?: number;
  streaming?: boolean;
}
export interface InspectionSnapshot {
  lifecycle: 'ready' | 'starting' | 'live' | 'ended' | 'error';
  startedAt: number | null;
  endedAt: number | null;
  transport: string;
  agentState: AgentSignalState;
  micEnabled: boolean;
  metrics: ModuleMetric[];
  turns: TurnMeasurement[];
  events: InspectionEvent[];
  messages: InspectionMessage[];
  interruptions: number;
}

export const EMPTY_INSPECTION: InspectionSnapshot = {
  lifecycle: 'ready',
  startedAt: null,
  endedAt: null,
  transport: 'Not started',
  agentState: 'idle',
  micEnabled: false,
  metrics: [],
  turns: [],
  events: [],
  messages: [],
  interruptions: 0,
};

const timestamp = (value: number) => (value > 1e12 ? value : value * 1000);
const record = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
const measurement = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : null;
const sdkMeasurement = (value: unknown) =>
  typeof value === 'number' && value > 0 ? measurement(value) : null;

// SDK 2.10 normalizes absent fields to zero. Raw reports preserve missing versus measured zero.
export function parseRawTurn(value: unknown): TurnMeasurement | null {
  const raw = record(value);
  if (
    !raw ||
    (raw.object !== 'turn.finished' && raw.event_type !== 'turn.finished')
  )
    return null;
  const payload = record(raw.payload) ?? raw;
  if (
    typeof payload.turn_id !== 'number' ||
    !Number.isInteger(payload.turn_id) ||
    typeof payload.agent_id !== 'string'
  )
    return null;
  const metrics = record(payload.metrics);
  const start = record(payload.start);
  const segments = new Map<string, number | null>();
  if (Array.isArray(metrics?.segmented_latency_ms))
    for (const item of metrics.segmented_latency_ms) {
      const segment = record(item);
      if (typeof segment?.name === 'string')
        segments.set(segment.name, measurement(segment.latency));
    }
  return {
    agentId: payload.agent_id,
    turnId: payload.turn_id,
    timestamp:
      typeof start?.start_at === 'number' && start.start_at > 0
        ? timestamp(start.start_at)
        : Date.now(),
    e2e: measurement(metrics?.e2e_latency_ms),
    source: 'raw',
    segments: {
      processing: segments.get('algorithm_processing') ?? null,
      asr: segments.get('asr_ttlw') ?? null,
      llm: segments.get('llm_ttft') ?? null,
      transport: segments.get('transport') ?? null,
      tts: segments.get('tts_ttfb') ?? null,
    },
  };
}

export function normalizeSdkTurn(turn: {
  agentId: string;
  turnId: number;
  timestamp: number;
  e2eLatencyMs: number;
  segmentedLatency: {
    algorithmProcessingMs: number;
    asrTtlwMs: number;
    llmTtftMs: number;
    transportMs: number;
    ttsTtfbMs: number;
  };
}): TurnMeasurement {
  return {
    agentId: turn.agentId,
    turnId: turn.turnId,
    timestamp: turn.timestamp > 0 ? timestamp(turn.timestamp) : Date.now(),
    e2e: sdkMeasurement(turn.e2eLatencyMs),
    source: 'sdk',
    segments: {
      processing: sdkMeasurement(turn.segmentedLatency.algorithmProcessingMs),
      asr: sdkMeasurement(turn.segmentedLatency.asrTtlwMs),
      llm: sdkMeasurement(turn.segmentedLatency.llmTtftMs),
      transport: sdkMeasurement(turn.segmentedLatency.transportMs),
      tts: sdkMeasurement(turn.segmentedLatency.ttsTtfbMs),
    },
  };
}

export function upsertTurn(
  turns: TurnMeasurement[],
  incoming: TurnMeasurement,
): TurnMeasurement[] {
  const index = turns.findIndex(
    (turn) =>
      turn.agentId === incoming.agentId && turn.turnId === incoming.turnId,
  );
  if (index < 0) return [...turns, incoming].slice(-50);
  if (turns[index].source === 'raw' && incoming.source === 'sdk') return turns;
  return turns.map((turn, i) => (i === index ? incoming : turn));
}

export function appendInspectionEvent(
  events: InspectionEvent[],
  event: InspectionEvent,
): InspectionEvent[] {
  if (events.some((item) => item.id === event.id)) return events;
  return [...events, event].slice(-100);
}

export function latencySummary(turns: TurnMeasurement[]) {
  const values = turns
    .map((turn) => turn.e2e)
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b);
  if (!values.length) return { count: 0, median: null, p95: null };
  const mid = Math.floor(values.length / 2);
  return {
    count: values.length,
    median:
      values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2,
    p95: values[Math.ceil(values.length * 0.95) - 1],
  };
}

export function validModuleMetric(metric: ModuleMetric): ModuleMetric | null {
  if (!metric.type || !metric.name || measurement(metric.value) === null)
    return null;
  return {
    ...metric,
    timestamp:
      Number.isFinite(metric.timestamp) && metric.timestamp > 0
        ? timestamp(metric.timestamp)
        : Date.now(),
  };
}
