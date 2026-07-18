import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  type CheckpointReflectionRepository,
  getCheckpointReflectionRepository,
} from "../services/checkpointReflectionRepository";
import {
  type FlareEventRepository,
  getFlareEventRepository,
  type PersistedCheckpointReflection,
  type PersistedFlareEvent,
} from "../services/flareEventRepository";
import {
  resolveFlareSupabaseAuthState,
  type FlareSupabaseAuthState,
} from "../services/flareSupabaseAuth";
import { useAnchorNote } from "./AnchorNoteContext";
import { useBehaviorPattern } from "./BehaviorPatternContext";
import { useOptionalFlareAuth } from "./FlareAuthContext";

export type CheckpointReflection = {
  actionTaken: string;
  createdAt: string;
  howIFeelNow: string;
  id: string;
  note: string;
  outcome: string;
  updatedAt: string;
  userId: string | null;
  whatHappened: string;
  whatHelped: string;
};

export type FlareEventStatus = "active" | "reflected" | "closed";

export type FlareEvent = {
  anchorNoteId: string | null;
  anchorNoteVersion: number | null;
  archivedAt: string | null;
  behaviorDescriptionSnapshot: string | null;
  behaviorLabelSnapshot: string | null;
  behaviorPatternId: string | null;
  checkpoint: CheckpointReflection | null;
  closedAt: string | null;
  createdAt: string;
  id: string;
  responseMode: "configured" | "fallback-generic";
  status: FlareEventStatus;
  supportActionShown: string | null;
  supportActionTaken: string | null;
  updatedAt: string;
  userId: string | null;
};

export type CreateFlareEventInput = {
  behaviorDescriptionSnapshot?: string | null;
  behaviorLabelSnapshot?: string | null;
  supportActionShown?: string | null;
};

export type SaveCheckpointReflectionInput = {
  actionTaken?: string;
  howIFeelNow: string;
  note: string;
  outcome: string;
  whatHappened: string;
  whatHelped: string;
};

type FlareEventContextValue = {
  activeEvent: FlareEvent | null;
  archiveFlareEvent: (eventId: string) => void;
  currentEvent: FlareEvent | null;
  flareEvents: FlareEvent[];
  createFlareEvent: (input: CreateFlareEventInput) => FlareEvent;
  restoreFlareEvent: (eventId: string) => void;
  saveCheckpointReflection: (input: SaveCheckpointReflectionInput) => void;
  upsertPersistedFlareEvent: (persistedRecord: PersistedFlareEvent) => void;
};

type FlareEventProviderProps = PropsWithChildren<{
  authState?: FlareSupabaseAuthState;
  checkpointReflectionRepository?: CheckpointReflectionRepository;
  flareEventRepository?: FlareEventRepository;
  resolveAuthState?: () => Promise<FlareSupabaseAuthState>;
}>;

const FlareEventContext = createContext<FlareEventContextValue | undefined>(
  undefined,
);

let nextFlareEventId = 1;
let nextCheckpointReflectionId = 1;

const defaultFlareEventRepository: FlareEventRepository = {
  archiveFlareEvent(input) {
    return getFlareEventRepository().archiveFlareEvent(input);
  },
  createFlareEvent(input) {
    return getFlareEventRepository().createFlareEvent(input);
  },
  loadFlareEvents(userId, options) {
    return getFlareEventRepository().loadFlareEvents(userId, options);
  },
  restoreFlareEvent(input) {
    return getFlareEventRepository().restoreFlareEvent(input);
  },
  updateFlareEventStatus(input) {
    return getFlareEventRepository().updateFlareEventStatus(input);
  },
};

const defaultCheckpointReflectionRepository: CheckpointReflectionRepository = {
  saveCheckpointReflection(input) {
    return getCheckpointReflectionRepository().saveCheckpointReflection(input);
  },
};

const UNCONFIGURED_BEHAVIOR_LABEL = "Behavior pattern not configured";

