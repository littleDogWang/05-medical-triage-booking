import assert from 'node:assert/strict';
import { mapSignalState, smoothAudioLevel } from '../lib/agent-signal';

for (const transport of ['CONNECTING', 'RECONNECTING']) {
  assert.equal(mapSignalState('speaking', true, transport), 'connecting');
}
for (const transport of ['DISCONNECTED', 'DISCONNECTING']) {
  assert.equal(mapSignalState('speaking', true, transport), 'error');
}
assert.equal(mapSignalState('speaking', false, 'CONNECTED'), 'connecting');
assert.equal(mapSignalState('speaking', true, 'CONNECTED', true), 'error');
for (const state of ['listening', 'thinking', 'speaking'] as const) {
  assert.equal(mapSignalState(state, true, 'CONNECTED'), state);
}
for (const state of ['silent', 'idle', null]) {
  assert.equal(mapSignalState(state, true, 'CONNECTED'), 'idle');
}

assert.equal(smoothAudioLevel(0, 0, 1 / 30), 0, 'Silence must stay silent');
assert.equal(smoothAudioLevel(Number.NaN, 0, 1 / 30), 0);
assert.equal(smoothAudioLevel(-4, 0, 1 / 30), 0);
assert.equal(smoothAudioLevel(0.8, 0.2, 0), 0.2);
assert.ok(
  smoothAudioLevel(1, 0, 1 / 30) > 1 - smoothAudioLevel(0, 1, 1 / 30),
  'Attack must be faster than release',
);
assert.ok(smoothAudioLevel(99, 0, 1) <= 1);
console.log('Signal state and measured-audio checks passed');
