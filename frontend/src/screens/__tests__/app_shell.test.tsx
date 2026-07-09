import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { PropsWithChildren, ReactNode } from "react";
import { act } from "@testing-library/react-native";

import { CustomizeScreen } from "../CustomizeScreen";
import { FlareScreen } from "../FlareScreen";
import { HistoryScreen } from "../HistoryScreen";
import { DEFAULT_SUPPORT_CHANNEL_MESSAGE } from "../../services/supportChannelApi";
import { AnchorNoteProvider } from "../../state/AnchorNoteContext";
import { BehaviorPatternProvider } from "../../state/BehaviorPatternContext";
import { FlareAuthProvider } from "../../state/FlareAuthContext";
import { FlareEventProvider } from "../../state/FlareEventContext";
import * as flareResponseApi from "../../services/flareResponseApi";
import * as supportChannelApi from "../../services/supportChannelApi";

jest.mock("../../state/FlarePlanContext", () => ({
  FlarePlanProvider: ({ children }: { children: ReactNode }) => children,
  useFlarePlan: () => ({
    archiveAction: jest.fn(),
    createCustomAction: jest.fn(),
    createFromTemplate: jest.fn(),
    ensureTemplatesLoaded: jest.fn(),
    errorBanner: null,
    isActionPending: () => false,
    isAtActionLimit: false,
    isInitialLoading: false,
    isPlanConfigured: false,
    isReorderPending: false,
    isRefreshing: false,
    isTemplatePending: () => false,
    plan: {
      id: "plan-1",
      is_configured: false,
      active_action_count: 0,
      maximum_active_actions: 10,
      actions: [],
      updated_at: "2026-07-08T00:00:00.000Z",
    },
    planError: null,
    refetchAll: jest.fn(),
    retryPlan: jest.fn(),
    retryTemplates: jest.fn(),
    saveAction: jest.fn(),
    templates: [],
    templatesError: null,
    updateLocalPlan: jest.fn(),
    reorderActions: jest.fn(),
  }),
}));

jest.mock("expo-router", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  const focusEffects = new Set<() => void | (() => void)>();
  const focusCleanups = new Map<
    () => void | (() => void),
    void | (() => void)
  >();

  return {
    Link: ({ children }: { children: ReactNode }) => children,
    useFocusEffect(effect: () => void | (() => void)) {
      React.useEffect(() => {
        focusEffects.add(effect);
        const cleanup = effect();
        focusCleanups.set(effect, cleanup);

        return () => {
          focusEffects.delete(effect);
          const currentCleanup = focusCleanups.get(effect);

          if (typeof currentCleanup === "function") {
            currentCleanup();
          }

          focusCleanups.delete(effect);
        };
      }, [effect]);
    },
    __triggerFocus() {
      focusEffects.forEach((effect) => {
        const currentCleanup = focusCleanups.get(effect);

        if (typeof currentCleanup === "function") {
          currentCleanup();
        }

        const nextCleanup = effect();
        focusCleanups.set(effect, nextCleanup);
      });
    },
  };
});

jest.mock("expo-linking", () => ({
  addEventListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  getInitialURL: jest.fn().mockResolvedValue(null),
  openURL: jest.fn().mockResolvedValue(undefined),
  parse: jest.requireActual("expo-linking").parse,
}));

jest.mock("../../services/flareResponseApi", () => ({
  beginFlarePlanRun: jest.fn(),
  completeFlarePlanAction: jest.fn(),
  createFlareResponse: jest.fn(),
  declineFlarePlanRun: jest.fn(),
  endFlarePlanRunEarly: jest.fn(),
  getFlareResponse: jest.fn().mockResolvedValue({
    flareEvent: null,
    run: null,
    supportDelivery: null,
  }),
  skipFlarePlanAction: jest.fn(),
}));

function TestProviders({ children }: PropsWithChildren) {
  return (
    <FlareAuthProvider
      initialAuthState={{ kind: "no-session" }}
      resolveAuthState={async () => ({ kind: "no-session" })}
      subscribe={() => null}
    >
      <BehaviorPatternProvider>
        <AnchorNoteProvider>
          <FlareEventProvider>{children}</FlareEventProvider>
        </AnchorNoteProvider>
      </BehaviorPatternProvider>
    </FlareAuthProvider>
  );
}

const expoRouter = jest.requireMock("expo-router") as {
  __triggerFocus: () => void;
};

