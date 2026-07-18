import {
  beginFlarePlanRun,
  createFlareResponse,
  getFlareResponse,
} from "../flareResponseApi";

function createJsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as never;
}

describe("flareResponseApi", () => {
  const env = {
    EXPO_PUBLIC_FLARE_API_BASE_URL: "http://localhost",
  };

  it("creates a flare event with the backend route and returns the offered run", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      createJsonResponse({
        flare_event: {
          id: "event-1",
          user_id: "user-1",
          status: "active",
          response_mode: "configured",
          behavior_label_snapshot: "Scrolling",
          behavior_description_snapshot: null,
          behavior_pattern_id: null,
          anchor_note_id: null,
          anchor_note_version: null,
          support_action_shown: null,
          support_action_taken: null,
          created_at: "2026-07-09T00:00:00Z",
          updated_at: "2026-07-09T00:00:00Z",
          closed_at: null,
          archived_at: null,
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
      }),
    );

    const created = await createFlareResponse(
      {
        behaviorLabelSnapshot: "Scrolling",
        responseMode: "configured",
        idempotencyKey: "send-1",
      },
      { env, fetchImpl, getAccessToken: async () => "token-123" },
    );

    expect(created.flareEvent.id).toBe("event-1");
    expect(created.run?.status).toBe("offered");
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://localhost/api/flare-events",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: "Bearer token-123",
          "Idempotency-Key": "send-1",
        }),
      }),
    );
    const request = fetchImpl.mock.calls[0][1];
    expect(JSON.parse(String(request.body))).toEqual(
      expect.not.objectContaining({
        idempotencyKey: expect.anything(),
        trace_id: expect.anything(),
      }),
    );
  });

  it("loads canonical response state from the response route and never hits a plain event-detail GET", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          response: {
            flare_event: {
              id: "event-1",
              user_id: "user-1",
              status: "active",
              response_mode: "configured",
              behavior_label_snapshot: "Scrolling",
              behavior_description_snapshot: null,
              behavior_pattern_id: null,
              anchor_note_id: null,
              anchor_note_version: null,
              support_action_shown: null,
              support_action_taken: null,
              created_at: "2026-07-09T00:00:00Z",
              updated_at: "2026-07-09T00:00:00Z",
              closed_at: null,
              archived_at: null,
            },
            support_delivery: null,
            run: null,
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          run: {
            id: "run-1",
            flare_event_id: "event-1",
            source_plan_id: "plan-1",
            status: "in_progress",
            current_action: {
              id: "event-action-1",
              source_action_id: "action-1",
              source_template_key: null,
              title: "First",
              description: null,
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
            started_at: "2026-07-09T00:01:00Z",
            declined_at: null,
            completed_at: null,
            ended_at: null,
            updated_at: "2026-07-09T00:01:00Z",
          },
        }),
      );

    const state = await getFlareResponse("event-1", {
      env,
      fetchImpl,
      getAccessToken: async () => "token-123",
    });
    const run = await beginFlarePlanRun("run-1", "begin-1", {
      env,
      fetchImpl,
      getAccessToken: async () => "token-123",
    });

    expect(state.flareEvent.id).toBe("event-1");
    expect(run?.status).toBe("in_progress");
    expect(fetchImpl.mock.calls[0][0]).toBe(
      "http://localhost/api/flare-events/event-1/response",
    );
    expect(fetchImpl.mock.calls[0][0]).not.toBe(
      "http://localhost/api/flare-events/event-1",
    );
    expect(fetchImpl.mock.calls[1][0]).toBe(
      "http://localhost/api/flare-plan-runs/run-1/begin",
    );
  });
});
