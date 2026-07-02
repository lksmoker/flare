import { StyleSheet, Text } from "react-native";

import { AppShell } from "../components/AppShell";
import { FlareEventHistoryList } from "../components/FlareEventHistoryList";
import { useFlareEvents } from "../state/FlareEventContext";

export function HistoryScreen() {
  const { flareEvents } = useFlareEvents();

  return (
    <AppShell
      currentPath="/history"
      screenLabel="Past moments"
      subtitle="A lightweight chronological list of recent Flare Events and attached Checkpoint / Reflection notes."
      title="History stays chronological and light"
    >
      <Text style={styles.intro}>
        Authenticated sessions load your own persisted event history.
        Signed-out sessions stay local-only, with no analytics or Telegram data
        shown here.
      </Text>
      <FlareEventHistoryList flareEvents={flareEvents} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  intro: {
    color: "#526071",
    fontSize: 14,
    lineHeight: 20,
  },
});
