import { StyleSheet, Text, View } from "react-native";

import { AnchorNote } from "../state/AnchorNoteContext";

type AnchorNoteSummaryProps = {
  anchorNote: AnchorNote | null;
};

const fieldLabels: Array<{
  key: keyof AnchorNote;
  label: string;
}> = [
  { key: "interruptionReasons", label: "Why interrupt" },
  { key: "continuingCosts", label: "Costs of continuing" },
  { key: "groundedReminders", label: "Grounded reminder" },
  { key: "emergencyActions", label: "Emergency action" },
  { key: "supportivePhrase", label: "Supportive phrase" },
];

export function AnchorNoteSummary({ anchorNote }: AnchorNoteSummaryProps) {
  if (!anchorNote) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>Not configured yet</Text>
        <Text style={styles.emptyCopy}>
          Save a few grounded reminders so Flare Response can show them
          immediately during a flare.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.summaryCard}>
      {fieldLabels.map((field) => {
        const value = anchorNote[field.key];

        if (!value) {
          return null;
        }

        return (
          <View key={field.key} style={styles.summarySection}>
            <Text style={styles.sectionLabel}>{field.label}</Text>
            <Text style={styles.sectionValue}>{value}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    gap: 6,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#f7efe3",
  },
  emptyTitle: {
    color: "#5b4635",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyCopy: {
    color: "#6a7685",
    fontSize: 14,
    lineHeight: 20,
  },
  summaryCard: {
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#f7efe3",
  },
  summarySection: {
    gap: 4,
  },
  sectionLabel: {
    color: "#8a5a2b",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  sectionValue: {
    color: "#374151",
    fontSize: 14,
    lineHeight: 20,
  },
});
