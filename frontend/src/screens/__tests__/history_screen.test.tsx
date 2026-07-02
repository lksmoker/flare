import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { PropsWithChildren } from "react";

import type { AnchorNoteRepository } from "../../services/anchorNoteRepository";
import type { BehaviorPatternRepository } from "../../services/behaviorPatternRepository";
import type { FlareEventRepository } from "../../services/flareEventRepository";
import { AnchorNoteProvider } from "../../state/AnchorNoteContext";
import { BehaviorPatternProvider } from "../../state/BehaviorPatternContext";
import { FlareAuthProvider } from "../../state/FlareAuthContext";
import { FlareEventProvider } from "../../state/FlareEventContext";
import { HistoryScreen } from "../HistoryScreen";

function createHistoryRepositoryStub(
  overrides?: Partial<FlareEventRepository>,
): FlareEventRepository {
  return {
    archiveFlareEvent: jest.fn(),
    createFlareEvent: jest.fn(),
    loadFlareEvents: jest.fn().mockResolvedValue([]),
    restoreFlareEvent: jest.fn(),
    updateFlareEventStatus: jest.fn(),
    ...overrides,
  };
}

const behaviorPatternRepository: BehaviorPatternRepository = {
  loadActiveBehaviorPattern: jest.fn().mockResolvedValue(null),
  saveBehaviorPattern: jest.fn(),
};

const anchorNoteRepository: AnchorNoteRepository = {
  loadActiveAnchorNote: jest.fn().mockResolvedValue(null),
  saveAnchorNote: jest.fn(),
};

function AuthenticatedHistoryProviders({
  children,
  flareEventRepository,
}: PropsWithChildren<{
  flareEventRepository: FlareEventRepository;
}>) {
  return (
    <FlareAuthProvider
      initialAuthState={{
        kind: "authenticated",
        userEmail: "flare@example.com",
        userId: "user-123",
      }}
      resolveAuthState={async () => ({
        kind: "authenticated",
        userEmail: "flare@example.com",
        userId: "user-123",
      })}
      subscribe={() => null}
    >
      <BehaviorPatternProvider behaviorPatternRepository={behaviorPatternRepository}>
        <AnchorNoteProvider anchorNoteRepository={anchorNoteRepository}>
          <FlareEventProvider flareEventRepository={flareEventRepository}>
            {children}
          </FlareEventProvider>
        </AnchorNoteProvider>
      </BehaviorPatternProvider>
    </FlareAuthProvider>
  );
}

