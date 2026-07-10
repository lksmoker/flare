import { act, render, waitFor } from "@testing-library/react-native";
import { PropsWithChildren, StrictMode } from "react";
import { Text } from "react-native";

import type {
  ActiveFlarePlan,
  SavedFlarePlanAction,
  StarterTemplate,
} from "../../services/flarePlanApi";
import { FlareAuthProvider } from "../FlareAuthContext";
import {
  FlarePlanProvider,
  type FlarePlanRepository,
  useFlarePlan,
} from "../FlarePlanContext";

function createAction(
  id: string,
  title: string,
  position: number,
  overrides?: Partial<SavedFlarePlanAction>,
): SavedFlarePlanAction {
  return {
    id,
    source_template_key: null,
    title,
    description: null,
    position,
    is_active: true,
    created_at: "2026-07-08T00:00:00.000Z",
    updated_at: `2026-07-08T00:00:0${position}.000Z`,
    ...overrides,
  };
}

function createPlan(actions: SavedFlarePlanAction[]): ActiveFlarePlan {
  return {
    id: "plan-1",
    is_configured: actions.length > 0,
    active_action_count: actions.length,
    maximum_active_actions: 10,
    actions,
    updated_at: "2026-07-08T00:00:00.000Z",
  };
}

function createTemplate(
  templateKey: string,
  title: string,
  overrides?: Partial<StarterTemplate>,
): StarterTemplate {
  return {
    template_key: templateKey,
    title,
    description: `${title} description`,
    category: "change_the_situation",
    category_label: "Change the situation",
    display_position: 1,
    is_selected: false,
    ...overrides,
  };
}

type MutableRepository = FlarePlanRepository & {
  loadPlan: jest.Mock<Promise<ActiveFlarePlan>, []>;
  loadTemplates: jest.Mock<Promise<StarterTemplate[]>, []>;
};

function createRepository(options?: {
  initialPlan?: ActiveFlarePlan;
  initialTemplates?: StarterTemplate[];
}) {
  let plan = options?.initialPlan ?? createPlan([]);
  const templates =
    options?.initialTemplates ??
    [createTemplate("move_to_different_room", "Move to a different room")];

  const repository: MutableRepository = {
    archiveAction: jest.fn(async ({ actionId }) => {
      plan = createPlan(plan.actions.filter((action) => action.id !== actionId));
      return {
        archived_action_id: actionId,
        plan,
      };
    }),
    createActionFromTemplate: jest.fn(async ({ templateKey }) => {
      const template = templates.find(
        (candidate) => candidate.template_key === templateKey,
      );

      if (!template) {
        throw new Error("Missing template");
      }

      const nextAction = createAction(
        `action-${plan.actions.length + 1}`,
        template.title,
        plan.actions.length + 1,
        {
          description: template.description,
          source_template_key: template.template_key,
        },
      );
      plan = createPlan([...plan.actions, nextAction]);
      return {
        created_action_id: nextAction.id,
        plan,
      };
    }),
    createCustomAction: jest.fn(async ({ description, title }) => {
      const nextAction = createAction(
        `action-${plan.actions.length + 1}`,
        title.trim(),
        plan.actions.length + 1,
        {
          description: description?.trim() || null,
        },
      );
      plan = createPlan([...plan.actions, nextAction]);
      return {
        created_action_id: nextAction.id,
        plan,
      };
    }),
    loadPlan: jest.fn(async () => plan),
    loadTemplates: jest.fn(async () => templates),
    reorderActions: jest.fn(async ({ actionIds }) => {
      plan = createPlan(
        actionIds.map((actionId, index) => {
          const action = plan.actions.find((candidate) => candidate.id === actionId);

          if (!action) {
            throw new Error("Missing action");
          }

          return {
            ...action,
            position: index + 1,
          };
        }),
      );
      return { plan };
    }),
    updateAction: jest.fn(async (input) => {
      plan = createPlan(
        plan.actions.map((action) =>
          action.id === input.actionId
            ? {
                ...action,
                title:
                  input.titleProvided && typeof input.title === "string"
                    ? input.title.trim()
                    : action.title,
                description: input.descriptionProvided
                  ? input.description ?? null
                  : action.description,
              }
            : action,
        ),
      );
      return {
        plan,
        updated_action_id: input.actionId,
      };
    }),
  };

  return repository;
}

let latestContext: ReturnType<typeof useFlarePlan> | null = null;

function Probe({ tick }: { tick: number }) {
  latestContext = useFlarePlan();
  const actionCount = latestContext.plan?.active_action_count ?? 0;

  return <Text>{`tick:${tick} actions:${actionCount}`}</Text>;
}

function renderWithProviders(
  repository: FlarePlanRepository,
  options?: {
    authState?: {
      kind: "authenticated";
      userEmail: string;
      userId: string;
    } | {
      kind: "no-session";
    };
    strictMode?: boolean;
    tick?: number;
  },
) {
  const content = <Probe tick={options?.tick ?? 0} />;

  const tree = options?.strictMode ? <StrictMode>{content}</StrictMode> : content;

  return render(tree, {
    wrapper({ children }: PropsWithChildren) {
      return (
        <FlareAuthProvider
          initialAuthState={
            options?.authState ?? {
              kind: "authenticated",
              userEmail: "flare@example.com",
              userId: "user-123",
            }
          }
          resolveAuthState={async () =>
            options?.authState ?? {
              kind: "authenticated",
              userEmail: "flare@example.com",
              userId: "user-123",
            }
          }
          subscribe={() => null}
        >
          <FlarePlanProvider flarePlanRepository={repository}>
            {children}
          </FlarePlanProvider>
        </FlareAuthProvider>
      );
    },
  });
}

