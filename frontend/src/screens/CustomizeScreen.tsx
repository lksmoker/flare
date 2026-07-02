import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppShell } from "../components/AppShell";
import { AnchorNoteSetupModal } from "../components/AnchorNoteSetupModal";
import { AnchorNoteSummary } from "../components/AnchorNoteSummary";
import { AuthStatusCard } from "../components/AuthStatusCard";
import { BehaviorPatternSetupModal } from "../components/BehaviorPatternSetupModal";
import { BehaviorPatternSummary } from "../components/BehaviorPatternSummary";
import flareContent from "../content/flareContent.json";
import { useAnchorNote } from "../state/AnchorNoteContext";
import { useBehaviorPattern } from "../state/BehaviorPatternContext";

export function CustomizeScreen() {
  const [isBehaviorPatternVisible, setIsBehaviorPatternVisible] =
    useState(false);
  const [isAnchorNoteVisible, setIsAnchorNoteVisible] = useState(false);
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

        <View style={styles.comingSoonCard}>
          <Text style={styles.cardTitle}>
            {flareContent.components.telegramSupport.title}
          </Text>
          <Text style={styles.comingSoonBadge}>
            {flareContent.components.telegramSupport.badge}
          </Text>
          <Text style={styles.cardCopy}>
            {flareContent.components.telegramSupport.copy}
          </Text>
        </View>
      </View>

      <BehaviorPatternSetupModal
        onClose={() => setIsBehaviorPatternVisible(false)}
        visible={isBehaviorPatternVisible}
      />
      <AnchorNoteSetupModal
        onClose={() => setIsAnchorNoteVisible(false)}
        visible={isAnchorNoteVisible}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 12,
  },
  card: {
    gap: 8,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e7dcc7",
    backgroundColor: "#fffdf8",
  },
  cardHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  comingSoonCard: {
    gap: 8,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#d9cfbf",
    backgroundColor: "#f7efe3",
  },
  cardTitle: {
    flexShrink: 1,
    color: "#1f2937",
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "700",
  },
  cardCopy: {
    color: "#5d6b7b",
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
    backgroundColor: "#d7eadc",
    color: "#24553a",
  },
  pendingBadge: {
    backgroundColor: "#efe3d3",
    color: "#7a5430",
  },
  comingSoonBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#d6693d",
    paddingHorizontal: 10,
    paddingVertical: 4,
    color: "#fffaf3",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
