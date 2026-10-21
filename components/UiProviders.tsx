'use client';
import { TooltipProvider } from './ui/tooltip';
export function UiProviders({ children }: { children: React.ReactNode }) {
  return <TooltipProvider>{children}</TooltipProvider>;
}
