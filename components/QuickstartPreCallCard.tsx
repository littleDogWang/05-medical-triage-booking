'use client';

import { Loader2, Mic } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import type { ScenarioPresentation } from '@/scenarios/presentation';

function ScenarioFeatures({ scenario }: { scenario: ScenarioPresentation }) {
  return (
    <>
      {scenario.features.length ? (
        <section
          className="demo-features"
          aria-label={scenario.featuresHeading}
        >
          <h3>
            <span className="demo-feature-comparison">
              {scenario.featuresHeading}
            </span>
          </h3>
          <ul>
            {scenario.features.map((feature) => (
              <li key={feature.title}>
                <span className="demo-feature-emoji" aria-hidden="true">
                  {feature.emoji}
                </span>
                {feature.title}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <div className="demo-built-with">
        <span>Built with</span>
        <ul aria-label="Technology stack">
          {scenario.builtWith.map((technology) => (
            <li key={technology}>{technology}</li>
          ))}
        </ul>
      </div>
    </>
  );
}

export function QuickstartPreCallCard({
  scenario,
  isLoading,
  disabled = false,
  error,
  onStart,
}: {
  scenario: ScenarioPresentation;
  isLoading: boolean;
  disabled?: boolean;
  error: string | null;
  onStart: () => void;
}) {
  return (
    <section className="demo-welcome">
      <h2>
        {scenario.headline.map((line, index) => (
          <span key={line}>
            {index > 0 ? <br /> : null}
            {line}
          </span>
        ))}
      </h2>
      <p className="demo-lead">{scenario.summary}</p>
      <ScenarioFeatures scenario={scenario} />
      <div className="demo-welcome-actions">
        <Button
          size="lg"
          disabled={isLoading || disabled}
          aria-busy={isLoading}
          onClick={onStart}
        >
          {isLoading ? (
            <Loader2 className="animate-spin" data-icon="inline-start" />
          ) : (
            <Mic data-icon="inline-start" />
          )}
          {isLoading ? 'Connecting…' : scenario.startLabel}
        </Button>
      </div>
      <p className="demo-note">Microphone access required.</p>
      <p className="demo-note">{scenario.boundaryShort}</p>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </section>
  );
}

export function ScenarioEntryDialog({
  scenario,
  open,
  onOpenChange,
  isLoading,
  disabled = false,
  error,
  sessionActive,
  onStart,
}: {
  scenario: ScenarioPresentation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
  disabled?: boolean;
  error: string | null;
  sessionActive: boolean;
  onStart: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!isLoading) onOpenChange(value);
      }}
    >
      <DialogContent
        className="demo-entry-dialog"
        showCloseButton={!isLoading}
        onEscapeKeyDown={(event) => {
          if (isLoading) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (isLoading) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{scenario.name}</DialogTitle>
          <DialogDescription>{scenario.summary}</DialogDescription>
        </DialogHeader>
        {!error ? <ScenarioFeatures scenario={scenario} /> : null}
        <p className="demo-note">{scenario.boundaryShort}</p>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {sessionActive ? (
          <Button onClick={() => onOpenChange(false)}>
            Back to conversation
          </Button>
        ) : (
          <Button
            size="lg"
            disabled={isLoading || disabled}
            aria-busy={isLoading}
            onClick={onStart}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <Mic data-icon="inline-start" />
            )}
            {isLoading
              ? `Connecting to ${scenario.name}…`
              : scenario.startLabel}
          </Button>
        )}
        {!sessionActive ? (
          <Button
            variant="ghost"
            disabled={isLoading || disabled}
            onClick={() => onOpenChange(false)}
          >
            Preview first
          </Button>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
