'use client';

import { useState, type ReactNode } from 'react';
import { Pause, Play } from 'lucide-react';
import { AgentSignal } from './AgentSignal';
import { Button } from './ui/button';
import { SIGNAL_COPY, type AgentSignalSnapshot } from '@/lib/agent-signal';
import type { InspectionSnapshot } from '@/lib/inspection';
import type { ScenarioPresentation } from '@/lib/presentation';

export function ConversationWorkspace({
  children,
  activity,
  scenario,
  inspection,
}: {
  children: ReactNode;
  activity: AgentSignalSnapshot;
  scenario: ScenarioPresentation;
  inspection: InspectionSnapshot;
}) {
  const [paused, setPaused] = useState(false);
  const ready =
    inspection.lifecycle === 'ready' ||
    inspection.lifecycle === 'starting' ||
    inspection.lifecycle === 'error';
  const copy = SIGNAL_COPY[activity.state];
  const muted = inspection.lifecycle === 'live' && !activity.micEnabled;
  const description = muted
    ? activity.state === 'speaking'
      ? 'Unmute to interrupt or reply.'
      : 'Unmute when you’re ready to speak.'
    : activity.state === 'error'
      ? 'Open Inspector for details.'
      : '';
  return (
    <main
      id="main-content"
      className={`demo-workspace ${ready ? 'demo-workspace-ready' : 'demo-workspace-session'}`}
    >
      <div className="demo-main-content">{children}</div>
      <aside className="demo-sidebar" aria-label={`${scenario.name} activity`}>
        <section className="demo-agent" aria-label="Agent activity">
          <div className="demo-agent-control">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={
                paused ? 'Resume Agent animation' : 'Pause Agent animation'
              }
              aria-pressed={paused}
              onClick={() => setPaused((value) => !value)}
            >
              {paused ? <Play /> : <Pause />}
            </Button>
          </div>
          <AgentSignal activity={activity} paused={paused} />
          <div
            className={`demo-agent-copy ${activity.state === 'idle' ? 'sr-only' : ''}`}
            role="status"
          >
            <h2>{copy.title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
        </section>
      </aside>
    </main>
  );
}
