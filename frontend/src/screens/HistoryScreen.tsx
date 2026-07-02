import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppShell } from "../components/AppShell";
import { FlareEventHistoryList } from "../components/FlareEventHistoryList";
import { PlaceholderModal } from "../components/PlaceholderModal";
import flareContent from "../content/flareContent.json";
import {
  FlareEvent,
  formatFlareEventTimestamp,
  useFlareEvents,
} from "../state/FlareEventContext";

type HistoryFilter = "active" | "all" | "archived" | "reflected";

const HISTORY_FILTERS: Array<{ label: string; value: HistoryFilter }> = [
  { label: flareContent.history.filters.active, value: "active" },
  { label: flareContent.history.filters.reflected, value: "reflected" },
  { label: flareContent.history.filters.archived, value: "archived" },
  { label: flareContent.history.filters.all, value: "all" },
];

function normalizeSearchText(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function buildHistorySearchText(flareEvent: FlareEvent) {
  return [
    flareEvent.behaviorLabelSnapshot,
    flareEvent.behaviorDescriptionSnapshot,
    flareEvent.checkpoint?.whatHappened,
    flareEvent.checkpoint?.whatHelped,
    flareEvent.checkpoint?.howIFeelNow,
    flareEvent.checkpoint?.outcome,
    flareEvent.checkpoint?.note,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matchesFilter(flareEvent: FlareEvent, filter: HistoryFilter) {
  switch (filter) {
    case "active":
      return flareEvent.archivedAt === null;
    case "archived":
      return flareEvent.archivedAt !== null;
    case "reflected":
      return flareEvent.archivedAt === null && flareEvent.status === "reflected";
    default:
      return true;
  }
}

function getHistoryEmptyState(filter: HistoryFilter, searchQuery: string) {
  if (searchQuery.trim().length > 0) {
    return {
      title: flareContent.history.empty.search.title,
      copy: flareContent.history.empty.search.copy,
    };
  }

  switch (filter) {
    case "archived":
      return {
        title: flareContent.history.empty.archived.title,
        copy: flareContent.history.empty.archived.copy,
      };
    case "reflected":
      return {
        title: flareContent.history.empty.reflected.title,
        copy: flareContent.history.empty.reflected.copy,
      };
    default:
      return {
        title: flareContent.history.empty.default.title,
        copy: flareContent.history.empty.default.copy,
      };
  }
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) {
    return null;
  }

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export function HistoryScreen() {
  const { archiveFlareEvent, flareEvents, restoreFlareEvent } = useFlareEvents();
  const [activeFilter, setActiveFilter] = useState<HistoryFilter>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<FlareEvent | null>(null);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = normalizeSearchText(searchQuery);

    return flareEvents.filter((flareEvent) => {
      if (!matchesFilter(flareEvent, activeFilter)) {
        return false;
      }

      if (normalizedQuery.length === 0) {
        return true;
      }

      return buildHistorySearchText(flareEvent).includes(normalizedQuery);
    });
  }, [activeFilter, flareEvents, searchQuery]);

  const emptyState = getHistoryEmptyState(activeFilter, searchQuery);
  const resolvedSelectedEvent =
    selectedEvent === null
      ? null
      : flareEvents.find((flareEvent) => flareEvent.id === selectedEvent.id) ?? null;

  return (
    <AppShell
      currentPath="/history"
      screenLabel={flareContent.history.screenLabel}
      subtitle={flareContent.history.subtitle}
      title={flareContent.history.title}
    >
      <Text style={styles.intro}>{flareContent.history.intro}</Text>
      <View style={styles.controlsCard}>
        <Text style={styles.controlsTitle}>{flareContent.history.controlsTitle}</Text>
        <TextInput
          accessibilityLabel={flareContent.history.searchAccessibilityLabel}
          onChangeText={setSearchQuery}
          placeholder={flareContent.history.searchPlaceholder}
          placeholderTextColor="#8c97a5"
          style={styles.searchInput}
          value={searchQuery}
        />
        <View style={styles.filterRow}>
          {HISTORY_FILTERS.map((filterOption) => {
            const isSelected = activeFilter === filterOption.value;

            return (
              <Pressable
                accessibilityRole="button"
                key={filterOption.value}
                onPress={() => setActiveFilter(filterOption.value)}
                style={[
                  styles.filterButton,
                  isSelected ? styles.filterButtonActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.filterButtonLabel,
                    isSelected ? styles.filterButtonLabelActive : null,
                  ]}
                >
                  {filterOption.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <FlareEventHistoryList
        emptyCopy={emptyState.copy}
        emptyTitle={emptyState.title}
        flareEvents={filteredEvents}
        onSelectFlareEvent={setSelectedEvent}
      />
      <PlaceholderModal
        onClose={() => setSelectedEvent(null)}
        subtitle={flareContent.history.detailModal.subtitle}
        title={flareContent.history.detailModal.title}
        visible={resolvedSelectedEvent !== null}
      >
        {resolvedSelectedEvent ? (
          <View style={styles.detailContent}>
            <DetailRow
              label={flareContent.history.detail.labels.created}
              value={formatFlareEventTimestamp(resolvedSelectedEvent.createdAt)}
            />
            <DetailRow
              label={flareContent.history.detail.labels.status}
              value={
                resolvedSelectedEvent.archivedAt
                  ? flareContent.history.detail.statusArchived
                  : resolvedSelectedEvent.status
              }
            />
            <DetailRow
              label={flareContent.history.detail.labels.archived}
              value={
                resolvedSelectedEvent.archivedAt
                  ? formatFlareEventTimestamp(resolvedSelectedEvent.archivedAt)
                  : null
              }
            />
            <DetailRow
              label={flareContent.history.detail.labels.behaviorPattern}
              value={
                resolvedSelectedEvent.behaviorLabelSnapshot ??
                flareContent.history.detail.behaviorPatternNotConfigured
              }
            />
            <DetailRow
              label={flareContent.history.detail.labels.behaviorSnapshot}
              value={resolvedSelectedEvent.behaviorDescriptionSnapshot}
            />
            <DetailRow
              label={flareContent.history.detail.labels.responseMode}
              value={resolvedSelectedEvent.responseMode}
            />
            <DetailRow
              label={flareContent.history.detail.labels.supportActionShown}
              value={resolvedSelectedEvent.supportActionShown}
            />
            <DetailRow
              label={flareContent.history.detail.labels.supportActionTaken}
              value={resolvedSelectedEvent.supportActionTaken}
            />
            {resolvedSelectedEvent.checkpoint ? (
              <View style={styles.reflectionSection}>
                <Text style={styles.reflectionSectionTitle}>
                  {flareContent.history.detail.labels.checkpointReflection}
                </Text>
                <DetailRow
                  label={flareContent.history.detail.labels.whatHappened}
                  value={resolvedSelectedEvent.checkpoint.whatHappened}
                />
                <DetailRow
                  label={flareContent.history.detail.labels.whatHelped}
                  value={resolvedSelectedEvent.checkpoint.whatHelped}
                />
                <DetailRow
                  label={flareContent.history.detail.labels.howIFeelNow}
                  value={resolvedSelectedEvent.checkpoint.howIFeelNow}
                />
                <DetailRow
                  label={flareContent.history.detail.labels.outcome}
                  value={resolvedSelectedEvent.checkpoint.outcome}
                />
                <DetailRow
                  label={flareContent.history.detail.labels.actionTaken}
                  value={resolvedSelectedEvent.checkpoint.actionTaken}
                />
                <DetailRow
                  label={flareContent.history.detail.labels.note}
                  value={resolvedSelectedEvent.checkpoint.note}
                />
              </View>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (resolvedSelectedEvent.archivedAt) {
                  restoreFlareEvent(resolvedSelectedEvent.id);
                } else {
                  archiveFlareEvent(resolvedSelectedEvent.id);

                  if (activeFilter === "active") {
                    setSelectedEvent(null);
                  }
                }
              }}
              style={[
                styles.eventActionButton,
                resolvedSelectedEvent.archivedAt
                  ? styles.restoreButton
                  : styles.archiveButton,
              ]}
            >
              <Text style={styles.eventActionButtonLabel}>
                {resolvedSelectedEvent.archivedAt
                  ? flareContent.actions.restoreEvent
                  : flareContent.actions.archiveEvent}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </PlaceholderModal>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  intro: {
    color: "#526071",
    fontSize: 14,
    lineHeight: 20,
  },
  controlsCard: {
    gap: 12,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e7dcc7",
    backgroundColor: "#fffdf8",
  },
  controlsTitle: {
    color: "#1f2937",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
  },
  searchInput: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d7c7ae",
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#1f2937",
    fontSize: 15,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d7c7ae",
    backgroundColor: "#fff7ea",
  },
  filterButtonActive: {
    borderColor: "#8a5a2b",
    backgroundColor: "#8a5a2b",
  },
  filterButtonLabel: {
    color: "#6b4a24",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  filterButtonLabelActive: {
    color: "#fffaf4",
  },
  detailContent: {
    gap: 14,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    color: "#8a5a2b",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  detailValue: {
    color: "#1f2937",
    fontSize: 15,
    lineHeight: 22,
  },
  reflectionSection: {
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#f7efe3",
  },
  reflectionSectionTitle: {
    color: "#5b4635",
    fontSize: 16,
    fontWeight: "700",
  },
  eventActionButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  archiveButton: {
    backgroundColor: "#7a3f29",
  },
  restoreButton: {
    backgroundColor: "#2f6f57",
  },
  eventActionButtonLabel: {
    color: "#fffaf4",
    fontSize: 15,
    fontWeight: "700",
  },
});
