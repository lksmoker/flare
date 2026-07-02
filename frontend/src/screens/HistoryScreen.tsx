import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppShell } from "../components/AppShell";
import { FlareEventHistoryList } from "../components/FlareEventHistoryList";
import { PlaceholderModal } from "../components/PlaceholderModal";
import {
  FlareEvent,
  formatFlareEventTimestamp,
  useFlareEvents,
} from "../state/FlareEventContext";

type HistoryFilter = "active" | "all" | "archived" | "reflected";

const HISTORY_FILTERS: Array<{ label: string; value: HistoryFilter }> = [
  { label: "Active", value: "active" },
  { label: "Reflected", value: "reflected" },
  { label: "Archived", value: "archived" },
  { label: "All", value: "all" },
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
      title: "No matching Flare Events",
      copy:
        "Try a different search term from the behavior snapshot or reflection notes.",
    };
  }

  switch (filter) {
    case "archived":
      return {
        title: "No archived Flare Events",
        copy:
          "Archive keeps older events out of the default view without deleting them.",
      };
    case "reflected":
      return {
        title: "No reflected Flare Events",
        copy:
          "Checkpoint / Reflection entries appear here after you save a reflection.",
      };
    default:
      return {
        title: "No Flare Events yet",
        copy:
          "Send Flare to log the first event. Signed-in sessions can reload saved events here, while signed-out sessions stay local-only.",
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
      screenLabel="Past moments"
      subtitle="A lightweight chronological list of past Flare Events and attached Checkpoint / Reflection notes."
      title="Review past flares without turning this into analytics"
    >
      <Text style={styles.intro}>
        Signed-in sessions load your own saved event history. Signed-out
        sessions stay local-only. Flare does not monitor you in real time or
        score your behavior.
      </Text>
      <View style={styles.controlsCard}>
        <Text style={styles.controlsTitle}>Find a past moment</Text>
        <TextInput
          accessibilityLabel="Search Flare Event history"
          onChangeText={setSearchQuery}
          placeholder="Search behavior or reflection notes"
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
        subtitle="Review the saved behavior snapshot and any attached reflection before deciding whether to archive or restore it."
        title="Flare Event details"
        visible={resolvedSelectedEvent !== null}
      >
        {resolvedSelectedEvent ? (
          <View style={styles.detailContent}>
            <DetailRow
              label="Created"
              value={formatFlareEventTimestamp(resolvedSelectedEvent.createdAt)}
            />
            <DetailRow
              label="Status"
              value={
                resolvedSelectedEvent.archivedAt
                  ? "Archived"
                  : resolvedSelectedEvent.status
              }
            />
            <DetailRow
              label="Archived"
              value={
                resolvedSelectedEvent.archivedAt
                  ? formatFlareEventTimestamp(resolvedSelectedEvent.archivedAt)
                  : null
              }
            />
            <DetailRow
              label="Behavior Pattern"
              value={
                resolvedSelectedEvent.behaviorLabelSnapshot ??
                "Behavior pattern not configured"
              }
            />
            <DetailRow
              label="Behavior Snapshot"
              value={resolvedSelectedEvent.behaviorDescriptionSnapshot}
            />
            <DetailRow
              label="Response mode"
              value={resolvedSelectedEvent.responseMode}
            />
            <DetailRow
              label="Support action shown"
              value={resolvedSelectedEvent.supportActionShown}
            />
            <DetailRow
              label="Support action taken"
              value={resolvedSelectedEvent.supportActionTaken}
            />
            {resolvedSelectedEvent.checkpoint ? (
              <View style={styles.reflectionSection}>
                <Text style={styles.reflectionSectionTitle}>
                  Checkpoint / Reflection
                </Text>
                <DetailRow
                  label="What happened"
                  value={resolvedSelectedEvent.checkpoint.whatHappened}
                />
                <DetailRow
                  label="What helped"
                  value={resolvedSelectedEvent.checkpoint.whatHelped}
                />
                <DetailRow
                  label="How I feel now"
                  value={resolvedSelectedEvent.checkpoint.howIFeelNow}
                />
                <DetailRow
                  label="Outcome"
                  value={resolvedSelectedEvent.checkpoint.outcome}
                />
                <DetailRow
                  label="Action taken"
                  value={resolvedSelectedEvent.checkpoint.actionTaken}
                />
                <DetailRow
                  label="Note"
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
                {resolvedSelectedEvent.archivedAt ? "Restore event" : "Archive event"}
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