function createLocalFlareEventRecord(
  input: CreateFlareEventInput & {
    anchorNoteId?: string | null;
    anchorNoteVersion?: number | null;
    behaviorPatternId?: string | null;
    responseMode: "configured" | "fallback-generic";
    userId?: string | null;
  },
  createdAt: string = new Date().toISOString(),
): FlareEvent {
  const id = `flare-event-${nextFlareEventId}`;
  nextFlareEventId += 1;

  return {
    anchorNoteId: input.anchorNoteId ?? null,
    anchorNoteVersion: input.anchorNoteVersion ?? null,
    archivedAt: null,
    behaviorDescriptionSnapshot: input.behaviorDescriptionSnapshot?.trim() || null,
    behaviorLabelSnapshot: input.behaviorLabelSnapshot?.trim() || null,
    behaviorPatternId: input.behaviorPatternId ?? null,
    checkpoint: null,
    closedAt: null,
    createdAt,
    id,
    responseMode: input.responseMode,
    status: "active",
    supportActionShown: input.supportActionShown?.trim() || null,
    supportActionTaken: null,
    updatedAt: createdAt,
    userId: input.userId ?? null,
  };
}

function createCheckpointReflectionRecord(
  input: SaveCheckpointReflectionInput,
  createdAt: string = new Date().toISOString(),
): CheckpointReflection {
  const id = `checkpoint-reflection-${nextCheckpointReflectionId}`;
  nextCheckpointReflectionId += 1;

  return {
    actionTaken: input.actionTaken?.trim() || "",
    createdAt,
    howIFeelNow: input.howIFeelNow.trim(),
    id,
    note: input.note.trim(),
    outcome: input.outcome.trim(),
    updatedAt: createdAt,
    userId: null,
    whatHappened: input.whatHappened.trim(),
    whatHelped: input.whatHelped.trim(),
  };
}

function replaceFlareEvent(
  currentEvents: FlareEvent[],
  targetId: string,
  nextEvent: FlareEvent,
) {
  return currentEvents.map((flareEvent) =>
    flareEvent.id === targetId ? nextEvent : flareEvent,
  );
}

function isArchivedFlareEvent(flareEvent: FlareEvent) {
  return flareEvent.archivedAt !== null;
}

function applyArchiveState(
  flareEvent: FlareEvent,
  archivedAt: string | null,
): FlareEvent {
  return {
    ...flareEvent,
    archivedAt,
    updatedAt: archivedAt ?? new Date().toISOString(),
  };
}

function mergePersistedFlareEvent(
  currentEvent: FlareEvent,
  persistedRecord: PersistedFlareEvent,
): FlareEvent {
  return {
    ...persistedRecord.flareEvent,
    checkpoint:
      currentEvent.checkpoint ?? persistedRecord.flareEvent.checkpoint ?? null,
    status:
      currentEvent.status === "reflected" &&
      persistedRecord.flareEvent.status === "active"
        ? "reflected"
        : persistedRecord.flareEvent.status,
  };
}

function mergePersistedCheckpointReflection(
  currentEvent: FlareEvent,
  persistedCheckpointReflection: PersistedCheckpointReflection,
): FlareEvent {
  return {
    ...currentEvent,
    checkpoint: persistedCheckpointReflection.checkpointReflection,
    status: "reflected",
    updatedAt: persistedCheckpointReflection.updatedAt,
    userId: persistedCheckpointReflection.userId,
  };
}

function insertPersistedFlareEvent(
  currentEvents: FlareEvent[],
  persistedRecord: PersistedFlareEvent,
) {
  const nextEvent = persistedRecord.flareEvent;
  const withoutTarget = currentEvents.filter((flareEvent) => flareEvent.id !== nextEvent.id);

  const normalized = withoutTarget.map((flareEvent) =>
    flareEvent.status === "active" && flareEvent.archivedAt === null
      ? {
          ...flareEvent,
          closedAt: flareEvent.closedAt ?? nextEvent.createdAt,
          status: "closed" as const,
          updatedAt: nextEvent.updatedAt,
        }
      : flareEvent,
  );

  return [nextEvent, ...normalized];
}

export function formatFlareEventTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export function createEmptyCheckpointReflection() {
  return {
    actionTaken: "",
    howIFeelNow: "",
    note: "",
    outcome: "",
    whatHappened: "",
    whatHelped: "",
  };
}

