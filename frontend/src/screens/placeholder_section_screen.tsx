import { StyleSheet, Text, View } from "react-native";

import { ScreenShell } from "../components/screen_shell";
import { PlaceholderSection } from "../content/placeholder_sections";

type PlaceholderSectionScreenProps = {
  section: PlaceholderSection;
};

export function PlaceholderSectionScreen({
  section,
}: PlaceholderSectionScreenProps) {
  return (
    <ScreenShell
      eyebrow={section.badge}
      title={section.title}
      subtitle={section.summary}
    >
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Planned V0 contents</Text>
        {section.placeholders.map((item) => (
          <View key={item} style={styles.listRow}>
            <View style={styles.dot} />
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: 14,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#dccfb8",
    backgroundColor: "#fff9f1",
  },
  panelTitle: {
    color: "#1f2937",
    fontSize: 18,
    fontWeight: "700",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  dot: {
    width: 8,
    height: 8,
    marginTop: 7,
    borderRadius: 999,
    backgroundColor: "#d6693d",
  },
  listText: {
    flex: 1,
    color: "#475569",
    fontSize: 15,
    lineHeight: 22,
  },
});
