import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppShell } from "../components/AppShell";
import { BehaviorPatternSetupModal } from "../components/BehaviorPatternSetupModal";
import { RecoveryMemorySetupModal } from "../components/RecoveryMemorySetupModal";

export function CustomizeScreen() {
  const [isBehaviorPatternVisible, setIsBehaviorPatternVisible] =
    useState(false);
  const [isRecoveryMemoryVisible, setIsRecoveryMemoryVisible] = useState(false);

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
          <Text style={styles.cardTitle}>Behavior Pattern Setup</Text>
          <Text style={styles.cardCopy}>
            Define the pattern, likely triggers, and the replacement action you
            want available during a flare.
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => setIsRecoveryMemoryVisible(true)}
          style={styles.card}
        >
          <Text style={styles.cardTitle}>Recovery Memory Setup</Text>
          <Text style={styles.cardCopy}>
            Capture grounded reminders, costs, and phrases that belong in the
            future Recovery Response.
          </Text>
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
  comingSoonCard: {
    gap: 8,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#d9cfbf",
    backgroundColor: "#f7efe3",
  },
  cardTitle: {
    color: "#1f2937",
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
  },
  cardCopy: {
    color: "#5d6b7b",
    fontSize: 14,
    lineHeight: 20,
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
