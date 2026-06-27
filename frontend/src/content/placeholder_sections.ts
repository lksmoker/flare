export type PlaceholderSection = {
  href: "/behavior-pattern" | "/recovery-memory" | "/send-flare" | "/checkpoint-reflection";
  id: "behavior-pattern" | "recovery-memory" | "send-flare" | "checkpoint-reflection";
  title: string;
  badge: string;
  summary: string;
  placeholders: string[];
};

export const behaviorPatternSection: PlaceholderSection = {
  id: "behavior-pattern",
  href: "/behavior-pattern",
  title: "Behavior Pattern",
  badge: "Setup",
  summary: "Define the pattern Flare will eventually help interrupt during the low-capacity moment.",
  placeholders: [
    "Primary pattern name and user language",
    "Trigger examples and early warning cues",
    "Single-pattern-first V0 setup flow",
  ],
};

export const recoveryMemorySection: PlaceholderSection = {
  id: "recovery-memory",
  href: "/recovery-memory",
  title: "Recovery Memory",
  badge: "Memory Bank",
  summary: "Hold the clear-minded reminders, costs, and first steps that should surface during a flare.",
  placeholders: [
    "Why I want to interrupt this pattern",
    "What continuing costs me",
    "What helps in the first two minutes",
  ],
};

export const sendFlareSection: PlaceholderSection = {
  id: "send-flare",
  href: "/send-flare",
  title: "Send Flare",
  badge: "Urgent Flow",
  summary: "Keep the central action immediate, calm, and obvious on a phone before real behavior is implemented.",
  placeholders: [
    "Primary urgent action button",
    "Minimal confirmation friction",
    "Immediate transition into recovery support",
  ],
};

export const checkpointReflectionSection: PlaceholderSection = {
  id: "checkpoint-reflection",
  href: "/checkpoint-reflection",
  title: "Checkpoint / Reflection",
  badge: "Aftercare",
  summary: "Reserve a short post-flare reflection step without making it mandatory for the first scaffold.",
  placeholders: [
    "Did this help?",
    "What action was taken?",
    "What should future me remember next time?",
  ],
};

export const placeholderSections: PlaceholderSection[] = [
  behaviorPatternSection,
  recoveryMemorySection,
  sendFlareSection,
  checkpointReflectionSection,
];
