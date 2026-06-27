import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppShell } from "../components/AppShell";
import { BehaviorPatternSetupModal } from "../components/BehaviorPatternSetupModal";
import { BehaviorPatternSummary } from "../components/BehaviorPatternSummary";
import { RecoveryMemorySummary } from "../components/RecoveryMemorySummary";
import { RecoveryMemorySetupModal } from "../components/RecoveryMemorySetupModal";
import { useBehaviorPattern } from "../state/BehaviorPatternContext";
import { useRecoveryMemory } from "../state/RecoveryMemoryContext";

export function CustomizeScreen() {
  const [isBehaviorPatternVisible, setIsBehaviorPatternVisible] =
    useState(false);
  const [isRecoveryMemoryVisible, setIsRecoveryMemoryVisible] = useState(false);
  const { behaviorPattern, isConfigured } = useBehaviorPattern();
  const {
    isConfigured: isRecoveryMemoryConfigured,
    recoveryMemory,
  } = useRecoveryMemory();

  return (
    <AppShell
      currentPath="/customize"
      screenLabel="Setup"
      subtitle="Keep configuration distinct from the urgent recovery path."
      title="Customize what supports you in the moment"
    >
      <View style={styles.stack}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setIsBehaviorPatternVisible(true)}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Behavior Pattern Setup</Text>
            <Text
              style={[
                styles.statusBadge,
                isConfigured ? styles.readyBadge : styles.pendingBadge,
              ]}
            >
              {isConfigured ? "Configured" : "Needs setup"}
            </Text>
          </View>
          <Text style={styles.cardCopy}>
            Define the pattern, likely triggers, and the replacement action you
            want available during a flare.
          </Text>
          <BehaviorPatternSummary behaviorPattern={behaviorPattern} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => setIsRecoveryMemoryVisible(true)}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recovery Memory Setup</Text>
            <Text
              style={[
                styles.statusBadge,
                isRecoveryMemoryConfigured
                  ? styles.readyBadge
                  : styles.pendingBadge,
              ]}
            >
              {isRecoveryMemoryConfigured ? "Configured" : "Needs setup"}
            </Text>
          </View>
          <Text style={styles.cardCopy}>
            Capture grounded reminders, costs, and phrases that belong in the
            future Recovery Response.
          </Text>
          <RecoveryMemorySummary recoveryMemory={recoveryMemory} />
        </Pressable>

        <View style={styles.comingSoonCard}>
          <Text style={styles.cardTitle}>Telegram Support</Text>
          <Text style={styles.comingSoonBadge}>Coming in V1</Text>
          <Text style={styles.cardCopy}>
            Visible here as future-scoped support direction only. No real setup
            or integration behavior exists in V0.
          </Text>
        </View>
      </View>

      <BehaviorPatternSetupModal
        onClose={() => setIsBehaviorPatternVisible(false)}
        visible={isBehaviorPatternVisible}
      />
      <RecoveryMemorySetupModal
        onClose={() => setIsRecoveryMemoryVisible(false)}
        visible={isRecoveryMemoryVisible}
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
