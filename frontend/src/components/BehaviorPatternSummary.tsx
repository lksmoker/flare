import { StyleSheet, Text, View } from "react-native";

import flareContent from "../content/flareContent.json";
import { BehaviorPattern } from "../state/BehaviorPatternContext";
import { flareTheme } from "../theme/flareTheme";

type BehaviorPatternSummaryProps = {
  behaviorPattern: BehaviorPattern | null;
};

const fieldLabels: Array<{
  key: keyof BehaviorPattern;
  label: string;
}> = [
  {
    key: "shortDescription",
    label: flareContent.components.behaviorPattern.summaryLabels.shortDescription,
  },
  {
    key: "commonTriggers",
    label: flareContent.components.behaviorPattern.summaryLabels.commonTriggers,
  },
  {
    key: "riskTimesOrSituations",
    label:
      flareContent.components.behaviorPattern.summaryLabels
        .riskTimesOrSituations,
  },
];

export function BehaviorPatternSummary({
  behaviorPattern,
}: BehaviorPatternSummaryProps) {
  if (!behaviorPattern) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>
          {flareContent.common.states.empty.notConfiguredTitle}
        </Text>
        <Text style={styles.emptyCopy}>
          {flareContent.components.behaviorPattern.summaryEmptyCopy}
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
    backgroundColor: flareTheme.colors.surfaceSoft,
  },
  emptyTitle: {
    color: flareTheme.colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  emptyCopy: {
    color: flareTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  summaryCard: {
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: flareTheme.colors.surfaceSoft,
  },
  summarySection: {
    gap: 4,
  },
  behaviorName: {
    color: flareTheme.colors.textStrong,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
  },
  description: {
    color: flareTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionLabel: {
    color: flareTheme.colors.primaryBright,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  sectionValue: {
    color: flareTheme.colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
});
