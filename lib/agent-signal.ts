export type AgentSignalState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'error'
  | 'ended';

export interface AudioLevelSource {
  getVolumeLevel(): number;
}

export interface AgentSignalSnapshot {
  state: AgentSignalState;
  micEnabled: boolean;
  levelSource?: AudioLevelSource | null;
}

export const SIGNAL_COPY: Record<
  AgentSignalState,
  { title: string; description: string }
> = {
  idle: {
    title: 'Ready when you are',
    description: 'Start a voice session to talk with your assistant.',
  },
  connecting: {
    title: 'Getting connected',
    description: 'Establishing your voice connection.',
  },
  listening: {
    title: 'Listening',
    description: 'Tell me what’s happening. Take your time.',
  },
  thinking: {
    title: 'Thinking it through',
    description: 'Working through your last message.',
  },
  speaking: {
    title: 'Talking with you',
    description: 'You can speak to interrupt or ask a question.',
  },
  error: {
    title: 'Connection needs attention',
    description: 'Check the session message, then try again.',
  },
  ended: {
    title: 'Session ended',
    description: 'You can start a new troubleshooting session.',
  },
};

// Transport health takes priority over stale Agent activity. Microphone state is independent.
export function mapSignalState(
  agentState: string | null,
  isAgentConnected: boolean,
  connectionState: string,
  hasError = false,
): AgentSignalState {
  if (
    hasError ||
    connectionState === 'DISCONNECTED' ||
    connectionState === 'DISCONNECTING'
  )
    return 'error';
  if (
    connectionState === 'CONNECTING' ||
    connectionState === 'RECONNECTING' ||
    !isAgentConnected
  )
    return 'connecting';
  if (
    agentState === 'listening' ||
    agentState === 'thinking' ||
    agentState === 'speaking'
  )
    return agentState;
  return 'idle';
}

// Fast attack and slower release make measured audio readable without inventing a signal.
export function smoothAudioLevel(
  raw: number,
  previous: number,
  deltaSeconds: number,
): number {
  const target = Math.sqrt(
    Math.max(0, Math.min(1, Number.isFinite(raw) ? raw : 0)),
  );
  const rate = target > previous ? 22 : 7;
  return (
    previous +
    (target - previous) * (1 - Math.exp(-Math.max(0, deltaSeconds) * rate))
  );
}
