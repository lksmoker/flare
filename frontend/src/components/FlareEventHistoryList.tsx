import { Pressable, StyleSheet, Text, View } from "react-native";

import flareContent from "../content/flareContent.json";
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
    return flareContent.common.status.archivedEvent;
  }

  switch (flareEvent.status) {
    case "active":
      return flareContent.common.status.activeEvent;
    case "reflected":
      return flareContent.common.status.reflectedEvent;
    default:
      return flareContent.common.status.closedEvent;
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
          {emptyTitle ?? flareContent.screens.history.empty.default.title}
        </Text>
        <Text style={styles.emptyCopy}>
          {emptyCopy ?? flareContent.screens.history.empty.default.copy}
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
          <Text style={styles.cardTitle}>
            {flareContent.components.flareEventHistory.list.cardTitle}
          </Text>
          <Text style={styles.cardDetail}>
            {getStatusLabel(flareEvent)} |{" "}
            {formatFlareEventTimestamp(flareEvent.createdAt)}
          </Text>
          <Text style={styles.cardNote}>
            {flareEvent.behaviorLabelSnapshot
              ? `${flareContent.components.flareEventHistory.list.behaviorPatternConfiguredPrefix} ${flareEvent.behaviorLabelSnapshot}`
              : flareContent.components.flareEventHistory.list.behaviorPatternNotConfigured}
          </Text>
          {flareEvent.behaviorDescriptionSnapshot ? (
            <Text style={styles.cardNote}>
              {flareEvent.behaviorDescriptionSnapshot}
            </Text>
          ) : null}
          {flareEvent.checkpoint ? (
            <View style={styles.reflectionCard}>
              <Text style={styles.reflectionTitle}>
                {flareContent.components.flareEventHistory.list.reflectionTitle}
              </Text>
              <Text style={styles.reflectionCopy}>
                {
                  flareContent.components.flareEventHistory.list.reflectionFields
                    .whatHappened
                }{" "}
                {flareEvent.checkpoint.whatHappened}
              </Text>
              <Text style={styles.reflectionCopy}>
                {
                  flareContent.components.flareEventHistory.list.reflectionFields
                    .whatHelped
                }{" "}
                {flareEvent.checkpoint.whatHelped}
              </Text>
              <Text style={styles.reflectionCopy}>
                {
                  flareContent.components.flareEventHistory.list.reflectionFields
                    .howIFeelNow
                }{" "}
                {flareEvent.checkpoint.howIFeelNow}
              </Text>
              <Text style={styles.reflectionCopy}>
                {
                  flareContent.components.flareEventHistory.list.reflectionFields
                    .outcome
                }{" "}
                {flareEvent.checkpoint.outcome}
              </Text>
              {flareEvent.checkpoint.note ? (
                <Text style={styles.reflectionCopy}>
                  {flareContent.components.flareEventHistory.list.reflectionFields.note}{" "}
                  {flareEvent.checkpoint.note}
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
