import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppShell } from "../components/AppShell";
import { CheckpointReflectionModal } from "../components/CheckpointReflectionModal";
import { FlareResponse } from "../components/FlareResponse";
import { PlaceholderModal } from "../components/PlaceholderModal";
import { SendFlareButton } from "../components/SendFlareButton";
import flareContent from "../content/flareContent.json";
import {
  beginFlarePlanRun,
  completeFlarePlanAction,
  createFlareResponse,
  declineFlarePlanRun,
  type FlareSupportDelivery,
  endFlarePlanRunEarly,
  type FlareResponseState,
  getFlareResponse,
  skipFlarePlanAction,
} from "../services/flareResponseApi";
import { createIdempotencyKey } from "../services/idempotency";
import {
  sendSupportChannelFlare,
  type SupportChannelFlareDeliveryResult,
} from "../services/supportChannelApi";
import { useFlareAuth } from "../state/FlareAuthContext";
import { useAnchorNote } from "../state/AnchorNoteContext";
import { useBehaviorPattern } from "../state/BehaviorPatternContext";
import { useFlareEvents } from "../state/FlareEventContext";
import { useFlarePlan } from "../state/FlarePlanContext";
import { useSupportChannelStatus } from "../state/useSupportChannelStatus";
import { flareTheme } from "../theme/flareTheme";

type ExternalSupportState =
  | {
      copy: string;
      title: string;
      tone: "muted" | "success" | "warning";
    }
  | null;

function mapExternalSupportState(
  result: SupportChannelFlareDeliveryResult,
): ExternalSupportState {
  const externalContent = flareContent.components.flareResponse.externalSupport;

  if (result.status === "sent") {
    return {
      copy: externalContent.sentCopy,
      title: externalContent.sentTitle,
      tone: "success",
    };
  }

  if (result.error_code === "support_channel_not_configured") {
    return {
      copy: externalContent.notConfiguredCopy,
      title: externalContent.notConfiguredTitle,
      tone: "muted",
    };
  }

  if (result.error_code === "support_channel_disabled") {
    return {
      copy: externalContent.disabledCopy,
      title: externalContent.disabledTitle,
      tone: "muted",
    };
  }

  if (result.status === "blocked") {
    return {
      copy: result.error_message_safe ?? externalContent.blockedCopy,
      title: externalContent.blockedTitle,
      tone: "muted",
    };
  }

  return {
    copy: result.error_message_safe ?? externalContent.failedCopy,
    title: externalContent.failedTitle,
    tone: "warning",
  };
}

function mapPersistedSupportDelivery(
  delivery: FlareSupportDelivery | null,
): ExternalSupportState {
  if (!delivery) {
    return null;
  }

  return mapExternalSupportState({
    attempted_at: delivery.attempted_at ?? "",
    delivered_at: delivery.delivered_at,
    destination_display_name: delivery.destination_display_name,
    error_code: delivery.error_code,
    error_message_safe: delivery.error_message_safe,
    message_preview: "",
    provider: "groupme",
    send_kind: "real",
    status: delivery.status,
  });
}

