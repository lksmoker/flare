import { StyleSheet, Text, View } from "react-native";

import {
  FlareEvent,
  formatFlareEventTimestamp,
} from "../state/FlareEventContext";

type FlareEventHistoryListProps = {
  flareEvents: FlareEvent[];
};

function getStatusLabel(flareEvent: FlareEvent) {
  switch (flareEvent.status) {
    case "active":
      return "Active event";
    case "reflected":
      return "Reflected event";
    default:
      return "Closed event";
  }
}

export function FlareEventHistoryList({
  flareEvents,
}: FlareEventHistoryListProps) {
  if (flareEvents.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>No Flare Events yet</Text>
        <Text style={styles.emptyCopy}>
          Send Flare to create the first in-memory event. Reflections saved from
          the active event will show up here too.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {flareEvents.map((flareEvent) => (
        <View key={flareEvent.id} style={styles.card}>
          <Text style={styles.cardTitle}>Flare Event</Text>
          <Text style={styles.cardDetail}>
            {getStatusLabel(flareEvent)} •{" "}
            {formatFlareEventTimestamp(flareEvent.createdAt)}
          </Text>
          <Text style={styles.cardNote}>
            {flareEvent.behaviorName
              ? `Behavior Pattern: ${flareEvent.behaviorName}`
              : "Behavior Pattern: Not configured yet"}
          </Text>
          {flareEvent.behaviorSummary ? (
            <Text style={styles.cardNote}>{flareEvent.behaviorSummary}</Text>
          ) : null}
          {flareEvent.checkpoint ? (
            <View style={styles.reflectionCard}>
              <Text style={styles.reflectionTitle}>Checkpoint / Reflection</Text>
              <Text style={styles.reflectionCopy}>
                What happened: {flareEvent.checkpoint.whatHappened}
              </Text>
              <Text style={styles.reflectionCopy}>
                What helped: {flareEvent.checkpoint.whatHelped}
              </Text>
              <Text style={styles.reflectionCopy}>
                How I feel now: {flareEvent.checkpoint.howIFeelNow}
              </Text>
              <Text style={styles.reflectionCopy}>
                Outcome: {flareEvent.checkpoint.outcome}
              </Text>
              {flareEvent.checkpoint.note ? (
                <Text style={styles.reflectionCopy}>
                  Note: {flareEvent.checkpoint.note}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      ))}
    </View>
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
  reflectionCard: {
    gap: 4,
    marginTop: 8,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#f7efe3",
  },
  reflectionTitle: {
    color: "#5b4635",
    fontSize: 15,
    fontWeight: "700",
  },
  reflectionCopy: {
    color: "#526071",
    fontSize: 14,
    lineHeight: 20,
  },
  emptyCard: {
    gap: 8,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e7dcc7",
    backgroundColor: "#fffdf8",
  },
  emptyTitle: {
    color: "#1f2937",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
  },
  emptyCopy: {
    color: "#5d6b7b",
    fontSize: 14,
    lineHeight: 20,
  },
});
