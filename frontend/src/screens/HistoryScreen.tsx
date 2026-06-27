import { Text } from "react-native";

import { AppShell } from "../components/AppShell";
import { FlareEventHistoryList } from "../components/FlareEventHistoryList";
import { useFlareEvents } from "../state/FlareEventContext";

export function HistoryScreen() {
  const { flareEvents } = useFlareEvents();

  return (
    <AppShell
      currentPath="/history"
      screenLabel="Past moments"
      subtitle="A lightweight in-memory list of recent Flare Events and attached Checkpoint / Reflection notes."
      title="History stays chronological and light"
    >
      <Text>
        V0 keeps History local-only. No persistence, analytics, or Telegram data
        is included here.
      </Text>
      <FlareEventHistoryList flareEvents={flareEvents} />
    </AppShell>
  );
}
