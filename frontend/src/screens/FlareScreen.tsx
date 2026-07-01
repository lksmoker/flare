import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppShell } from "../components/AppShell";
import { CheckpointReflectionModal } from "../components/CheckpointReflectionModal";
import { FlareResponse } from "../components/FlareResponse";
import { PlaceholderModal } from "../components/PlaceholderModal";
import { SendFlareButton } from "../components/SendFlareButton";
import { useFlareAuth } from "../state/FlareAuthContext";
import { useAnchorNote } from "../state/AnchorNoteContext";
import { useBehaviorPattern } from "../state/BehaviorPatternContext";
import { useFlareEvents } from "../state/FlareEventContext";

export function FlareScreen() {
  const [isFlareResponseVisible, setIsFlareResponseVisible] = useState(false);
  const [isCheckpointVisible, setIsCheckpointVisible] = useState(false);
  const { behaviorPattern, isConfigured } = useBehaviorPattern();
  const { activeEvent, createFlareEvent, currentEvent } = useFlareEvents();
  const { anchorNote, isConfigured: isAnchorNoteConfigured } = useAnchorNote();
  const { authState, authStatus } = useFlareAuth();

  const persistenceStatus =
    authStatus === "loading"
      ? "Checking for a real session"
      : authState.kind === "authenticated"
        ? `Connected: ${authState.userEmail ?? authState.userId}`
        : authState.kind === "client-unavailable"
          ? "Local-only until public Supabase config is loaded"
          : "Local-only until sign in";

  const readinessItems = [
    {
      label: "Setup persistence",
      status: persistenceStatus,
    },
    {
      label: "Behavior Pattern",
      status: isConfigured
        ? `Configured: ${behaviorPattern?.behaviorName}`
        : "Ready to define",
    },
    {
      label: "Anchor Note",
      status: isAnchorNoteConfigured
        ? `Configured: ${anchorNote?.supportivePhrase}`
        : "Ready to define",
    },
    { label: "Telegram Support", status: "Coming in V1" },
  ];

  const openCheckpoint = () => {
    setIsFlareResponseVisible(false);
    setIsCheckpointVisible(true);
  };
  const eventForResponse = activeEvent ?? currentEvent;

  return (
    <AppShell
      currentPath="/"
      screenLabel="Urgent action"
      subtitle="Keep the recovery path simple: one dominant action, one secondary reflection entry, and lightweight readiness cues."
      title="Immediate support for the hard moment"
    >
      <SendFlareButton
        onPress={() => {
          createFlareEvent({
            behaviorName: behaviorPattern?.behaviorName,
            behaviorSummary: behaviorPattern?.shortDescription,
          });
          setIsCheckpointVisible(false);
          setIsFlareResponseVisible(true);
        }}
      />

      <Pressable
        accessibilityRole="button"
        onPress={() => setIsCheckpointVisible(true)}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonLabel}>Checkpoint / Reflection</Text>
        <Text style={styles.secondaryButtonCopy}>
          Open a lightweight reflection sheet without leaving the Flare screen.
        </Text>
      </Pressable>

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

      <PlaceholderModal
        onClose={() => setIsFlareResponseVisible(false)}
        subtitle="This V0 sheet opens immediately and stays attached to the current in-memory Flare Event."
        title="Flare Response"
        visible={isFlareResponseVisible}
      >
        <FlareResponse
          flareEvent={eventForResponse}
          onOpenCheckpoint={openCheckpoint}
        />
      </PlaceholderModal>

      <CheckpointReflectionModal
        flareEvent={activeEvent}
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
