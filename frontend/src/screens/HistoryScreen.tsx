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
import { flareTheme } from "../theme/flareTheme";

type HistoryFilter = "active" | "all" | "archived" | "reflected";

const HISTORY_FILTERS: Array<{ label: string; value: HistoryFilter }> = [
  { label: flareContent.screens.history.filters.active, value: "active" },
  { label: flareContent.screens.history.filters.reflected, value: "reflected" },
  { label: flareContent.screens.history.filters.archived, value: "archived" },
  { label: flareContent.screens.history.filters.all, value: "all" },
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
      title: flareContent.screens.history.empty.search.title,
      copy: flareContent.screens.history.empty.search.copy,
    };
  }

  switch (filter) {
    case "archived":
      return {
        title: flareContent.screens.history.empty.archived.title,
        copy: flareContent.screens.history.empty.archived.copy,
      };
    case "reflected":
      return {
        title: flareContent.screens.history.empty.reflected.title,
        copy: flareContent.screens.history.empty.reflected.copy,
      };
    default:
      return {
        title: flareContent.screens.history.empty.default.title,
        copy: flareContent.screens.history.empty.default.copy,
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
  const {
    archiveFlareEvent,
    flareEvents,
    flareEventsError,
    isLoadingEvents,
    reloadFlareEvents,
    restoreFlareEvent,
  } = useFlareEvents();
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
      screenLabel={flareContent.screens.history.screenLabel}
      subtitle={flareContent.screens.history.subtitle}
      title={flareContent.screens.history.title}
    >
      <Text style={styles.intro}>{flareContent.screens.history.intro}</Text>
      <View style={styles.controlsCard}>
        <Text style={styles.controlsTitle}>
          {flareContent.screens.history.controls.title}
        </Text>
        <TextInput
          accessibilityLabel={
            flareContent.screens.history.controls.searchAccessibilityLabel
          }
          onChangeText={setSearchQuery}
          placeholder={flareContent.screens.history.controls.searchPlaceholder}
          placeholderTextColor={flareTheme.colors.textSubtle}
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
      {isLoadingEvents ? (
        <View style={styles.stateCard}>
          <Text style={styles.stateTitle}>
            {flareContent.screens.history.loading.title}
          </Text>
          <Text style={styles.stateCopy}>
            {flareContent.screens.history.loading.copy}
          </Text>
        </View>
      ) : flareEventsError ? (
        <View style={styles.stateCard}>
          <Text style={styles.stateTitle}>
            {flareContent.screens.history.error.title}
          </Text>
          <Text style={styles.stateCopy}>
            {flareContent.screens.history.error.copy}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void reloadFlareEvents()}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonLabel}>
              {flareContent.common.actions.retry}
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlareEventHistoryList
          emptyCopy={emptyState.copy}
          emptyTitle={emptyState.title}
          flareEvents={filteredEvents}
          onSelectFlareEvent={setSelectedEvent}
        />
      )}
      <PlaceholderModal
        onClose={() => setSelectedEvent(null)}
        subtitle={flareContent.components.flareEventHistory.detailModal.subtitle}
        title={flareContent.components.flareEventHistory.detailModal.title}
        visible={resolvedSelectedEvent !== null}
      >
        {resolvedSelectedEvent ? (
          <View style={styles.detailContent}>
            <DetailRow
              label={flareContent.components.flareEventHistory.detail.labels.created}
              value={formatFlareEventTimestamp(resolvedSelectedEvent.createdAt)}
            />
            <DetailRow
              label={flareContent.components.flareEventHistory.detail.labels.status}
              value={
                resolvedSelectedEvent.archivedAt
                  ? flareContent.components.flareEventHistory.detail.statusArchived
                  : resolvedSelectedEvent.status
              }
            />
            <DetailRow
              label={flareContent.components.flareEventHistory.detail.labels.archived}
              value={
                resolvedSelectedEvent.archivedAt
                  ? formatFlareEventTimestamp(resolvedSelectedEvent.archivedAt)
                  : null
              }
            />
            <DetailRow
              label={
                flareContent.components.flareEventHistory.detail.labels
                  .behaviorPattern
              }
              value={
                resolvedSelectedEvent.behaviorLabelSnapshot ??
                flareContent.components.flareEventHistory.detail
                  .behaviorPatternNotConfigured
              }
            />
            <DetailRow
              label={
                flareContent.components.flareEventHistory.detail.labels
                  .behaviorSnapshot
              }
              value={resolvedSelectedEvent.behaviorDescriptionSnapshot}
            />
            <DetailRow
              label={
                flareContent.components.flareEventHistory.detail.labels
                  .responseMode
              }
              value={resolvedSelectedEvent.responseMode}
            />
            <DetailRow
              label={
                flareContent.components.flareEventHistory.detail.labels
                  .supportActionShown
              }
              value={resolvedSelectedEvent.supportActionShown}
            />
            <DetailRow
              label={
                flareContent.components.flareEventHistory.detail.labels
                  .supportActionTaken
              }
              value={resolvedSelectedEvent.supportActionTaken}
            />
            {resolvedSelectedEvent.checkpoint ? (
              <View style={styles.reflectionSection}>
                <Text style={styles.reflectionSectionTitle}>
                  {
                    flareContent.components.flareEventHistory.detail.labels
                      .checkpointReflection
                  }
                </Text>
                <DetailRow
                  label={
                    flareContent.components.flareEventHistory.detail.labels
                      .whatHappened
                  }
                  value={resolvedSelectedEvent.checkpoint.whatHappened}
                />
                <DetailRow
                  label={
                    flareContent.components.flareEventHistory.detail.labels
                      .whatHelped
                  }
                  value={resolvedSelectedEvent.checkpoint.whatHelped}
                />
                <DetailRow
                  label={
                    flareContent.components.flareEventHistory.detail.labels
                      .howIFeelNow
                  }
                  value={resolvedSelectedEvent.checkpoint.howIFeelNow}
                />
                <DetailRow
                  label={
                    flareContent.components.flareEventHistory.detail.labels
                      .outcome
                  }
                  value={resolvedSelectedEvent.checkpoint.outcome}
                />
                <DetailRow
                  label={
                    flareContent.components.flareEventHistory.detail.labels
                      .actionTaken
                  }
                  value={resolvedSelectedEvent.checkpoint.actionTaken}
                />
                <DetailRow
                  label={flareContent.components.flareEventHistory.detail.labels.note}
                  value={resolvedSelectedEvent.checkpoint.note}
                />
              </View>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (resolvedSelectedEvent.archivedAt) {
                  restoreFlareEvent(resolvedSelectedEvent.id);

                  if (activeFilter === "archived") {
                    setSelectedEvent(null);
                  }
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
                  ? flareContent.common.actions.restoreEvent
                  : flareContent.common.actions.archiveEvent}
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
    color: flareTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  controlsCard: {
    ...flareTheme.shadows.card,
    gap: 12,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: flareTheme.colors.border,
    backgroundColor: flareTheme.colors.surface,
  },
  controlsTitle: {
    color: flareTheme.colors.textStrong,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
  },
  searchInput: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: flareTheme.colors.border,
    backgroundColor: flareTheme.colors.surfaceStrong,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: flareTheme.colors.textStrong,
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
    borderColor: flareTheme.colors.borderStrong,
    backgroundColor: flareTheme.colors.surfaceStrong,
  },
  filterButtonActive: {
    borderColor: flareTheme.colors.primaryStrong,
    backgroundColor: flareTheme.colors.primary,
  },
  filterButtonLabel: {
    color: flareTheme.colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  filterButtonLabelActive: {
    color: flareTheme.colors.onPrimary,
  },
  stateCard: {
    ...flareTheme.shadows.card,
    gap: 10,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: flareTheme.colors.border,
    backgroundColor: flareTheme.colors.surface,
  },
  stateTitle: {
    color: flareTheme.colors.textStrong,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
  },
  stateCopy: {
    color: flareTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  retryButton: {
    minHeight: 46,
    alignSelf: "flex-start",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: flareTheme.colors.primary,
    paddingHorizontal: 16,
  },
  retryButtonLabel: {
    color: flareTheme.colors.onPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  detailContent: {
    gap: 14,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    color: flareTheme.colors.primaryBright,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  detailValue: {
    color: flareTheme.colors.textStrong,
    fontSize: 15,
    lineHeight: 22,
  },
  reflectionSection: {
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: flareTheme.colors.surfaceSoft,
  },
  reflectionSectionTitle: {
    color: flareTheme.colors.text,
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
    backgroundColor: flareTheme.colors.primaryStrong,
  },
  restoreButton: {
    backgroundColor: flareTheme.colors.primaryBright,
  },
  eventActionButtonLabel: {
    color: flareTheme.colors.onPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
});
