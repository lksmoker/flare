import { Pressable, StyleSheet, Text, View } from "react-native";

import flareContent from "../content/flareContent.json";
import {
  FlareEvent,
  formatFlareEventTimestamp,
} from "../state/FlareEventContext";
import { useAnchorNote } from "../state/AnchorNoteContext";
import { flareTheme } from "../theme/flareTheme";

type FlareResponseProps = {
  externalSupportState?: {
    copy: string;
    title: string;
    tone: "muted" | "success" | "warning";
  } | null;
  flareEvent: FlareEvent | null;
  onOpenCheckpoint: () => void;
};

export function FlareResponse({
  externalSupportState = null,
  flareEvent,
  onOpenCheckpoint,
}: FlareResponseProps) {
  const { anchorNote } = useAnchorNote();

  return (
    <View style={styles.container}>
      <View style={styles.eventCard}>
        <Text style={styles.eventLabel}>
          {flareContent.components.flareResponse.eventLabel}
        </Text>
        <Text style={styles.eventTitle}>
          {flareEvent?.status === "reflected"
            ? flareContent.components.flareResponse.eventTitleReflected
            : flareContent.components.flareResponse.eventTitleActive}
        </Text>
        <Text style={styles.eventCopy}>
          {flareEvent
            ? `${flareContent.components.flareResponse.eventStartedPrefix} ${formatFlareEventTimestamp(flareEvent.createdAt)} | ${flareContent.components.flareResponse.eventStatusPrefix} ${flareEvent.status}`
            : flareContent.components.flareResponse.noActiveEvent}
        </Text>
        {flareEvent?.behaviorLabelSnapshot ? (
          <Text style={styles.eventCopy}>
            {flareContent.components.flareResponse.behaviorPatternPrefix}{" "}
            {flareEvent.behaviorLabelSnapshot}
          </Text>
        ) : null}
      </View>
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
      </View>
      <View style={styles.actionCard}>
        <Text style={styles.actionTitle}>
          {flareContent.components.flareResponse.nextStepTitle}
        </Text>
        <Text style={styles.actionCopy}>
          {anchorNote?.emergencyActions ||
            flareContent.components.flareResponse.defaultNextStep}
        </Text>
      </View>
      {externalSupportState ? (
        <View
          style={[
            styles.deliveryCard,
            externalSupportState.tone === "success"
              ? styles.deliveryCardSuccess
              : externalSupportState.tone === "warning"
                ? styles.deliveryCardWarning
                : styles.deliveryCardMuted,
          ]}
        >
          <Text style={styles.deliveryLabel}>
            {flareContent.components.flareResponse.externalSupport.label}
          </Text>
          <Text style={styles.deliveryTitle}>{externalSupportState.title}</Text>
          <Text style={styles.deliveryCopy}>{externalSupportState.copy}</Text>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={onOpenCheckpoint}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonLabel}>
          {flareContent.components.flareResponse.checkpointButton}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  eventCard: {
    gap: 6,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: flareTheme.colors.border,
    backgroundColor: flareTheme.colors.surfaceSoft,
  },
  eventLabel: {
    color: flareTheme.colors.primaryBright,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  eventTitle: {
    color: flareTheme.colors.text,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
  },
  eventCopy: {
    color: flareTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
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
  secondaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: flareTheme.colors.primaryMuted,
    paddingHorizontal: 18,
  },
  secondaryButtonLabel: {
    color: flareTheme.colors.primaryStrong,
    fontSize: 15,
    fontWeight: "700",
  },
});