async function waitForPlanLoad(repository: MutableRepository) {
  await waitFor(() => {
    expect(repository.loadPlan).toHaveBeenCalledTimes(1);
    expect(latestContext?.plan?.id).toBe("plan-1");
  });
}

describe("FlarePlanProvider loading behavior", () => {
  afterEach(() => {
    latestContext = null;
    jest.useRealTimers();
  });

  it("loads the plan once on mount, does not load templates eagerly, and does not poll", async () => {
    jest.useFakeTimers();
    const repository = createRepository();
    const rendered = renderWithProviders(repository);

    await waitForPlanLoad(repository);
    expect(repository.loadTemplates).not.toHaveBeenCalled();

    rendered.rerender(<Probe tick={1} />);

    await waitFor(() => {
      expect(repository.loadPlan).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      jest.advanceTimersByTime(10_000);
    });

    expect(repository.loadPlan).toHaveBeenCalledTimes(1);
    expect(repository.loadTemplates).not.toHaveBeenCalled();
  });

  it("uses the built-in default plan and blocks editing while signed out", async () => {
    const repository = createRepository();

    renderWithProviders(repository, {
      authState: { kind: "no-session" },
    });

    await waitFor(() => {
      expect(latestContext?.isUsingBuiltInDefaultPlan).toBe(true);
      expect(latestContext?.canEditPlan).toBe(false);
      expect(latestContext?.plan?.active_action_count).toBe(4);
    });

    expect(repository.loadPlan).not.toHaveBeenCalled();

    await act(async () => {
      await latestContext?.createCustomAction({
        description: "desc",
        title: "title",
      });
    });

    expect(repository.createCustomAction).not.toHaveBeenCalled();
    expect(latestContext?.errorBanner?.code).toBe("auth_session_missing");
  });

  it("loads templates once when requested and dedupes concurrent reads", async () => {
    const repository = createRepository();
    let resolveTemplates: ((value: StarterTemplate[]) => void) | null = null;
    repository.loadTemplates.mockImplementation(
      () =>
        new Promise<StarterTemplate[]>((resolve) => {
          resolveTemplates = resolve;
        }),
    );

    renderWithProviders(repository);
    await waitForPlanLoad(repository);

    await act(async () => {
      void latestContext?.ensureTemplatesLoaded();
      void latestContext?.ensureTemplatesLoaded();
    });

    expect(repository.loadTemplates).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveTemplates?.([createTemplate("move_to_different_room", "Move to a different room")]);
    });

    await waitFor(() => {
      expect(latestContext?.templates).toHaveLength(1);
    });

    await act(async () => {
      await latestContext?.ensureTemplatesLoaded();
    });

    expect(repository.loadTemplates).toHaveBeenCalledTimes(1);
  });

  it("uses mutation responses as authoritative and does not refetch plan or templates", async () => {
    const repository = createRepository({
      initialPlan: createPlan([
        createAction("action-1", "Existing action", 1, {
          source_template_key: "move_to_different_room",
        }),
      ]),
      initialTemplates: [
        createTemplate("move_to_different_room", "Move to a different room"),
      ],
    });

    renderWithProviders(repository);
    await waitForPlanLoad(repository);

    await act(async () => {
      await latestContext?.ensureTemplatesLoaded();
    });

    expect(repository.loadTemplates).toHaveBeenCalledTimes(1);
    expect(latestContext?.templates[0]?.is_selected).toBe(true);

    await act(async () => {
      await latestContext?.saveAction({
        actionId: "action-1",
        description: "Updated description",
        title: "Updated action",
      });
      await latestContext?.createCustomAction({
        description: "Custom description",
        title: "Custom action",
      });
      await latestContext?.archiveAction("action-1");
    });

    await waitFor(() => {
      expect(latestContext?.plan?.active_action_count).toBe(1);
    });

    expect(repository.loadPlan).toHaveBeenCalledTimes(1);
    expect(repository.loadTemplates).toHaveBeenCalledTimes(1);
    expect(latestContext?.templates[0]?.is_selected).toBe(false);
  });

  it("cleans up unmount and remount lifecycles without duplicate recurring reads", async () => {
    const repository = createRepository();
    const firstRender = renderWithProviders(repository);

    await waitForPlanLoad(repository);
    await act(async () => {
      await latestContext?.ensureTemplatesLoaded();
    });
    expect(repository.loadTemplates).toHaveBeenCalledTimes(1);

    firstRender.unmount();
    latestContext = null;

    renderWithProviders(repository, { strictMode: true });

    await waitFor(() => {
      expect(repository.loadPlan).toHaveBeenCalledTimes(2);
      expect(latestContext?.plan?.id).toBe("plan-1");
    });

    await act(async () => {
      await latestContext?.ensureTemplatesLoaded();
    });

    expect(repository.loadTemplates).toHaveBeenCalledTimes(2);
  });
});
