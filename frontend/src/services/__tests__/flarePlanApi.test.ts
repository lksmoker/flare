import {
  archiveFlarePlanAction,
  createCustomFlarePlanAction,
  createFlarePlanActionFromTemplate,
  FlarePlanApiError,
  getFlarePlan,
  getFlarePlanTemplates,
  reorderFlarePlanActions,
  updateFlarePlanAction,
} from "../flarePlanApi";

function createJsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as never;
}

describe("flarePlanApi", () => {
  const env = {
    EXPO_PUBLIC_FLARE_API_BASE_URL: "http://localhost",
  };

  it("loads the active plan through the shared API base path", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      createJsonResponse({
        plan: {
          id: "plan-1",
          is_configured: true,
          active_action_count: 1,
          maximum_active_actions: 10,
          actions: [
            {
              id: "action-1",
              source_template_key: null,
              title: "One",
              description: null,
              position: 1,
              is_active: true,
              created_at: "2026-07-08T00:00:00.000Z",
              updated_at: "2026-07-08T00:00:00.000Z",
            },
          ],
          updated_at: "2026-07-08T00:00:00.000Z",
        },
      }),
    );

    await expect(
      getFlarePlan({
        env,
        fetchImpl,
        getAccessToken: async () => "token-123",
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        active_action_count: 1,
        id: "plan-1",
        is_configured: true,
      }),
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://localhost/api/flare-plan",
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: "Bearer token-123",
        }),
        method: "GET",
      }),
    );
  });

  it("loads starter templates with the canonical selected flag", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      createJsonResponse({
        templates: [
          {
            template_key: "move_to_different_room",
            title: "Move to a different room",
            description: "Create some distance.",
            category: "change_the_situation",
            category_label: "Change the situation",
            display_position: 1,
            is_selected: false,
          },
        ],
      }),
    );

    await expect(
      getFlarePlanTemplates({
        env,
        fetchImpl,
        getAccessToken: async () => "token-123",
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        category_label: "Change the situation",
        is_selected: false,
        template_key: "move_to_different_room",
      }),
    ]);
  });

  it("sends Idempotency-Key on every mutation route", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          plan: {
            id: "plan-1",
            is_configured: true,
            active_action_count: 1,
            maximum_active_actions: 10,
            actions: [
              {
                id: "action-1",
                source_template_key: "move_to_different_room",
                title: "Move to a different room",
                description: null,
                position: 1,
                is_active: true,
                created_at: "2026-07-08T00:00:00.000Z",
                updated_at: "2026-07-08T00:00:00.000Z",
              },
            ],
            updated_at: "2026-07-08T00:00:00.000Z",
          },
          created_action_id: "action-1",
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          plan: {
            id: "plan-1",
            is_configured: true,
            active_action_count: 1,
            maximum_active_actions: 10,
            actions: [],
            updated_at: "2026-07-08T00:00:00.000Z",
          },
          created_action_id: "action-2",
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          plan: {
            id: "plan-1",
            is_configured: true,
            active_action_count: 1,
            maximum_active_actions: 10,
            actions: [],
            updated_at: "2026-07-08T00:00:00.000Z",
          },
          updated_action_id: "action-2",
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          plan: {
            id: "plan-1",
            is_configured: false,
            active_action_count: 0,
            maximum_active_actions: 10,
            actions: [],
            updated_at: "2026-07-08T00:00:00.000Z",
          },
          archived_action_id: "action-2",
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          plan: {
            id: "plan-1",
            is_configured: true,
            active_action_count: 2,
            maximum_active_actions: 10,
            actions: [],
            updated_at: "2026-07-08T00:00:00.000Z",
          },
        }),
      );

    const deps = {
      env,
      fetchImpl,
      getAccessToken: async () => "token-123",
    };

    await createFlarePlanActionFromTemplate(
      {
        idempotencyKey: "idem-1",
        templateKey: "move_to_different_room",
      },
      deps,
    );
    await createCustomFlarePlanAction(
      {
        idempotencyKey: "idem-2",
        title: "Custom action",
      },
      deps,
    );
    await updateFlarePlanAction(
      {
        actionId: "action-2",
        description: null,
        descriptionProvided: true,
        idempotencyKey: "idem-3",
        title: "Updated action",
        titleProvided: true,
      },
      deps,
    );
    await archiveFlarePlanAction(
      {
        actionId: "action-2",
        idempotencyKey: "idem-4",
      },
      deps,
    );
    await reorderFlarePlanActions(
      {
        actionIds: ["action-2", "action-1"],
        idempotencyKey: "idem-5",
      },
      deps,
    );

    expect(fetchImpl.mock.calls[0][1].headers).toEqual(
      expect.objectContaining({ "Idempotency-Key": "idem-1" }),
    );
    expect(fetchImpl.mock.calls[1][1].headers).toEqual(
      expect.objectContaining({ "Idempotency-Key": "idem-2" }),
    );
    expect(fetchImpl.mock.calls[2][1].headers).toEqual(
      expect.objectContaining({ "Idempotency-Key": "idem-3" }),
    );
    expect(fetchImpl.mock.calls[3][1].headers).toEqual(
      expect.objectContaining({ "Idempotency-Key": "idem-4" }),
    );
    expect(fetchImpl.mock.calls[4][1].headers).toEqual(
      expect.objectContaining({ "Idempotency-Key": "idem-5" }),
    );
  });

  it("preserves backend validation codes on mutation errors", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      createJsonResponse(
        {
          error: {
            code: "FLARE_PLAN_ACTION_TITLE_REQUIRED",
            message: "Action title is required.",
            details: {},
          },
        },
        422,
      ),
    );

    await expect(
      createCustomFlarePlanAction(
        {
          idempotencyKey: "idem-1",
          title: "",
        },
        {
          env,
          fetchImpl,
          getAccessToken: async () => "token-123",
        },
      ),
    ).rejects.toEqual(
      expect.objectContaining<Partial<FlarePlanApiError>>({
        code: "FLARE_PLAN_ACTION_TITLE_REQUIRED",
        message: "Action title is required.",
        statusCode: 422,
      }),
    );
  });

  it("maps malformed success payloads into the existing error model", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      createJsonResponse({
        plan: {
          id: "plan-1",
          actions: [],
        },
      }),
    );

    await expect(
      getFlarePlan({
        env,
        fetchImpl,
        getAccessToken: async () => "token-123",
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<FlarePlanApiError>>({
        code: "flare_plan_response_invalid",
      }),
    );
  });
});