describe("HistoryScreen", () => {
  it("excludes archived events from the default History view and shows them in the archived filter", async () => {
    const flareEventRepository = createHistoryRepositoryStub({
      loadFlareEvents: jest.fn().mockResolvedValue([
        {
          createdAt: "2026-07-02T02:00:00.000Z",
          flareEvent: {
            anchorNoteId: null,
            anchorNoteVersion: null,
            archivedAt: null,
            behaviorDescriptionSnapshot:
              "I opened the app before the spiral took over.",
            behaviorLabelSnapshot: "Late-night scrolling",
            behaviorPatternId: null,
            checkpoint: null,
            closedAt: null,
            createdAt: "2026-07-02T02:00:00.000Z",
            id: "event-active",
            responseMode: "configured",
            status: "active",
            supportActionShown: "Leave the room.",
            supportActionTaken: null,
            updatedAt: "2026-07-02T02:00:00.000Z",
            userId: "user-123",
          },
          id: "event-active",
          updatedAt: "2026-07-02T02:00:00.000Z",
          userId: "user-123",
        },
        {
          createdAt: "2026-07-01T22:00:00.000Z",
          flareEvent: {
            anchorNoteId: null,
            anchorNoteVersion: null,
            archivedAt: "2026-07-02T03:00:00.000Z",
            behaviorDescriptionSnapshot: "Archived description",
            behaviorLabelSnapshot: "Archived flare",
            behaviorPatternId: null,
            checkpoint: null,
            closedAt: null,
            createdAt: "2026-07-01T22:00:00.000Z",
            id: "event-archived",
            responseMode: "configured",
            status: "closed",
            supportActionShown: null,
            supportActionTaken: null,
            updatedAt: "2026-07-02T03:00:00.000Z",
            userId: "user-123",
          },
          id: "event-archived",
          updatedAt: "2026-07-02T03:00:00.000Z",
          userId: "user-123",
        },
      ]),
    });

    const { getByText, queryByText } = render(<HistoryScreen />, {
      wrapper({ children }) {
        return (
          <AuthenticatedHistoryProviders flareEventRepository={flareEventRepository}>
            {children}
          </AuthenticatedHistoryProviders>
        );
      },
    });

    await waitFor(() => {
      expect(getByText(/Behavior Pattern: Late-night scrolling/)).toBeTruthy();
    });

    expect(queryByText(/Behavior Pattern: Archived flare/)).toBeNull();

    fireEvent.press(getByText("Archived"));

    await waitFor(() => {
      expect(getByText(/Behavior Pattern: Archived flare/)).toBeTruthy();
    });
  });

  it("searches History by behavior snapshot and reflection content", async () => {
    const flareEventRepository = createHistoryRepositoryStub({
      loadFlareEvents: jest.fn().mockResolvedValue([
        {
          createdAt: "2026-07-02T02:00:00.000Z",
          flareEvent: {
            anchorNoteId: null,
            anchorNoteVersion: null,
            archivedAt: null,
            behaviorDescriptionSnapshot:
              "I start checking feeds when I feel depleted.",
            behaviorLabelSnapshot: "Late-night scrolling",
            behaviorPatternId: null,
            checkpoint: {
              actionTaken: "",
              createdAt: "2026-07-02T02:10:00.000Z",
              howIFeelNow: "Steadier now.",
              id: "reflection-1",
              note: "Cold water helped me reset.",
              outcome: "avoided",
              updatedAt: "2026-07-02T02:10:00.000Z",
              userId: "user-123",
              whatHappened: "A spike hit after work.",
              whatHelped: "Cold water and stepping outside.",
            },
            closedAt: null,
            createdAt: "2026-07-02T02:00:00.000Z",
            id: "event-1",
            responseMode: "configured",
            status: "reflected",
            supportActionShown: null,
            supportActionTaken: null,
            updatedAt: "2026-07-02T02:10:00.000Z",
            userId: "user-123",
          },
          id: "event-1",
          updatedAt: "2026-07-02T02:10:00.000Z",
          userId: "user-123",
        },
      ]),
    });

    const { getByLabelText, getByText, queryByText } = render(<HistoryScreen />, {
      wrapper({ children }) {
        return (
          <AuthenticatedHistoryProviders flareEventRepository={flareEventRepository}>
            {children}
          </AuthenticatedHistoryProviders>
        );
      },
    });

    await waitFor(() => {
      expect(getByText(/Behavior Pattern: Late-night scrolling/)).toBeTruthy();
    });

    fireEvent.changeText(
      getByLabelText("Search Flare Event history"),
      "cold water",
    );
    expect(getByText(/Behavior Pattern: Late-night scrolling/)).toBeTruthy();

    fireEvent.changeText(
      getByLabelText("Search Flare Event history"),
      "not present",
    );
    expect(queryByText(/Behavior Pattern: Late-night scrolling/)).toBeNull();

    fireEvent.changeText(
      getByLabelText("Search Flare Event history"),
      "depleted",
    );
    expect(getByText(/Behavior Pattern: Late-night scrolling/)).toBeTruthy();
  });

  it("shows persisted event details and supports archive then restore from History", async () => {
    const archiveFlareEvent = jest.fn().mockResolvedValue({
      createdAt: "2026-07-02T02:00:00.000Z",
      flareEvent: {
        anchorNoteId: null,
        anchorNoteVersion: null,
        archivedAt: "2026-07-02T04:00:00.000Z",
        behaviorDescriptionSnapshot: "I start checking feeds when I feel depleted.",
        behaviorLabelSnapshot: "Late-night scrolling",
        behaviorPatternId: null,
        checkpoint: {
          actionTaken: "Walked outside",
          createdAt: "2026-07-02T02:10:00.000Z",
          howIFeelNow: "Steadier now.",
          id: "reflection-1",
          note: "Cold water helped me reset.",
          outcome: "avoided",
          updatedAt: "2026-07-02T02:10:00.000Z",
          userId: "user-123",
          whatHappened: "A spike hit after work.",
          whatHelped: "Cold water and stepping outside.",
        },
        closedAt: null,
        createdAt: "2026-07-02T02:00:00.000Z",
        id: "event-1",
        responseMode: "configured",
        status: "reflected",
        supportActionShown: "Leave the room.",
        supportActionTaken: "Walked outside",
        updatedAt: "2026-07-02T04:00:00.000Z",
        userId: "user-123",
      },
      id: "event-1",
      updatedAt: "2026-07-02T04:00:00.000Z",
      userId: "user-123",
    });
    const restoreFlareEvent = jest.fn().mockResolvedValue({
      createdAt: "2026-07-02T02:00:00.000Z",
      flareEvent: {
        anchorNoteId: null,
        anchorNoteVersion: null,
        archivedAt: null,
        behaviorDescriptionSnapshot: "I start checking feeds when I feel depleted.",
        behaviorLabelSnapshot: "Late-night scrolling",
        behaviorPatternId: null,
        checkpoint: {
          actionTaken: "Walked outside",
          createdAt: "2026-07-02T02:10:00.000Z",
          howIFeelNow: "Steadier now.",
          id: "reflection-1",
          note: "Cold water helped me reset.",
          outcome: "avoided",
          updatedAt: "2026-07-02T02:10:00.000Z",
          userId: "user-123",
          whatHappened: "A spike hit after work.",
          whatHelped: "Cold water and stepping outside.",
        },
        closedAt: null,
        createdAt: "2026-07-02T02:00:00.000Z",
        id: "event-1",
        responseMode: "configured",
        status: "reflected",
        supportActionShown: "Leave the room.",
        supportActionTaken: "Walked outside",
        updatedAt: "2026-07-02T04:30:00.000Z",
        userId: "user-123",
      },
      id: "event-1",
      updatedAt: "2026-07-02T04:30:00.000Z",
      userId: "user-123",
    });
    const flareEventRepository = createHistoryRepositoryStub({
      archiveFlareEvent,
      loadFlareEvents: jest.fn().mockResolvedValue([
        {
          createdAt: "2026-07-02T02:00:00.000Z",
          flareEvent: {
            anchorNoteId: null,
            anchorNoteVersion: null,
            archivedAt: null,
            behaviorDescriptionSnapshot:
              "I start checking feeds when I feel depleted.",
            behaviorLabelSnapshot: "Late-night scrolling",
            behaviorPatternId: null,
            checkpoint: {
              actionTaken: "Walked outside",
              createdAt: "2026-07-02T02:10:00.000Z",
              howIFeelNow: "Steadier now.",
              id: "reflection-1",
              note: "Cold water helped me reset.",
              outcome: "avoided",
              updatedAt: "2026-07-02T02:10:00.000Z",
              userId: "user-123",
              whatHappened: "A spike hit after work.",
              whatHelped: "Cold water and stepping outside.",
            },
            closedAt: null,
            createdAt: "2026-07-02T02:00:00.000Z",
            id: "event-1",
            responseMode: "configured",
            status: "reflected",
            supportActionShown: "Leave the room.",
            supportActionTaken: "Walked outside",
            updatedAt: "2026-07-02T02:10:00.000Z",
            userId: "user-123",
          },
          id: "event-1",
          updatedAt: "2026-07-02T02:10:00.000Z",
          userId: "user-123",
        },
      ]),
      restoreFlareEvent,
    });

    const { getByText, queryByText } = render(<HistoryScreen />, {
      wrapper({ children }) {
        return (
          <AuthenticatedHistoryProviders flareEventRepository={flareEventRepository}>
            {children}
          </AuthenticatedHistoryProviders>
        );
      },
    });

    await waitFor(() => {
      expect(getByText(/Behavior Pattern: Late-night scrolling/)).toBeTruthy();
    });

    fireEvent.press(getByText(/Behavior Pattern: Late-night scrolling/));

    await waitFor(() => {
      expect(getByText("Flare Event details")).toBeTruthy();
      expect(getByText("What happened")).toBeTruthy();
      expect(getByText("A spike hit after work.")).toBeTruthy();
      expect(getByText("Archive event")).toBeTruthy();
    });

    fireEvent.press(getByText("Archive event"));

    await waitFor(() => {
      expect(queryByText(/Behavior Pattern: Late-night scrolling/)).toBeNull();
      expect(archiveFlareEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: "event-1",
          userId: "user-123",
        }),
      );
    });

    fireEvent.press(getByText("Archived"));

    await waitFor(() => {
      expect(getByText(/Behavior Pattern: Late-night scrolling/)).toBeTruthy();
    });

    fireEvent.press(getByText(/Behavior Pattern: Late-night scrolling/));

    await waitFor(() => {
      expect(getByText("Restore event")).toBeTruthy();
    });

    fireEvent.press(getByText("Restore event"));

    await waitFor(() => {
      expect(restoreFlareEvent).toHaveBeenCalledWith({
        eventId: "event-1",
        userId: "user-123",
      });
    });

    fireEvent.press(getByText("All"));

    await waitFor(() => {
      expect(getByText(/Behavior Pattern: Late-night scrolling/)).toBeTruthy();
    });
  });
});
