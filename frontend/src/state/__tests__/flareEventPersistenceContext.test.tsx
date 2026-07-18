import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Pressable, Text, View } from "react-native";

import {
  type PersistedAnchorNote,
  type AnchorNoteRepository,
} from "../../services/anchorNoteRepository";
import {
  type BehaviorPatternRepository,
  type PersistedBehaviorPattern,
} from "../../services/behaviorPatternRepository";
import {
  type CheckpointReflectionRepository,
} from "../../services/checkpointReflectionRepository";
import {
  type FlareEventRepository,
} from "../../services/flareEventRepository";
import { AnchorNoteProvider } from "../AnchorNoteContext";
import { BehaviorPatternProvider } from "../BehaviorPatternContext";
import {
  FlareEventProvider,
  useFlareEvents,
} from "../FlareEventContext";
import type { FlareSupabaseAuthState } from "../../services/flareSupabaseAuth";

function FlareEventHarness() {
  const {
    activeEvent,
    archiveFlareEvent,
    createFlareEvent,
    flareEvents,
    restoreFlareEvent,
    saveCheckpointReflection,
    upsertPersistedFlareEvent,
  } = useFlareEvents();

  return (
    <View>
      <Text>event count: {flareEvents.length}</Text>
      <Text>active event: {activeEvent?.id ?? "none"}</Text>
      <Text>event statuses: {flareEvents.map((event) => event.status).join(",")}</Text>
      <Text>
        event labels:{" "}
        {flareEvents
          .map((event) => event.behaviorLabelSnapshot ?? "none")
          .join(",")}
      </Text>
      <Text>
        event checkpoints:{" "}
        {flareEvents
          .map((event) => event.checkpoint?.whatHappened ?? "none")
          .join(",")}
      </Text>
      <Text>
        event archived:{" "}
        {flareEvents
          .map((event) => (event.archivedAt ? "archived" : "active"))
          .join(",")}
      </Text>
      <Pressable
        onPress={() => {
          createFlareEvent({});
        }}
      >
        <Text>send flare</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          upsertPersistedFlareEvent({
            createdAt: "2026-07-02T02:00:00.000Z",
            flareEvent: {
              anchorNoteId: "anchor-1",
              anchorNoteVersion: 4,
              archivedAt: null,
              behaviorDescriptionSnapshot:
                "I start checking feeds when I feel depleted.",
              behaviorLabelSnapshot: "Late-night scrolling",
              behaviorPatternId: "pattern-1",
              checkpoint: null,
              closedAt: null,
              createdAt: "2026-07-02T02:00:00.000Z",
              id: "event-1",
              responseMode: "configured",
              status: "active",
              supportActionShown: "Leave the room and drink water.",
              supportActionTaken: null,
              updatedAt: "2026-07-02T02:00:00.000Z",
              userId: "user-123",
            },
            id: "event-1",
            updatedAt: "2026-07-02T02:00:00.000Z",
            userId: "user-123",
          });
        }}
      >
        <Text>hydrate persisted event</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          saveCheckpointReflection({
            howIFeelNow: "Less flooded and more steady.",
            note: "The first minute was the hardest part.",
            outcome: "avoided",
            whatHappened: "I felt the spike right after finishing work.",
            whatHelped: "I left the room and drank cold water.",
          });
        }}
      >
        <Text>save reflection</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          const firstEvent = flareEvents[0];

          if (firstEvent) {
            archiveFlareEvent(firstEvent.id);
          }
        }}
      >
        <Text>archive event</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          const archivedEvent = flareEvents.find((event) => event.archivedAt);

          if (archivedEvent) {
            restoreFlareEvent(archivedEvent.id);
          }
        }}
      >
        <Text>restore event</Text>
      </Pressable>
    </View>
  );
}

