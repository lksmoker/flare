import {
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from "react";

export type CheckpointReflection = {
  createdAt: string;
  howIFeelNow: string;
  note: string;
  outcome: string;
  whatHappened: string;
  whatHelped: string;
};

export type FlareEventStatus = "active" | "reflected" | "closed";

export type FlareEvent = {
  behaviorName: string | null;
  behaviorSummary: string | null;
  checkpoint: CheckpointReflection | null;
  createdAt: string;
  id: string;
  status: FlareEventStatus;
};

export type CreateFlareEventInput = {
  behaviorName?: string | null;
  behaviorSummary?: string | null;
};

export type SaveCheckpointReflectionInput = {
  howIFeelNow: string;
  note: string;
  outcome: string;
  whatHappened: string;
  whatHelped: string;
};

type FlareEventContextValue = {
  activeEvent: FlareEvent | null;
  currentEvent: FlareEvent | null;
  flareEvents: FlareEvent[];
  createFlareEvent: (input: CreateFlareEventInput) => FlareEvent;
  saveCheckpointReflection: (input: SaveCheckpointReflectionInput) => void;
};

const FlareEventContext = createContext<FlareEventContextValue | undefined>(
  undefined,
);

let nextFlareEventId = 1;

function createFlareEventRecord(
  input: CreateFlareEventInput,
  createdAt: string = new Date().toISOString(),
): FlareEvent {
  const id = `flare-event-${nextFlareEventId}`;
  nextFlareEventId += 1;

  return {
    behaviorName: input.behaviorName?.trim() || null,
    behaviorSummary: input.behaviorSummary?.trim() || null,
    checkpoint: null,
    createdAt,
    id,
    status: "active",
  };
}

function createCheckpointReflectionRecord(
  input: SaveCheckpointReflectionInput,
  createdAt: string = new Date().toISOString(),
): CheckpointReflection {
  return {
    createdAt,
    howIFeelNow: input.howIFeelNow.trim(),
    note: input.note.trim(),
    outcome: input.outcome.trim(),
    whatHappened: input.whatHappened.trim(),
    whatHelped: input.whatHelped.trim(),
  };
}

export function formatFlareEventTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export function createEmptyCheckpointReflection() {
  return {
    howIFeelNow: "",
    note: "",
    outcome: "",
    whatHappened: "",
    whatHelped: "",
  };
}

export function FlareEventProvider({ children }: PropsWithChildren) {
  const [flareEvents, setFlareEvents] = useState<FlareEvent[]>([]);

  const value = useMemo<FlareEventContextValue>(() => {
    const currentEvent = flareEvents[0] ?? null;
    const activeEvent =
      flareEvents.find((flareEvent) => flareEvent.status === "active") ?? null;

    return {
      activeEvent,
      currentEvent,
      flareEvents,
      createFlareEvent: (input) => {
        const nextEvent = createFlareEventRecord(input);

        setFlareEvents((currentEvents) => [
          nextEvent,
          ...currentEvents.map((flareEvent) =>
            flareEvent.status === "active"
              ? { ...flareEvent, status: "closed" as const }
              : flareEvent,
          ),
        ]);

        return nextEvent;
      },
      saveCheckpointReflection: (input) => {
        setFlareEvents((currentEvents) => {
          const currentActiveEvent = currentEvents.find(
            (flareEvent) => flareEvent.status === "active",
          );

          if (!currentActiveEvent) {
            return currentEvents;
          }

          const checkpoint = createCheckpointReflectionRecord(input);

          return currentEvents.map((flareEvent) =>
            flareEvent.id === currentActiveEvent.id
              ? {
                  ...flareEvent,
                  checkpoint,
                  status: "reflected",
                }
              : flareEvent,
          );
        });
      },
    };
  }, [flareEvents]);

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
