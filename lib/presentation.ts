import type { ScenarioPresentation } from '@/types/presentation';
export type { ScenarioPresentation } from '@/types/presentation';

export const presentation: ScenarioPresentation = {
  "id": "08-medical-triage-booking",
  "name": "Clinic Appointment Assistant",
  "purpose": "Clinic information and simulated appointments",
  "headline": [
    "Appointments, by voice."
  ],
  "summary": "Ask about Agora Family Clinic or arrange a simulated appointment with the assistant.",
  "featuresHeading": "Beyond starter",
  "features": [
    {
      "emoji": "🩺",
      "title": "Clinic information"
    },
    {
      "emoji": "📅",
      "title": "Appointment scheduling"
    },
    {
      "emoji": "🚨",
      "title": "Emergency escalation guidance"
    }
  ],
  "builtWith": [
    "Agora Conversational AI",
    "Agents SDK",
    "Next.js"
  ],
  "startLabel": "Talk to clinic reception",
  "boundaryShort": "Simulated clinic only. No diagnosis, prescription, real appointment or live transfer.",
  "outcomes": [
    {
      "id": "answered",
      "label": "My appointment questions were answered"
    },
    {
      "id": "needs-help",
      "label": "I need further help"
    }
  ],
  "developer": {
    "sourceUrl": "https://github.com/AgoraIO-Conversational-AI/agent-quickstart-nextjs",
    "runCommand": "pnpm install\nagora login\nagora project use <your-project>\nagora project env write .env.local\npnpm dev",
    "skillsCommand": "npx skills add github:AgoraIO/skills",
    "assistantPrompt": "Use Agora Skills to work in the existing 08-medical-triage-booking scenario checkout. Preserve the working Agora session lifecycle and business contracts. Help me adapt its business data and assistant instructions for my workflow.",
    "docsUrl": "https://docs.agora.io/en/ai/build/build-server-client",
    "sdkUrl": "https://www.npmjs.com/package/agora-agents",
    "consoleUrl": "https://console.agora.io/",
    "cliUrl": "https://github.com/AgoraIO/cli",
    "skillsUrl": "https://github.com/AgoraIO/skills",
    "extensionPoints": [
      {
        "title": "Change assistant instructions",
        "path": "lib/agent-config.ts"
      },
      {
        "title": "Adapt clinic.ts",
        "path": "lib/medical-triage-booking/clinic.ts"
      },
      {
        "title": "Adapt clinic.json",
        "path": "lib/medical-triage-booking/clinic.json"
      },
      {
        "title": "Choose models and voice",
        "path": "app/api/invite-agent/route.ts"
      },
      {
        "title": "Adapt scenario UI content",
        "path": "lib/presentation.ts"
      }
    ]
  }
};

export function getScenarioPresentation(): ScenarioPresentation {
  return presentation;
}
