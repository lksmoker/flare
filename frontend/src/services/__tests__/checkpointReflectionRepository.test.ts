import { mapCheckpointReflectionInputToSupabaseMutation } from "../checkpointReflectionRepository";

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
