'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import type { ScenarioPresentation } from '@/lib/presentation';
import { latencySummary, type InspectionSnapshot } from '@/lib/inspection';
import { SIGNAL_COPY } from '@/lib/agent-signal';
import { RUNTIME_PROFILE } from '@/lib/runtime-profile';

export const formatLatency = (value: number | null) =>
  value === null
    ? 'Not reported'
    : `${Math.round(value).toLocaleString('en-US')} ms`;
const time = (value: number) =>
  new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(value);

export function ScenarioInspector({
  scenario,
  snapshot,
  outcome,
  onOutcomeChange,
  open,
  onOpenChange,
}: {
  scenario: ScenarioPresentation;
  snapshot: InspectionSnapshot;
  outcome: string;
  onOutcomeChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selected, setSelected] = useState('latest');
  const [exportError, setExportError] = useState('');
  const latest = snapshot.turns.at(-1);
  const turn =
    selected === 'latest'
      ? latest
      : (snapshot.turns.find(
          (item) => `${item.agentId}:${item.turnId}` === selected,
        ) ?? latest);
  const summary = latencySummary(snapshot.turns);
  const metrics = new Map<string, (typeof snapshot.metrics)[number]>();
  snapshot.metrics.forEach((metric) =>
    metrics.set(`${metric.type}:${metric.name}`, metric),
  );
  const errors = snapshot.events.filter((event) => event.kind === 'error');

  function exportSession() {
    try {
      const data = {
        schemaVersion: 1,
        scenario: scenario.id,
        exportedAt: new Date().toISOString(),
        outcome: outcome || null,
        outcomeSource: outcome ? 'user-confirmed' : null,
        ...snapshot,
      };
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `${scenario.id}-session.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExportError('');
    } catch {
      setExportError('Could not export this session. Please try again.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="demo-inspector">
        <DialogHeader>
          <DialogTitle>Session Inspector</DialogTitle>
          <DialogDescription>
            {scenario.name} ·{' '}
            {snapshot.lifecycle === 'ended'
              ? 'Last session, kept in this page'
              : snapshot.lifecycle === 'live'
                ? 'Live session evidence'
                : 'Session diagnostics and evidence'}
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="overview" className="demo-inspector-tabs">
          <TabsList variant="line" aria-label="Inspector views">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="latency">Latency</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="demo-inspector-content">
            <h3>What is happening</h3>
            <dl className="demo-inspector-facts">
              <div>
                <dt>Session</dt>
                <dd>{snapshot.lifecycle}</dd>
              </div>
              <div>
                <dt>RTC connection</dt>
                <dd>{snapshot.transport}</dd>
              </div>
              <div>
                <dt>Agent activity</dt>
                <dd>{SIGNAL_COPY[snapshot.agentState].title}</dd>
              </div>
              <div>
                <dt>Microphone</dt>
                <dd>
                  {snapshot.lifecycle === 'live'
                    ? snapshot.micEnabled
                      ? 'On'
                      : 'Muted'
                    : 'Not active'}
                </dd>
              </div>
              <div>
                <dt>Recorded turns</dt>
                <dd>{snapshot.turns.length}</dd>
              </div>
              <div>
                <dt>Interruptions observed</dt>
                <dd>{snapshot.interruptions}</dd>
              </div>
              <div>
                <dt>Retained errors</dt>
                <dd>{errors.length}</dd>
              </div>
            </dl>
            <h3>Configured pipeline</h3>
            <dl className="demo-inspector-facts">
              <div>
                <dt>Speech recognition</dt>
                <dd>
                  {RUNTIME_PROFILE.recognition.provider}
                  <small>{RUNTIME_PROFILE.recognition.model}</small>
                </dd>
              </div>
              <div>
                <dt>Language model</dt>
                <dd>
                  {RUNTIME_PROFILE.reasoning.provider}
                  <small>{RUNTIME_PROFILE.reasoning.model}</small>
                </dd>
              </div>
              <div>
                <dt>Speech synthesis</dt>
                <dd>
                  {RUNTIME_PROFILE.synthesis.provider}
                  <small>{RUNTIME_PROFILE.synthesis.model}</small>
                </dd>
              </div>
            </dl>
            <p className="demo-note">
              Configuration shared with the server. This does not indicate that
              a stage is currently active.
            </p>
            <h3>Did it help?</h3>
            <label className="demo-field-label" htmlFor="session-outcome">
              Your assessment
            </label>
            <select
              className="demo-select"
              id="session-outcome"
              disabled={
                snapshot.lifecycle !== 'live' && snapshot.lifecycle !== 'ended'
              }
              value={outcome}
              onChange={(event) => onOutcomeChange(event.target.value)}
            >
              <option value="">Not confirmed</option>
              {scenario.outcomes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <p className="demo-note">
              User-confirmed, not an automated quality score. Kept in this page
              until a new session starts.
            </p>
            <details className="demo-evidence">
              <summary>
                Conversation evidence · {snapshot.messages.length} messages
              </summary>
              {snapshot.messages.length ? (
                snapshot.messages.map((message) => (
                  <div key={message.id}>
                    <strong>
                      {message.role === 'user' ? 'You' : 'Assistant'}
                    </strong>
                    <p>{message.text}</p>
                  </div>
                ))
              ) : (
                <p>No transcript has arrived yet.</p>
              )}
            </details>
            {errors.length > 0 ? (
              <div className="demo-inspector-errors">
                <h3>Needs attention</h3>
                {errors.map((event) => (
                  <p key={event.id}>
                    {event.label}
                    {event.detail ? ` · ${event.detail}` : ''}
                  </p>
                ))}
              </div>
            ) : null}
          </TabsContent>
          <TabsContent value="latency" className="demo-inspector-content">
            <div className="demo-latency-summary">
              <div>
                <span>Median E2E</span>
                <strong>{formatLatency(summary.median)}</strong>
              </div>
              <div>
                <span>p95 E2E</span>
                <strong>{formatLatency(summary.p95)}</strong>
              </div>
            </div>
            <p className="demo-note">
              {summary.count} measured turns in this page’s retained window, up
              to 50. p95 is descriptive; a small sample is not a performance
              benchmark.
            </p>
            <label className="demo-field-label" htmlFor="inspector-turn">
              Completed turn
            </label>
            <select
              id="inspector-turn"
              className="demo-select"
              value={selected}
              onChange={(event) => setSelected(event.target.value)}
            >
              <option value="latest">
                Latest turn{latest ? ` · ${latest.turnId}` : ''}
              </option>
              {snapshot.turns.map((item) => (
                <option
                  key={`${item.agentId}:${item.turnId}`}
                  value={`${item.agentId}:${item.turnId}`}
                >
                  Turn {item.turnId} · {time(item.timestamp)}
                </option>
              ))}
            </select>
            <dl className="demo-inspector-facts demo-timing">
              <div>
                <dt>Server-reported E2E</dt>
                <dd>{formatLatency(turn?.e2e ?? null)}</dd>
              </div>
              {(
                [
                  ['processing', 'Algorithm processing'],
                  ['asr', 'Speech recognition · TTLW'],
                  ['llm', 'Language model · TTFT'],
                  ['transport', 'Transport'],
                  ['tts', 'Speech synthesis · TTFB'],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd>{formatLatency(turn?.segments[key] ?? null)}</dd>
                </div>
              ))}
            </dl>
            <p className="demo-note">
              These are reported timings, not current stage activity. E2E is not
              calculated by adding these rows. Missing segments stay “Not
              reported”.
            </p>
            <h3>Latest module reports</h3>
            {metrics.size ? (
              <dl className="demo-inspector-facts">
                {[...metrics.values()].map((metric) => (
                  <div key={`${metric.type}:${metric.name}`}>
                    <dt>
                      <span>{metric.type.toUpperCase()}</span>
                      <small>{metric.name.replace(/[_-]/g, ' ')}</small>
                    </dt>
                    <dd>{formatLatency(metric.value)}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="demo-note">
                Waiting for metrics. Reports usually arrive after a response; a
                provider may omit individual timings.
              </p>
            )}
          </TabsContent>
          <TabsContent value="events" className="demo-inspector-content">
            <h3>Observed event timeline</h3>
            <p className="demo-note">
              Most recent 100 events. Activity, transport and interruptions come
              from session events; their receipt time is shown in your browser’s
              local time.
            </p>
            {snapshot.events.length ? (
              <ol className="demo-event-list">
                {[...snapshot.events].reverse().map((event) => (
                  <li key={event.id}>
                    <time dateTime={new Date(event.time).toISOString()}>
                      {time(event.time)}
                    </time>
                    <div>
                      <strong>{event.label}</strong>
                      {event.detail ? <p>{event.detail}</p> : null}
                    </div>
                    <span>{event.kind}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="demo-note">
                Start a voice session to collect events.
              </p>
            )}
          </TabsContent>
        </Tabs>
        <div className="demo-inspector-footer">
          <Button
            variant="outline"
            onClick={exportSession}
            disabled={snapshot.lifecycle === 'ready'}
          >
            <Download data-icon="inline-start" />
            Export session evidence
          </Button>
          <p className="demo-note">
            Includes transcript and timing data. No credentials are exported.
          </p>
          {exportError ? <p role="alert">{exportError}</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
