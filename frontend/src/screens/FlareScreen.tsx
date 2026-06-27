import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppShell } from "../components/AppShell";
import { CheckpointReflectionModal } from "../components/CheckpointReflectionModal";
import { PlaceholderModal } from "../components/PlaceholderModal";
import { RecoveryResponse } from "../components/RecoveryResponse";
import { SendFlareButton } from "../components/SendFlareButton";

const readinessItems = [
  { label: "Behavior Pattern", status: "Ready to define" },
  { label: "Recovery Memory", status: "Ready to define" },
  { label: "Telegram Support", status: "Coming in V1" },
];

export function FlareScreen() {
  const [isRecoveryResponseVisible, setIsRecoveryResponseVisible] =
    useState(false);
  const [isCheckpointVisible, setIsCheckpointVisible] = useState(false);

  const openCheckpoint = () => {
    setIsRecoveryResponseVisible(false);
    setIsCheckpointVisible(true);
  };

  return (
    <AppShell
      currentPath="/"
      screenLabel="Urgent action"
      subtitle="Keep the recovery path simple: one dominant action, one secondary reflection entry, and lightweight readiness cues."
      title="Immediate support for the hard moment"
    >
      <View style={styles.readinessCard}>
        <Text style={styles.sectionTitle}>Readiness</Text>
        <View style={styles.readinessList}>
          {readinessItems.map((item) => (
            <View key={item.label} style={styles.readinessPill}>
              <Text style={styles.readinessLabel}>{item.label}</Text>
              <Text style={styles.readinessStatus}>{item.status}</Text>
            </View>
          ))}
        </View>
      </View>

      <SendFlareButton onPress={() => setIsRecoveryResponseVisible(true)} />

      <Pressable
        accessibilityRole="button"
        onPress={() => setIsCheckpointVisible(true)}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonLabel}>Checkpoint / Reflection</Text>
        <Text style={styles.secondaryButtonCopy}>
          Open a lightweight placeholder sheet without leaving the Flare screen.
        </Text>
      </Pressable>

      <PlaceholderModal
        onClose={() => setIsRecoveryResponseVisible(false)}
        subtitle="This placeholder proves the no-confirmation urgent flow."
        title="Recovery Response"
        visible={isRecoveryResponseVisible}
      >
        <RecoveryResponse onOpenCheckpoint={openCheckpoint} />
      </PlaceholderModal>

      <CheckpointReflectionModal
        onClose={() => setIsCheckpointVisible(false)}
        visible={isCheckpointVisible}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  readinessCard: {
    gap: 14,
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e7dcc7",
    backgroundColor: "#fffdf8",
  },
  sectionTitle: {
    color: "#1f2937",
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "700",
  },
  readinessList: {
    gap: 10,
  },
  readinessPill: {
    gap: 4,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#f7efe3",
  },
  readinessLabel: {
    color: "#5b4635",
    fontSize: 14,
    fontWeight: "700",
  },
  readinessStatus: {
    color: "#6a7685",
    fontSize: 14,
    lineHeight: 20,
  },
  secondaryButton: {
    gap: 4,
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#dccfb8",
    backgroundColor: "#fff9f1",
  },
  secondaryButtonLabel: {
    color: "#1f2937",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
  },
  secondaryButtonCopy: {
    color: "#5d6b7b",
    fontSize: 14,
    lineHeight: 20,
  },
});
