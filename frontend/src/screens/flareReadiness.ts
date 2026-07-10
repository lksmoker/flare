import flareContent from "../content/flareContent.json";
import type { FlareSupabaseAuthState } from "../services/flareSupabaseAuth";

// Required setup should advance in one stable order so the setup CTA is deterministic.
export const FLARE_REQUIRED_SETUP_PRIORITY = [
  "behavior-pattern",
  "flare-plan",
  "anchor-note",
] as const;

export type FlareReadinessFocus =
  | "auth"
  | "behavior-pattern"
  | "flare-plan"
  | "anchor-note"
  | "support-channel";

export type FlareReadinessItem = {
  configured: boolean;
  countsTowardConfigured: boolean;
  focus: FlareReadinessFocus;
  label: string;
  requiredForSetup: boolean;
  status: string;
};

type BuildFlareReadinessModelInput = {
  anchorNotePhrase?: string | null;
  authState: FlareSupabaseAuthState;
  authStatus: "loading" | "ready";
  behaviorPatternName?: string | null;
  isAnchorNoteConfigured: boolean;
  isBehaviorPatternConfigured: boolean;
  isPlanConfigured: boolean;
  isPlanLoading: boolean;
  isSupportChannelConfigured: boolean;
  isSupportChannelLoading: boolean;
  planActiveActionCount?: number | null;
  planMaximumActiveActions?: number | null;
  supportChannelName?: string | null;
};

type FlareReadinessModel = {
  configuredCount: number;
  isSetupComplete: boolean;
  items: FlareReadinessItem[];
  nextRequiredFocus: FlareReadinessFocus | null;
  readinessSummary: string;
};

export function buildFlareReadinessModel(
  input: BuildFlareReadinessModelInput,
): FlareReadinessModel {
  const persistenceStatus =
    input.authStatus === "loading"
      ? flareContent.common.states.loading.checkingSession
      : input.authState.kind === "authenticated"
        ? `${flareContent.screens.flare.readiness.connectedPrefix} ${input.authState.userEmail ?? input.authState.userId}`
        : input.authState.kind === "client-unavailable"
          ? flareContent.screens.flare.readiness.localOnlyUntilConfigLoaded
          : flareContent.screens.flare.readiness.localOnlyUntilSignIn;

  const items: FlareReadinessItem[] = [
    {
      configured:
        input.authStatus === "ready" && input.authState.kind === "authenticated",
      countsTowardConfigured: false,
      focus: "auth",
      label: flareContent.screens.flare.readiness.setupPersistence,
      requiredForSetup: false,
      status: persistenceStatus,
    },
    {
      configured: input.isBehaviorPatternConfigured,
      countsTowardConfigured: true,
      focus: "behavior-pattern",
      label: flareContent.screens.flare.readiness.behaviorPattern,
      requiredForSetup: true,
      status: input.isBehaviorPatternConfigured
        ? `${flareContent.screens.flare.readiness.configuredPrefix} ${input.behaviorPatternName}`
        : flareContent.screens.flare.readiness.readyToDefine,
    },
    {
      configured: input.isPlanConfigured,
      countsTowardConfigured: true,
      focus: "flare-plan",
      label: flareContent.screens.flare.readiness.flarePlan,
      requiredForSetup: true,
      status: input.isPlanLoading
        ? flareContent.components.flarePlan.loading.checking
        : input.isPlanConfigured
          ? `${flareContent.screens.flare.readiness.configuredPrefix} ${input.planActiveActionCount ?? 0} of ${input.planMaximumActiveActions ?? 10} actions`
          : flareContent.components.flarePlan.notConfigured,
    },
    {
      configured: input.isAnchorNoteConfigured,
      countsTowardConfigured: true,
      focus: "anchor-note",
      label: flareContent.screens.flare.readiness.anchorNote,
      requiredForSetup: true,
      status: input.isAnchorNoteConfigured
        ? `${flareContent.screens.flare.readiness.configuredPrefix} ${input.anchorNotePhrase}`
        : flareContent.screens.flare.readiness.readyToDefine,
    },
    {
      configured: input.isSupportChannelConfigured,
      countsTowardConfigured: true,
      focus: "support-channel",
      label: flareContent.screens.flare.readiness.supportChannel,
      requiredForSetup: false,
      status: input.isSupportChannelLoading
        ? flareContent.common.states.loading.checkingConnection
        : input.isSupportChannelConfigured
          ? `${flareContent.screens.flare.readiness.configuredPrefix} ${input.supportChannelName ?? flareContent.components.supportChannel.cardTitle}`
          : flareContent.screens.flare.readiness.readyToDefine,
    },
  ];

  const progressItems = items.filter((item) => item.countsTowardConfigured);
  const configuredCount = progressItems.filter((item) => item.configured).length;
  const readinessSummary = `${configuredCount} of ${progressItems.length} configured`;
  const nextRequiredFocus =
    FLARE_REQUIRED_SETUP_PRIORITY.find((focus) =>
      items.some(
        (item) => item.focus === focus && item.requiredForSetup && !item.configured,
      ),
    ) ?? null;
  const isSetupComplete = items
    .filter((item) => item.requiredForSetup)
    .every((item) => item.configured);

  return {
    configuredCount,
    isSetupComplete,
    items,
    nextRequiredFocus,
    readinessSummary,
  };
}