function renderWithProviders({
  anchorNoteRecord,
  anchorNoteRepository,
  authState,
  behaviorPatternRecord,
  behaviorPatternRepository,
  checkpointReflectionRepository,
  flareEventRepository,
}: {
  anchorNoteRecord?: PersistedAnchorNote | null;
  anchorNoteRepository?: AnchorNoteRepository;
  authState: FlareSupabaseAuthState;
  behaviorPatternRecord?: PersistedBehaviorPattern | null;
  behaviorPatternRepository?: BehaviorPatternRepository;
  checkpointReflectionRepository?: CheckpointReflectionRepository;
  flareEventRepository?: FlareEventRepository;
}) {
  const effectiveBehaviorPatternRepository: BehaviorPatternRepository =
    behaviorPatternRepository ?? {
      loadActiveBehaviorPattern: jest
        .fn()
        .mockResolvedValue(behaviorPatternRecord ?? null),
      saveBehaviorPattern: jest.fn(),
    };
  const effectiveAnchorNoteRepository: AnchorNoteRepository =
    anchorNoteRepository ?? {
      loadActiveAnchorNote: jest.fn().mockResolvedValue(anchorNoteRecord ?? null),
      saveAnchorNote: jest.fn(),
    };

  return render(
    <BehaviorPatternProvider
      authState={authState}
      behaviorPatternRepository={effectiveBehaviorPatternRepository}
    >
      <AnchorNoteProvider
        anchorNoteRepository={effectiveAnchorNoteRepository}
        authState={authState}
      >
        <FlareEventProvider
          authState={authState}
          checkpointReflectionRepository={checkpointReflectionRepository}
          flareEventRepository={flareEventRepository}
        >
          <FlareEventHarness />
        </FlareEventProvider>
      </AnchorNoteProvider>
    </BehaviorPatternProvider>,
  );
}

const behaviorPatternRecord: PersistedBehaviorPattern = {
  behaviorPattern: {
    behaviorName: "Late-night scrolling",
    shortDescription: "I start checking feeds when I feel depleted.",
    commonTriggers: "Stress after work",
    riskTimesOrSituations: "Late nights",
    preferredRecoveryActions: "Leave the room and put the phone away",
  },
  createdAt: "2026-07-02T01:00:00.000Z",
  id: "pattern-1",
  updatedAt: "2026-07-02T01:05:00.000Z",
  userId: "user-123",
};

const anchorNoteRecord: PersistedAnchorNote = {
  anchorNote: {
    interruptionReasons: "I want tomorrow morning back.",
    continuingCosts: "I will be numb tomorrow.",
    groundedReminders: "You do not need to obey this feeling.",
    emergencyActions: "Leave the room and drink water.",
    supportivePhrase: "Pause now. Protect tomorrow.",
  },
  createdAt: "2026-07-02T01:00:00.000Z",
  id: "anchor-1",
  updatedAt: "2026-07-02T01:06:00.000Z",
  userId: "user-123",
  version: 4,
};

