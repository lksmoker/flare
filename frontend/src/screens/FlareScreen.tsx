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
import { flareTheme } from "../theme/flareTheme";

export function FlareScreen() {
  const [isFlareResponseVisible, setIsFlareResponseVisible] = useState(false);
  const [isCheckpointVisible, setIsCheckpointVisible] = useState(false);
  const { behaviorPattern, isConfigured } = useBehaviorPattern();
  const { activeEvent, createFlareEvent, currentEvent } = useFlareEvents();
  const { anchorNote, isConfigured: isAnchorNoteConfigured } = useAnchorNote();
  const { authState, authStatus } = useFlareAuth();

  const persistenceStatus =
    authStatus === "loading"
      ? flareContent.common.states.loading.checkingSession
      : authState.kind === "authenticated"
        ? `${flareContent.screens.flare.readiness.connectedPrefix} ${authState.userEmail ?? authState.userId}`
        : authState.kind === "client-unavailable"
          ? flareContent.screens.flare.readiness.localOnlyUntilConfigLoaded
          : flareContent.screens.flare.readiness.localOnlyUntilSignIn;

  const readinessItems = [
    {
      label: flareContent.screens.flare.readiness.setupPersistence,
      status: persistenceStatus,
    },
    {
      label: flareContent.screens.flare.readiness.behaviorPattern,
      status: isConfigured
        ? `${flareContent.screens.flare.readiness.configuredPrefix} ${behaviorPattern?.behaviorName}`
        : flareContent.screens.flare.readiness.readyToDefine,
    },
    {
      label: flareContent.screens.flare.readiness.anchorNote,
      status: isAnchorNoteConfigured
        ? `${flareContent.screens.flare.readiness.configuredPrefix} ${anchorNote?.supportivePhrase}`
        : flareContent.screens.flare.readiness.readyToDefine,
    },
    {
      label: flareContent.screens.flare.readiness.telegram,
      status: flareContent.common.status.comingSoon,
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
      screenLabel={flareContent.screens.flare.screenLabel}
      subtitle={flareContent.screens.flare.subtitle}
      title={flareContent.screens.flare.title}
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
          {flareContent.screens.flare.secondaryAction.label}
        </Text>
        <Text style={styles.secondaryButtonCopy}>
          {flareContent.screens.flare.secondaryAction.copy}
        </Text>
      </Pressable>

      <View style={styles.readinessCard}>
        <Text style={styles.sectionTitle}>
          {flareContent.screens.flare.readiness.title}
        </Text>
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
        subtitle={flareContent.components.flareResponse.modalSubtitle}
        title={flareContent.components.flareResponse.modalTitle}
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
        onSave={() => {
          setIsCheckpointVisible(false);
          setIsFlareResponseVisible(true);
        }}
        visible={isCheckpointVisible}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  readinessCard: {
    ...flareTheme.shadows.card,
    gap: 14,
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: flareTheme.colors.border,
    backgroundColor: flareTheme.colors.surface,
  },
  sectionTitle: {
    color: flareTheme.colors.textStrong,
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
    backgroundColor: flareTheme.colors.surfaceSoft,
  },
  readinessLabel: {
    color: flareTheme.colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  readinessStatus: {
    color: flareTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  secondaryButton: {
    ...flareTheme.shadows.card,
    gap: 4,
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: flareTheme.colors.border,
    backgroundColor: flareTheme.colors.surfaceStrong,
  },
  secondaryButtonLabel: {
    color: flareTheme.colors.textStrong,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
  },
  secondaryButtonCopy: {
    color: flareTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
