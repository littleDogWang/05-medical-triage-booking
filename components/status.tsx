import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type VoiceState = "ready" | "connecting" | "listening" | "thinking" | "speaking" | "muted" | "error" | "ended";
const labels: Record<VoiceState, string> = {
  ready: "Ready",
  connecting: "Connecting",
  thinking: "Thinking",
  speaking: "Speaking",
  muted: "Microphone muted",
  error: "Connection needs attention",
  listening: "Listening",
  ended: "Ended",
};
export function Status({
  state = "ready",
  children,
  className,
  ...props
}: ComponentProps<"span"> & { state?: VoiceState }) {
  return (
    <span
      data-slot="status"
      data-state={state}
      className={cn("ag-status", className)}
      {...props}
    >
      {children ?? labels[state]}
    </span>
  );
}
