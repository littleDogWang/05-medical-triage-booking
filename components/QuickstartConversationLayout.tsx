'use client';
import type { ReactNode } from 'react';

export function QuickstartConversationLayout({
  statusPanel,
  transcriptPanel,
  controls,
  audio,
  feedback,
}: {
  statusPanel: ReactNode;
  transcriptPanel: ReactNode;
  controls: ReactNode;
  audio: ReactNode;
  feedback?: ReactNode;
}) {
  return (
    <section className="demo-session" aria-label="Voice conversation">
      <div className="demo-session-heading">
        <div>
          <h2>Conversation</h2>
        </div>
        {statusPanel}
      </div>
      <div className="demo-session-feedback">{feedback}</div>
      <div className="demo-transcript-host">{transcriptPanel}</div>
      <div className="demo-dock-host">{controls}</div>
      {audio}
    </section>
  );
}
