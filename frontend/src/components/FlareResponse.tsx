import { Pressable, StyleSheet, Text, View } from "react-native";

import flareContent from "../content/flareContent.json";
import {
  FlareEvent,
  formatFlareEventTimestamp,
} from "../state/FlareEventContext";
import { useAnchorNote } from "../state/AnchorNoteContext";

type FlareResponseProps = {
  flareEvent: FlareEvent | null;
  onOpenCheckpoint: () => void;
};

export function FlareResponse({
  flareEvent,
  onOpenCheckpoint,
}: FlareResponseProps) {
  const { anchorNote } = useAnchorNote();

  return (
    <View style={styles.container}>
      <View style={styles.eventCard}>
        <Text style={styles.eventLabel}>{flareContent.flare.response.eventLabel}</Text>
        <Text style={styles.eventTitle}>
          {flareEvent?.status === "reflected"
            ? flareContent.flare.response.eventTitleReflected
            : flareContent.flare.response.eventTitleActive}
        </Text>
        <Text style={styles.eventCopy}>
          {flareEvent
            ? `${flareContent.flare.response.eventStartedPrefix} ${formatFlareEventTimestamp(flareEvent.createdAt)} | ${flareContent.flare.response.eventStatusPrefix} ${flareEvent.status}`
            : flareContent.flare.response.noActiveEvent}
        </Text>
        {flareEvent?.behaviorLabelSnapshot ? (
          <Text style={styles.eventCopy}>
            {flareContent.flare.response.behaviorPatternPrefix}{" "}
            {flareEvent.behaviorLabelSnapshot}
          </Text>
        ) : null}
      </View>
      <View style={styles.callout}>
        <Text style={styles.calloutLabel}>
          {flareContent.flare.response.anchorNoteLabel}
        </Text>
        <Text style={styles.calloutTitle}>
          {anchorNote?.supportivePhrase ||
            flareContent.flare.response.defaultSupportivePhrase}
        </Text>
        <Text style={styles.calloutCopy}>
          {anchorNote?.interruptionReasons ||
            flareContent.flare.response.defaultInterruptionReason}
        </Text>
        {anchorNote?.groundedReminders ? (
          <View style={styles.memorySection}>
            <Text style={styles.memoryLabel}>
              {flareContent.flare.response.groundedReminderLabel}
            </Text>
            <Text style={styles.memoryCopy}>{anchorNote.groundedReminders}</Text>
          </View>
        ) : null}
        {anchorNote?.continuingCosts ? (
          <View style={styles.memorySection}>
            <Text style={styles.memoryLabel}>
              {flareContent.flare.response.continuingCostsLabel}
            </Text>
            <Text style={styles.memoryCopy}>{anchorNote.continuingCosts}</Text>
          </View>
        ) : null}
        <Text style={styles.safetyCopy}>{flareContent.flare.response.safety}</Text>
      </View>
      <View style={styles.actionCard}>
        <Text style={styles.actionTitle}>
          {flareContent.flare.response.nextStepTitle}
        </Text>
        <Text style={styles.actionCopy}>
          {anchorNote?.emergencyActions ||
            flareContent.flare.response.defaultNextStep}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onOpenCheckpoint}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonLabel}>
          {flareContent.flare.response.checkpointButton}
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
    borderColor: "#edd2b5",
    backgroundColor: "#fff1df",
  },
  eventLabel: {
    color: "#8a5a2b",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  eventTitle: {
    color: "#5b4635",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
  },
  eventCopy: {
    color: "#526071",
    fontSize: 14,
    lineHeight: 20,
  },
  callout: {
    gap: 8,
    padding: 18,
    borderRadius: 22,
    backgroundColor: "#1f2937",
  },
  calloutLabel: {
    color: "#f5d6a0",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  calloutTitle: {
    color: "#fffaf3",
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "800",
  },
  calloutCopy: {
    color: "#e5edf5",
    fontSize: 15,
    lineHeight: 22,
  },
  memorySection: {
    gap: 4,
    paddingTop: 4,
  },
  memoryLabel: {
    color: "#f5d6a0",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  memoryCopy: {
    color: "#e5edf5",
    fontSize: 14,
    lineHeight: 20,
  },
  safetyCopy: {
    color: "#f9e8c8",
    fontSize: 13,
    lineHeight: 18,
  },
  actionCard: {
    gap: 6,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#fff1df",
    borderWidth: 1,
    borderColor: "#edd2b5",
  },
  actionTitle: {
    color: "#5b4635",
    fontSize: 17,
    fontWeight: "700",
  },
  actionCopy: {
    color: "#5d6b7b",
    fontSize: 15,
    lineHeight: 22,
  },
  secondaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#efe3d3",
    paddingHorizontal: 18,
  },
  secondaryButtonLabel: {
    color: "#5b4635",
    fontSize: 15,
    fontWeight: "700",
  },
});
