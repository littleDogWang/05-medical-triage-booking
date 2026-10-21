'use client';

import { useState } from 'react';
import { ArrowUpRight, Check, Copy } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import type { ScenarioPresentation } from '@/scenarios/presentation';

function CopyText({ text, label }: { text: string; label: string }) {
  const [result, setResult] = useState('');
  return (
    <div className="demo-copy">
      <Button
        variant="ghost"
        size="sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setResult('Copied');
          } catch {
            setResult('Select the text to copy it.');
          }
        }}
      >
        {result === 'Copied' ? (
          <Check data-icon="inline-start" />
        ) : (
          <Copy data-icon="inline-start" />
        )}
        {label}
      </Button>
      <span role="status">{result}</span>
    </div>
  );
}

export function DeveloperGuide({
  scenario,
  open,
  onOpenChange,
}: {
  scenario: ScenarioPresentation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const d = scenario.developer;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="demo-build-dialog">
        <DialogHeader>
          <DialogTitle>Make this scenario your own</DialogTitle>
          <DialogDescription>
            Start from the working {scenario.name} and follow the path that fits
            how you build.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="source">
          <TabsList variant="line" aria-label="Ways to develop this scenario">
            <TabsTrigger value="source">Run locally</TabsTrigger>
            <TabsTrigger value="skills">Build with AI</TabsTrigger>
            <TabsTrigger value="stack">Under the hood</TabsTrigger>
          </TabsList>
          <TabsContent value="source" className="demo-build-content">
            <h3>Run this scenario checkout</h3>
            <p>
              Open this scenario’s local checkout before running these commands.
              The Agora CLI handles sign-in and project credentials.
              The source link below opens the upstream voice starter.
            </p>
            <CopyText text={d.runCommand} label="Copy setup commands" />
            <pre tabIndex={0}>
              <code>{d.runCommand}</code>
            </pre>
            <p className="demo-note">
              Install the Agora CLI first. Replace &lt;your-project&gt; with a
              project you can use.
            </p>
            <a href={d.cliUrl} target="_blank" rel="noopener noreferrer">
              CLI installation and setup <ArrowUpRight aria-hidden="true" />
            </a>
          </TabsContent>
          <TabsContent value="skills" className="demo-build-content">
            <h3>Give your coding assistant the Agora context</h3>
            <p>
              Agora Skills provide official quickstarts and CLI workflows.
              Install them, then use this prompt to adapt the scenario.
            </p>
            <CopyText text={d.skillsCommand} label="Copy install command" />
            <pre>
              <code>{d.skillsCommand}</code>
            </pre>
            <CopyText text={d.assistantPrompt} label="Copy assistant prompt" />
            <blockquote>{d.assistantPrompt}</blockquote>
            <a href={d.skillsUrl} target="_blank" rel="noopener noreferrer">
              Explore Agora Skills <ArrowUpRight aria-hidden="true" />
            </a>
          </TabsContent>
          <TabsContent value="stack" className="demo-build-content">
            <h3>From your application to a voice response</h3>
            <dl className="demo-stack">
              <div>
                <dt>Agora Agents SDK</dt>
                <dd>
                  Creates and stops the server-side agent; configures
                  instructions, models, voice and tools.
                </dd>
              </div>
              <div>
                <dt>Web RTC + Signaling</dt>
                <dd>
                  Carry live audio, transcripts, Agent activity and reported
                  timing events.
                </dd>
              </div>
              <div>
                <dt>Client Toolkit + UIkit</dt>
                <dd>
                  Connect session events to the conversation, controls and
                  Inspector.
                </dd>
              </div>
            </dl>
            <h3>Change one thing at a time</h3>
            <ul className="demo-extension-list">
              {d.extensionPoints.map((point) => (
                <li key={point.path}>
                  <span>{point.title}</span>
                  <code>{point.path}</code>
                </li>
              ))}
            </ul>
          </TabsContent>
        </Tabs>
        <nav
          className="demo-developer-links"
          aria-label="Agora developer resources"
        >
          <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer">
            Source <ArrowUpRight aria-hidden="true" />
          </a>
          <a href={d.docsUrl} target="_blank" rel="noopener noreferrer">
            Build guide <ArrowUpRight aria-hidden="true" />
          </a>
          <a href={d.sdkUrl} target="_blank" rel="noopener noreferrer">
            Agents SDK <ArrowUpRight aria-hidden="true" />
          </a>
          <a href={d.consoleUrl} target="_blank" rel="noopener noreferrer">
            Agora Console <ArrowUpRight aria-hidden="true" />
          </a>
        </nav>
      </DialogContent>
    </Dialog>
  );
}
