import {
  mapCreateFlareEventInputToSupabaseMutation,
  mapFlareEventRowToRecord,
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
});
