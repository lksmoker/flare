import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  FlareEvent,
  formatFlareEventTimestamp,
} from "../state/FlareEventContext";
import { useRecoveryMemory } from "../state/RecoveryMemoryContext";

type RecoveryResponseProps = {
  flareEvent: FlareEvent | null;
  onOpenCheckpoint: () => void;
};

export function RecoveryResponse({
  flareEvent,
  onOpenCheckpoint,
}: RecoveryResponseProps) {
  const { recoveryMemory } = useRecoveryMemory();

  return (
    <View style={styles.container}>
      <View style={styles.eventCard}>
        <Text style={styles.eventLabel}>Current Flare Event</Text>
        <Text style={styles.eventTitle}>
          {flareEvent?.status === "reflected"
            ? "Reflection saved for this event"
            : "Recovery is open for this event"}
        </Text>
        <Text style={styles.eventCopy}>
          {flareEvent
            ? `Started ${formatFlareEventTimestamp(flareEvent.createdAt)} • status: ${flareEvent.status}`
            : "No in-memory event is active."}
        </Text>
        {flareEvent?.behaviorName ? (
          <Text style={styles.eventCopy}>
            Behavior Pattern: {flareEvent.behaviorName}
          </Text>
        ) : null}
      </View>
      <View style={styles.callout}>
        <Text style={styles.calloutLabel}>Recovery Memory</Text>
        <Text style={styles.calloutTitle}>
          {recoveryMemory?.supportivePhrase || "You already interrupted the spiral."}
        </Text>
        <Text style={styles.calloutCopy}>
          {recoveryMemory?.interruptionReasons ||
            "This V0 placeholder now surfaces saved Recovery Memory immediately after `Send Flare`, even before persistence exists."}
        </Text>
        {recoveryMemory?.groundedReminders ? (
          <View style={styles.memorySection}>
            <Text style={styles.memoryLabel}>Grounded reminder</Text>
            <Text style={styles.memoryCopy}>{recoveryMemory.groundedReminders}</Text>
          </View>
        ) : null}
        {recoveryMemory?.continuingCosts ? (
          <View style={styles.memorySection}>
            <Text style={styles.memoryLabel}>If I keep going</Text>
            <Text style={styles.memoryCopy}>{recoveryMemory.continuingCosts}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.actionCard}>
        <Text style={styles.actionTitle}>Try one next step</Text>
        <Text style={styles.actionCopy}>
          {recoveryMemory?.emergencyActions ||
            "Step away from the trigger for two minutes, drink water, and breathe before deciding what comes next."}
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
