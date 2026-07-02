import { StyleSheet, Text, View } from "react-native";

import { BehaviorPattern } from "../state/BehaviorPatternContext";

type BehaviorPatternSummaryProps = {
  behaviorPattern: BehaviorPattern | null;
};

const fieldLabels: Array<{
  key: keyof BehaviorPattern;
  label: string;
}> = [
  { key: "shortDescription", label: "Description" },
  { key: "commonTriggers", label: "Triggers" },
  { key: "riskTimesOrSituations", label: "Risk moments" },
  { key: "preferredRecoveryActions", label: "Next steps" },
];

export function BehaviorPatternSummary({
  behaviorPattern,
}: BehaviorPatternSummaryProps) {
  if (!behaviorPattern) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>Not configured yet</Text>
        <Text style={styles.emptyCopy}>
          Add one lightweight pattern so Flare can show that your setup is
          ready.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summarySection}>
        <Text style={styles.behaviorName}>{behaviorPattern.behaviorName}</Text>
        {behaviorPattern.shortDescription ? (
          <Text style={styles.description}>
            {behaviorPattern.shortDescription}
          </Text>
        ) : null}
      </View>

      {fieldLabels.map((field) => {
        const value = behaviorPattern[field.key];

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
  behaviorName: {
    color: "#1f2937",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
  },
  description: {
    color: "#5d6b7b",
    fontSize: 14,
    lineHeight: 20,
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
