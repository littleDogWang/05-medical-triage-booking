export interface ScenarioPresentation {
  id: string;
  name: string;
  purpose: string;
  headline: string[];
  summary: string;
  featuresHeading: string;
  features: { emoji: string; title: string }[];
  builtWith: string[];
  startLabel: string;
  boundaryShort: string;
  outcomes: { id: string; label: string }[];
  developer: {
    sourceUrl: string;
    runCommand: string;
    assistantPrompt: string;
    skillsCommand: string;
    docsUrl: string;
    sdkUrl: string;
    consoleUrl: string;
    cliUrl: string;
    skillsUrl: string;
    extensionPoints: { title: string; path: string }[];
  };
}
