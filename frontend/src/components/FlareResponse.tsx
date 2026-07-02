import { Pressable, StyleSheet, Text, View } from "react-native";

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
        <Text style={styles.eventLabel}>Current Flare Event</Text>
        <Text style={styles.eventTitle}>
          {flareEvent?.status === "reflected"
            ? "Reflection saved for this event"
            : "Your self-support screen is open"}
        </Text>
        <Text style={styles.eventCopy}>
          {flareEvent
            ? `Started ${formatFlareEventTimestamp(flareEvent.createdAt)} | status: ${flareEvent.status}`
            : "No in-memory event is active."}
        </Text>
        {flareEvent?.behaviorLabelSnapshot ? (
          <Text style={styles.eventCopy}>
            Behavior Pattern: {flareEvent.behaviorLabelSnapshot}
          </Text>
        ) : null}
      </View>
      <View style={styles.callout}>
        <Text style={styles.calloutLabel}>Anchor Note</Text>
        <Text style={styles.calloutTitle}>
          {anchorNote?.supportivePhrase || "You already paused the pattern."}
        </Text>
        <Text style={styles.calloutCopy}>
          {anchorNote?.interruptionReasons ||
            "Flare shows your saved Anchor Note right after Send Flare so your own words are close at hand."}
        </Text>
        {anchorNote?.groundedReminders ? (
          <View style={styles.memorySection}>
            <Text style={styles.memoryLabel}>Grounded reminder</Text>
            <Text style={styles.memoryCopy}>{anchorNote.groundedReminders}</Text>
          </View>
        ) : null}
        {anchorNote?.continuingCosts ? (
          <View style={styles.memorySection}>
            <Text style={styles.memoryLabel}>If I keep going</Text>
            <Text style={styles.memoryCopy}>{anchorNote.continuingCosts}</Text>
          </View>
        ) : null}
        <Text style={styles.safetyCopy}>
          Flare is a self-support tool. If you may hurt yourself or someone
          else, or you need immediate help, contact local emergency services or
          a crisis hotline now.
        </Text>
      </View>
      <View style={styles.actionCard}>
        <Text style={styles.actionTitle}>Try one next step</Text>
        <Text style={styles.actionCopy}>
          {anchorNote?.emergencyActions ||
            "Step away from the trigger for two minutes, drink water, and give yourself a short pause before choosing what comes next."}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onOpenCheckpoint}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonLabel}>Checkpoint / Reflection</Text>
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
