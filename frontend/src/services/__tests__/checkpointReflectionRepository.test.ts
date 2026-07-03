import {
  createCheckpointReflectionRepository,
  mapCheckpointReflectionInputToSupabaseMutation,
} from "../checkpointReflectionRepository";

describe("checkpointReflectionRepository mappings", () => {
  it("maps app data to the checkpoint_reflections row shape", () => {
    expect(
      mapCheckpointReflectionInputToSupabaseMutation({
        checkpointReflection: {
          actionTaken: " Left the room. ",
          howIFeelNow: " More steady. ",
          note: " The first minute was hard. ",
          outcome: " Avoided ",
          whatHappened: " The urge hit after work. ",
          whatHelped: " Cold water and fresh air. ",
        },
        flareEventId: "event-1",
        userId: "user-123",
      }),
    ).toEqual({
      action_taken: "Left the room.",
      flare_event_id: "event-1",
      how_i_feel_now: "More steady.",
      note: "The first minute was hard.",
      outcome: "avoided",
      user_id: "user-123",
      what_happened: "The urge hit after work.",
      what_helped: "Cold water and fresh air.",
    });
  });

  it("falls back to 'unclear' for freeform outcomes outside the allowed vocabulary", () => {
    expect(
      mapCheckpointReflectionInputToSupabaseMutation({
        checkpointReflection: {
          howIFeelNow: "More steady.",
          note: "",
          outcome: "Urge dropped enough to keep moving",
          whatHappened: "The urge hit after work.",
          whatHelped: "Cold water and fresh air.",
        },
        flareEventId: "event-1",
        userId: "user-123",
      }).outcome,
    ).toBe("unclear");
  });
});

describe("checkpointReflectionRepository queries", () => {
  it("writes the reflection with the authenticated user's ownership fields", async () => {
    const single = jest.fn().mockResolvedValue({
      data: {
        action_taken: null,
        created_at: "2026-07-02T02:04:00.000Z",
        flare_event_id: "event-1",
        how_i_feel_now: "Less flooded and more steady.",
        id: "reflection-1",
        note: "The first minute was the hardest part.",
        outcome: "avoided",
        updated_at: "2026-07-02T02:04:00.000Z",
        user_id: "user-123",
        what_happened: "I felt the spike right after finishing work.",
        what_helped: "I left the room and drank cold water.",
      },
      error: null,
    });
    const select = jest.fn().mockReturnValue({ single });
    const insert = jest.fn().mockReturnValue({ select });
    const from = jest.fn().mockReturnValue({ insert });
    const repository = createCheckpointReflectionRepository({ from } as never);

    await repository.saveCheckpointReflection({
      checkpointReflection: {
        howIFeelNow: "Less flooded and more steady.",
        note: "The first minute was the hardest part.",
        outcome: "avoided",
        whatHappened: "I felt the spike right after finishing work.",
        whatHelped: "I left the room and drank cold water.",
      },
      flareEventId: "event-1",
      userId: "user-123",
    });

    expect(from).toHaveBeenCalledWith("checkpoint_reflections");
    expect(insert).toHaveBeenCalledWith({
      action_taken: null,
      flare_event_id: "event-1",
      how_i_feel_now: "Less flooded and more steady.",
      note: "The first minute was the hardest part.",
      outcome: "avoided",
      user_id: "user-123",
      what_happened: "I felt the spike right after finishing work.",
      what_helped: "I left the room and drank cold water.",
    });
  });
});