export function FlareScreen() {
  const [isFlareResponseVisible, setIsFlareResponseVisible] = useState(false);
  const [isCheckpointVisible, setIsCheckpointVisible] = useState(false);
  const [isReadinessExpanded, setIsReadinessExpanded] = useState(false);
  const [externalSupportState, setExternalSupportState] =
    useState<ExternalSupportState>(null);
  const [responseState, setResponseState] = useState<FlareResponseState | null>(null);
  const [responseError, setResponseError] = useState<string | null>(null);
  const [isRunMutationPending, setIsRunMutationPending] = useState(false);
  const { behaviorPattern, behaviorPatternRecord, isConfigured } = useBehaviorPattern();
  const { activeEvent, createFlareEvent, currentEvent, upsertPersistedFlareEvent } = useFlareEvents();
  const { anchorNote, anchorNoteRecord, isConfigured: isAnchorNoteConfigured } = useAnchorNote();
  const { authState, authStatus } = useFlareAuth();
  const { isInitialLoading: isPlanLoading, isPlanConfigured, plan } = useFlarePlan();
  const {
    isSupportChannelConfigured,
    isSupportChannelLoading,
    supportChannel,
  } = useSupportChannelStatus();

  const isPersistenceConfigured =
    authStatus === "ready" && authState.kind === "authenticated";

  const persistenceStatus =
    authStatus === "loading"
      ? flareContent.common.states.loading.checkingSession
      : authState.kind === "authenticated"
        ? `${flareContent.screens.flare.readiness.connectedPrefix} ${authState.userEmail ?? authState.userId}`
        : authState.kind === "client-unavailable"
          ? flareContent.screens.flare.readiness.localOnlyUntilConfigLoaded
          : flareContent.screens.flare.readiness.localOnlyUntilSignIn;

  const readinessItems = [
    {
      configured: isPersistenceConfigured,
      label: flareContent.screens.flare.readiness.setupPersistence,
      status: persistenceStatus,
    },
    {
      configured: isConfigured,
      label: flareContent.screens.flare.readiness.behaviorPattern,
      status: isConfigured
        ? `${flareContent.screens.flare.readiness.configuredPrefix} ${behaviorPattern?.behaviorName}`
        : flareContent.screens.flare.readiness.readyToDefine,
    },
    {
      configured: isPlanConfigured,
      label: flareContent.screens.flare.readiness.flarePlan,
      status: isPlanLoading
        ? flareContent.components.flarePlan.loading.checking
        : isPlanConfigured
          ? `${flareContent.screens.flare.readiness.configuredPrefix} ${plan?.active_action_count ?? 0} of ${plan?.maximum_active_actions ?? 10} actions`
          : flareContent.components.flarePlan.notConfigured,
    },
    {
      configured: isAnchorNoteConfigured,
      label: flareContent.screens.flare.readiness.anchorNote,
      status: isAnchorNoteConfigured
        ? `${flareContent.screens.flare.readiness.configuredPrefix} ${anchorNote?.supportivePhrase}`
        : flareContent.screens.flare.readiness.readyToDefine,
    },
    {
      configured: isSupportChannelConfigured,
      label: flareContent.screens.flare.readiness.supportChannel,
      status: isSupportChannelLoading
        ? flareContent.common.states.loading.checkingConnection
        : isSupportChannelConfigured
          ? `${flareContent.screens.flare.readiness.configuredPrefix} ${supportChannel?.destination_display_name ?? flareContent.components.supportChannel.cardTitle}`
          : flareContent.screens.flare.readiness.readyToDefine,
    },
  ];
  const configuredCount = readinessItems.filter((item) => item.configured).length;
  const readinessSummary = `${configuredCount} out of ${readinessItems.length} configured`;

  const openCheckpoint = () => {
    setIsFlareResponseVisible(false);
    setIsCheckpointVisible(true);
  };
  const eventForResponse = responseState?.flareEvent ?? activeEvent ?? currentEvent;
  const deliveryStateForResponse =
    externalSupportState ?? mapPersistedSupportDelivery(responseState?.supportDelivery ?? null);

  useEffect(() => {
    if (authState.kind !== "authenticated" || !currentEvent) {
      return;
    }

    let isActive = true;
    void getFlareResponse(currentEvent.id)
      .then((state) => {
        if (!isActive) {
          return;
        }
        setResponseState(state);
        if (state.run?.status === "in_progress") {
          setIsFlareResponseVisible(true);
        }
      })
      .catch(() => {
        if (isActive) {
          setResponseState(null);
        }
      });

    return () => {
      isActive = false;
    };
  }, [authState.kind, currentEvent]);

  async function runMutation(
    callback: () => Promise<FlareResponseState["run"]>,
  ) {
    setIsRunMutationPending(true);
    setResponseError(null);
    try {
      const run = await callback();
      setResponseState((current) => (current ? { ...current, run } : current));
    } catch (error) {
      setResponseError(
        error instanceof Error ? error.message : "Flare Plan could not be updated right now.",
      );
    } finally {
      setIsRunMutationPending(false);
    }
  }

  return (
    <AppShell
      currentPath="/"
      screenLabel={flareContent.screens.flare.screenLabel}
      subtitle={flareContent.screens.flare.subtitle}
      title={flareContent.screens.flare.title}
    >
      <SendFlareButton
        onPress={async () => {
          setResponseError(null);
          setResponseState(null);
          let flareEventId: string | null = null;

          if (authState.kind === "authenticated") {
            try {
              const created = await createFlareResponse({
                anchorNoteId: anchorNoteRecord?.id ?? null,
                anchorNoteVersion: anchorNoteRecord?.version ?? null,
                behaviorDescriptionSnapshot: behaviorPattern?.shortDescription ?? null,
                behaviorLabelSnapshot: behaviorPattern?.behaviorName ?? "Behavior pattern not configured",
                behaviorPatternId: behaviorPatternRecord?.id ?? null,
                responseMode: anchorNote ? "configured" : "fallback-generic",
                supportActionShown: anchorNote?.emergencyActions ?? null,
                idempotencyKey: createIdempotencyKey(),
              });
              flareEventId = created.flareEvent.id;
              upsertPersistedFlareEvent({
                createdAt: created.flareEvent.createdAt,
                flareEvent: created.flareEvent,
                id: created.flareEvent.id,
                updatedAt: created.flareEvent.updatedAt,
                userId: created.flareEvent.userId ?? authState.userId,
              });
              setResponseState({
                flareEvent: created.flareEvent,
                run: created.run,
                supportDelivery: null,
              });
            } catch (error) {
              setResponseError(error instanceof Error ? error.message : "Flare could not be created right now.");
              return;
            }
            const externalContent =
              flareContent.components.flareResponse.externalSupport;
            setExternalSupportState({
              copy: externalContent.sendingCopy,
              title: externalContent.sendingTitle,
              tone: "muted",
            });
            void sendSupportChannelFlare({
              flareEventId,
            })
              .then((result) => {
                setExternalSupportState(mapExternalSupportState(result));
              })
              .catch(() => {
                setExternalSupportState({
                  copy: externalContent.failedCopy,
                  title: externalContent.failedTitle,
                  tone: "warning",
                });
              });
          } else {
            const localFallbackEvent = createFlareEvent({
              behaviorDescriptionSnapshot: behaviorPattern?.shortDescription,
              behaviorLabelSnapshot: behaviorPattern?.behaviorName,
              supportActionShown: anchorNote?.emergencyActions,
            });
            setExternalSupportState(null);
            setResponseState({
              flareEvent: localFallbackEvent,
              run: null,
              supportDelivery: null,
            });
          }
          setIsCheckpointVisible(false);
          setIsFlareResponseVisible(true);
        }}
      />

      {!(isFlareResponseVisible && responseState?.run?.status === "in_progress") ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setIsCheckpointVisible(true)}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonLabel}>
            {flareContent.screens.flare.secondaryAction.label}
          </Text>
          <Text style={styles.secondaryButtonCopy}>
            {flareContent.screens.flare.secondaryAction.copy}
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.readinessCard}>
        <Pressable
          accessibilityLabel={
            isReadinessExpanded
              ? flareContent.screens.flare.readiness.collapseAccessibilityLabel
              : flareContent.screens.flare.readiness.expandAccessibilityLabel
          }
          accessibilityRole="button"
          accessibilityState={{ expanded: isReadinessExpanded }}
          onPress={() => setIsReadinessExpanded((currentValue) => !currentValue)}
          style={styles.readinessHeader}
        >
          <View style={styles.readinessHeadingBlock}>
            <Text style={styles.sectionTitle}>
              {flareContent.screens.flare.readiness.title}
            </Text>
            {!isReadinessExpanded ? (
              <Text style={styles.readinessSummary}>{readinessSummary}</Text>
            ) : null}
          </View>
          <Text style={styles.readinessToggle}>
            {isReadinessExpanded ? "Hide" : "Show"}
          </Text>
        </Pressable>
        {isReadinessExpanded ? (
          <View style={styles.readinessList}>
            {readinessItems.map((item) => (
              <View key={item.label} style={styles.readinessPill}>
                <Text style={styles.readinessLabel}>{item.label}</Text>
                <Text style={styles.readinessStatus}>{item.status}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <PlaceholderModal
        onClose={() => setIsFlareResponseVisible(false)}
        showCloseButton={responseState?.run?.status !== "in_progress"}
        subtitle={flareContent.components.flareResponse.modalSubtitle}
        title={flareContent.components.flareResponse.modalTitle}
        visible={isFlareResponseVisible}
      >
        <FlareResponse
          externalSupportState={deliveryStateForResponse}
          flareEvent={eventForResponse}
          isMutationPending={isRunMutationPending}
          mutationError={responseError}
          onBeginPlan={(runId) =>
            void runMutation(() => beginFlarePlanRun(runId, createIdempotencyKey()))
          }
          onDeclinePlan={(runId) =>
            void runMutation(() => declineFlarePlanRun(runId, createIdempotencyKey()))
          }
          onEndPlan={(runId) =>
            void runMutation(() => endFlarePlanRunEarly(runId, createIdempotencyKey()))
          }
          onOpenCheckpoint={openCheckpoint}
          onResolveActionDone={(runId, actionId) =>
            void runMutation(() =>
              completeFlarePlanAction(runId, actionId, createIdempotencyKey()),
            )
          }
          onResolveActionSkipped={(runId, actionId) =>
            void runMutation(() =>
              skipFlarePlanAction(runId, actionId, createIdempotencyKey()),
            )
          }
          run={responseState?.run ?? null}
        />
      </PlaceholderModal>

      <CheckpointReflectionModal
        flareEvent={activeEvent}
        onClose={() => setIsCheckpointVisible(false)}
        onSave={() => {
          setIsCheckpointVisible(false);
          setIsFlareResponseVisible(true);
        }}
        visible={isCheckpointVisible}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  readinessCard: {
    ...flareTheme.shadows.card,
    gap: 14,
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: flareTheme.colors.border,
    backgroundColor: flareTheme.colors.surface,
  },
  sectionTitle: {
    color: flareTheme.colors.textStrong,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "700",
  },
  readinessHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  readinessHeadingBlock: {
    flex: 1,
    gap: 4,
  },
  readinessSummary: {
    color: flareTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  readinessToggle: {
    color: flareTheme.colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  readinessList: {
    gap: 10,
  },
  readinessPill: {
    gap: 4,
    padding: 14,
    borderRadius: 18,
    backgroundColor: flareTheme.colors.surfaceSoft,
  },
  readinessLabel: {
    color: flareTheme.colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  readinessStatus: {
    color: flareTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  secondaryButton: {
    ...flareTheme.shadows.card,
    gap: 4,
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: flareTheme.colors.border,
    backgroundColor: flareTheme.colors.surfaceStrong,
  },
  secondaryButtonLabel: {
    color: flareTheme.colors.textStrong,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
  },
  secondaryButtonCopy: {
    color: flareTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
