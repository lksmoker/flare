import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenShell } from "../components/screen_shell";
import { placeholderSections } from "../content/placeholder_sections";

export function HomeScreen() {
  return (
    <ScreenShell
      eyebrow="Phase 1 scaffold"
      title="Flare"
      subtitle="A mobile-first recovery-support app scaffold for the solo interruption loop."
    >
      <View style={styles.callout}>
        <Text style={styles.calloutLabel}>V0 smoke screen</Text>
        <Text style={styles.calloutCopy}>
          This starter shell proves the Expo routing structure and the core product areas before auth, data, or messaging exist.
        </Text>
      </View>

      <View style={styles.sectionList}>
        {placeholderSections.map((section) => (
          <View key={section.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.badge}>{section.badge}</Text>
              <Text style={styles.cardTitle}>{section.title}</Text>
            </View>
            <Text style={styles.cardSummary}>{section.summary}</Text>
            <Link href={section.href} asChild>
              <Pressable accessibilityRole="button" style={styles.button}>
                <Text style={styles.buttonText}>Open {section.title}</Text>
              </Pressable>
            </Link>
          </View>
        ))}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  callout: {
    gap: 8,
    padding: 18,
    borderRadius: 22,
    backgroundColor: "#1f2937",
  },
  calloutLabel: {
    color: "#f5d6a0",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  calloutCopy: {
    color: "#e2e8f0",
    fontSize: 15,
    lineHeight: 22,
  },
  sectionList: {
    gap: 14,
  },
  card: {
    gap: 14,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e7dcc7",
    backgroundColor: "#fffdf8",
  },
  cardHeader: {
    gap: 6,
  },
  badge: {
    color: "#8a5a2b",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  cardTitle: {
    color: "#1f2937",
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "700",
  },
  cardSummary: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: "#d6693d",
    paddingHorizontal: 18,
  },
  buttonText: {
    color: "#fffaf3",
    fontSize: 15,
    fontWeight: "700",
  },
});
