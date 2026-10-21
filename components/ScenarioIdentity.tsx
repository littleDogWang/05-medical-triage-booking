'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { Button } from './ui/button';
import type { ScenarioPresentation } from '@/scenarios/presentation';

export function ScenarioIdentity({
  scenario,
  onInspect,
  onBuild,
}: {
  scenario: ScenarioPresentation;
  onInspect: () => void;
  onBuild: () => void;
}) {
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const header = headerRef.current;
    const shell = header?.closest<HTMLElement>('.demo-shell');
    if (!header || !shell) return;
    const update = () =>
      shell.style.setProperty(
        '--demo-header-bottom',
        `${Math.ceil(header.getBoundingClientRect().bottom + window.scrollY)}px`,
      );
    const observer = new ResizeObserver(update);
    observer.observe(header);
    update();
    return () => {
      observer.disconnect();
      shell.style.removeProperty('--demo-header-bottom');
    };
  }, []);
  return (
    <header ref={headerRef} className="demo-header">
      <a className="demo-skip" href="#main-content">
        Skip to main content
      </a>
      <div className="demo-brand-group">
        <a
          className="demo-brand"
          href="https://www.agora.io/en/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Agora website (opens in a new tab)"
        >
          <Image
            src="/agora-logo.svg"
            alt="Agora"
            width={92}
            height={32}
            priority
          />
        </a>
        <div className="demo-identity">
          <h1>{scenario.name}</h1>
          <p>
            {scenario.id} · {scenario.purpose}
          </p>
        </div>
      </div>
      <nav className="demo-header-actions" aria-label="Demo tools">
        <Button
          variant="ghost"
          size="sm"
          onClick={onInspect}
          aria-label="Open Inspector"
          title="Inspector"
        >
          <span className="demo-tool-label">Inspector</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBuild}
          aria-label="Build this scenario"
          title="Build this scenario"
        >
          <span className="demo-tool-label">Build</span>
        </Button>
      </nav>
    </header>
  );
}
