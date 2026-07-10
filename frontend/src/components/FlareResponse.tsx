import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import flareContent from "../content/flareContent.json";
import type { FlarePlanRun } from "../services/flareResponseApi";
import { FlareEvent } from "../state/FlareEventContext";
import { useAnchorNote } from "../state/AnchorNoteContext";
import { flareTheme } from "../theme/flareTheme";

type DeliveryState = {
  copy: string;
  title: string;
  tone: "muted" | "success" | "warning";
} | null;

type FlareResponseProps = {
  externalSupportState?: DeliveryState;
  flareEvent: FlareEvent | null;
  isMutationPending?: boolean;
  mutationError?: string | null;
  onBeginPlan?: (runId: string) => void;
  onDeclinePlan?: (runId: string) => void;
  onEndPlan?: (runId: string) => void;
  onOpenCheckpoint: () => void;
  onResolveActionDone?: (runId: string, actionId: string) => void;
  onResolveActionSkipped?: (runId: string, actionId: string) => void;
  run: FlarePlanRun | null;
};

function ActionButton({
  label,
  muted = false,
  onPress,
  disabled = false,
}: {
  label: string;
  muted?: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.primaryButton, muted ? styles.primaryButtonMuted : null, disabled ? styles.buttonDisabled : null]}
    >
      <Text style={[styles.primaryButtonLabel, muted ? styles.primaryButtonMutedLabel : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

function trimCopy(value: string | null | undefined) {
  return value?.trim() ?? "";
}

export function FlareResponse({
  externalSupportState = null,
  flareEvent: _flareEvent,
  isMutationPending = false,
  mutationError = null,
  onBeginPlan,
  onDeclinePlan,
  onEndPlan,
  onOpenCheckpoint,
  onResolveActionDone,
  onResolveActionSkipped,
  run,
}: FlareResponseProps) {
  const { anchorNote } = useAnchorNote();
  const [isEndConfirmVisible, setIsEndConfirmVisible] = useState(false);
  const currentAction = run?.current_action ?? null;
  const isTerminalRun =
    run?.status === "declined" ||
    run?.status === "completed" ||
    run?.status === "ended_early";
  const deliveryCardState = !isTerminalRun ? externalSupportState : null;

  const summaryCopy = useMemo(() => {
    if (!run) {
      return null;
    }
    return `${run.progress.done_count} done, ${run.progress.skipped_count} skipped${
      run.status === "ended_early" ? `, ${run.progress.not_reached_count} not reached` : ""
    }`;
  }, [run]);
  const interruptionReasons = trimCopy(anchorNote?.interruptionReasons);
  const continuingCosts = trimCopy(anchorNote?.continuingCosts);
  const emergencyActions = trimCopy(anchorNote?.emergencyActions);
  const reminderSections = [
    interruptionReasons ? { label: "Why", value: interruptionReasons } : null,
    continuingCosts ? { label: "If I continue...", value: continuingCosts } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;
  const hasReminderSections = reminderSections.length > 0;
  const recoveryActionCopy =
    emergencyActions || flareContent.components.flareResponse.defaultNextStep;

  if (run?.status === "in_progress" && currentAction) {
    return (
      <View style={styles.focusedContainer}>
        <View style={styles.focusedHeader}>
          <Text style={styles.focusedLabel}>Flare Plan</Text>
          <Text style={styles.focusedStep}>
            Step {run.progress.current_position} of {run.progress.total_count}
          </Text>
        </View>
        <View style={styles.focusedBody}>
          <Text style={styles.focusedTitle}>{currentAction.title}</Text>
          {currentAction.description ? (
            <Text style={styles.focusedDescription}>{currentAction.description}</Text>
          ) : null}
        </View>
        {mutationError ? <Text style={styles.errorCopy}>{mutationError}</Text> : null}
        {isEndConfirmVisible ? (
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>End your Flare Plan?</Text>
            <Text style={styles.confirmCopy}>
              Your completed and skipped steps will be saved. The remaining steps will be marked not reached.
            </Text>
            <ActionButton
              disabled={isMutationPending}
              label="End plan"
              onPress={() => {
                if (run && onEndPlan) {
                  onEndPlan(run.id);
                }
              }}
            />
            <ActionButton
              disabled={isMutationPending}
              label="Keep going"
              muted
              onPress={() => setIsEndConfirmVisible(false)}
            />
          </View>
        ) : (
          <View style={styles.focusedActions}>
            <ActionButton
              disabled={isMutationPending}
              label="Done"
              onPress={() => {
                if (run && onResolveActionDone) {
                  onResolveActionDone(run.id, currentAction.id);
                }
              }}
            />
            <ActionButton
              disabled={isMutationPending}
              label="Skip this step"
              muted
              onPress={() => {
                if (run && onResolveActionSkipped) {
                  onResolveActionSkipped(run.id, currentAction.id);
                }
              }}
            />
            <Pressable
              accessibilityRole="button"
              disabled={isMutationPending}
              onPress={() => setIsEndConfirmVisible(true)}
              style={styles.linkButton}
            >
              <Text style={styles.linkButtonLabel}>End plan</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {run?.status === "offered" || run === null ? (
        <View style={styles.recoveryCard}>
          {deliveryCardState ? (
            <View
              style={[
                styles.deliveryCard,
                styles.deliveryCardWithinRecovery,
                deliveryCardState.tone === "success"
                  ? styles.deliveryCardSuccess
                  : deliveryCardState.tone === "warning"
                    ? styles.deliveryCardWarning
                    : styles.deliveryCardMuted,
              ]}
            >
              <Text style={styles.deliveryTitle}>{deliveryCardState.title}</Text>
              <Text style={styles.deliveryCopy}>{deliveryCardState.copy}</Text>
            </View>
          ) : null}
          <View style={styles.recoveryReminder}>
            <Text style={styles.calloutTitle}>
              {flareContent.components.flareResponse.rememberTitle}
            </Text>
            {hasReminderSections ? (
              reminderSections.map((section) => (
                <View key={section.label} style={styles.memorySection}>
                  <Text style={styles.memoryLabel}>{section.label}</Text>
                  <Text style={styles.memoryCopy}>{section.value}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.calloutCopy}>
                {flareContent.components.flareResponse.defaultWhy}
              </Text>
            )}
          </View>
          {mutationError ? <Text style={styles.errorCopy}>{mutationError}</Text> : null}
          {run?.status === "offered" ? (
            <View style={styles.recoveryActions}>
              <ActionButton
                disabled={isMutationPending}
                label="Begin Flare Plan"
                onPress={() => {
                  if (run && onBeginPlan) {
                    onBeginPlan(run.id);
                  }
                }}
              />
              <ActionButton
                disabled={isMutationPending}
                label="Skip for now"
                muted
                onPress={() => {
                  if (run && onDeclinePlan) {
                    onDeclinePlan(run.id);
                  }
                }}
              />
            </View>
          ) : (
            <View style={styles.recoveryActionSection}>
              <Text style={styles.recoveryActionTitle}>
                {flareContent.components.flareResponse.nextStepTitle}
              </Text>
              <Text style={styles.recoveryActionCopy}>{recoveryActionCopy}</Text>
            </View>
          )}
        </View>
      ) : null}

      {run?.status !== "offered" && run?.status !== "in_progress" ? (
        <View style={styles.reflectionSection}>
          <Pressable
            accessibilityRole="button"
            onPress={onOpenCheckpoint}
            style={styles.sheetSecondaryButton}
          >
            <Text style={styles.sheetSecondaryButtonLabel}>
              {flareContent.components.flareResponse.checkpointButton}
            </Text>
          </Pressable>

          {run?.status === "declined" ? (
            <View style={styles.statusNote}>
              <Text style={styles.statusNoteTitle}>Flare Plan skipped for now</Text>
              <Text style={styles.statusNoteCopy}>
                Move to a short checkpoint when you are ready.
              </Text>
            </View>
          ) : null}

          {run?.status === "completed" ? (
            <View style={styles.statusNote}>
              <Text style={styles.statusNoteTitle}>Flare Plan complete</Text>
              <Text style={styles.statusNoteCopy}>Your steps are saved. {summaryCopy}</Text>
            </View>
          ) : null}

          {run?.status === "ended_early" ? (
            <View style={styles.statusNote}>
              <Text style={styles.statusNoteTitle}>Flare Plan ended</Text>
              <Text style={styles.statusNoteCopy}>Your progress was saved. {summaryCopy}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },
  focusedContainer: {
    minHeight: 420,
    justifyContent: "space-between",
    gap: 24,
    paddingVertical: 12,
  },
  focusedHeader: {
    gap: 8,
  },
  focusedLabel: {
    color: flareTheme.colors.primaryBright,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  focusedStep: {
    color: flareTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  focusedBody: {
    gap: 14,
    paddingVertical: 12,
  },
  focusedTitle: {
    color: flareTheme.colors.textStrong,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
  },
  focusedDescription: {
    color: flareTheme.colors.textMuted,
    fontSize: 18,
    lineHeight: 28,
  },
  focusedActions: {
    gap: 12,
  },
  confirmCard: {
    gap: 12,
    padding: 18,
    borderRadius: 22,
    backgroundColor: flareTheme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: flareTheme.colors.border,
  },
  confirmTitle: {
    color: flareTheme.colors.textStrong,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
  },
  confirmCopy: {
    color: flareTheme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  recoveryCard: {
    gap: 20,
    padding: 24,
    borderRadius: 24,
    backgroundColor: flareTheme.colors.primaryStrong,
    minHeight: 420,
    justifyContent: "space-between",
  },
  recoveryActions: {
    gap: 12,
    paddingTop: 8,
  },
  recoveryActionSection: {
    gap: 6,
    paddingTop: 8,
  },
  recoveryReminder: {
    gap: 12,
  },
  calloutTitle: {
    color: flareTheme.colors.onPrimary,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
  },
  calloutCopy: {
    color: flareTheme.colors.onPrimaryMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  memorySection: {
    gap: 6,
  },
  memoryLabel: {
    color: flareTheme.colors.primaryMutedStrong,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  memoryCopy: {
    color: flareTheme.colors.onPrimaryMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  recoveryActionTitle: {
    color: flareTheme.colors.onPrimary,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
  },
  recoveryActionCopy: {
    color: flareTheme.colors.onPrimaryMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  deliveryCard: {
    gap: 6,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  deliveryCardWithinRecovery: {
    marginBottom: 4,
  },
  deliveryCardMuted: {
    borderColor: flareTheme.colors.border,
    backgroundColor: flareTheme.colors.surfaceSoft,
  },
  deliveryCardSuccess: {
    borderColor: flareTheme.colors.successText,
    backgroundColor: flareTheme.colors.successBg,
  },
  deliveryCardWarning: {
    borderColor: "#C38B34",
    backgroundColor: "#FFF2DD",
  },
  deliveryTitle: {
    color: flareTheme.colors.textStrong,
    fontSize: 17,
    fontWeight: "700",
  },
  deliveryCopy: {
    color: flareTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  reflectionSection: {
    gap: 10,
  },
  statusNote: {
    gap: 4,
    paddingHorizontal: 2,
  },
  statusNoteTitle: {
    color: flareTheme.colors.textStrong,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  statusNoteCopy: {
    color: flareTheme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: flareTheme.colors.surface,
    paddingHorizontal: 18,
  },
  primaryButtonLabel: {
    color: flareTheme.colors.primaryStrong,
    fontSize: 15,
    fontWeight: "800",
  },
  primaryButtonMuted: {
    backgroundColor: flareTheme.colors.primaryMuted,
  },
  primaryButtonMutedLabel: {
    color: flareTheme.colors.primaryStrong,
  },
  sheetSecondaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: flareTheme.colors.primaryMuted,
    paddingHorizontal: 18,
  },
  sheetSecondaryButtonLabel: {
    color: flareTheme.colors.primaryStrong,
    fontSize: 15,
    fontWeight: "700",
  },
  linkButton: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  linkButtonLabel: {
    color: flareTheme.colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  errorCopy: {
    color: "#A33F28",
    fontSize: 14,
    lineHeight: 20,
  },
});
