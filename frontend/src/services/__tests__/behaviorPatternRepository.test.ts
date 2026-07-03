import {
  createBehaviorPatternRepository,
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

describe("behaviorPatternRepository queries", () => {
  it("loads only the authenticated user's active non-archived pattern", async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const limit = jest.fn().mockReturnValue({ maybeSingle });
    const order = jest.fn().mockReturnValue({ limit });
    const is = jest.fn().mockReturnValue({ order });
    const eqStatus = jest.fn().mockReturnValue({ is });
    const eqUser = jest.fn().mockReturnValue({ eq: eqStatus });
    const select = jest.fn().mockReturnValue({ eq: eqUser });
    const from = jest.fn().mockReturnValue({ select });
    const repository = createBehaviorPatternRepository({ from } as never);

    await repository.loadActiveBehaviorPattern("user-123");

    expect(from).toHaveBeenCalledWith("behavior_patterns");
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
        common_triggers: null,
        created_at: "2026-07-02T01:00:00.000Z",
        description: null,
        id: "pattern-1",
        is_primary: true,
        label: "Weekend drinking",
        preferred_recovery_actions: "Leave the bar and call my brother.",
        risk_times_or_situations: null,
        status: "active",
        updated_at: "2026-07-02T01:05:00.000Z",
        user_id: "user-123",
      },
      error: null,
    });
    const select = jest.fn().mockReturnValue({ single });
    const eqUser = jest.fn().mockReturnValue({ select });
    const eqId = jest.fn().mockReturnValue({ eq: eqUser });
    const update = jest.fn().mockReturnValue({ eq: eqId });
    const from = jest.fn().mockReturnValue({ update });
    const repository = createBehaviorPatternRepository({ from } as never);

    await repository.saveBehaviorPattern({
      behaviorPattern: {
        behaviorName: "Weekend drinking",
        shortDescription: "",
        commonTriggers: "",
        riskTimesOrSituations: "",
        preferredRecoveryActions: "Leave the bar and call my brother.",
      },
      currentRecordId: "pattern-1",
      userId: "user-123",
    });

    expect(update).toHaveBeenCalledWith({
      archived_at: null,
      common_triggers: null,
      description: null,
      is_primary: true,
      label: "Weekend drinking",
      preferred_recovery_actions: "Leave the bar and call my brother.",
      risk_times_or_situations: null,
      status: "active",
      user_id: "user-123",
    });
    expect(eqId).toHaveBeenCalledWith("id", "pattern-1");
    expect(eqUser).toHaveBeenCalledWith("user_id", "user-123");
  });
});
