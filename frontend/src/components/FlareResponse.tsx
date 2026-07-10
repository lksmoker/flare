import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import flareContent from "../content/flareContent.json";
import type { FlarePlanRun } from "../services/flareResponseApi";
import { FlareEvent, formatFlareEventTimestamp } from "../state/FlareEventContext";
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

export function FlareResponse({
  externalSupportState = null,
  flareEvent,
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
      {deliveryCardState ? (
        <View
          style={[
            styles.deliveryCard,
            deliveryCardState.tone === "success"
              ? styles.deliveryCardSuccess
              : deliveryCardState.tone === "warning"
                ? styles.deliveryCardWarning
                : styles.deliveryCardMuted,
          ]}
        >
          <Text style={styles.deliveryLabel}>
            {flareContent.components.flareResponse.externalSupport.label}
          </Text>
          <Text style={styles.deliveryTitle}>{deliveryCardState.title}</Text>
          <Text style={styles.deliveryCopy}>{deliveryCardState.copy}</Text>
        </View>
      ) : null}

      <View style={styles.callout}>
        <Text style={styles.calloutLabel}>
          {flareContent.components.flareResponse.anchorNoteLabel}
        </Text>
        <Text style={styles.calloutTitle}>
          {anchorNote?.supportivePhrase ||
            flareContent.components.flareResponse.defaultSupportivePhrase}
        </Text>
        <Text style={styles.calloutCopy}>
          {anchorNote?.interruptionReasons ||
            flareContent.components.flareResponse.defaultInterruptionReason}
        </Text>
        {anchorNote?.groundedReminders ? (
          <View style={styles.memorySection}>
            <Text style={styles.memoryLabel}>
              {flareContent.components.flareResponse.groundedReminderLabel}
            </Text>
            <Text style={styles.memoryCopy}>{anchorNote.groundedReminders}</Text>
          </View>
        ) : null}
        {anchorNote?.continuingCosts ? (
          <View style={styles.memorySection}>
            <Text style={styles.memoryLabel}>
              {flareContent.components.flareResponse.continuingCostsLabel}
            </Text>
            <Text style={styles.memoryCopy}>{anchorNote.continuingCosts}</Text>
          </View>
        ) : null}
        <Text style={styles.safetyCopy}>{flareContent.safety.urgentHelp}</Text>
        {flareEvent ? (
          <Text style={styles.contextCopy}>
            {`${flareContent.components.flareResponse.eventStartedPrefix} ${formatFlareEventTimestamp(flareEvent.createdAt)} | ${flareContent.components.flareResponse.eventStatusPrefix} ${flareEvent.status}`}
          </Text>
        ) : null}
        {flareEvent?.behaviorLabelSnapshot ? (
          <Text style={styles.contextCopy}>
            {flareContent.components.flareResponse.behaviorPatternPrefix} {flareEvent.behaviorLabelSnapshot}
          </Text>
        ) : null}
      </View>

      {run?.status === "offered" ? (
        <View style={styles.offerCard}>
          <Text style={styles.offerEyebrow}>Flare Plan</Text>
          <Text style={styles.offerTitle}>You sent a Flare.</Text>
          <Text style={styles.offerBody}>
            You interrupted the pattern and reached for support. That matters.
          </Text>
          <Text style={styles.offerBody}>Keep the momentum going with your Flare Plan.</Text>
          {mutationError ? <Text style={styles.errorCopy}>{mutationError}</Text> : null}
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
      ) : null}

      {run === null ? (
        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>
            {flareContent.components.flareResponse.nextStepTitle}
          </Text>
          <Text style={styles.actionCopy}>
            {anchorNote?.emergencyActions ||
              flareContent.components.flareResponse.defaultNextStep}
          </Text>
        </View>
      ) : null}

      {run?.status !== "offered" && run?.status !== "in_progress" ? (
        <Pressable
          accessibilityRole="button"
          onPress={onOpenCheckpoint}
          style={styles.sheetSecondaryButton}
        >
          <Text style={styles.sheetSecondaryButtonLabel}>
            {flareContent.components.flareResponse.checkpointButton}
          </Text>
        </Pressable>
      ) : null}

      {run?.status === "declined" ? (
        <View style={styles.statusNote}>
          <Text style={styles.statusNoteTitle}>Flare Plan skipped for now</Text>
          <Text style={styles.statusNoteCopy}>You can close this response and come back to your plan later.</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
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
  offerCard: {
    gap: 12,
    padding: 20,
    borderRadius: 24,
    backgroundColor: flareTheme.colors.primaryStrong,
  },
  offerEyebrow: {
    color: flareTheme.colors.primaryMutedStrong,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  offerTitle: {
    color: flareTheme.colors.onPrimary,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
  },
  offerBody: {
    color: flareTheme.colors.onPrimaryMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  callout: {
    gap: 8,
    padding: 18,
    borderRadius: 22,
    backgroundColor: flareTheme.colors.primaryStrong,
  },
  calloutLabel: {
    color: flareTheme.colors.primaryMutedStrong,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  calloutTitle: {
    color: flareTheme.colors.onPrimary,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "800",
  },
  calloutCopy: {
    color: flareTheme.colors.onPrimaryMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  memorySection: {
    gap: 4,
    paddingTop: 4,
  },
  memoryLabel: {
    color: flareTheme.colors.primaryMutedStrong,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  memoryCopy: {
    color: flareTheme.colors.onPrimaryMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  safetyCopy: {
    color: "#DCEBFF",
    fontSize: 13,
    lineHeight: 18,
  },
  contextCopy: {
    color: "#DCEBFF",
    fontSize: 13,
    lineHeight: 18,
  },
  actionCard: {
    gap: 6,
    padding: 16,
    borderRadius: 20,
    backgroundColor: flareTheme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: flareTheme.colors.border,
  },
  actionTitle: {
    color: flareTheme.colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
  actionCopy: {
    color: flareTheme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  deliveryCard: {
    gap: 6,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
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
  deliveryLabel: {
    color: flareTheme.colors.text,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
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
