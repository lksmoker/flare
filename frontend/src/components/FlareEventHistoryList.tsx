import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  FlareEvent,
  formatFlareEventTimestamp,
} from "../state/FlareEventContext";

type FlareEventHistoryListProps = {
  emptyCopy?: string;
  emptyTitle?: string;
  flareEvents: FlareEvent[];
  onSelectFlareEvent?: (flareEvent: FlareEvent) => void;
};

function getStatusLabel(flareEvent: FlareEvent) {
  if (flareEvent.archivedAt) {
    return "Archived event";
  }

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
  emptyCopy,
  emptyTitle,
  flareEvents,
  onSelectFlareEvent,
}: FlareEventHistoryListProps) {
  if (flareEvents.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>
          {emptyTitle ?? "No Flare Events yet"}
        </Text>
        <Text style={styles.emptyCopy}>
          {emptyCopy ??
            "Send Flare to log the first event. Signed-in sessions can reload saved events here, while signed-out sessions stay local-only."}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {flareEvents.map((flareEvent) => (
        <Pressable
          accessibilityRole="button"
          key={flareEvent.id}
          onPress={
            onSelectFlareEvent ? () => onSelectFlareEvent(flareEvent) : undefined
          }
          style={styles.card}
        >
          <Text style={styles.cardTitle}>Flare Event</Text>
          <Text style={styles.cardDetail}>
            {getStatusLabel(flareEvent)} |{" "}
            {formatFlareEventTimestamp(flareEvent.createdAt)}
          </Text>
          <Text style={styles.cardNote}>
            {flareEvent.behaviorLabelSnapshot
              ? `Behavior Pattern: ${flareEvent.behaviorLabelSnapshot}`
              : "Behavior Pattern: Not configured yet"}
          </Text>
          {flareEvent.behaviorDescriptionSnapshot ? (
            <Text style={styles.cardNote}>
              {flareEvent.behaviorDescriptionSnapshot}
            </Text>
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
        </Pressable>
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
