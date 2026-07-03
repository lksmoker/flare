import {
  createAnchorNoteRepository,
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

describe("anchorNoteRepository queries", () => {
  it("loads only the authenticated user's active non-archived note", async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const limit = jest.fn().mockReturnValue({ maybeSingle });
    const order = jest.fn().mockReturnValue({ limit });
    const is = jest.fn().mockReturnValue({ order });
    const eqStatus = jest.fn().mockReturnValue({ is });
    const eqUser = jest.fn().mockReturnValue({ eq: eqStatus });
    const select = jest.fn().mockReturnValue({ eq: eqUser });
    const from = jest.fn().mockReturnValue({ select });
    const repository = createAnchorNoteRepository({ from } as never);

    await repository.loadActiveAnchorNote("user-123");

    expect(from).toHaveBeenCalledWith("anchor_notes");
    expect(eqUser).toHaveBeenCalledWith("user_id", "user-123");
    expect(eqStatus).toHaveBeenCalledWith("status", "active");
    expect(is).toHaveBeenCalledWith("archived_at", null);
    expect(order).toHaveBeenCalledWith("updated_at", { ascending: false });
    expect(limit).toHaveBeenCalledWith(1);
  });

  it("updates only the matching record for the authenticated user", async () => {
    const single = jest.fn().mockResolvedValue({
      data: {
        archived_at: null,
        costs_of_continuing: "I will be foggy tomorrow.",
        created_at: "2026-07-02T01:00:00.000Z",
        emergency_actions: "Leave the room and drink water.",
        future_self_message: null,
        grounded_self_reminder: "The urge peaks fast.",
        id: "anchor-1",
        notes: null,
        reasons_to_interrupt: "I want tomorrow morning back.",
        status: "active",
        supportive_phrase: "Pause now. Protect tomorrow.",
        updated_at: "2026-07-02T01:06:00.000Z",
        user_id: "user-123",
        version: 4,
      },
      error: null,
    });
    const select = jest.fn().mockReturnValue({ single });
    const eqUser = jest.fn().mockReturnValue({ select });
    const eqId = jest.fn().mockReturnValue({ eq: eqUser });
    const update = jest.fn().mockReturnValue({ eq: eqId });
    const from = jest.fn().mockReturnValue({ update });
    const repository = createAnchorNoteRepository({ from } as never);

    await repository.saveAnchorNote({
      anchorNote: {
        interruptionReasons: "I want tomorrow morning back.",
        continuingCosts: "I will be foggy tomorrow.",
        groundedReminders: "The urge peaks fast.",
        emergencyActions: "Leave the room and drink water.",
        supportivePhrase: "Pause now. Protect tomorrow.",
      },
      currentRecordId: "anchor-1",
      currentVersion: 3,
      userId: "user-123",
    });

    expect(update).toHaveBeenCalledWith({
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
    expect(eqId).toHaveBeenCalledWith("id", "anchor-1");
    expect(eqUser).toHaveBeenCalledWith("user_id", "user-123");
  });
});