describe("V0 app shell", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the top-level navigation labels and dominant Send Flare action", () => {
    const { getAllByText, getByText } = render(<FlareScreen />, {
      wrapper: TestProviders,
    });

    expect(getAllByText("Flare").length).toBeGreaterThanOrEqual(1);
    expect(getByText("History")).toBeTruthy();
    expect(getByText("Customize")).toBeTruthy();
    expect(getByText("Send Flare")).toBeTruthy();
  });

  it("renders the flare screen hierarchy with actions before readiness cards", () => {
    const { toJSON } = render(<FlareScreen />, {
      wrapper: TestProviders,
    });
    const rendered = JSON.stringify(toJSON());

    const sendFlareIndex = rendered.indexOf("Send Flare");
    const checkpointIndex = rendered.indexOf("Checkpoint / Reflection");
    const readinessIndex = rendered.indexOf("Readiness");

    expect(sendFlareIndex).toBeGreaterThan(-1);
    expect(checkpointIndex).toBeGreaterThan(sendFlareIndex);
    expect(readinessIndex).toBeGreaterThan(checkpointIndex);
  });

  it("shows the Readiness panel collapsed by default with the aggregate count", () => {
    const { getByLabelText, getByText, queryByText } = render(<FlareScreen />, {
      wrapper: TestProviders,
    });

    expect(getByLabelText("Expand readiness details")).toBeTruthy();
    expect(getByText("0 out of 5 configured")).toBeTruthy();
    expect(queryByText("Setup saving")).toBeNull();
    expect(queryByText("Behavior Pattern")).toBeNull();
    expect(queryByText("Anchor Note")).toBeNull();
    expect(queryByText("Support Group")).toBeNull();
  });

  it("expands and collapses the Readiness panel with correct accessibility state", () => {
    const { getByLabelText, getByText, queryByText } = render(<FlareScreen />, {
      wrapper: TestProviders,
    });

    const toggle = getByLabelText("Expand readiness details");
    expect(toggle.props.accessibilityState).toEqual({ expanded: false });

    fireEvent.press(toggle);

    expect(getByLabelText("Collapse readiness details")).toBeTruthy();
    expect(getByText("Setup saving")).toBeTruthy();
    expect(getByText("Behavior Pattern")).toBeTruthy();
    expect(getByText("Flare Plan")).toBeTruthy();
    expect(getByText("Anchor Note")).toBeTruthy();
    expect(getByText("Support Group")).toBeTruthy();

    const expandedToggle = getByLabelText("Collapse readiness details");
    expect(expandedToggle.props.accessibilityState).toEqual({
      expanded: true,
    });

    fireEvent.press(expandedToggle);

    expect(queryByText("Setup saving")).toBeNull();
    expect(queryByText("Behavior Pattern")).toBeNull();
    expect(queryByText("Flare Plan")).toBeNull();
    expect(queryByText("Anchor Note")).toBeNull();
    expect(queryByText("Support Group")).toBeNull();
  });

  it("shows Flare Response immediately when Send Flare is pressed", () => {
    const { getByText, queryByText } = render(<FlareScreen />, {
      wrapper: TestProviders,
    });

    expect(queryByText("Flare Response")).toBeNull();

    fireEvent.press(getByText("Send Flare"));

    expect(getByText("Flare Response")).toBeTruthy();
    expect(getByText("Current Flare Event")).toBeTruthy();
    expect(getByText(/status: active/i)).toBeTruthy();
    expect(getByText("You paused the pattern")).toBeTruthy();
    expect(queryByText("Are you sure?")).toBeNull();
  });

  it("shows the offered Flare Plan acknowledgement before any actions are revealed", async () => {
    jest.spyOn(flareResponseApi, "createFlareResponse").mockResolvedValue({
      flareEvent: {
        anchorNoteId: null,
        anchorNoteVersion: null,
        archivedAt: null,
        behaviorDescriptionSnapshot: null,
        behaviorLabelSnapshot: "Late-night scrolling",
        behaviorPatternId: null,
        checkpoint: null,
        closedAt: null,
        createdAt: "2026-07-09T00:00:00Z",
        id: "event-1",
        responseMode: "configured",
        status: "active",
        supportActionShown: null,
        supportActionTaken: null,
        updatedAt: "2026-07-09T00:00:00Z",
        userId: "user-123",
      },
      run: {
        id: "run-1",
        flare_event_id: "event-1",
        source_plan_id: "plan-1",
        status: "offered",
        current_action: null,
        progress: {
          current_position: null,
          total_count: 2,
          done_count: 0,
          skipped_count: 0,
          not_reached_count: 0,
          pending_count: 2,
        },
        actions: [
          {
            id: "event-action-1",
            source_action_id: "action-1",
            source_template_key: null,
            title: "First step",
            description: null,
            position: 1,
            outcome: "pending",
            responded_at: null,
          },
        ],
        offered_at: "2026-07-09T00:00:00Z",
        started_at: null,
        declined_at: null,
        completed_at: null,
        ended_at: null,
        updated_at: "2026-07-09T00:00:00Z",
      },
    });
    jest.spyOn(flareResponseApi, "getFlareResponse").mockResolvedValue({
      flareEvent: {
        anchorNoteId: null,
        anchorNoteVersion: null,
        archivedAt: null,
        behaviorDescriptionSnapshot: null,
        behaviorLabelSnapshot: "Late-night scrolling",
        behaviorPatternId: null,
        checkpoint: null,
        closedAt: null,
        createdAt: "2026-07-09T00:00:00Z",
        id: "event-1",
        responseMode: "configured",
        status: "active",
        supportActionShown: null,
        supportActionTaken: null,
        updatedAt: "2026-07-09T00:00:00Z",
        userId: "user-123",
      },
      supportDelivery: null,
      run: {
        id: "run-1",
        flare_event_id: "event-1",
        source_plan_id: "plan-1",
        status: "offered",
        current_action: null,
        progress: {
          current_position: null,
          total_count: 2,
          done_count: 0,
          skipped_count: 0,
          not_reached_count: 0,
          pending_count: 2,
        },
        actions: [],
        offered_at: "2026-07-09T00:00:00Z",
        started_at: null,
        declined_at: null,
        completed_at: null,
        ended_at: null,
        updated_at: "2026-07-09T00:00:00Z",
      },
    });

    const { getByText, queryByText } = render(<FlareScreen />, {
      wrapper({ children }) {
        return (
          <FlareAuthProvider
            initialAuthState={{
              kind: "authenticated",
              userEmail: "flare@example.com",
              userId: "user-123",
            }}
            subscribe={() => null}
          >
            <BehaviorPatternProvider>
              <AnchorNoteProvider>
                <FlareEventProvider>{children}</FlareEventProvider>
              </AnchorNoteProvider>
            </BehaviorPatternProvider>
          </FlareAuthProvider>
        );
      },
    });

    await act(async () => {
      fireEvent.press(getByText("Send Flare"));
    });

    expect(getByText("You sent a Flare.")).toBeTruthy();
    expect(getByText("Begin Flare Plan")).toBeTruthy();
    expect(getByText("Skip for now")).toBeTruthy();
    expect(queryByText("First step")).toBeNull();
    expect(flareResponseApi.getFlareResponse).toHaveBeenCalledWith("event-1");
  });

  it("enters focused mode, advances one action, and hides the ordinary response chrome", async () => {
    jest.spyOn(flareResponseApi, "createFlareResponse").mockResolvedValue({
      flareEvent: {
        anchorNoteId: null,
        anchorNoteVersion: null,
        archivedAt: null,
        behaviorDescriptionSnapshot: null,
        behaviorLabelSnapshot: "Late-night scrolling",
        behaviorPatternId: null,
        checkpoint: null,
        closedAt: null,
        createdAt: "2026-07-09T00:00:00Z",
        id: "event-1",
        responseMode: "configured",
        status: "active",
        supportActionShown: null,
        supportActionTaken: null,
        updatedAt: "2026-07-09T00:00:00Z",
        userId: "user-123",
      },
      run: {
        id: "run-1",
        flare_event_id: "event-1",
        source_plan_id: "plan-1",
        status: "offered",
        current_action: null,
        progress: {
          current_position: null,
          total_count: 2,
          done_count: 0,
          skipped_count: 0,
          not_reached_count: 0,
          pending_count: 2,
        },
        actions: [],
        offered_at: "2026-07-09T00:00:00Z",
        started_at: null,
        declined_at: null,
        completed_at: null,
        ended_at: null,
        updated_at: "2026-07-09T00:00:00Z",
      },
    });
    jest.spyOn(flareResponseApi, "getFlareResponse").mockResolvedValue({
      flareEvent: {
        anchorNoteId: null,
        anchorNoteVersion: null,
        archivedAt: null,
        behaviorDescriptionSnapshot: null,
        behaviorLabelSnapshot: "Late-night scrolling",
        behaviorPatternId: null,
        checkpoint: null,
        closedAt: null,
        createdAt: "2026-07-09T00:00:00Z",
        id: "event-1",
        responseMode: "configured",
        status: "active",
        supportActionShown: null,
        supportActionTaken: null,
        updatedAt: "2026-07-09T00:00:00Z",
        userId: "user-123",
      },
      supportDelivery: null,
      run: {
        id: "run-1",
        flare_event_id: "event-1",
        source_plan_id: "plan-1",
        status: "offered",
        current_action: null,
        progress: {
          current_position: null,
          total_count: 2,
          done_count: 0,
          skipped_count: 0,
          not_reached_count: 0,
          pending_count: 2,
        },
        actions: [],
        offered_at: "2026-07-09T00:00:00Z",
        started_at: null,
        declined_at: null,
        completed_at: null,
        ended_at: null,
        updated_at: "2026-07-09T00:00:00Z",
      },
    });
    jest.spyOn(flareResponseApi, "beginFlarePlanRun").mockResolvedValue({
      id: "run-1",
      flare_event_id: "event-1",
      source_plan_id: "plan-1",
      status: "in_progress",
      current_action: {
        id: "event-action-1",
        source_action_id: "action-1",
        source_template_key: null,
        title: "First step",
        description: "Start here.",
        position: 1,
        outcome: "pending",
        responded_at: null,
      },
      progress: {
        current_position: 1,
        total_count: 2,
        done_count: 0,
        skipped_count: 0,
        not_reached_count: 0,
        pending_count: 2,
      },
      actions: [],
      offered_at: "2026-07-09T00:00:00Z",
      started_at: "2026-07-09T00:00:10Z",
      declined_at: null,
      completed_at: null,
      ended_at: null,
      updated_at: "2026-07-09T00:00:10Z",
    });
    jest.spyOn(flareResponseApi, "completeFlarePlanAction").mockResolvedValue({
      id: "run-1",
      flare_event_id: "event-1",
      source_plan_id: "plan-1",
      status: "in_progress",
      current_action: {
        id: "event-action-2",
        source_action_id: "action-2",
        source_template_key: null,
        title: "Second step",
        description: "Then this.",
        position: 2,
        outcome: "pending",
        responded_at: null,
      },
      progress: {
        current_position: 2,
        total_count: 2,
        done_count: 1,
        skipped_count: 0,
        not_reached_count: 0,
        pending_count: 1,
      },
      actions: [],
      offered_at: "2026-07-09T00:00:00Z",
      started_at: "2026-07-09T00:00:10Z",
      declined_at: null,
      completed_at: null,
      ended_at: null,
      updated_at: "2026-07-09T00:00:20Z",
    });

    const { getByText, queryByText } = render(<FlareScreen />, {
      wrapper({ children }) {
        return (
          <FlareAuthProvider
            initialAuthState={{
              kind: "authenticated",
              userEmail: "flare@example.com",
              userId: "user-123",
            }}
            subscribe={() => null}
          >
            <BehaviorPatternProvider>
              <AnchorNoteProvider>
                <FlareEventProvider>{children}</FlareEventProvider>
              </AnchorNoteProvider>
            </BehaviorPatternProvider>
          </FlareAuthProvider>
        );
      },
    });

    await act(async () => {
      fireEvent.press(getByText("Send Flare"));
    });
    await act(async () => {
      fireEvent.press(getByText("Begin Flare Plan"));
    });

    expect(getByText("Step 1 of 2")).toBeTruthy();
    expect(getByText("First step")).toBeTruthy();
    expect(queryByText("Current Flare Event")).toBeNull();
    expect(queryByText("Checkpoint / Reflection")).toBeNull();

    await act(async () => {
      fireEvent.press(getByText("Done"));
    });

    expect(getByText("Second step")).toBeTruthy();
  });

  it("opens end-plan confirmation and renders the ended summary after confirmation", async () => {
    jest.spyOn(flareResponseApi, "getFlareResponse").mockResolvedValue({
      flareEvent: {
        anchorNoteId: null,
        anchorNoteVersion: null,
        archivedAt: null,
        behaviorDescriptionSnapshot: null,
        behaviorLabelSnapshot: "Late-night scrolling",
        behaviorPatternId: null,
        checkpoint: null,
        closedAt: null,
        createdAt: "2026-07-09T00:00:00Z",
        id: "event-1",
        responseMode: "configured",
        status: "active",
        supportActionShown: null,
        supportActionTaken: null,
        updatedAt: "2026-07-09T00:00:00Z",
        userId: "user-123",
      },
      supportDelivery: null,
      run: {
        id: "run-1",
        flare_event_id: "event-1",
        source_plan_id: "plan-1",
        status: "in_progress",
        current_action: {
          id: "event-action-1",
          source_action_id: "action-1",
          source_template_key: null,
          title: "First step",
          description: null,
          position: 1,
          outcome: "pending",
          responded_at: null,
        },
        progress: {
          current_position: 1,
          total_count: 3,
          done_count: 1,
          skipped_count: 1,
          not_reached_count: 0,
          pending_count: 1,
        },
        actions: [],
        offered_at: "2026-07-09T00:00:00Z",
        started_at: "2026-07-09T00:00:10Z",
        declined_at: null,
        completed_at: null,
        ended_at: null,
        updated_at: "2026-07-09T00:00:10Z",
      },
    });
    jest.spyOn(flareResponseApi, "endFlarePlanRunEarly").mockResolvedValue({
      id: "run-1",
      flare_event_id: "event-1",
      source_plan_id: "plan-1",
      status: "ended_early",
      current_action: null,
      progress: {
        current_position: null,
        total_count: 3,
        done_count: 1,
        skipped_count: 1,
        not_reached_count: 1,
        pending_count: 0,
      },
      actions: [],
      offered_at: "2026-07-09T00:00:00Z",
      started_at: "2026-07-09T00:00:10Z",
      declined_at: null,
      completed_at: null,
      ended_at: "2026-07-09T00:00:30Z",
      updated_at: "2026-07-09T00:00:30Z",
    });

    const { getByText } = render(<FlareScreen />, {
      wrapper({ children }) {
        return (
          <FlareAuthProvider
            initialAuthState={{
              kind: "authenticated",
              userEmail: "flare@example.com",
              userId: "user-123",
            }}
            subscribe={() => null}
          >
            <BehaviorPatternProvider>
              <AnchorNoteProvider>
                <FlareEventProvider
                  flareEventRepository={{
                    archiveFlareEvent: jest.fn(),
                    createFlareEvent: jest.fn(),
                    loadFlareEvents: jest.fn().mockResolvedValue([
                      {
                        createdAt: "2026-07-09T00:00:00Z",
                        flareEvent: {
                          anchorNoteId: null,
                          anchorNoteVersion: null,
                          archivedAt: null,
                          behaviorDescriptionSnapshot: null,
                          behaviorLabelSnapshot: "Late-night scrolling",
                          behaviorPatternId: null,
                          checkpoint: null,
                          closedAt: null,
                          createdAt: "2026-07-09T00:00:00Z",
                          id: "event-1",
                          responseMode: "configured",
                          status: "active",
                          supportActionShown: null,
                          supportActionTaken: null,
                          updatedAt: "2026-07-09T00:00:00Z",
                          userId: "user-123",
                        },
                        id: "event-1",
                        updatedAt: "2026-07-09T00:00:00Z",
                        userId: "user-123",
                      },
                    ]),
                    restoreFlareEvent: jest.fn(),
                    updateFlareEventStatus: jest.fn(),
                  }}
                >
                  {children}
                </FlareEventProvider>
              </AnchorNoteProvider>
            </BehaviorPatternProvider>
          </FlareAuthProvider>
        );
      },
    });

    await waitFor(() => {
      expect(getByText("First step")).toBeTruthy();
    });

    fireEvent.press(getByText("End plan"));
    expect(getByText("End your Flare Plan?")).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByText("End plan"));
    });

    expect(getByText("Flare Plan ended")).toBeTruthy();
    expect(getByText(/1 done, 1 skipped, 1 not reached/i)).toBeTruthy();
  });

  it("shows a calm sent status when Send Flare reaches the enabled support group", async () => {
    jest.spyOn(supportChannelApi, "sendSupportChannelFlare").mockResolvedValue({
      attempted_at: "2026-07-06T03:40:00Z",
      delivered_at: "2026-07-06T03:40:00Z",
      destination_display_name: "Close Friends",
      error_code: null,
      error_message_safe: null,
      message_preview:
        "Luke sent a Flare and may need support. Please check in when you can.",
      provider: "groupme",
      send_kind: "real",
      status: "sent",
    });

    const { getByText } = render(<FlareScreen />, {
      wrapper({ children }) {
        return (
          <FlareAuthProvider
            initialAuthState={{
              kind: "authenticated",
              userEmail: "flare@example.com",
              userId: "user-123",
            }}
            subscribe={() => null}
          >
            <BehaviorPatternProvider>
              <AnchorNoteProvider>
                <FlareEventProvider>{children}</FlareEventProvider>
              </AnchorNoteProvider>
            </BehaviorPatternProvider>
          </FlareAuthProvider>
        );
      },
    });

    fireEvent.press(getByText("Send Flare"));

    await waitFor(() => {
      expect(getByText("Support message sent")).toBeTruthy();
      expect(
        getByText("Your saved support message was sent to the connected group."),
      ).toBeTruthy();
    });
  });

  it("keeps the flare event flow working when external delivery fails safely", async () => {
    jest.spyOn(supportChannelApi, "sendSupportChannelFlare").mockResolvedValue({
      attempted_at: "2026-07-06T03:45:00Z",
      delivered_at: null,
      destination_display_name: "Close Friends",
      error_code: "groupme_http_500",
      error_message_safe: "GroupMe rejected the support message.",
      message_preview:
        "Luke sent a Flare and may need support. Please check in when you can.",
      provider: "groupme",
      send_kind: "real",
      status: "failed",
    });

    const { getAllByText, getByText } = render(
      <>
        <FlareScreen />
        <HistoryScreen />
      </>,
      {
        wrapper({ children }) {
          return (
            <FlareAuthProvider
              initialAuthState={{
                kind: "authenticated",
                userEmail: "flare@example.com",
                userId: "user-123",
              }}
              subscribe={() => null}
            >
              <BehaviorPatternProvider>
                <AnchorNoteProvider>
                  <FlareEventProvider>{children}</FlareEventProvider>
                </AnchorNoteProvider>
              </BehaviorPatternProvider>
            </FlareAuthProvider>
          );
        },
      },
    );

    fireEvent.press(getByText("Send Flare"));

    await waitFor(() => {
      expect(getByText("Support message failed")).toBeTruthy();
      expect(getByText("GroupMe rejected the support message.")).toBeTruthy();
    });

    expect(getAllByText("Flare Event").length).toBeGreaterThanOrEqual(1);
  });

  it("opens the Checkpoint / Reflection sheet and shows guidance when no active event exists", () => {
    const { getAllByText, getByText } = render(<FlareScreen />, {
      wrapper: TestProviders,
    });

    fireEvent.press(getAllByText("Checkpoint / Reflection")[0]);

    expect(getByText("No active Flare Event")).toBeTruthy();
    expect(getByText("Save Reflection")).toBeTruthy();
  });

  it("renders the History empty state before any flare events exist", () => {
    const { getByText } = render(<HistoryScreen />, {
      wrapper: TestProviders,
    });

    expect(getByText("No Flare Events yet")).toBeTruthy();
  });

  it("keeps setup ownership inside Customize and adds the support-group entry point", () => {
    jest
      .spyOn(supportChannelApi, "getSupportChannel")
      .mockResolvedValue(null);
    const { getByText } = render(<CustomizeScreen />, {
      wrapper: TestProviders,
    });

    expect(getByText("Save your setup")).toBeTruthy();
    expect(getByText("Not saved yet")).toBeTruthy();
    expect(getByText("Behavior Pattern")).toBeTruthy();
    expect(getByText("Anchor Note")).toBeTruthy();
    expect(getByText("Support Group")).toBeTruthy();
    expect(
      getByText(
        "Connect one GroupMe group for a single saved Flare support message. Send a test before relying on it.",
      ),
    ).toBeTruthy();
  });

  it("shows Support Group as configured when the authenticated user already has an active channel", async () => {
    jest.spyOn(supportChannelApi, "getSupportChannel").mockResolvedValue({
      configured: true,
      destination_display_name: "Close Friends",
      enabled: true,
      last_delivery_at: "2026-07-06T03:10:00Z",
      last_delivery_status: "sent",
      message_preview: DEFAULT_SUPPORT_CHANNEL_MESSAGE,
      provider: "groupme",
      status: "connected",
    });

    const { getAllByText, queryByText } = render(<CustomizeScreen />, {
      wrapper({ children }) {
        return (
          <FlareAuthProvider
            initialAuthState={{
              kind: "authenticated",
              userEmail: "flare@example.com",
              userId: "user-123",
            }}
            subscribe={() => null}
          >
            <BehaviorPatternProvider>
              <AnchorNoteProvider>
                <FlareEventProvider>{children}</FlareEventProvider>
              </AnchorNoteProvider>
            </BehaviorPatternProvider>
          </FlareAuthProvider>
        );
      },
    });

    await waitFor(() => {
      expect(getAllByText("Configured").length).toBeGreaterThanOrEqual(1);
    });
    expect(queryByText("Checking connection")).toBeNull();
  });

  it("shows Support Group as configured in Flare readiness when the active support channel is usable", async () => {
    jest.spyOn(supportChannelApi, "getSupportChannel").mockResolvedValue({
      configured: true,
      destination_display_name: "Close Friends",
      enabled: true,
      last_delivery_at: "2026-07-06T03:10:00Z",
      last_delivery_status: "sent",
      message_preview: DEFAULT_SUPPORT_CHANNEL_MESSAGE,
      provider: "groupme",
      status: "connected",
    });

    const { getByText, getByLabelText } = render(<FlareScreen />, {
      wrapper({ children }) {
        return (
          <FlareAuthProvider
            initialAuthState={{
              kind: "authenticated",
              userEmail: "flare@example.com",
              userId: "user-123",
            }}
            subscribe={() => null}
          >
            <BehaviorPatternProvider>
              <AnchorNoteProvider>
                <FlareEventProvider>{children}</FlareEventProvider>
              </AnchorNoteProvider>
            </BehaviorPatternProvider>
          </FlareAuthProvider>
        );
      },
    });

    await waitFor(() => {
      expect(getByText("2 out of 5 configured")).toBeTruthy();
    });

    fireEvent.press(getByLabelText("Expand readiness details"));

    expect(getByText("Configured: Close Friends")).toBeTruthy();
  });

  it("shows Support Group as not configured when the authenticated user has no active channel", async () => {
    jest.spyOn(supportChannelApi, "getSupportChannel").mockResolvedValue(null);

    const { getByText } = render(<CustomizeScreen />, {
      wrapper({ children }) {
        return (
          <FlareAuthProvider
            initialAuthState={{
              kind: "authenticated",
              userEmail: "flare@example.com",
              userId: "user-123",
            }}
            subscribe={() => null}
          >
            <BehaviorPatternProvider>
              <AnchorNoteProvider>
                <FlareEventProvider>{children}</FlareEventProvider>
              </AnchorNoteProvider>
            </BehaviorPatternProvider>
          </FlareAuthProvider>
        );
      },
    });

    await waitFor(() => {
      expect(getByText("Not configured")).toBeTruthy();
    });
  });

  it("shows Support Group as unconfigured in Flare readiness when no valid active configuration exists", async () => {
    jest.spyOn(supportChannelApi, "getSupportChannel").mockResolvedValue(null);

    const { getAllByText, getByLabelText, getByText, queryByText } = render(<FlareScreen />, {
      wrapper({ children }) {
        return (
          <FlareAuthProvider
            initialAuthState={{
              kind: "authenticated",
              userEmail: "flare@example.com",
              userId: "user-123",
            }}
            subscribe={() => null}
          >
            <BehaviorPatternProvider>
              <AnchorNoteProvider>
                <FlareEventProvider>{children}</FlareEventProvider>
              </AnchorNoteProvider>
            </BehaviorPatternProvider>
          </FlareAuthProvider>
        );
      },
    });

    await waitFor(() => {
      expect(getByText("1 out of 5 configured")).toBeTruthy();
    });

    fireEvent.press(getByLabelText("Expand readiness details"));

    expect(getAllByText("Ready to set up").length).toBeGreaterThanOrEqual(1);
    expect(queryByText("Configured: Close Friends")).toBeNull();
  });

  it("shows a loading status instead of a false not-configured state while support-group status is loading", () => {
    jest.spyOn(supportChannelApi, "getSupportChannel").mockImplementation(
      () =>
        new Promise(() => {
          // Leave the request unresolved to verify the interim screen state.
        }),
    );

    const { getByText } = render(<CustomizeScreen />, {
      wrapper({ children }) {
        return (
          <FlareAuthProvider
            initialAuthState={{
              kind: "authenticated",
              userEmail: "flare@example.com",
              userId: "user-123",
            }}
            subscribe={() => null}
          >
            <BehaviorPatternProvider>
              <AnchorNoteProvider>
                <FlareEventProvider>{children}</FlareEventProvider>
              </AnchorNoteProvider>
            </BehaviorPatternProvider>
          </FlareAuthProvider>
        );
      },
    });

    expect(getByText("Checking connection")).toBeTruthy();
  });

  it("refetches the support-group status when Customize regains focus", async () => {
    const getSupportChannelSpy = jest
      .spyOn(supportChannelApi, "getSupportChannel")
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        configured: true,
        destination_display_name: "Close Friends",
        enabled: true,
        last_delivery_at: "2026-07-06T03:10:00Z",
        last_delivery_status: "sent",
        message_preview: DEFAULT_SUPPORT_CHANNEL_MESSAGE,
        provider: "groupme",
        status: "connected",
      });

    const { getAllByText, getByText } = render(<CustomizeScreen />, {
      wrapper({ children }) {
        return (
          <FlareAuthProvider
            initialAuthState={{
              kind: "authenticated",
              userEmail: "flare@example.com",
              userId: "user-123",
            }}
            subscribe={() => null}
          >
            <BehaviorPatternProvider>
              <AnchorNoteProvider>
                <FlareEventProvider>{children}</FlareEventProvider>
              </AnchorNoteProvider>
            </BehaviorPatternProvider>
          </FlareAuthProvider>
        );
      },
    });

    await waitFor(() => {
      expect(getByText("Not configured")).toBeTruthy();
    });

    act(() => {
      expoRouter.__triggerFocus();
    });

    await waitFor(() => {
      expect(getAllByText("Configured").length).toBeGreaterThanOrEqual(1);
      expect(getSupportChannelSpy).toHaveBeenCalledTimes(2);
    });
  });

  it("updates the Flare readiness summary when the support-group status changes on refocus", async () => {
    jest
      .spyOn(supportChannelApi, "getSupportChannel")
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        configured: true,
        destination_display_name: "Close Friends",
        enabled: true,
        last_delivery_at: "2026-07-06T03:10:00Z",
        last_delivery_status: "sent",
        message_preview: DEFAULT_SUPPORT_CHANNEL_MESSAGE,
        provider: "groupme",
        status: "connected",
      });

    const { getByText } = render(<FlareScreen />, {
      wrapper({ children }) {
        return (
          <FlareAuthProvider
            initialAuthState={{
              kind: "authenticated",
              userEmail: "flare@example.com",
              userId: "user-123",
            }}
            subscribe={() => null}
          >
            <BehaviorPatternProvider>
              <AnchorNoteProvider>
                <FlareEventProvider>{children}</FlareEventProvider>
              </AnchorNoteProvider>
            </BehaviorPatternProvider>
          </FlareAuthProvider>
        );
      },
    });

    await waitFor(() => {
      expect(getByText("1 out of 5 configured")).toBeTruthy();
    });

    act(() => {
      expoRouter.__triggerFocus();
    });

    await waitFor(() => {
      expect(getByText("2 out of 5 configured")).toBeTruthy();
    });
  });

  it("shows the signed-in setup card collapsed by default on Customize", async () => {
    jest.spyOn(supportChannelApi, "getSupportChannel").mockResolvedValue(null);
    const { getByLabelText, getByText, queryByText } = render(
      <CustomizeScreen />,
      {
        wrapper({ children }) {
          return (
            <FlareAuthProvider
              initialAuthState={{
                kind: "authenticated",
                userEmail: "luke.smoker@gmail.com",
                userId: "user-123",
              }}
              subscribe={() => null}
            >
              <BehaviorPatternProvider>
                <AnchorNoteProvider>
                  <FlareEventProvider>{children}</FlareEventProvider>
                </AnchorNoteProvider>
              </BehaviorPatternProvider>
            </FlareAuthProvider>
          );
        },
      },
    );

    await waitFor(() => {
      expect(getByText("Not configured")).toBeTruthy();
    });
    expect(getByText("Save your setup")).toBeTruthy();
    expect(getByText("Signed in as luke.smoker@gmail.com")).toBeTruthy();
    expect(getByText("Connected")).toBeTruthy();
    expect(getByText("Details")).toBeTruthy();
    expect(
      queryByText(
        "Your Behavior Pattern and Anchor Note can now reload when you sign in on this device.",
      ),
    ).toBeNull();
    expect(getByLabelText("Show saved setup details")).toBeTruthy();
  });

  it("opens Behavior Pattern Setup from Customize and keeps support-group setup separate", () => {
    jest
      .spyOn(supportChannelApi, "getSupportChannel")
      .mockResolvedValue(null);
    const { getAllByText, getByText } = render(<CustomizeScreen />, {
      wrapper: TestProviders,
    });

    fireEvent.press(getAllByText("Behavior Pattern")[0]);
    expect(
      getByText(
        "Describe the pattern you want Flare to help you pause and reflect on.",
      ),
    ).toBeTruthy();
    expect(getByText("Save Behavior Pattern")).toBeTruthy();

    fireEvent.press(getByText("Close"));
    fireEvent.press(getAllByText("Anchor Note")[0]);
    expect(
      getByText(
        "Keep this honest, specific, and easy to revisit. This note is for self-support.",
      ),
    ).toBeTruthy();
    expect(getByText("Save Anchor Note")).toBeTruthy();
    expect(getByText("Support Group")).toBeTruthy();
  });

  it("opens the support-group flow and shows current safe onboarding steps", async () => {
    jest.spyOn(supportChannelApi, "getSupportChannel").mockResolvedValue(null);
    jest
      .spyOn(supportChannelApi, "startGroupMeConnect")
      .mockResolvedValue({
        auth_url: "https://oauth.groupme.com/oauth/authorize?client_id=test",
        provider: "groupme",
      });

    const { getAllByText, getByText } = render(<CustomizeScreen />, {
      wrapper({ children }) {
        return (
          <FlareAuthProvider
            initialAuthState={{
              kind: "authenticated",
              userEmail: "flare@example.com",
              userId: "user-123",
            }}
            subscribe={() => null}
          >
            <BehaviorPatternProvider>
              <AnchorNoteProvider>
                <FlareEventProvider>{children}</FlareEventProvider>
              </AnchorNoteProvider>
            </BehaviorPatternProvider>
          </FlareAuthProvider>
        );
      },
    });

    fireEvent.press(getAllByText("Support Group")[0]);

    await waitFor(() => {
      expect(getByText("External Support Channel")).toBeTruthy();
    });

    expect(getByText("Current status")).toBeTruthy();
    expect(getByText("Connect GroupMe")).toBeTruthy();
    expect(
      getByText(
        "Flare can send one predefined message to the GroupMe group you choose.",
      ),
    ).toBeTruthy();
  });

  it("shows the configured support-group state and test action", async () => {
    jest.spyOn(supportChannelApi, "getSupportChannel").mockResolvedValue({
      configured: true,
      destination_display_name: "Close Friends",
      enabled: true,
      last_delivery_at: "2026-07-06T03:10:00Z",
      last_delivery_status: "sent",
      message_preview:
        "Luke sent a Flare and may need support. Please check in when you can.",
      provider: "groupme",
      status: "connected",
    });

    const { getAllByText, getByText } = render(<CustomizeScreen />, {
      wrapper({ children }) {
        return (
          <FlareAuthProvider
            initialAuthState={{
              kind: "authenticated",
              userEmail: "flare@example.com",
              userId: "user-123",
            }}
            subscribe={() => null}
          >
            <BehaviorPatternProvider>
              <AnchorNoteProvider>
                <FlareEventProvider>{children}</FlareEventProvider>
              </AnchorNoteProvider>
            </BehaviorPatternProvider>
          </FlareAuthProvider>
        );
      },
    });

    fireEvent.press(getAllByText("Support Group")[0]);

    await waitFor(() => {
      expect(getByText("Close Friends")).toBeTruthy();
    });

    expect(getByText("Enabled")).toBeTruthy();
    expect(getByText("Send test flare")).toBeTruthy();
    expect(getByText("Disable")).toBeTruthy();
  });

  it("shows a successful test-flare result after the test action runs", async () => {
    jest.spyOn(supportChannelApi, "getSupportChannel").mockResolvedValue({
      configured: true,
      destination_display_name: "Close Friends",
      enabled: true,
      last_delivery_at: "2026-07-06T03:10:00Z",
      last_delivery_status: "sent",
      message_preview: DEFAULT_SUPPORT_CHANNEL_MESSAGE,
      provider: "groupme",
      status: "connected",
    });
    const sendTestSpy = jest
      .spyOn(supportChannelApi, "sendSupportChannelTest")
      .mockResolvedValue({
        attempted_at: "2026-07-06T03:40:00Z",
        delivered_at: "2026-07-06T03:40:00Z",
        destination_display_name: "Close Friends",
        error_code: null,
        error_message_safe: null,
        message_preview:
          "TEST FLARE: Luke is testing Flare support notifications. No action is needed.",
        provider: "groupme",
        send_kind: "test",
        status: "sent",
      });

    const { getAllByText, getByText } = render(<CustomizeScreen />, {
      wrapper({ children }) {
        return (
          <FlareAuthProvider
            initialAuthState={{
              kind: "authenticated",
              userEmail: "flare@example.com",
              userId: "user-123",
            }}
            subscribe={() => null}
          >
            <BehaviorPatternProvider>
              <AnchorNoteProvider>
                <FlareEventProvider>{children}</FlareEventProvider>
              </AnchorNoteProvider>
            </BehaviorPatternProvider>
          </FlareAuthProvider>
        );
      },
    });

    fireEvent.press(getAllByText("Support Group")[0]);

    await waitFor(() => {
      expect(getByText("Send test flare")).toBeTruthy();
    });

    fireEvent.press(getByText("Send test flare"));

    await waitFor(() => {
      expect(sendTestSpy).toHaveBeenCalledTimes(1);
      expect(getByText("Test flare sent.")).toBeTruthy();
      expect(getByText("Last test")).toBeTruthy();
      expect(getByText("sent")).toBeTruthy();
    });
  });

  it("shows a safe failure state when the test-flare action fails", async () => {
    jest.spyOn(supportChannelApi, "getSupportChannel").mockResolvedValue({
      configured: true,
      destination_display_name: "Close Friends",
      enabled: true,
      last_delivery_at: "2026-07-06T03:10:00Z",
      last_delivery_status: "sent",
      message_preview: DEFAULT_SUPPORT_CHANNEL_MESSAGE,
      provider: "groupme",
      status: "connected",
    });
    const sendTestSpy = jest
      .spyOn(supportChannelApi, "sendSupportChannelTest")
      .mockRejectedValue(
        new supportChannelApi.SupportChannelApiError({
          code: "groupme_http_500",
          message: "GroupMe rejected the test message.",
          statusCode: 502,
        }),
      );

    const { getAllByText, getByText, queryByText } = render(
      <CustomizeScreen />,
      {
        wrapper({ children }) {
          return (
            <FlareAuthProvider
              initialAuthState={{
                kind: "authenticated",
                userEmail: "flare@example.com",
                userId: "user-123",
              }}
              subscribe={() => null}
            >
              <BehaviorPatternProvider>
                <AnchorNoteProvider>
                  <FlareEventProvider>{children}</FlareEventProvider>
                </AnchorNoteProvider>
              </BehaviorPatternProvider>
            </FlareAuthProvider>
          );
        },
      },
    );

    fireEvent.press(getAllByText("Support Group")[0]);

    await waitFor(() => {
      expect(getByText("Send test flare")).toBeTruthy();
    });

    fireEvent.press(getByText("Send test flare"));

    await waitFor(() => {
      expect(sendTestSpy).toHaveBeenCalledTimes(1);
      expect(getByText("GroupMe rejected the test message.")).toBeTruthy();
    });
    expect(queryByText("Test flare sent.")).toBeNull();
  });

  it("does not expose support-message editing during the real Send Flare action", async () => {
    jest.spyOn(supportChannelApi, "sendSupportChannelFlare").mockResolvedValue({
      attempted_at: "2026-07-06T03:40:00Z",
      delivered_at: "2026-07-06T03:40:00Z",
      destination_display_name: "Close Friends",
      error_code: null,
      error_message_safe: null,
      message_preview: DEFAULT_SUPPORT_CHANNEL_MESSAGE,
      provider: "groupme",
      send_kind: "real",
      status: "sent",
    });

    const { getByText, queryByDisplayValue, queryByText } = render(
      <FlareScreen />,
      {
        wrapper({ children }) {
          return (
            <FlareAuthProvider
              initialAuthState={{
                kind: "authenticated",
                userEmail: "flare@example.com",
                userId: "user-123",
              }}
              subscribe={() => null}
            >
              <BehaviorPatternProvider>
                <AnchorNoteProvider>
                  <FlareEventProvider>{children}</FlareEventProvider>
                </AnchorNoteProvider>
              </BehaviorPatternProvider>
            </FlareAuthProvider>
          );
        },
      },
    );

    fireEvent.press(getByText("Send Flare"));

    await waitFor(() => {
      expect(getByText("Support message sent")).toBeTruthy();
    });

    expect(
      queryByText(
        "This is the message Flare will send when you press Send Flare. It is not editable at send time.",
      ),
    ).toBeNull();
    expect(queryByText("Saved message")).toBeNull();
    expect(queryByDisplayValue(DEFAULT_SUPPORT_CHANNEL_MESSAGE)).toBeNull();
  });

  it("saves Anchor Note and shows the summary on Customize", () => {
    const { getAllByText, getByLabelText, getByText, queryByText } = render(
      <CustomizeScreen />,
      {
        wrapper: TestProviders,
      },
    );

    fireEvent.press(getAllByText("Anchor Note")[0]);

    fireEvent.changeText(
      getByLabelText("Why pause this pattern?"),
      "I want to stop before I lose the rest of tonight.",
    );
    fireEvent.changeText(
      getByLabelText("Costs of continuing"),
      "I will be numb tomorrow and break trust with myself.",
    );
    fireEvent.changeText(
      getByLabelText("Reminder from grounded self"),
      "The urge peaks fast and passes if I move.",
    );
    fireEvent.changeText(
      getByLabelText("Immediate next step"),
      "Put the phone away, drink water, and go outside.",
    );
    fireEvent.changeText(
      getByLabelText("Supportive phrase"),
      "Pause now. Protect tomorrow.",
    );

    fireEvent.press(getByText("Save Anchor Note"));

    expect(queryByText("Save Anchor Note")).toBeNull();
    expect(getAllByText("Configured").length).toBeGreaterThanOrEqual(1);
    expect(getByText("Pause now. Protect tomorrow.")).toBeTruthy();
    expect(
      getByText("I want to stop before I lose the rest of tonight."),
    ).toBeTruthy();
    expect(
      getByText("Put the phone away, drink water, and go outside."),
    ).toBeTruthy();
  });

  it("saves a behavior pattern and shows the summary on Customize", () => {
    const { getAllByText, getByLabelText, getByText, queryByText } = render(
      <CustomizeScreen />,
      {
        wrapper: TestProviders,
      },
    );

    fireEvent.press(getAllByText("Behavior Pattern")[0]);

    fireEvent.changeText(
      getByLabelText("Behavior name"),
      "Evening doomscrolling",
    );
    fireEvent.changeText(
      getByLabelText("Short description"),
      "I keep opening social apps when I feel numb.",
    );
    fireEvent.changeText(
      getByLabelText("Common triggers"),
      "Stress after work",
    );
    fireEvent.changeText(
      getByLabelText("Risk times or situations"),
      "Late nights",
    );
    fireEvent.press(getByText("Save Behavior Pattern"));

    expect(queryByText("Save Behavior Pattern")).toBeNull();
    expect(getByText("Configured")).toBeTruthy();
    expect(getByText("Evening doomscrolling")).toBeTruthy();
    expect(getByText("Stress after work")).toBeTruthy();
  });

  it("updates the Flare readiness indicator after a behavior pattern is saved", () => {
    const { getAllByText, getByLabelText, getByText } = render(
      <>
        <CustomizeScreen />
        <FlareScreen />
      </>,
      {
        wrapper: TestProviders,
      },
    );

    expect(getByText("0 out of 5 configured")).toBeTruthy();
    fireEvent.press(getByLabelText("Expand readiness details"));
    expect(getByText("Local-only until sign in")).toBeTruthy();
    expect(getAllByText("Ready to set up").length).toBeGreaterThanOrEqual(2);

    fireEvent.press(getAllByText("Behavior Pattern")[0]);
    fireEvent.changeText(getByLabelText("Behavior name"), "Weekend drinking");
    fireEvent.press(getByText("Save Behavior Pattern"));

    expect(getByText("Configured: Weekend drinking")).toBeTruthy();
    expect(getAllByText("Configured").length).toBeGreaterThanOrEqual(1);
  });

  it("updates the Flare readiness indicator after Anchor Note is saved", () => {
    const { getAllByText, getByLabelText, getByText } = render(
      <>
        <CustomizeScreen />
        <FlareScreen />
      </>,
      {
        wrapper: TestProviders,
      },
    );

    fireEvent.press(getByLabelText("Expand readiness details"));
    expect(getAllByText("Ready to set up").length).toBeGreaterThanOrEqual(2);

    fireEvent.press(getAllByText("Anchor Note")[0]);
    fireEvent.changeText(
      getByLabelText("Why pause this pattern?"),
      "This urge is not worth the fallout.",
    );
    fireEvent.changeText(
      getByLabelText("Supportive phrase"),
      "Hold the line for ten minutes.",
    );
    fireEvent.press(getByText("Save Anchor Note"));

    expect(getByText("Configured: Hold the line for ten minutes.")).toBeTruthy();
  });

  it("shows saved Anchor Note immediately in Flare Response after Send Flare", () => {
    const { getAllByText, getByLabelText, getByText } = render(
      <>
        <CustomizeScreen />
        <FlareScreen />
      </>,
      {
        wrapper: TestProviders,
      },
    );

    fireEvent.press(getAllByText("Anchor Note")[0]);
    fireEvent.changeText(
      getByLabelText("Why pause this pattern?"),
      "I want tomorrow morning back.",
    );
    fireEvent.changeText(
      getByLabelText("Reminder from grounded self"),
      "You do not need to obey this feeling.",
    );
    fireEvent.changeText(
      getByLabelText("Immediate next step"),
      "Leave the room and drink water.",
    );
    fireEvent.changeText(
      getByLabelText("Supportive phrase"),
      "Pause now. You already chose differently.",
    );
    fireEvent.press(getByText("Save Anchor Note"));

    fireEvent.press(getByText("Send Flare"));

    expect(getByText("Flare Response")).toBeTruthy();
    expect(getByText("Current Flare Event")).toBeTruthy();
    expect(
      getAllByText("Pause now. You already chose differently.").length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      getAllByText("I want tomorrow morning back.").length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      getAllByText("You do not need to obey this feeling.").length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      getAllByText("Leave the room and drink water.").length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("creates a flare event tied to the current behavior pattern and shows it in History", () => {
    const { getAllByText, getByLabelText, getByText } = render(
      <>
        <CustomizeScreen />
        <FlareScreen />
        <HistoryScreen />
      </>,
      {
        wrapper: TestProviders,
      },
    );

    fireEvent.press(getAllByText("Behavior Pattern")[0]);
    fireEvent.changeText(getByLabelText("Behavior name"), "Late-night scrolling");
    fireEvent.changeText(
      getByLabelText("Short description"),
      "I start checking feeds when I feel depleted.",
    );
    fireEvent.press(getByText("Save Behavior Pattern"));

    fireEvent.press(getByText("Send Flare"));

    expect(getAllByText("Flare Event").length).toBeGreaterThanOrEqual(1);
    expect(
      getAllByText(/Behavior Pattern: Late-night scrolling/).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      getAllByText("I start checking feeds when I feel depleted.").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("saves a checkpoint reflection for the active event and shows it in History", () => {
    const { getAllByText, getByLabelText, getByText, queryByText } = render(
      <>
        <FlareScreen />
        <HistoryScreen />
      </>,
      {
        wrapper: TestProviders,
      },
    );

    fireEvent.press(getByText("Send Flare"));
    fireEvent.press(getAllByText("Checkpoint / Reflection")[1]);

    fireEvent.changeText(
      getByLabelText("What happened?"),
      "I felt the spike right after finishing work.",
    );
    fireEvent.changeText(
      getByLabelText("What helped?"),
      "I left the room and drank cold water.",
    );
    fireEvent.changeText(
      getByLabelText("How do I feel now?"),
      "Less flooded and more steady.",
    );
    fireEvent.press(getByText("Avoided"));
    fireEvent.changeText(
      getByLabelText("Optional note"),
      "The first minute was the hardest part.",
    );
    fireEvent.press(getByText("Save Reflection"));

    expect(queryByText("Save Reflection")).toBeNull();
    expect(getByText("Reflection saved for this event")).toBeTruthy();
    expect(
      getByText(/What happened: I felt the spike right after finishing work\./),
    ).toBeTruthy();
    expect(
      getByText(/What helped: I left the room and drank cold water\./),
    ).toBeTruthy();
    expect(
      getByText(/How I feel now: Less flooded and more steady\./),
    ).toBeTruthy();
    expect(getByText(/Outcome:/i)).toBeTruthy();
    expect(
      getByText(/Note: The first minute was the hardest part\./),
    ).toBeTruthy();
    expect(getByText(/Reflected event/i)).toBeTruthy();
  });

  it("keeps support-group guidance scoped to Customize after the flare event flow changes", () => {
    const { getByText } = render(
      <>
        <FlareScreen />
        <CustomizeScreen />
        <HistoryScreen />
      </>,
      {
        wrapper: TestProviders,
      },
    );

    expect(getByText("0 out of 5 configured")).toBeTruthy();
    expect(
      getByText(
        /Connect one GroupMe group for a single saved Flare support message\./,
      ),
    ).toBeTruthy();
  });

  it("settles without a maximum update depth error while auth initializes", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const { getByText } = render(<FlareScreen />, {
      wrapper({ children }) {
        return (
          <FlareAuthProvider
            resolveAuthState={async () => ({ kind: "no-session" })}
            subscribe={() => null}
          >
            <BehaviorPatternProvider>
              <AnchorNoteProvider>
                <FlareEventProvider>{children}</FlareEventProvider>
              </AnchorNoteProvider>
            </BehaviorPatternProvider>
          </FlareAuthProvider>
        );
      },
    });

    await waitFor(() => {
      expect(getByText("0 out of 5 configured")).toBeTruthy();
    });

    expect(
      consoleError.mock.calls.some((call) =>
        call.some(
          (arg) =>
            typeof arg === "string" &&
            arg.includes("Maximum update depth exceeded"),
        ),
      ),
    ).toBe(false);
  });
});