export function FlareEventProvider({
  authState: authStateOverride,
  checkpointReflectionRepository = defaultCheckpointReflectionRepository,
  children,
  flareEventRepository = defaultFlareEventRepository,
  resolveAuthState = resolveFlareSupabaseAuthState,
}: FlareEventProviderProps) {
  const authContext = useOptionalFlareAuth();
  const { anchorNote, anchorNoteRecord } = useAnchorNote();
  const { behaviorPattern, behaviorPatternRecord } = useBehaviorPattern();
  const [flareEvents, setFlareEvents] = useState<FlareEvent[]>([]);
  const flareEventsRef = useRef<FlareEvent[]>([]);

  useEffect(() => {
    flareEventsRef.current = flareEvents;
  }, [flareEvents]);

  useEffect(() => {
    let isActive = true;

    async function loadFlareEvents() {
      const activeAuthState =
        authStateOverride ?? authContext?.authState ?? (await resolveAuthState());

      if (activeAuthState.kind !== "authenticated") {
        if (isActive) {
          setFlareEvents([]);
        }

        return;
      }

      try {
        const persistedEvents = await flareEventRepository.loadFlareEvents(
          activeAuthState.userId,
          { includeArchived: true },
        );

        if (isActive) {
          setFlareEvents(persistedEvents.map((record) => record.flareEvent));
        }
      } catch (error) {
        console.warn("Failed to load persisted Flare Events.", error);
      }
    }

    void loadFlareEvents();

    return () => {
      isActive = false;
    };
  }, [
    authContext?.authState,
    authStateOverride,
    flareEventRepository,
    resolveAuthState,
  ]);

  const value = useMemo<FlareEventContextValue>(() => {
    const currentEvent =
      flareEvents.find((flareEvent) => !isArchivedFlareEvent(flareEvent)) ?? null;
    const activeEvent =
      flareEvents.find(
        (flareEvent) =>
          flareEvent.status === "active" && !isArchivedFlareEvent(flareEvent),
      ) ?? null;

    return {
      activeEvent,
      archiveFlareEvent: (eventId) => {
        const archivedAt = new Date().toISOString();
        let targetEvent: FlareEvent | null = null;

        setFlareEvents((currentEvents) =>
          currentEvents.map((flareEvent) => {
            if (flareEvent.id !== eventId) {
              return flareEvent;
            }

            targetEvent = flareEvent;

            return applyArchiveState(flareEvent, archivedAt);
          }),
        );

        void (async () => {
          try {
            const authState =
              authStateOverride ??
              authContext?.authState ??
              (await resolveAuthState());

            if (authState.kind !== "authenticated") {
              return;
            }

            const localTargetEvent =
              targetEvent ??
              flareEventsRef.current.find((flareEvent) => flareEvent.id === eventId) ??
              null;

            if (!localTargetEvent) {
              return;
            }

            const persistedRecord = await flareEventRepository.archiveFlareEvent({
              archivedAt,
              eventId,
              userId: authState.userId,
            });

            setFlareEvents((currentEvents) =>
              replaceFlareEvent(
                currentEvents,
                localTargetEvent.id,
                mergePersistedFlareEvent(localTargetEvent, persistedRecord),
              ),
            );
          } catch (error) {
            console.warn("Failed to archive Flare Event.", error);
          }
        })();
      },
      currentEvent,
      flareEvents,
      upsertPersistedFlareEvent: (persistedRecord) => {
        setFlareEvents((currentEvents) =>
          insertPersistedFlareEvent(currentEvents, persistedRecord),
        );
      },
      createFlareEvent: (input) => {
        const nextEvent = createLocalFlareEventRecord({
          anchorNoteId: anchorNoteRecord?.id ?? null,
          anchorNoteVersion: anchorNoteRecord?.version ?? null,
          behaviorDescriptionSnapshot:
            input.behaviorDescriptionSnapshot ??
            behaviorPattern?.shortDescription ??
            null,
          behaviorLabelSnapshot:
            input.behaviorLabelSnapshot ??
            behaviorPattern?.behaviorName ??
            UNCONFIGURED_BEHAVIOR_LABEL,
          behaviorPatternId: behaviorPatternRecord?.id ?? null,
          responseMode: anchorNote ? "configured" : "fallback-generic",
          supportActionShown:
            input.supportActionShown ?? anchorNote?.emergencyActions ?? null,
          userId:
            authStateOverride?.kind === "authenticated"
              ? authStateOverride.userId
              : authContext?.authState.kind === "authenticated"
                ? authContext.authState.userId
                : null,
        });

        setFlareEvents((currentEvents) => [
          nextEvent,
          ...currentEvents.map((flareEvent) =>
            flareEvent.status === "active"
              && !isArchivedFlareEvent(flareEvent)
              ? {
                  ...flareEvent,
                  closedAt: flareEvent.closedAt ?? new Date().toISOString(),
                  status: "closed" as const,
                  updatedAt: new Date().toISOString(),
                }
              : flareEvent,
          ),
        ]);

        return nextEvent;
      },
      restoreFlareEvent: (eventId) => {
        let targetEvent: FlareEvent | null = null;

        setFlareEvents((currentEvents) =>
          currentEvents.map((flareEvent) => {
            if (flareEvent.id !== eventId) {
              return flareEvent;
            }

            targetEvent = flareEvent;

            return applyArchiveState(flareEvent, null);
          }),
        );

        void (async () => {
          try {
            const authState =
              authStateOverride ??
              authContext?.authState ??
              (await resolveAuthState());

            if (authState.kind !== "authenticated") {
              return;
            }

            const localTargetEvent =
              targetEvent ??
              flareEventsRef.current.find((flareEvent) => flareEvent.id === eventId) ??
              null;

            if (!localTargetEvent) {
              return;
            }

            const persistedRecord = await flareEventRepository.restoreFlareEvent({
              eventId,
              userId: authState.userId,
            });

            setFlareEvents((currentEvents) =>
              replaceFlareEvent(
                currentEvents,
                localTargetEvent.id,
                mergePersistedFlareEvent(localTargetEvent, persistedRecord),
              ),
            );
          } catch (error) {
            console.warn("Failed to restore Flare Event.", error);
          }
        })();
      },
      saveCheckpointReflection: (input) => {
        const checkpoint = createCheckpointReflectionRecord(input);
        let targetEvent: FlareEvent | null = null;

        setFlareEvents((currentEvents) => {
          const currentActiveEvent = currentEvents.find(
            (flareEvent) =>
              flareEvent.status === "active" && !isArchivedFlareEvent(flareEvent),
          );

          if (!currentActiveEvent) {
            return currentEvents;
          }

          targetEvent = currentActiveEvent;

          return currentEvents.map((flareEvent) =>
            flareEvent.id === currentActiveEvent.id
              ? {
                  ...flareEvent,
                  checkpoint,
                  status: "reflected",
                  updatedAt: checkpoint.updatedAt,
                }
              : flareEvent,
          );
        });

        void (async () => {
          try {
            const authState =
              authStateOverride ??
              authContext?.authState ??
              (await resolveAuthState());

            if (authState.kind !== "authenticated") {
              return;
            }

            const currentActiveEvent =
              targetEvent ??
              flareEventsRef.current.find(
                (flareEvent) =>
                  ((flareEvent.status === "active" ||
                    flareEvent.status === "reflected") &&
                    !isArchivedFlareEvent(flareEvent)),
              ) ??
              null;

            if (!currentActiveEvent) {
              return;
            }

            const latestMatchingEvent =
              flareEventsRef.current.find(
                (flareEvent) =>
                  flareEvent.id === currentActiveEvent.id ||
                  flareEvent.createdAt === currentActiveEvent.createdAt,
              ) ?? currentActiveEvent;
            const persistedCheckpointReflection =
              await checkpointReflectionRepository.saveCheckpointReflection({
                checkpointReflection: input,
                flareEventId: latestMatchingEvent.id,
                userId: authState.userId,
              });
            const persistedFlareEvent =
              await flareEventRepository.updateFlareEventStatus({
                eventId: latestMatchingEvent.id,
                status: "reflected",
                userId: authState.userId,
              });

            setFlareEvents((currentEvents) =>
              currentEvents.map((flareEvent) => {
                if (
                  flareEvent.id !== currentActiveEvent.id &&
                  flareEvent.id !== latestMatchingEvent.id
                ) {
                  return flareEvent;
                }

                return mergePersistedCheckpointReflection(
                  mergePersistedFlareEvent(flareEvent, persistedFlareEvent),
                  persistedCheckpointReflection,
                );
              }),
            );
          } catch (error) {
            console.warn("Failed to persist Checkpoint / Reflection.", error);
          }
        })();
      },
    };
  }, [
    anchorNote,
    anchorNoteRecord,
    authContext?.authState,
    authStateOverride,
    behaviorPattern,
    behaviorPatternRecord,
    checkpointReflectionRepository,
    flareEventRepository,
    flareEvents,
    resolveAuthState,
  ]);

  return (
    <FlareEventContext.Provider value={value}>
      {children}
    </FlareEventContext.Provider>
  );
}

export function useFlareEvents() {
  const context = useContext(FlareEventContext);

  if (!context) {
    throw new Error("useFlareEvents must be used within a FlareEventProvider.");
  }

  return context;
}
