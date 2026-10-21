'use client';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from './ui/empty';
export function LoadingSkeleton() {
  return (
    <Empty role="status">
      <EmptyHeader>
        <EmptyTitle>Getting your session ready</EmptyTitle>
        <EmptyDescription>
          Connecting voice, the assistant and live transcript.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
