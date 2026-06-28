import {
  mapAnchorNoteRowToRecord,
  mapAnchorNoteToSupabaseMutation,
} from "../anchorNoteRepository";

describe("anchorNoteRepository mappings", () => {
  it("maps app data to the anchor_notes row shape", () => {
    expect(
      mapAnchorNoteToSupabaseMutation(
        "user-123",
        {
          interruptionReasons: " I want tomorrow morning back. ",
          continuingCosts: " I will be foggy tomorrow. ",
          groundedReminders: " The urge peaks fast. ",
          emergencyActions: " Leave the room and drink water. ",
          supportivePhrase: " Pause now. Protect tomorrow. ",
        },
        3,
      ),
    ).toEqual({
      archived_at: null,
      costs_of_continuing: "I will be foggy tomorrow.",
      emergency_actions: "Leave the room and drink water.",
      future_self_message: null,
      grounded_self_reminder: "The urge peaks fast.",
      notes: null,
      reasons_to_interrupt: "I want tomorrow morning back.",
      status: "active",
      supportive_phrase: "Pause now. Protect tomorrow.",
      user_id: "user-123",
      version: 4,
    });
  });

  it("maps Supabase rows back to app data", () => {
    expect(
      mapAnchorNoteRowToRecord({
        archived_at: null,
        costs_of_continuing: "I will be foggy tomorrow.",
        created_at: "2026-06-28T01:00:00.000Z",
        emergency_actions: "Leave the room and drink water.",
        future_self_message: null,
        grounded_self_reminder: "The urge peaks fast.",
        id: "anchor-1",
        notes: null,
        reasons_to_interrupt: "I want tomorrow morning back.",
        status: "active",
        supportive_phrase: "Pause now. Protect tomorrow.",
        updated_at: "2026-06-28T02:00:00.000Z",
        user_id: "user-123",
        version: 4,
      }),
    ).toEqual({
      anchorNote: {
        interruptionReasons: "I want tomorrow morning back.",
        continuingCosts: "I will be foggy tomorrow.",
        groundedReminders: "The urge peaks fast.",
        emergencyActions: "Leave the room and drink water.",
        supportivePhrase: "Pause now. Protect tomorrow.",
      },
      createdAt: "2026-06-28T01:00:00.000Z",
      id: "anchor-1",
      updatedAt: "2026-06-28T02:00:00.000Z",
      userId: "user-123",
      version: 4,
    });
  });
});
