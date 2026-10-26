// Shared non-secret configuration: the server consumes these exact model IDs.
export const RUNTIME_PROFILE = {
  recognition: { provider: 'Deepgram', model: 'nova-3', language: 'en' },
  reasoning: { provider: 'OpenAI', model: 'gpt-4o-mini' },
  synthesis: {
    provider: 'MiniMax',
    model: 'speech_2_6_turbo',
    voice: 'English_captivating_female1',
  },
} as const;
