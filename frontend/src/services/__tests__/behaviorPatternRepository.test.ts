import {
  mapBehaviorPatternRowToRecord,
  mapBehaviorPatternToSupabaseMutation,
} from "../behaviorPatternRepository";

describe("behaviorPatternRepository mappings", () => {
  it("maps app data to the behavior_patterns row shape", () => {
    expect(
      mapBehaviorPatternToSupabaseMutation("user-123", {
        behaviorName: " Evening doomscrolling ",
        shortDescription: " I keep opening feeds when I feel numb. ",
        commonTriggers: " Stress after work ",
        riskTimesOrSituations: " Late nights ",
        preferredRecoveryActions:
          " Put the phone in another room and walk outside ",
      }),
    ).toEqual({
      archived_at: null,
      common_triggers: "Stress after work",
      description: "I keep opening feeds when I feel numb.",
      is_primary: true,
      label: "Evening doomscrolling",
      preferred_recovery_actions:
        "Put the phone in another room and walk outside",
      risk_times_or_situations: "Late nights",
      status: "active",
      user_id: "user-123",
    });
  });

  it("maps Supabase rows back to app data", () => {
    expect(
      mapBehaviorPatternRowToRecord({
        archived_at: null,
        common_triggers: "Stress after work",
        created_at: "2026-06-28T01:00:00.000Z",
        description: "I keep opening feeds when I feel numb.",
        id: "pattern-1",
        is_primary: true,
        label: "Evening doomscrolling",
        preferred_recovery_actions:
          "Put the phone in another room and walk outside",
        risk_times_or_situations: "Late nights",
        status: "active",
        updated_at: "2026-06-28T02:00:00.000Z",
        user_id: "user-123",
      }),
    ).toEqual({
      behaviorPattern: {
        behaviorName: "Evening doomscrolling",
        shortDescription: "I keep opening feeds when I feel numb.",
        commonTriggers: "Stress after work",
        riskTimesOrSituations: "Late nights",
        preferredRecoveryActions:
          "Put the phone in another room and walk outside",
      },
      createdAt: "2026-06-28T01:00:00.000Z",
      id: "pattern-1",
      updatedAt: "2026-06-28T02:00:00.000Z",
      userId: "user-123",
    });
  });
});