describe("FlareEventProvider persistence", () => {
  it("keeps createFlareEvent local-only even when a session exists", async () => {
    const flareEventRepository: FlareEventRepository = {
      archiveFlareEvent: jest.fn(),
      createFlareEvent: jest.fn(),
      loadFlareEvents: jest.fn().mockResolvedValue([]),
      restoreFlareEvent: jest.fn(),
      updateFlareEventStatus: jest.fn(),
    };

    const { getByText } = renderWithProviders({
      anchorNoteRecord,
      authState: {
        kind: "authenticated",
        userEmail: "flare@example.com",
        userId: "user-123",
      },
      behaviorPatternRecord,
      flareEventRepository,
    });

    await waitFor(() => {
      expect(getByText("event count: 0")).toBeTruthy();
    });

    fireEvent.press(getByText("send flare"));

    await waitFor(() => {
      expect(getByText("event count: 1")).toBeTruthy();
      expect(getByText("event labels: Late-night scrolling")).toBeTruthy();
    });

    expect(flareEventRepository.createFlareEvent).not.toHaveBeenCalled();
  });

  it("keeps send flare local-only and skips repository writes when there is no session", async () => {
    const flareEventRepository: FlareEventRepository = {
      archiveFlareEvent: jest.fn(),
      createFlareEvent: jest.fn(),
      loadFlareEvents: jest.fn(),
      restoreFlareEvent: jest.fn(),
      updateFlareEventStatus: jest.fn(),
    };

    const { getByText } = renderWithProviders({
      authState: { kind: "no-session" },
      flareEventRepository,
    });

    fireEvent.press(getByText("send flare"));

    await waitFor(() => {
      expect(getByText("event count: 1")).toBeTruthy();
    });

    expect(flareEventRepository.createFlareEvent).not.toHaveBeenCalled();
    expect(flareEventRepository.loadFlareEvents).not.toHaveBeenCalled();
  });

  it("persists a checkpoint reflection against the durable event and marks the event reflected", async () => {
    const updateFlareEventStatus = jest.fn().mockResolvedValue({
      createdAt: "2026-07-02T02:00:00.000Z",
      flareEvent: {
        anchorNoteId: "anchor-1",
        anchorNoteVersion: 4,
        archivedAt: null,
        behaviorDescriptionSnapshot:
          "I start checking feeds when I feel depleted.",
        behaviorLabelSnapshot: "Late-night scrolling",
        behaviorPatternId: "pattern-1",
        checkpoint: null,
        closedAt: null,
        createdAt: "2026-07-02T02:00:00.000Z",
        id: "event-1",
        responseMode: "configured",
        status: "reflected",
        supportActionShown: "Leave the room and drink water.",
        supportActionTaken: null,
        updatedAt: "2026-07-02T02:05:00.000Z",
        userId: "user-123",
      },
      id: "event-1",
      updatedAt: "2026-07-02T02:05:00.000Z",
      userId: "user-123",
    });
    const saveCheckpointReflection = jest.fn().mockResolvedValue({
      checkpointReflection: {
        actionTaken: "",
        createdAt: "2026-07-02T02:04:00.000Z",
        howIFeelNow: "Less flooded and more steady.",
        id: "reflection-1",
        note: "The first minute was the hardest part.",
        outcome: "avoided",
        updatedAt: "2026-07-02T02:04:00.000Z",
        userId: "user-123",
        whatHappened: "I felt the spike right after finishing work.",
        whatHelped: "I left the room and drank cold water.",
      },
      flareEventId: "event-1",
      id: "reflection-1",
      updatedAt: "2026-07-02T02:04:00.000Z",
      userId: "user-123",
    });
    const flareEventRepository: FlareEventRepository = {
      archiveFlareEvent: jest.fn(),
      createFlareEvent: jest.fn(),
      loadFlareEvents: jest.fn().mockResolvedValue([]),
      restoreFlareEvent: jest.fn(),
      updateFlareEventStatus,
    };
    const checkpointReflectionRepository: CheckpointReflectionRepository = {
      saveCheckpointReflection,
    };

    const { getByText } = renderWithProviders({
      anchorNoteRecord,
      authState: {
        kind: "authenticated",
        userEmail: "flare@example.com",
        userId: "user-123",
      },
      behaviorPatternRecord,
      checkpointReflectionRepository,
      flareEventRepository,
    });

    await waitFor(() => {
      expect(getByText("event count: 0")).toBeTruthy();
    });

    fireEvent.press(getByText("hydrate persisted event"));

    await waitFor(() => {
      expect(getByText("event count: 1")).toBeTruthy();
      expect(getByText("event statuses: active")).toBeTruthy();
    });

    fireEvent.press(getByText("save reflection"));

    await waitFor(() => {
      expect(saveCheckpointReflection).toHaveBeenCalledWith({
        checkpointReflection: {
          howIFeelNow: "Less flooded and more steady.",
          note: "The first minute was the hardest part.",
          outcome: "avoided",
          whatHappened: "I felt the spike right after finishing work.",
          whatHelped: "I left the room and drank cold water.",
        },
        flareEventId: "event-1",
        userId: "user-123",
      });
      expect(updateFlareEventStatus).toHaveBeenCalledWith({
        eventId: "event-1",
        status: "reflected",
        userId: "user-123",
      });
      expect(getByText("event statuses: reflected")).toBeTruthy();
      expect(
        getByText(
          "event checkpoints: I felt the spike right after finishing work.",
        ),
      ).toBeTruthy();
    });
  });

  it("loads persisted authenticated history with related reflections", async () => {
    const flareEventRepository: FlareEventRepository = {
      archiveFlareEvent: jest.fn(),
      createFlareEvent: jest.fn(),
      loadFlareEvents: jest.fn().mockResolvedValue([
        {
          createdAt: "2026-07-02T02:00:00.000Z",
          flareEvent: {
            anchorNoteId: "anchor-1",
            anchorNoteVersion: 4,
            archivedAt: null,
            behaviorDescriptionSnapshot:
              "I start checking feeds when I feel depleted.",
            behaviorLabelSnapshot: "Late-night scrolling",
            behaviorPatternId: "pattern-1",
            checkpoint: {
              actionTaken: "",
              createdAt: "2026-07-02T02:04:00.000Z",
              howIFeelNow: "Less flooded and more steady.",
              id: "reflection-1",
              note: "",
              outcome: "avoided",
              updatedAt: "2026-07-02T02:04:00.000Z",
              userId: "user-123",
              whatHappened: "I felt the spike right after finishing work.",
              whatHelped: "I left the room and drank cold water.",
            },
            closedAt: null,
            createdAt: "2026-07-02T02:00:00.000Z",
            id: "event-1",
            responseMode: "configured",
            status: "reflected",
            supportActionShown: "Leave the room and drink water.",
            supportActionTaken: null,
            updatedAt: "2026-07-02T02:05:00.000Z",
            userId: "user-123",
          },
          id: "event-1",
          updatedAt: "2026-07-02T02:05:00.000Z",
          userId: "user-123",
        },
      ]),
      restoreFlareEvent: jest.fn(),
      updateFlareEventStatus: jest.fn(),
    };

    const { getByText } = renderWithProviders({
      authState: {
        kind: "authenticated",
        userEmail: "flare@example.com",
        userId: "user-123",
      },
      flareEventRepository,
    });

    await waitFor(() => {
      expect(getByText("event count: 1")).toBeTruthy();
      expect(getByText("event statuses: reflected")).toBeTruthy();
      expect(getByText("event labels: Late-night scrolling")).toBeTruthy();
      expect(
        getByText(
          "event checkpoints: I felt the spike right after finishing work.",
        ),
      ).toBeTruthy();
    });
  });

  it("clears authenticated persisted history when auth changes to signed out", async () => {
    const flareEventRepository: FlareEventRepository = {
      archiveFlareEvent: jest.fn(),
      createFlareEvent: jest.fn(),
      loadFlareEvents: jest.fn().mockResolvedValue([
        {
          createdAt: "2026-07-02T02:00:00.000Z",
          flareEvent: {
            anchorNoteId: null,
            anchorNoteVersion: null,
            archivedAt: null,
            behaviorDescriptionSnapshot: null,
            behaviorLabelSnapshot: "Late-night scrolling",
            behaviorPatternId: null,
            checkpoint: null,
            closedAt: null,
            createdAt: "2026-07-02T02:00:00.000Z",
            id: "event-1",
            responseMode: "fallback-generic",
            status: "active",
            supportActionShown: null,
            supportActionTaken: null,
            updatedAt: "2026-07-02T02:00:00.000Z",
            userId: "user-123",
          },
          id: "event-1",
          updatedAt: "2026-07-02T02:00:00.000Z",
          userId: "user-123",
        },
      ]),
      restoreFlareEvent: jest.fn(),
      updateFlareEventStatus: jest.fn(),
    };

    const { getByText, rerender } = renderWithProviders({
      authState: {
        kind: "authenticated",
        userEmail: "flare@example.com",
        userId: "user-123",
      },
      flareEventRepository,
    });

    await waitFor(() => {
      expect(getByText("event count: 1")).toBeTruthy();
    });

    rerender(
      <BehaviorPatternProvider authState={{ kind: "no-session" }}>
        <AnchorNoteProvider authState={{ kind: "no-session" }}>
          <FlareEventProvider
            authState={{ kind: "no-session" }}
            flareEventRepository={flareEventRepository}
          >
            <FlareEventHarness />
          </FlareEventProvider>
        </AnchorNoteProvider>
      </BehaviorPatternProvider>,
    );

    await waitFor(() => {
      expect(getByText("event count: 0")).toBeTruthy();
    });
  });

  it("supports local-only archive and restore without Supabase writes", async () => {
    const flareEventRepository: FlareEventRepository = {
      archiveFlareEvent: jest.fn(),
      createFlareEvent: jest.fn(),
      loadFlareEvents: jest.fn(),
      restoreFlareEvent: jest.fn(),
      updateFlareEventStatus: jest.fn(),
    };

    const { getByText } = renderWithProviders({
      authState: { kind: "no-session" },
      flareEventRepository,
    });

    fireEvent.press(getByText("send flare"));

    await waitFor(() => {
      expect(getByText("event archived: active")).toBeTruthy();
    });

    fireEvent.press(getByText("archive event"));

    await waitFor(() => {
      expect(getByText("event archived: archived")).toBeTruthy();
      expect(getByText("active event: none")).toBeTruthy();
    });

    fireEvent.press(getByText("restore event"));

    await waitFor(() => {
      expect(getByText("event archived: active")).toBeTruthy();
      expect(flareEventRepository.archiveFlareEvent).not.toHaveBeenCalled();
      expect(flareEventRepository.restoreFlareEvent).not.toHaveBeenCalled();
    });
  });
});
