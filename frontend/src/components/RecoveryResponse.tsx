import { Pressable, StyleSheet, Text, View } from "react-native";

type RecoveryResponseProps = {
  onOpenCheckpoint: () => void;
};

export function RecoveryResponse({
  onOpenCheckpoint,
}: RecoveryResponseProps) {
  return (
    <View style={styles.container}>
      <View style={styles.callout}>
        <Text style={styles.calloutLabel}>Recovery Memory placeholder</Text>
        <Text style={styles.calloutTitle}>You already interrupted the spiral.</Text>
        <Text style={styles.calloutCopy}>
          This V0 placeholder would surface grounding reminders, one recovery
          action, and the next safe step immediately after `Send Flare`.
        </Text>
      </View>
      <View style={styles.actionCard}>
        <Text style={styles.actionTitle}>Try one next step</Text>
        <Text style={styles.actionCopy}>
          Step away from the trigger for two minutes, drink water, and breathe
          before deciding what comes next.
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
