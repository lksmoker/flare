import { StyleSheet, Text, View } from "react-native";

import { AppShell } from "../components/AppShell";

const historyItems = [
  {
    title: "Flare Event",
    detail: "Today, 8:10 PM",
    note: "Placeholder: recovery step started immediately.",
  },
  {
    title: "Checkpoint / Reflection",
    detail: "Yesterday, 6:42 PM",
    note: "Placeholder: urge reduced after a short walk.",
  },
  {
    title: "Flare Event",
    detail: "Yesterday, 1:08 PM",
    note: "Placeholder: quick review only, no analytics yet.",
  },
];

export function HistoryScreen() {
  return (
    <AppShell
      currentPath="/history"
      screenLabel="Past moments"
      subtitle="A simple placeholder list for recent Flare Events and Checkpoints / Reflections."
      title="History stays chronological and light"
    >
      <View style={styles.list}>
        {historyItems.map((item) => (
          <View key={`${item.title}-${item.detail}`} style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDetail}>{item.detail}</Text>
            <Text style={styles.cardNote}>{item.note}</Text>
          </View>
        ))}
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  card: {
    gap: 6,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e7dcc7",
    backgroundColor: "#fffdf8",
  },
  cardTitle: {
    color: "#1f2937",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
  },
  cardDetail: {
    color: "#8a5a2b",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  cardNote: {
    color: "#5d6b7b",
    fontSize: 14,
    lineHeight: 20,
  },
});
