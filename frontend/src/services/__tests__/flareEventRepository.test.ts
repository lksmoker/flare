import {
  createFlareEventRepository,
  mapArchiveFlareEventInputToSupabaseMutation,
  mapCreateFlareEventInputToSupabaseMutation,
  mapFlareEventRowToRecord,
  mapRestoreFlareEventInputToSupabaseMutation,
  mapUpdateFlareEventStatusInputToSupabaseMutation,
} from "../flareEventRepository";

describe("flareEventRepository mappings", () => {
  it("maps app data to the flare_events row shape", () => {
    expect(
      mapCreateFlareEventInputToSupabaseMutation({
        anchorNoteId: "anchor-1",
        anchorNoteVersion: 3,
        behaviorDescriptionSnapshot: " I reach for feeds when I feel numb. ",
        behaviorLabelSnapshot: " Evening doomscrolling ",
        behaviorPatternId: "pattern-1",
        responseMode: "configured",
        supportActionShown: " Leave the phone in the kitchen. ",
        supportActionTaken: " Walked outside. ",
        userId: "user-123",
      }),
    ).toEqual({
      anchor_note_id: "anchor-1",
      anchor_note_version: 3,
      behavior_description_snapshot: "I reach for feeds when I feel numb.",
      behavior_label_snapshot: "Evening doomscrolling",
      behavior_pattern_id: "pattern-1",
      response_mode: "configured",
      status: "active",
      support_action_shown: "Leave the phone in the kitchen.",
      support_action_taken: "Walked outside.",
      user_id: "user-123",
    });
  });

  it("maps Supabase rows back to app data with an attached reflection", () => {
    expect(
      mapFlareEventRowToRecord({
        anchor_note_id: "anchor-1",
        anchor_note_version: 3,
        archived_at: null,
        behavior_description_snapshot: "I reach for feeds when I feel numb.",
        behavior_label_snapshot: "Evening doomscrolling",
        behavior_pattern_id: "pattern-1",
        checkpoint_reflections: [
          {
            action_taken: null,
            created_at: "2026-07-02T01:30:00.000Z",
            flare_event_id: "event-1",
            how_i_feel_now: "Steadier.",
            id: "reflection-1",
            note: "The first minute was the hardest.",
            outcome: "avoided",
            updated_at: "2026-07-02T01:35:00.000Z",
            user_id: "user-123",
            what_happened: "I opened the app right after work.",
            what_helped: "Cold water and leaving the room.",
          },
        ],
        closed_at: null,
        created_at: "2026-07-02T01:00:00.000Z",
        id: "event-1",
        response_mode: "configured",
        status: "reflected",
        support_action_shown: "Leave the phone in the kitchen.",
        support_action_taken: null,
        updated_at: "2026-07-02T01:35:00.000Z",
        user_id: "user-123",
      }),
    ).toEqual({
      createdAt: "2026-07-02T01:00:00.000Z",
      flareEvent: {
        anchorNoteId: "anchor-1",
        anchorNoteVersion: 3,
        archivedAt: null,
        behaviorDescriptionSnapshot: "I reach for feeds when I feel numb.",
        behaviorLabelSnapshot: "Evening doomscrolling",
        behaviorPatternId: "pattern-1",
        checkpoint: {
          actionTaken: "",
          createdAt: "2026-07-02T01:30:00.000Z",
          howIFeelNow: "Steadier.",
          id: "reflection-1",
          note: "The first minute was the hardest.",
          outcome: "avoided",
          updatedAt: "2026-07-02T01:35:00.000Z",
          userId: "user-123",
          whatHappened: "I opened the app right after work.",
          whatHelped: "Cold water and leaving the room.",
        },
        closedAt: null,
        createdAt: "2026-07-02T01:00:00.000Z",
        id: "event-1",
        responseMode: "configured",
        status: "reflected",
        supportActionShown: "Leave the phone in the kitchen.",
        supportActionTaken: null,
        updatedAt: "2026-07-02T01:35:00.000Z",
        userId: "user-123",
      },
      id: "event-1",
      updatedAt: "2026-07-02T01:35:00.000Z",
      userId: "user-123",
    });
  });

  it("maps event status updates to the flare_events row shape", () => {
    expect(
      mapUpdateFlareEventStatusInputToSupabaseMutation({
        closedAt: "2026-07-02T02:00:00.000Z",
        eventId: "event-1",
        status: "closed",
        supportActionTaken: "Walked outside.",
        userId: "user-123",
      }),
    ).toEqual({
      closed_at: "2026-07-02T02:00:00.000Z",
      status: "closed",
      support_action_taken: "Walked outside.",
    });
  });

  it("maps archive and restore mutations to the flare_events row shape", () => {
    expect(
      mapArchiveFlareEventInputToSupabaseMutation({
        archivedAt: "2026-07-02T03:00:00.000Z",
        eventId: "event-1",
        userId: "user-123",
      }),
    ).toEqual({
      archived_at: "2026-07-02T03:00:00.000Z",
    });

    expect(mapRestoreFlareEventInputToSupabaseMutation()).toEqual({
      archived_at: null,
    });
  });
});

