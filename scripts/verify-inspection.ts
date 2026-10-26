import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const repositoryName: string = JSON.parse(readFileSync('package.json', 'utf8')).name;
import {
  latencySummary,
  normalizeSdkTurn,
  parseRawTurn,
  upsertTurn,
  validModuleMetric,
} from '../lib/inspection';
import { getScenarioPresentation } from '../lib/presentation';

assert.equal(parseRawTurn({ object: 'message.metrics' }), null);
assert.equal(
  parseRawTurn({
    object: 'turn.finished',
    payload: { agent_id: 'agent', turn_id: 'bad' },
  }),
  null,
);
const zero = parseRawTurn({
  object: 'turn.finished',
  payload: {
    agent_id: 'agent',
    turn_id: 1,
    start: { start_at: 1760000000 },
    metrics: {
      e2e_latency_ms: 0,
      segmented_latency_ms: [
        { name: 'llm_ttft', latency: 0 },
        { name: 'tts_ttfb', latency: -1 },
      ],
    },
  },
})!;
assert.equal(zero.e2e, 0);
assert.equal(zero.segments.llm, 0);
assert.equal(zero.segments.tts, null);
assert.equal(zero.segments.asr, null);
assert.equal(zero.timestamp, 1760000000000);
const missing = normalizeSdkTurn({
  agentId: 'agent',
  turnId: 1,
  timestamp: 1760000000,
  e2eLatencyMs: 0,
  segmentedLatency: {
    algorithmProcessingMs: 0,
    asrTtlwMs: 0,
    llmTtftMs: 0,
    transportMs: 0,
    ttsTtfbMs: 0,
  },
});
assert.equal(
  missing.e2e,
  null,
  'A normalized SDK zero cannot prove a measurement was reported',
);
assert.equal(upsertTurn([zero], missing)[0].source, 'raw');
assert.equal(upsertTurn([missing], zero).length, 1);
assert.equal(upsertTurn([missing], zero)[0].e2e, 0);
assert.equal(latencySummary([missing]).count, 0);
assert.deepEqual(latencySummary([zero, { ...zero, turnId: 2, e2e: 100 }]), {
  count: 2,
  median: 50,
  p95: 100,
});
assert.equal(
  validModuleMetric({
    type: 'llm',
    name: 'ttft',
    value: Number.NaN,
    timestamp: 0,
  }),
  null,
);
assert.equal(
  validModuleMetric({
    type: 'llm',
    name: 'ttft',
    value: 0,
    timestamp: 1760000000,
  })?.timestamp,
  1760000000000,
);
let window = [zero];
for (let id = 2; id <= 80; id++)
  window = upsertTurn(window, { ...zero, turnId: id });
assert.equal(window.length, 50);
assert.equal(window[0].turnId, 31);
const scenario = getScenarioPresentation();
assert.equal(scenario.id, repositoryName);
assert.ok(
  scenario.summary && scenario.startLabel && scenario.outcomes.length > 0,
);
assert.ok(
  !scenario.developer.runCommand.includes('--recipe ' + repositoryName.slice(3)),
  'A scenario must not advertise an unregistered CLI recipe',
);
console.log(
  'Inspector measurements, bounded history and scenario presentation checks passed',
);
