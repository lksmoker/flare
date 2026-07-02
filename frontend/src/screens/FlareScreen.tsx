import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppShell } from "../components/AppShell";
import { CheckpointReflectionModal } from "../components/CheckpointReflectionModal";
import { FlareResponse } from "../components/FlareResponse";
import { PlaceholderModal } from "../components/PlaceholderModal";
import { SendFlareButton } from "../components/SendFlareButton";
import flareContent from "../content/flareContent.json";
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
      ? flareContent.states.loading.checkingSession
      : authState.kind === "authenticated"
        ? `${flareContent.flare.readiness.connectedPrefix} ${authState.userEmail ?? authState.userId}`
        : authState.kind === "client-unavailable"
          ? flareContent.flare.readiness.localOnlyUntilConfigLoaded
          : flareContent.flare.readiness.localOnlyUntilSignIn;

  const readinessItems = [
    {
      label: flareContent.flare.readiness.setupPersistence,
      status: persistenceStatus,
    },
    {
      label: flareContent.flare.readiness.behaviorPattern,
      status: isConfigured
        ? `${flareContent.flare.readiness.configuredPrefix} ${behaviorPattern?.behaviorName}`
        : flareContent.flare.readiness.readyToDefine,
    },
    {
      label: flareContent.flare.readiness.anchorNote,
      status: isAnchorNoteConfigured
        ? `${flareContent.flare.readiness.configuredPrefix} ${anchorNote?.supportivePhrase}`
        : flareContent.flare.readiness.readyToDefine,
    },
    {
      label: flareContent.flare.readiness.telegram,
      status: flareContent.flare.readiness.comingSoon,
    },
  ];

  const openCheckpoint = () => {
    setIsFlareResponseVisible(false);
    setIsCheckpointVisible(true);
  };
  const eventForResponse = activeEvent ?? currentEvent;

  return (
    <AppShell
      currentPath="/"
      screenLabel={flareContent.flare.screenLabel}
      subtitle={flareContent.flare.subtitle}
      title={flareContent.flare.title}
    >
      <SendFlareButton
        onPress={() => {
          createFlareEvent({
            behaviorDescriptionSnapshot: behaviorPattern?.shortDescription,
            behaviorLabelSnapshot: behaviorPattern?.behaviorName,
            supportActionShown: anchorNote?.emergencyActions,
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
        <Text style={styles.secondaryButtonLabel}>
          {flareContent.flare.secondaryAction.label}
        </Text>
        <Text style={styles.secondaryButtonCopy}>
          {flareContent.flare.secondaryAction.copy}
        </Text>
      </Pressable>

      <View style={styles.readinessCard}>
        <Text style={styles.sectionTitle}>{flareContent.flare.readiness.title}</Text>
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
        subtitle={flareContent.flare.responseModal.subtitle}
        title={flareContent.flare.responseModal.title}
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
