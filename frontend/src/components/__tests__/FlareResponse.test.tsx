import { render, waitFor } from "@testing-library/react-native";

import { FlareResponse } from "../FlareResponse";
import {
  AnchorNote,
  AnchorNoteProvider,
} from "../../state/AnchorNoteContext";
import type { FlareEvent } from "../../state/FlareEventContext";
import type { FlarePlanRun } from "../../services/flareResponseApi";

function renderFlareResponse({
  anchorNote = null,
  externalSupportState = null,
  flareEvent = null,
  run = null,
}: {
  anchorNote?: AnchorNote | null;
  externalSupportState?: {
    copy: string;
    title: string;
    tone: "muted" | "success" | "warning";
  } | null;
  flareEvent?: FlareEvent | null;
  run?: FlarePlanRun | null;
}) {
  return render(
    <AnchorNoteProvider
      anchorNoteRepository={{
        async loadActiveAnchorNote() {
          if (!anchorNote) {
            return null;
          }

          return {
            anchorNote,
            createdAt: "2026-07-09T00:00:00Z",
            id: "anchor-1",
            updatedAt: "2026-07-09T00:00:00Z",
            userId: "user-123",
            version: 1,
          };
        },
        async saveAnchorNote() {
          throw new Error("saveAnchorNote should not be called in this test");
        },
      }}
      authState={{ kind: "authenticated", userEmail: "flare@example.com", userId: "user-123" }}
    >
        <FlareResponse
          externalSupportState={externalSupportState}
          flareEvent={flareEvent}
          onOpenCheckpoint={() => undefined}
          run={run}
        />
    </AnchorNoteProvider>,
  );
}

const flareEvent: FlareEvent = {
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
};

describe("FlareResponse", () => {
  it("leads with support delivery and removes the old event card in the post-send state", async () => {
    const { getByText, queryByText, toJSON } = renderFlareResponse({
      anchorNote: {
        interruptionReasons: "Protect tomorrow morning.",
        continuingCosts: "I will feel foggy and ashamed again.",
        groundedReminders: "This feeling can pass without action.",
        emergencyActions: "Put the phone down and walk outside.",
        supportivePhrase: "Pause now.",
      },
      externalSupportState: {
        copy: "Your saved support message was sent to the connected group.",
        title: "Support message sent",
        tone: "success",
      },
      flareEvent,
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

    await waitFor(() => {
      expect(getByText("Why")).toBeTruthy();
    });

    expect(getByText("Support message sent")).toBeTruthy();
    expect(getByText("Remember why you're doing this")).toBeTruthy();
    expect(getByText("If I continue...")).toBeTruthy();
    expect(getByText("Begin Flare Plan")).toBeTruthy();
    expect(getByText("Skip for now")).toBeTruthy();
    expect(queryByText("Current Flare Event")).toBeNull();
    expect(queryByText("You paused the pattern")).toBeNull();
    expect(queryByText("Support Group Delivery")).toBeNull();
    expect(queryByText("You sent a Flare.")).toBeNull();
    expect(queryByText("Keep the momentum going with your Flare Plan.")).toBeNull();
    expect(queryByText(/Started /i)).toBeNull();
    expect(queryByText(/status:/i)).toBeNull();
    expect(queryByText(/Behavior Pattern:/i)).toBeNull();

    const rendered = JSON.stringify(toJSON());
    expect(rendered.indexOf("Support message sent")).toBeLessThan(
      rendered.indexOf("Remember why you're doing this"),
    );
    expect(rendered.indexOf("Remember why you're doing this")).toBeLessThan(
      rendered.indexOf("Begin Flare Plan"),
    );
  });

  it("hides empty reminder labels when only one saved recovery field exists", async () => {
    const view = renderFlareResponse({
      anchorNote: {
        interruptionReasons: "",
        continuingCosts: "If I keep going, I lose the rest of tonight.",
        groundedReminders: "",
        emergencyActions: "",
        supportivePhrase: "Pause now.",
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

    await waitFor(() => {
      expect(view.getByText("If I continue...")).toBeTruthy();
    });

    expect(view.queryByText("Why")).toBeNull();
    expect(view.getByText("If I keep going, I lose the rest of tonight.")).toBeTruthy();
  });

  it("keeps recovery content available without falsely reporting support success on delivery failure", async () => {
    const view = renderFlareResponse({
      anchorNote: {
        interruptionReasons: "Remember what matters tonight.",
        continuingCosts: "",
        groundedReminders: "",
        emergencyActions: "",
        supportivePhrase: "Pause now.",
      },
      externalSupportState: {
        copy: "The support message did not go through, but your flare was still recorded here.",
        title: "Support message failed",
        tone: "warning",
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

    await waitFor(() => {
      expect(view.getByText("Support message failed")).toBeTruthy();
    });

    expect(view.queryByText("Support message sent")).toBeNull();
    expect(view.getByText("Remember why you're doing this")).toBeTruthy();
    expect(view.getByText("Begin Flare Plan")).toBeTruthy();
  });

  it("promotes checkpoint and hides repeated support delivery after the plan is completed", () => {
    const { getByText, queryByText, toJSON } = renderFlareResponse({
      externalSupportState: {
        copy: "Your saved support message was sent to the connected group.",
        title: "Support message sent",
        tone: "success",
      },
      flareEvent,
      run: {
        id: "run-1",
        flare_event_id: "event-1",
        source_plan_id: "plan-1",
        status: "completed",
        current_action: null,
        progress: {
          current_position: null,
          total_count: 2,
          done_count: 2,
          skipped_count: 0,
          not_reached_count: 0,
          pending_count: 0,
        },
        actions: [],
        offered_at: "2026-07-09T00:00:00Z",
        started_at: "2026-07-09T00:00:10Z",
        declined_at: null,
        completed_at: "2026-07-09T00:00:20Z",
        ended_at: null,
        updated_at: "2026-07-09T00:00:20Z",
      },
    });

    expect(getByText("Checkpoint / Reflection")).toBeTruthy();
    expect(getByText("Flare Plan complete")).toBeTruthy();
    expect(queryByText("Support message sent")).toBeNull();

    const rendered = JSON.stringify(toJSON());
    expect(rendered.indexOf("Checkpoint / Reflection")).toBeLessThan(
      rendered.indexOf("Flare Plan complete"),
    );
    expect(queryByText("Remember why you're doing this")).toBeNull();
    expect(queryByText("Anchor Note")).toBeNull();
  });

  it("makes checkpoint the primary post-plan action after the plan is skipped", () => {
    const { getByText, queryByText, toJSON } = renderFlareResponse({
      run: {
        id: "run-1",
        flare_event_id: "event-1",
        source_plan_id: "plan-1",
        status: "declined",
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
        declined_at: "2026-07-09T00:00:20Z",
        completed_at: null,
        ended_at: null,
        updated_at: "2026-07-09T00:00:20Z",
      },
    });

    expect(getByText("Checkpoint / Reflection")).toBeTruthy();
    expect(getByText("Flare Plan skipped for now")).toBeTruthy();
    expect(queryByText("Remember why you're doing this")).toBeNull();

    const rendered = JSON.stringify(toJSON());
    expect(rendered.indexOf("Checkpoint / Reflection")).toBeLessThan(
      rendered.indexOf("Flare Plan skipped for now"),
    );
  });
});
