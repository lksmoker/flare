import { render } from "@testing-library/react-native";

import { FlareResponse } from "../FlareResponse";
import { AnchorNoteProvider } from "../../state/AnchorNoteContext";
import type { FlareEvent } from "../../state/FlareEventContext";
import type { FlarePlanRun } from "../../services/flareResponseApi";

function renderFlareResponse({
  externalSupportState = null,
  flareEvent = null,
  run = null,
}: {
  externalSupportState?: {
    copy: string;
    title: string;
    tone: "muted" | "success" | "warning";
  } | null;
  flareEvent?: FlareEvent | null;
  run?: FlarePlanRun | null;
}) {
  return render(
    <AnchorNoteProvider authState={{ kind: "no-session" }}>
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
  it("leads with support delivery and removes the old event card in the post-send state", () => {
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

    expect(getByText("Support message sent")).toBeTruthy();
    expect(getByText("Remember why you're doing this")).toBeTruthy();
    expect(getByText("Why")).toBeTruthy();
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
    expect(rendered.indexOf("Anchor Note")).toBeLessThan(
      rendered.indexOf("Checkpoint / Reflection"),
    );
    expect(rendered.indexOf("Checkpoint / Reflection")).toBeLessThan(
      rendered.indexOf("Flare Plan complete"),
    );
  });
});
