> **When to Read This:** Load this when modifying transcript rendering, event handling, UID mapping, metrics/error panels, or RTM fallback parsing.

# Transcript Pipeline

## Overview

Transcript and call diagnostics are delivered through AgoraVoiceAI events over RTM, then normalized for UI kit components.

Primary pipeline:

1. RTM/RTC data arrives.
2. `AgoraVoiceAI` emits transcript/state/metrics/error events.
3. `ConversationComponent` stores raw transcript and issue streams.
4. `lib/conversation.ts` normalizes UID/text/timestamps.
5. UI panels render message history + in-progress turn separately.

## Transcript Normalization Stages

- UID remap: toolkit `uid="0"` -> actual local RTC UID string.
- Text cleanup: punctuation spacing normalization.
- Timestamp normalization: seconds vs milliseconds unified.
- Status segmentation:
- `IN_PROGRESS` displayed as live bubble.
- `END` + `INTERRUPTED` included in scrollable history.

## Why `INTERRUPTED` Must Stay in History

If the first agent turn is interrupted and omitted, `messageList` can remain empty and transcript auto-open logic may never engage. Keeping interrupted turns preserves user-visible causality.

## Agent Activity Mapping

`mapSignalState` in `lib/agent-signal.ts` prioritizes transport errors before agent activity:

- An error or `DISCONNECTED`/`DISCONNECTING` maps to `error`.
- `CONNECTING`/`RECONNECTING` or no agent presence maps to `connecting`.
- Connected `listening`, `thinking` and `speaking` retain their semantic state.
- Other connected states map to `idle`; microphone state remains independent.

## Metrics and Error Streams

Handled signals:

- `AGENT_METRICS` for retained Inspector reports.
- `MESSAGE_ERROR` and `AGENT_ERROR` for surfaced issues.
- `MESSAGE_SAL_STATUS` for registration failures (`VP_REGISTER_FAIL`, `VP_REGISTER_DUPLICATE`).

Fallback parser:

- Raw RTM `message` listener parses JSON payloads for `message.error` and `message.sal_status` to catch issues not raised via higher-level events.

## Coupled Files

- `components/ConversationComponent.tsx`: event subscriptions and issue collection.
- `lib/conversation.ts`: transcript normalization and message segmentation.
- `lib/agent-signal.ts`: transport-aware activity mapping.
- `components/QuickstartTranscriptPanel.tsx`: transcript render sink.
- `components/ScenarioInspector.tsx`: retained metrics and session evidence.
- `components/ConnectionStatusPanel.tsx`: surfaced connection diagnostics.
