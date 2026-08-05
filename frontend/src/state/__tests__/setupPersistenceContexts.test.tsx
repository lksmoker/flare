import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Pressable, Text, View } from "react-native";

import {
  type PersistedAnchorNote,
  type AnchorNoteRepository,
} from "../../services/anchorNoteRepository";
import {
  type PersistedBehaviorPattern,
  type BehaviorPatternRepository,
} from "../../services/behaviorPatternRepository";
import { FlareAuthProvider } from "../FlareAuthContext";
import { AnchorNoteProvider, useAnchorNote } from "../AnchorNoteContext";
import { BehaviorPatternProvider, useBehaviorPattern } from "../BehaviorPatternContext";

function BehaviorPatternHarness() {
  const { behaviorPattern, isConfigured, saveBehaviorPattern } =
    useBehaviorPattern();

  return (
    <View>
      <Text>{behaviorPattern?.behaviorName ?? "no behavior pattern"}</Text>
      <Text>{isConfigured ? "configured" : "not configured"}</Text>
      <Pressable
        onPress={() => {
          void saveBehaviorPattern({
            behaviorName: "Draft behavior",
            shortDescription: "Draft description",
            commonTriggers: "Draft trigger",
            riskTimesOrSituations: "Draft risk",
            preferredRecoveryActions: "Draft action",
          });
        }}
      >
        <Text>save behavior pattern</Text>
      </Pressable>
    </View>
  );
}

function AnchorNoteHarness() {
  const { anchorNote, isConfigured, saveAnchorNote } = useAnchorNote();

  return (
    <View>
      <Text>{anchorNote?.supportivePhrase ?? "no anchor note"}</Text>
      <Text>{isConfigured ? "configured" : "not configured"}</Text>
      <Pressable
        onPress={() => {
          void saveAnchorNote({
            interruptionReasons: "Draft reason",
            continuingCosts: "Draft cost",
            groundedReminders: "Draft reminder",
            emergencyActions: "Draft action",
            supportivePhrase: "Draft phrase",
          });
        }}
      >
        <Text>save anchor note</Text>
      </Pressable>
    </View>
  );
}

