'use client';

import { type ReactNode } from 'react';
import { EMPTY_INSPECTION, type InspectionSnapshot } from '@/lib/inspection';
import type { AgentSignalSnapshot } from '@/lib/agent-signal';
import { ScenarioIdentity } from './ScenarioIdentity';
import { ConversationWorkspace } from './ConversationWorkspace';
import { QuickstartPreCallCard, ScenarioEntryDialog } from './QuickstartPreCallCard';
import { ScenarioInspector } from './ScenarioInspector';
import { DeveloperGuide } from './DeveloperGuide';
import { ConversationPanel } from './agent-ui/conversation-panel';
import { Button } from './ui/button';

import { useState, useRef, Suspense, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { getScenarioPresentation } from '@/lib/presentation';
import type { RTMClient } from 'agora-rtm';
import type {
  AgoraTokenData,
  ClientStartRequest,
  AgentResponse,
  AgoraRenewalTokens,
} from '../types/conversation';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingSkeleton } from './LoadingSkeleton';

// Dynamically import the ConversationComponent with ssr disabled
const ConversationComponent = dynamic(() => import('./ConversationComponent'), {
  ssr: false,
});

// Dynamically import AgoraRTCProvider (browser-only).
// The AgoraVoiceAI toolkit is initialized inside ConversationComponent after
// the RTC join succeeds, so this wrapper only needs to provide the RTC client.
const AgoraProvider = dynamic(
  async () => {
    const { AgoraRTCProvider, default: AgoraRTC } =
      await import('agora-rtc-react');
    return {
      default: function AgoraProviders({
        children,
      }: {
        children: React.ReactNode;
      }) {
        // useRef persists across StrictMode's simulated unmount/remount, so only
        // one RTC client is ever created per session (useMemo creates two in StrictMode).
        const clientRef = useRef<ReturnType<
          typeof AgoraRTC.createClient
        > | null>(null);
        if (!clientRef.current) {
          clientRef.current = AgoraRTC.createClient({
            mode: 'rtc',
            codec: 'vp8',
          });
        }
        return (
          <AgoraRTCProvider client={clientRef.current}>
            {children}
          </AgoraRTCProvider>
        );
      },
    };
  },
  { ssr: false },
);

