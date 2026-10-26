'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { EMPTY_INSPECTION, type InspectionSnapshot } from '@/lib/inspection';
import type { AgentSignalSnapshot } from '@/lib/agent-signal';
import { getScenarioPresentation } from '@/lib/presentation';
import { ScenarioIdentity } from './ScenarioIdentity';
import { ConversationWorkspace } from './ConversationWorkspace';
import { QuickstartPreCallCard, ScenarioEntryDialog } from './QuickstartPreCallCard';
import { ScenarioInspector } from './ScenarioInspector';
import { DeveloperGuide } from './DeveloperGuide';
import { ConversationPanel } from './agent-ui/conversation-panel';
import { Button } from './ui/button';

export function useScenarioUi() {
  const [activity, setActivity] = useState<AgentSignalSnapshot>({ state: 'idle', micEnabled: false });
  const [inspection, setInspection] = useState<InspectionSnapshot>(EMPTY_INSPECTION);
  const [entryOpen, setEntryOpen] = useState(true);
  const [outcome, setOutcome] = useState('');
  const start = useCallback(() => {
    setActivity({ state: 'connecting', micEnabled: false });
    setInspection({ ...EMPTY_INSPECTION, lifecycle: 'starting', startedAt: Date.now() });
    setOutcome('');
    setEntryOpen(false);
  }, []);
  const end = useCallback(() => {
    setActivity({ state: 'ended', micEnabled: false });
    setInspection(previous => ({ ...previous, lifecycle: 'ended', endedAt: Date.now(), agentState: 'ended', micEnabled: false, transport: 'DISCONNECTED' }));
  }, []);
  return { activity, setActivity, inspection, setInspection, entryOpen, setEntryOpen, outcome, setOutcome, start, end };
}

type ScenarioUi = ReturnType<typeof useScenarioUi>;

export function ScenarioShell({ ui, active, loading, error, disabled = false, onStart, children, business }: {
  ui: ScenarioUi;
  active: boolean;
  loading: boolean;
  error: string | null;
  disabled?: boolean;
  onStart: () => void;
  children: ReactNode;
  business?: ReactNode;
}) {
  const scenario = getScenarioPresentation();
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [buildOpen, setBuildOpen] = useState(false);
  const activity: AgentSignalSnapshot = !active && error
    ? { state: 'error', micEnabled: false }
    : loading ? { state: 'connecting', micEnabled: false } : ui.activity;
  const inspection: InspectionSnapshot = !active && error
    ? { ...ui.inspection, lifecycle: 'error', agentState: 'error', events: [...ui.inspection.events, { id: 'session-error', time: ui.inspection.startedAt ?? 0, kind: 'error', label: 'Session needs attention', detail: error }] }
    : ui.inspection;
  return (
    <div className="demo-shell">
      <ScenarioIdentity scenario={scenario} onInspect={() => setInspectorOpen(true)} onBuild={() => setBuildOpen(true)} />
      <ConversationWorkspace scenario={scenario} activity={activity} inspection={inspection}>
        {active ? children : inspection.lifecycle === 'ended' ? (
          <section className="demo-session demo-session-ended">
            <div className="demo-session-heading"><h2>Session ended.</h2></div>
            <ConversationPanel id="last-session-transcript" name={scenario.name} messages={inspection.messages} pending={false} voiceState="ended" className="demo-conversation" />
            <div className="demo-ended-actions">
              <Button disabled={disabled || loading} onClick={onStart}>Start again</Button>
            </div>
          </section>
        ) : (
          <QuickstartPreCallCard scenario={scenario} isLoading={loading} disabled={disabled} error={error} onStart={onStart} />
        )}
      </ConversationWorkspace>
      {business ? <section className="demo-business" aria-label={`${scenario.name} details`}>{business}</section> : null}
      <ScenarioEntryDialog scenario={scenario} open={ui.entryOpen && !active} onOpenChange={ui.setEntryOpen} isLoading={loading} disabled={disabled} error={error} sessionActive={active} onStart={onStart} />
      <ScenarioInspector scenario={scenario} snapshot={inspection} outcome={ui.outcome} onOutcomeChange={ui.setOutcome} open={inspectorOpen} onOpenChange={setInspectorOpen} />
      <DeveloperGuide scenario={scenario} open={buildOpen} onOpenChange={setBuildOpen} />
    </div>
  );
}