describe("setup persistence providers", () => {
  it("receives the hydrated auth user id through FlareAuthProvider", async () => {
    const behaviorPatternRepository: BehaviorPatternRepository = {
      loadActiveBehaviorPattern: jest.fn().mockResolvedValue(null),
      saveBehaviorPattern: jest.fn(),
    };

    render(
      <FlareAuthProvider
        resolveAuthState={async () => ({
          kind: "authenticated",
          userEmail: null,
          userId: "user-123",
        })}
        subscribe={() => null}
      >
        <BehaviorPatternProvider
          behaviorPatternRepository={behaviorPatternRepository}
        >
          <BehaviorPatternHarness />
        </BehaviorPatternProvider>
      </FlareAuthProvider>,
    );

    await waitFor(() => {
      expect(
        behaviorPatternRepository.loadActiveBehaviorPattern,
      ).toHaveBeenCalledWith("user-123");
    });
  });

  it("loads the active Behavior Pattern on mount for an authenticated user", async () => {
    const behaviorPatternRepository: BehaviorPatternRepository = {
      loadActiveBehaviorPattern: jest
        .fn<Promise<PersistedBehaviorPattern | null>, [string]>()
        .mockResolvedValue({
          behaviorPattern: {
            behaviorName: "Loaded behavior",
            shortDescription: "Loaded description",
            commonTriggers: "Loaded trigger",
            riskTimesOrSituations: "Loaded risk",
            preferredRecoveryActions: "Loaded action",
          },
          createdAt: "2026-06-28T01:00:00.000Z",
          id: "pattern-1",
          updatedAt: "2026-06-28T02:00:00.000Z",
          userId: "user-123",
        }),
      saveBehaviorPattern: jest.fn(),
    };

    const { getByText } = render(
      <BehaviorPatternProvider
        behaviorPatternRepository={behaviorPatternRepository}
        resolveAuthState={async () => ({
          kind: "authenticated",
          userEmail: null,
          userId: "user-123",
        })}
      >
        <BehaviorPatternHarness />
      </BehaviorPatternProvider>,
    );

    await waitFor(() => {
      expect(getByText("Loaded behavior")).toBeTruthy();
      expect(getByText("configured")).toBeTruthy();
    });

    expect(behaviorPatternRepository.loadActiveBehaviorPattern).toHaveBeenCalledWith(
      "user-123",
    );
  });

  it("keeps local-only Behavior Pattern behavior when no auth session exists", async () => {
    const behaviorPatternRepository: BehaviorPatternRepository = {
      loadActiveBehaviorPattern: jest.fn(),
      saveBehaviorPattern: jest.fn(),
    };

    const { getByText } = render(
      <BehaviorPatternProvider
        behaviorPatternRepository={behaviorPatternRepository}
        resolveAuthState={async () => ({ kind: "no-session" })}
      >
        <BehaviorPatternHarness />
      </BehaviorPatternProvider>,
    );

    fireEvent.press(getByText("save behavior pattern"));

    await waitFor(() => {
      expect(getByText("Draft behavior")).toBeTruthy();
      expect(getByText("configured")).toBeTruthy();
    });

    expect(behaviorPatternRepository.saveBehaviorPattern).not.toHaveBeenCalled();
  });

  it("updates Behavior Pattern state from the persisted row after a successful save", async () => {
    const behaviorPatternRepository: BehaviorPatternRepository = {
      loadActiveBehaviorPattern: jest.fn().mockResolvedValue(null),
      saveBehaviorPattern: jest.fn().mockResolvedValue({
        behaviorPattern: {
          behaviorName: "Persisted behavior",
          shortDescription: "Persisted description",
          commonTriggers: "Persisted trigger",
          riskTimesOrSituations: "Persisted risk",
          preferredRecoveryActions: "Persisted action",
        },
        createdAt: "2026-06-28T01:00:00.000Z",
        id: "pattern-1",
        updatedAt: "2026-06-28T02:00:00.000Z",
        userId: "user-123",
      }),
    };

    const { getByText, queryByText } = render(
      <BehaviorPatternProvider
        behaviorPatternRepository={behaviorPatternRepository}
        resolveAuthState={async () => ({
          kind: "authenticated",
          userEmail: null,
          userId: "user-123",
        })}
      >
        <BehaviorPatternHarness />
      </BehaviorPatternProvider>,
    );

    fireEvent.press(getByText("save behavior pattern"));

    await waitFor(() => {
      expect(getByText("Persisted behavior")).toBeTruthy();
    });

    expect(queryByText("Draft behavior")).toBeNull();
    expect(behaviorPatternRepository.saveBehaviorPattern).toHaveBeenCalledWith({
      behaviorPattern: {
        behaviorName: "Draft behavior",
        shortDescription: "Draft description",
        commonTriggers: "Draft trigger",
        riskTimesOrSituations: "Draft risk",
        preferredRecoveryActions: "Draft action",
      },
      currentRecordId: null,
      userId: "user-123",
    });
  });

  it("loads the active Anchor Note on mount for an authenticated user", async () => {
    const anchorNoteRepository: AnchorNoteRepository = {
      loadActiveAnchorNote: jest
        .fn<Promise<PersistedAnchorNote | null>, [string]>()
        .mockResolvedValue({
          anchorNote: {
            interruptionReasons: "Loaded reason",
            continuingCosts: "Loaded cost",
            groundedReminders: "Loaded reminder",
            emergencyActions: "Loaded action",
            supportivePhrase: "Loaded phrase",
          },
          createdAt: "2026-06-28T01:00:00.000Z",
          id: "anchor-1",
          updatedAt: "2026-06-28T02:00:00.000Z",
          userId: "user-123",
          version: 2,
        }),
      saveAnchorNote: jest.fn(),
    };

    const { getByText } = render(
      <AnchorNoteProvider
        anchorNoteRepository={anchorNoteRepository}
        resolveAuthState={async () => ({
          kind: "authenticated",
          userEmail: null,
          userId: "user-123",
        })}
      >
        <AnchorNoteHarness />
      </AnchorNoteProvider>,
    );

    await waitFor(() => {
      expect(getByText("Loaded phrase")).toBeTruthy();
      expect(getByText("configured")).toBeTruthy();
    });

    expect(anchorNoteRepository.loadActiveAnchorNote).toHaveBeenCalledWith(
      "user-123",
    );
  });

  it("keeps local-only Anchor Note behavior when no auth session exists", async () => {
    const anchorNoteRepository: AnchorNoteRepository = {
      loadActiveAnchorNote: jest.fn(),
      saveAnchorNote: jest.fn(),
    };

    const { getByText } = render(
      <AnchorNoteProvider
        anchorNoteRepository={anchorNoteRepository}
        resolveAuthState={async () => ({ kind: "no-session" })}
      >
        <AnchorNoteHarness />
      </AnchorNoteProvider>,
    );

    fireEvent.press(getByText("save anchor note"));

    await waitFor(() => {
      expect(getByText("Draft phrase")).toBeTruthy();
      expect(getByText("configured")).toBeTruthy();
    });

    expect(anchorNoteRepository.saveAnchorNote).not.toHaveBeenCalled();
  });

  it("updates Anchor Note state from the persisted row after a successful save", async () => {
    const anchorNoteRepository: AnchorNoteRepository = {
      loadActiveAnchorNote: jest.fn().mockResolvedValue(null),
      saveAnchorNote: jest.fn().mockResolvedValue({
        anchorNote: {
          interruptionReasons: "Persisted reason",
          continuingCosts: "Persisted cost",
          groundedReminders: "Persisted reminder",
          emergencyActions: "Persisted action",
          supportivePhrase: "Persisted phrase",
        },
        createdAt: "2026-06-28T01:00:00.000Z",
        id: "anchor-1",
        updatedAt: "2026-06-28T02:00:00.000Z",
        userId: "user-123",
        version: 2,
      }),
    };

    const { getByText, queryByText } = render(
      <AnchorNoteProvider
        anchorNoteRepository={anchorNoteRepository}
        resolveAuthState={async () => ({
          kind: "authenticated",
          userEmail: null,
          userId: "user-123",
        })}
      >
        <AnchorNoteHarness />
      </AnchorNoteProvider>,
    );

    fireEvent.press(getByText("save anchor note"));

    await waitFor(() => {
      expect(getByText("Persisted phrase")).toBeTruthy();
    });

    expect(queryByText("Draft phrase")).toBeNull();
    expect(anchorNoteRepository.saveAnchorNote).toHaveBeenCalledWith({
      anchorNote: {
        interruptionReasons: "Draft reason",
        continuingCosts: "Draft cost",
        groundedReminders: "Draft reminder",
        emergencyActions: "Draft action",
        supportivePhrase: "Draft phrase",
      },
      currentRecordId: null,
      currentVersion: null,
      userId: "user-123",
    });
  });

  it("clears the persisted Behavior Pattern when auth becomes unauthenticated", async () => {
    const behaviorPatternRepository: BehaviorPatternRepository = {
      loadActiveBehaviorPattern: jest.fn().mockResolvedValue({
        behaviorPattern: {
          behaviorName: "Loaded behavior",
          shortDescription: "Loaded description",
          commonTriggers: "Loaded trigger",
          riskTimesOrSituations: "Loaded risk",
          preferredRecoveryActions: "Loaded action",
        },
        createdAt: "2026-06-28T01:00:00.000Z",
        id: "pattern-1",
        updatedAt: "2026-06-28T02:00:00.000Z",
        userId: "user-123",
      }),
      saveBehaviorPattern: jest.fn(),
    };

    const { getByText, queryByText, rerender } = render(
      <BehaviorPatternProvider
        authState={{
          kind: "authenticated",
          userEmail: "flare@example.com",
          userId: "user-123",
        }}
        behaviorPatternRepository={behaviorPatternRepository}
      >
        <BehaviorPatternHarness />
      </BehaviorPatternProvider>,
    );

    await waitFor(() => {
      expect(getByText("Loaded behavior")).toBeTruthy();
    });

    rerender(
      <BehaviorPatternProvider
        authState={{ kind: "no-session" }}
        behaviorPatternRepository={behaviorPatternRepository}
      >
        <BehaviorPatternHarness />
      </BehaviorPatternProvider>,
    );

    await waitFor(() => {
      expect(getByText("no behavior pattern")).toBeTruthy();
      expect(queryByText("Loaded behavior")).toBeNull();
    });
  });

  it("reloads owner-scoped setup records when authentication switches to a different user", async () => {
    const behaviorPatternRepository: BehaviorPatternRepository = {
      loadActiveBehaviorPattern: jest
        .fn<Promise<PersistedBehaviorPattern | null>, [string]>()
        .mockImplementation(async (userId) =>
          userId === "user-123"
            ? {
                behaviorPattern: {
                  behaviorName: "Owner one behavior",
                  shortDescription: "Owner one description",
                  commonTriggers: "Owner one trigger",
                  riskTimesOrSituations: "Owner one risk",
                  preferredRecoveryActions: "Owner one action",
                },
                createdAt: "2026-06-28T01:00:00.000Z",
                id: "pattern-1",
                updatedAt: "2026-06-28T02:00:00.000Z",
                userId,
              }
            : {
                behaviorPattern: {
                  behaviorName: "Owner two behavior",
                  shortDescription: "Owner two description",
                  commonTriggers: "Owner two trigger",
                  riskTimesOrSituations: "Owner two risk",
                  preferredRecoveryActions: "Owner two action",
                },
                createdAt: "2026-06-29T01:00:00.000Z",
                id: "pattern-2",
                updatedAt: "2026-06-29T02:00:00.000Z",
                userId,
              },
        ),
      saveBehaviorPattern: jest.fn(),
    };
    const anchorNoteRepository: AnchorNoteRepository = {
      loadActiveAnchorNote: jest
        .fn<Promise<PersistedAnchorNote | null>, [string]>()
        .mockImplementation(async (userId) =>
          userId === "user-123"
            ? {
                anchorNote: {
                  interruptionReasons: "Owner one reason",
                  continuingCosts: "Owner one cost",
                  groundedReminders: "Owner one reminder",
                  emergencyActions: "Owner one action",
                  supportivePhrase: "Owner one phrase",
                },
                createdAt: "2026-06-28T01:00:00.000Z",
                id: "anchor-1",
                updatedAt: "2026-06-28T02:00:00.000Z",
                userId,
                version: 1,
              }
            : {
                anchorNote: {
                  interruptionReasons: "Owner two reason",
                  continuingCosts: "Owner two cost",
                  groundedReminders: "Owner two reminder",
                  emergencyActions: "Owner two action",
                  supportivePhrase: "Owner two phrase",
                },
                createdAt: "2026-06-29T01:00:00.000Z",
                id: "anchor-2",
                updatedAt: "2026-06-29T02:00:00.000Z",
                userId,
                version: 2,
              },
        ),
      saveAnchorNote: jest.fn(),
    };

    const { getByText, queryByText, rerender } = render(
      <BehaviorPatternProvider
        authState={{
          kind: "authenticated",
          userEmail: "owner-one@example.com",
          userId: "user-123",
        }}
        behaviorPatternRepository={behaviorPatternRepository}
      >
        <AnchorNoteProvider
          anchorNoteRepository={anchorNoteRepository}
          authState={{
            kind: "authenticated",
            userEmail: "owner-one@example.com",
            userId: "user-123",
          }}
        >
          <BehaviorPatternHarness />
          <AnchorNoteHarness />
        </AnchorNoteProvider>
      </BehaviorPatternProvider>,
    );

    await waitFor(() => {
      expect(getByText("Owner one behavior")).toBeTruthy();
      expect(getByText("Owner one phrase")).toBeTruthy();
    });

    rerender(
      <BehaviorPatternProvider
        authState={{
          kind: "authenticated",
          userEmail: "owner-two@example.com",
          userId: "user-456",
        }}
        behaviorPatternRepository={behaviorPatternRepository}
      >
        <AnchorNoteProvider
          anchorNoteRepository={anchorNoteRepository}
          authState={{
            kind: "authenticated",
            userEmail: "owner-two@example.com",
            userId: "user-456",
          }}
        >
          <BehaviorPatternHarness />
          <AnchorNoteHarness />
        </AnchorNoteProvider>
      </BehaviorPatternProvider>,
    );

    await waitFor(() => {
      expect(getByText("Owner two behavior")).toBeTruthy();
      expect(getByText("Owner two phrase")).toBeTruthy();
      expect(queryByText("Owner one behavior")).toBeNull();
      expect(queryByText("Owner one phrase")).toBeNull();
    });

    expect(behaviorPatternRepository.loadActiveBehaviorPattern).toHaveBeenNthCalledWith(
      1,
      "user-123",
    );
    expect(behaviorPatternRepository.loadActiveBehaviorPattern).toHaveBeenNthCalledWith(
      2,
      "user-456",
    );
    expect(anchorNoteRepository.loadActiveAnchorNote).toHaveBeenNthCalledWith(
      1,
      "user-123",
    );
    expect(anchorNoteRepository.loadActiveAnchorNote).toHaveBeenNthCalledWith(
      2,
      "user-456",
    );
  });
});
