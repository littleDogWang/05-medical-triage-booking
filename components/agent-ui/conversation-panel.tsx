'use client';

import { Fragment, type ReactNode } from 'react';

import { Bubble, BubbleContent } from '@/components/ui/bubble';
import {
  Message,
  MessageContent,
  MessageHeader,
} from '@/components/ui/message';
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from '@/components/ui/message-scroller';

import type { VoiceState } from '@/components/status';
import { cn } from '@/lib/utils';

export interface TranscriptMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  createdAt?: number;
  streaming?: boolean;
}
export interface ConversationPanelProps {
  id: string;
  name?: string;
  messages: TranscriptMessage[];
  pending: boolean;

  voiceState?: VoiceState;
  hidden?: boolean;
  className?: string;
  agentRun?: {
    afterMessageId: string;
    content: ReactNode;
  };
}
export function ConversationPanel({
  id,
  name = 'IT Support Assistant',
  messages,
  pending,
  voiceState = 'ready',
  hidden,
  className,
  agentRun,
}: ConversationPanelProps) {
  const displayedMessages: TranscriptMessage[] =
    messages.length === 0 && !agentRun
      ? [
          {
            id: 'conversation-placeholder',
            role: 'agent',
            text:
              voiceState === 'connecting'
                ? 'Connecting…'
                : 'Describe your IT issue to get started.',
          },
        ]
      : messages;
  const agentRunAnchorFound = agentRun
    ? messages.some((message) => message.id === agentRun.afterMessageId)
    : false;
  return (
    <section
      id={id}
      hidden={hidden}
      className={cn('ag-conversation', className)}
      aria-label={`Conversation with ${name}`}
      aria-busy={pending}
      data-voice-state={voiceState}
    >
      <div className="ag-transcript">
        <MessageScrollerProvider autoScroll defaultScrollPosition="end">
          <MessageScroller>
            <MessageScrollerViewport
              role="log"
              aria-label={`${name} live transcript`}
              aria-live="polite"
              tabIndex={0}
            >
              <MessageScrollerContent>
                {displayedMessages.map((message) => (
                  <Fragment key={message.id}>
                    <MessageScrollerItem messageId={message.id}>
                      <Message
                        align={message.role === 'user' ? 'end' : 'start'}
                      >
                        <MessageContent>
                          <MessageHeader>
                            {message.role === 'user' ? 'You' : 'Assistant'}
                            {message.createdAt && (
                              <time
                                className="ml-2 font-normal"
                                dateTime={new Date(
                                  message.createdAt,
                                ).toISOString()}
                              >
                                {new Intl.DateTimeFormat('en', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                }).format(new Date(message.createdAt))}
                              </time>
                            )}
                            {message.streaming && (
                              <span className="ml-2 font-normal">Live</span>
                            )}
                          </MessageHeader>
                          <Bubble
                            variant={
                              message.role === 'user' ? 'tinted' : 'ghost'
                            }
                            align={message.role === 'user' ? 'end' : 'start'}
                          >
                            <BubbleContent>{message.text}</BubbleContent>
                          </Bubble>
                        </MessageContent>
                      </Message>
                    </MessageScrollerItem>
                    {agentRun?.afterMessageId === message.id ? (
                      <MessageScrollerItem
                        messageId={`${message.id}-agent-run`}
                      >
                        {agentRun.content}
                      </MessageScrollerItem>
                    ) : null}
                  </Fragment>
                ))}
                {agentRun && !agentRunAnchorFound ? (
                  <MessageScrollerItem messageId="unanchored-agent-run">
                    {agentRun.content}
                  </MessageScrollerItem>
                ) : null}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>
      </div>
    </section>
  );
}
