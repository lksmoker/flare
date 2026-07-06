import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppShell } from "../components/AppShell";
import { AnchorNoteSetupModal } from "../components/AnchorNoteSetupModal";
import { AnchorNoteSummary } from "../components/AnchorNoteSummary";
import { AuthStatusCard } from "../components/AuthStatusCard";
import { BehaviorPatternSetupModal } from "../components/BehaviorPatternSetupModal";
import { BehaviorPatternSummary } from "../components/BehaviorPatternSummary";
import { SupportChannelSetupModal } from "../components/SupportChannelSetupModal";
import flareContent from "../content/flareContent.json";
import { useAnchorNote } from "../state/AnchorNoteContext";
import { useBehaviorPattern } from "../state/BehaviorPatternContext";
import { flareTheme } from "../theme/flareTheme";
import { readAccessTokenFromCurrentUrl } from "../services/supportChannelApi";

export function CustomizeScreen() {
  const [isBehaviorPatternVisible, setIsBehaviorPatternVisible] =
    useState(false);
  const [isAnchorNoteVisible, setIsAnchorNoteVisible] = useState(false);
  const [isSupportChannelVisible, setIsSupportChannelVisible] = useState(
    () => Boolean(readAccessTokenFromCurrentUrl()),
  );
  const { behaviorPattern, isConfigured } = useBehaviorPattern();
  const { anchorNote, isConfigured: isAnchorNoteConfigured } = useAnchorNote();

  return (
    <AppShell
      currentPath="/customize"
      screenLabel={flareContent.screens.customize.screenLabel}
      subtitle={flareContent.screens.customize.subtitle}
      title={flareContent.screens.customize.title}
    >
      <View style={styles.stack}>
        <AuthStatusCard />

        <Pressable
          accessibilityRole="button"
          onPress={() => setIsBehaviorPatternVisible(true)}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {flareContent.components.behaviorPattern.cardTitle}
            </Text>
            <Text
              style={[
                styles.statusBadge,
                isConfigured ? styles.readyBadge : styles.pendingBadge,
              ]}
            >
              {isConfigured
                ? flareContent.common.status.configured
                : flareContent.common.status.needsSetup}
            </Text>
          </View>
          <Text style={styles.cardCopy}>
            {flareContent.components.behaviorPattern.cardCopy}
          </Text>
          <BehaviorPatternSummary behaviorPattern={behaviorPattern} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => setIsAnchorNoteVisible(true)}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {flareContent.components.anchorNote.cardTitle}
            </Text>
            <Text
              style={[
                styles.statusBadge,
                isAnchorNoteConfigured ? styles.readyBadge : styles.pendingBadge,
              ]}
            >
              {isAnchorNoteConfigured
                ? flareContent.common.status.configured
                : flareContent.common.status.needsSetup}
            </Text>
          </View>
          <Text style={styles.cardCopy}>
            {flareContent.components.anchorNote.cardCopy}
          </Text>
          <AnchorNoteSummary anchorNote={anchorNote} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => setIsSupportChannelVisible(true)}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {flareContent.components.supportChannel.cardTitle}
            </Text>
            <Text style={[styles.statusBadge, styles.pendingBadge]}>
              {flareContent.components.supportChannel.status.notConfigured}
            </Text>
          </View>
          <Text style={styles.cardCopy}>
            {flareContent.components.supportChannel.cardCopy}
          </Text>
        </Pressable>
      </View>

      <BehaviorPatternSetupModal
        onClose={() => setIsBehaviorPatternVisible(false)}
        visible={isBehaviorPatternVisible}
      />
      <AnchorNoteSetupModal
        onClose={() => setIsAnchorNoteVisible(false)}
        visible={isAnchorNoteVisible}
      />
      <SupportChannelSetupModal
        onClose={() => setIsSupportChannelVisible(false)}
        visible={isSupportChannelVisible}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 12,
  },
  card: {
    ...flareTheme.shadows.card,
    gap: 8,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: flareTheme.colors.border,
    backgroundColor: flareTheme.colors.surface,
  },
  cardHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitle: {
    flexShrink: 1,
    color: flareTheme.colors.textStrong,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "700",
  },
  cardCopy: {
    color: flareTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  readyBadge: {
    backgroundColor: flareTheme.colors.successBg,
    color: flareTheme.colors.successText,
  },
  pendingBadge: {
    backgroundColor: flareTheme.colors.neutralBg,
    color: flareTheme.colors.neutralText,
  },
});