export default function LandingPage() {
  const [showConversation, setShowConversation] = useState(false);
  const ui = useScenarioUi();
  const [ending, setEnding] = useState(false);
  const endPending = useRef(false);

  // Preload heavy modules on mount so they're already cached when the user
  // clicks "Try it Now" — eliminates the ~1.8s dynamic-import delay.
  useEffect(() => {
    import('agora-rtc-react').catch(() => {});
    import('agora-rtm').catch(() => {});
  }, []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agoraData, setAgoraData] = useState<AgoraTokenData | null>(null);
  const [rtmClient, setRtmClient] = useState<RTMClient | null>(null);
  const [agentJoinError, setAgentJoinError] = useState(false);

  const handleStartConversation = async () => {
    setIsLoading(true);
    ui.start();
    setError(null);
    setAgentJoinError(false);

    try {
      // 1. Fetch RTC token + channel
      // console.log('Fetching Agora token...');
      const agoraResponse = await fetch('/api/generate-agora-token');
      const responseData = await agoraResponse.json();
      // console.log('Agora token response: uid =', responseData.uid, 'channel =', responseData.channel);

      if (!agoraResponse.ok) {
        throw new Error(
          `Failed to generate Agora token: ${JSON.stringify(responseData)}`,
        );
      }

      // 2. Run agent invite and RTM setup in parallel — both only need the token response.
      //    RTM must be ready before ConversationComponent mounts so AgoraVoiceAI
      //    can subscribe immediately. Agent invite is non-fatal.
      const [agentData, rtm] = await Promise.all([
        // 2a. Start the AI agent
        fetch('/api/invite-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requester_id: responseData.uid,
            channel_name: responseData.channel,
          } as ClientStartRequest),
        })
          .then(async (res) => {
            if (!res.ok) {
              setAgentJoinError(true);
              return null;
            }
            return res.json() as Promise<AgentResponse>;
          })
          .catch((err) => {
            console.error('Failed to start conversation with agent:', err);
            setAgentJoinError(true);
            return null;
          }),

        // 2b. Set up RTM (dynamically imported to keep it client-only)
        (async () => {
          const { default: AgoraRTM } = await import('agora-rtm');
          const rtm: RTMClient = new AgoraRTM.RTM(
            process.env.NEXT_PUBLIC_AGORA_APP_ID!,
            responseData.uid,
          );
          await rtm.login({ token: responseData.token });
          await rtm.subscribe(responseData.channel);
          // console.log('RTM ready, channel:', responseData.channel);
          return rtm;
        })(),
      ]);

      // 3. All dependencies ready — store state and show conversation
      setRtmClient(rtm);
      setAgoraData({ ...responseData, agentId: agentData?.agent_id, startedAt: Date.now() });
      setShowConversation(true);
    } catch (err) {
      setError(`Could not connect to ${getScenarioPresentation().name}. Please try again.`);
      console.error('Error starting conversation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenWillExpire = useCallback(
    async (uid: string): Promise<AgoraRenewalTokens> => {
      try {
        const channel = agoraData?.channel;
        if (!channel) {
          throw new Error('Missing channel for token renewal');
        }

        // RTC and RTM tokens are renewed independently:
        //   - RTC uses the browser client's assigned UID (passed in from ConversationComponent).
        //   - RTM uses the same UID that was used during RTM login (agoraData.uid).
        // Both are fetched in parallel to stay within the token-expiry grace-period window.
        const [rtcResponse, rtmResponse] = await Promise.all([
          fetch(`/api/generate-agora-token?channel=${channel}&uid=${uid}`),
          fetch(`/api/generate-agora-token?channel=${channel}&uid=${agoraData.uid}`),
        ]);
        const [rtcData, rtmData] = await Promise.all([
          rtcResponse.json(),
          rtmResponse.json(),
        ]);

        if (!rtcResponse.ok || !rtmResponse.ok) {
          throw new Error('Failed to generate renewal tokens');
        }

        return {
          rtcToken: rtcData.token,
          rtmToken: rtmData.token,
        };
      } catch (error) {
        console.error('Error renewing token:', error);
        throw error;
      }
    },
    [agoraData],
  );

  const handleEndConversation = async () => {
    if (endPending.current) return;
    endPending.current = true;
    setEnding(true);
    try {
      // Stop the AI agent
      if (agoraData?.agentId) {
        try {
          // console.log('Stopping agent:', agoraData.agentId);
          const response = await fetch('/api/stop-conversation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agent_id: agoraData.agentId }),
          });
          if (!response.ok) {
            console.error('Failed to stop agent:', await response.text());
          }
          // else console.log('Agent stopped successfully');
        } catch (error) {
          console.error('Error stopping agent:', error);
        }
      }

      // Tear down RTM — owned here since we created it here
      rtmClient?.logout().catch((err) => console.error('RTM logout error:', err));
      setRtmClient(null);
      setShowConversation(false);
      ui.end();
    } finally {
      endPending.current = false;
      setEnding(false);
    }
  };

  return (
    <ScenarioShell ui={ui} active={showConversation} loading={isLoading} error={error} disabled={false} onStart={handleStartConversation}
    >
      {agentJoinError && <p role="alert">The assistant could not connect. End this session and try again.</p>}
      {error && <p className="demo-workspace-fallback" role="alert">{error}</p>}
      {showConversation && agoraData && rtmClient && <Suspense fallback={<LoadingSkeleton />}><ErrorBoundary><AgoraProvider>
        <ConversationComponent agoraData={agoraData} rtmClient={rtmClient} onTokenWillExpire={handleTokenWillExpire} onEndConversation={handleEndConversation}
          onActivityChange={ui.setActivity} onInspectionChange={ui.setInspection} ending={ending}
          startupError={agentJoinError ? "The assistant could not connect. End this session and try again." : undefined} />
      </AgoraProvider></ErrorBoundary></Suspense>}
    </ScenarioShell>
  );
}


function useScenarioUi() {
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

function ScenarioShell({ ui, active, loading, error, disabled = false, onStart, children, business }: {
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