describe("flareEventRepository queries", () => {
  it("archives only the authenticated user's matching flare event", async () => {
    const single = jest.fn().mockResolvedValue({
      data: {
        anchor_note_id: null,
        anchor_note_version: null,
        archived_at: "2026-07-02T03:00:00.000Z",
        behavior_description_snapshot: null,
        behavior_label_snapshot: "Evening doomscrolling",
        behavior_pattern_id: null,
        checkpoint_reflections: [],
        closed_at: null,
        created_at: "2026-07-02T01:00:00.000Z",
        id: "event-1",
        response_mode: "fallback-generic",
        status: "active",
        support_action_shown: null,
        support_action_taken: null,
        updated_at: "2026-07-02T03:00:00.000Z",
        user_id: "user-123",
      },
      error: null,
    });
    const select = jest.fn().mockReturnValue({ single });
    const eqUser = jest.fn().mockReturnValue({ select });
    const eqId = jest.fn().mockReturnValue({ eq: eqUser });
    const update = jest.fn().mockReturnValue({ eq: eqId });
    const from = jest.fn().mockReturnValue({ update });
    const repository = createFlareEventRepository({ from } as never);

    await repository.archiveFlareEvent({
      archivedAt: "2026-07-02T03:00:00.000Z",
      eventId: "event-1",
      userId: "user-123",
    });

    expect(from).toHaveBeenCalledWith("flare_events");
    expect(update).toHaveBeenCalledWith({
      archived_at: "2026-07-02T03:00:00.000Z",
    });
    expect(eqId).toHaveBeenCalledWith("id", "event-1");
    expect(eqUser).toHaveBeenCalledWith("user_id", "user-123");
  });

  it("restores a flare event by clearing archived_at", async () => {
    const single = jest.fn().mockResolvedValue({
      data: {
        anchor_note_id: null,
        anchor_note_version: null,
        archived_at: null,
        behavior_description_snapshot: null,
        behavior_label_snapshot: "Evening doomscrolling",
        behavior_pattern_id: null,
        checkpoint_reflections: [],
        closed_at: null,
        created_at: "2026-07-02T01:00:00.000Z",
        id: "event-1",
        response_mode: "fallback-generic",
        status: "active",
        support_action_shown: null,
        support_action_taken: null,
        updated_at: "2026-07-02T03:15:00.000Z",
        user_id: "user-123",
      },
      error: null,
    });
    const select = jest.fn().mockReturnValue({ single });
    const eqUser = jest.fn().mockReturnValue({ select });
    const eqId = jest.fn().mockReturnValue({ eq: eqUser });
    const update = jest.fn().mockReturnValue({ eq: eqId });
    const from = jest.fn().mockReturnValue({ update });
    const repository = createFlareEventRepository({ from } as never);

    const restored = await repository.restoreFlareEvent({
      eventId: "event-1",
      userId: "user-123",
    });

    expect(update).toHaveBeenCalledWith({ archived_at: null });
    expect(restored.flareEvent.archivedAt).toBeNull();
  });

  it("excludes archived events by default and skips that filter when requested", async () => {
    const is = jest.fn().mockResolvedValue({ data: [], error: null });
    const orderDefault = jest.fn().mockReturnValue({ is });
    const eqDefault = jest.fn().mockReturnValue({ order: orderDefault });
    const selectDefault = jest.fn().mockReturnValue({ eq: eqDefault });
    const fromDefault = jest.fn().mockReturnValue({ select: selectDefault });
    const repositoryDefault = createFlareEventRepository({
      from: fromDefault,
    } as never);

    await repositoryDefault.loadFlareEvents("user-123");

    expect(is).toHaveBeenCalledWith("archived_at", null);

    const orderAll = jest.fn().mockResolvedValue({ data: [], error: null });
    const eqAll = jest.fn().mockReturnValue({ order: orderAll });
    const selectAll = jest.fn().mockReturnValue({ eq: eqAll });
    const fromAll = jest.fn().mockReturnValue({ select: selectAll });
    const repositoryAll = createFlareEventRepository({ from: fromAll } as never);

    await repositoryAll.loadFlareEvents("user-123", { includeArchived: true });

    expect(orderAll).toHaveBeenCalledWith("created_at", { ascending: false });
  });
});
