import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { PropsWithChildren, ReactElement, ReactNode } from "react";
import { CustomizeScreen } from "../CustomizeScreen";
import { FlareScreen } from "../FlareScreen";
import type {
  BehaviorPatternRepository,
  PersistedBehaviorPattern,
} from "../../services/behaviorPatternRepository";
import type { AnchorNoteRepository } from "../../services/anchorNoteRepository";
import type { FlareEventRepository } from "../../services/flareEventRepository";
import * as supportChannelApi from "../../services/supportChannelApi";
import type {
  ActiveFlarePlan,
  SavedFlarePlanAction,
  StarterTemplate,
} from "../../services/flarePlanApi";
import { AnchorNoteProvider } from "../../state/AnchorNoteContext";
import { BehaviorPatternProvider } from "../../state/BehaviorPatternContext";
import { FlareAuthProvider } from "../../state/FlareAuthContext";
import { FlareEventProvider } from "../../state/FlareEventContext";
import {
  FlarePlanProvider,
  type FlarePlanRepository,
} from "../../state/FlarePlanContext";

jest.mock("expo-router", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  return {
    Link: ({ children }: { children: ReactNode }) => children,
    useFocusEffect(effect: () => void | (() => void)) {
      React.useEffect(() => effect(), [effect]);
    },
  };
});

type MutableFlarePlanRepository = FlarePlanRepository & {
  failNextReorder: boolean;
  lastArchiveInput: { actionId: string; idempotencyKey: string } | null;
  lastTemplateCreateInput: { idempotencyKey: string; templateKey: string } | null;
  lastUpdateInput: {
    actionId: string;
    description?: string | null;
    descriptionProvided?: boolean;
    idempotencyKey: string;
    title?: string;
    titleProvided?: boolean;
  } | null;
};

const anchorNoteRepository: AnchorNoteRepository = {
  loadActiveAnchorNote: jest.fn().mockResolvedValue(null),
  saveAnchorNote: jest.fn(),
};

const emptyBehaviorPatternRepository: BehaviorPatternRepository = {
  loadActiveBehaviorPattern: jest.fn().mockResolvedValue(null),
  saveBehaviorPattern: jest.fn(),
};

const flareEventRepository: FlareEventRepository = {
  archiveFlareEvent: jest.fn(),
  createFlareEvent: jest.fn(),
  loadFlareEvents: jest.fn().mockResolvedValue([]),
  restoreFlareEvent: jest.fn(),
  updateFlareEventStatus: jest.fn(),
};

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
  category: string,
  categoryLabel: string,
  displayPosition: number,
  overrides?: Partial<StarterTemplate>,
): StarterTemplate {
  return {
    template_key: templateKey,
    title,
    description: `${title} description`,
    category,
    category_label: categoryLabel,
    display_position: displayPosition,
    is_selected: false,
    ...overrides,
  };
}

function createFlarePlanRepositoryStub(options?: {
  initialPlan?: ActiveFlarePlan;
  initialTemplates?: StarterTemplate[];
  loadPlan?: () => Promise<ActiveFlarePlan>;
  loadTemplates?: () => Promise<StarterTemplate[]>;
}) {
  let plan = options?.initialPlan ?? createPlan([]);
  let templates =
    options?.initialTemplates ??
    [
      createTemplate(
        "move_to_different_room",
        "Move to a different room",
        "change_the_situation",
        "Change the situation",
        1,
      ),
      createTemplate(
        "drink_a_glass_of_water",
        "Drink a glass of water",
        "reset_your_body",
        "Reset your body",
        1,
      ),
    ];

  const repository: MutableFlarePlanRepository = {
    failNextReorder: false,
    lastArchiveInput: null,
    lastTemplateCreateInput: null,
    lastUpdateInput: null,
    async archiveAction(input) {
      repository.lastArchiveInput = input;
      const archivedAction =
        plan.actions.find((action) => action.id === input.actionId) ?? null;
      plan = createPlan(plan.actions.filter((action) => action.id !== input.actionId));
      templates = templates.map((template) =>
        template.template_key ===
        archivedAction?.source_template_key
          ? { ...template, is_selected: false }
          : template,
      );
      return {
        archived_action_id: input.actionId,
        plan,
      };
    },
    async createActionFromTemplate(input) {
      repository.lastTemplateCreateInput = input;
      const template = templates.find(
        (candidate) => candidate.template_key === input.templateKey,
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
      templates = templates.map((candidate) =>
        candidate.template_key === template.template_key
          ? { ...candidate, is_selected: true }
          : candidate,
      );
      return {
        created_action_id: nextAction.id,
        plan,
      };
    },
    async createCustomAction(input) {
      const nextAction = createAction(
        `action-${plan.actions.length + 1}`,
        input.title.trim(),
        plan.actions.length + 1,
        {
          description: input.description?.trim() || null,
        },
      );
      plan = createPlan([...plan.actions, nextAction]);
      return {
        created_action_id: nextAction.id,
        plan,
      };
    },
    async loadPlan() {
      if (options?.loadPlan) {
        return options.loadPlan();
      }
      return plan;
    },
    async loadTemplates() {
      if (options?.loadTemplates) {
        return options.loadTemplates();
      }
      return templates;
    },
    async reorderActions(input) {
      if (repository.failNextReorder) {
        repository.failNextReorder = false;
        throw new Error("reorder failed");
      }

      const nextActions = input.actionIds.map((actionId, index) => {
        const action = plan.actions.find((candidate) => candidate.id === actionId);

        if (!action) {
          throw new Error("missing action");
        }

        return {
          ...action,
          position: index + 1,
        };
      });
      plan = createPlan(nextActions);
      return { plan };
    },
    async updateAction(input) {
      repository.lastUpdateInput = input;
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
    },
  };

  return repository;
}

function renderWithProviders(
  ui: ReactElement,
  options?: {
    behaviorPatternRepository?: BehaviorPatternRepository;
    flarePlanRepository?: FlarePlanRepository;
  },
) {
  const flarePlanRepository =
    options?.flarePlanRepository ?? createFlarePlanRepositoryStub();
  const behaviorPatternRepository =
    options?.behaviorPatternRepository ?? emptyBehaviorPatternRepository;

  return render(ui, {
    wrapper({ children }: PropsWithChildren) {
      return (
        <FlareAuthProvider
          initialAuthState={{
            kind: "authenticated",
            userEmail: "flare@example.com",
            userId: "user-123",
          }}
          resolveAuthState={async () => ({
            kind: "authenticated",
            userEmail: "flare@example.com",
            userId: "user-123",
          })}
          subscribe={() => null}
        >
          <BehaviorPatternProvider
            behaviorPatternRepository={behaviorPatternRepository}
          >
            <AnchorNoteProvider anchorNoteRepository={anchorNoteRepository}>
              <FlarePlanProvider flarePlanRepository={flarePlanRepository}>
                <FlareEventProvider flareEventRepository={flareEventRepository}>
                  {children}
                </FlareEventProvider>
              </FlarePlanProvider>
            </AnchorNoteProvider>
          </BehaviorPatternProvider>
        </FlareAuthProvider>
      );
    },
  });
}

async function waitForCustomizePlanReady(getByText: (text: string) => unknown) {
  await waitFor(() => {
    expect(getByText("0 of 10 actions")).toBeTruthy();
  });
}

describe("Flare Plan Configure screen", () => {
  beforeEach(() => {
    jest.spyOn(supportChannelApi, "getSupportChannel").mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the empty plan and grouped starter templates in the modal", async () => {
    const repository = createFlarePlanRepositoryStub({
      initialTemplates: [
        createTemplate(
          "move_to_different_room",
          "Move to a different room",
          "change_the_situation",
          "Change the situation",
          1,
        ),
        createTemplate(
          "drink_a_glass_of_water",
          "Drink a glass of water",
          "reset_your_body",
          "Reset your body",
          1,
        ),
      ],
    });

    const { getByText, getAllByText } = renderWithProviders(<CustomizeScreen />, {
      flarePlanRepository: repository,
    });

    await waitForCustomizePlanReady(getByText);
    await act(async () => {
      fireEvent.press(getAllByText("Flare Plan")[0]);
    });

    await waitFor(() => {
      expect(getAllByText("No active actions yet").length).toBeGreaterThanOrEqual(1);
      expect(getByText("Change the situation")).toBeTruthy();
      expect(getByText("Reset your body")).toBeTruthy();
    });
  });

  it("selects a starter action once, disables double taps, and marks it added", async () => {
    let resolveCreate: (() => void) | null = null;
    const repository = createFlarePlanRepositoryStub();
    const originalCreate = repository.createActionFromTemplate;
    repository.createActionFromTemplate = jest.fn(async (input) => {
      await new Promise<void>((resolve) => {
        resolveCreate = resolve;
      });
      return originalCreate(input);
    });

    const { getAllByText, getByLabelText, getByText, queryByText } = renderWithProviders(
      <CustomizeScreen />,
      {
        flarePlanRepository: repository,
      },
    );

    await waitFor(() => {
      expect(getAllByText("0 of 10 actions").length).toBeGreaterThanOrEqual(1);
    });
    await act(async () => {
      fireEvent.press(getAllByText("Flare Plan")[0]);
    });

    const addStarter = await waitFor(() =>
      getByLabelText("Add starter action Move to a different room"),
    );
    fireEvent.press(addStarter);
    fireEvent.press(addStarter);

    expect(repository.createActionFromTemplate).toHaveBeenCalledTimes(1);
    expect(queryByText("Adding...")).toBeTruthy();

    await act(async () => {
      resolveCreate?.();
    });

    await waitFor(() => {
      expect(getAllByText("Move to a different room").length).toBeGreaterThanOrEqual(1);
      expect(getByText("Added")).toBeTruthy();
    });

    expect(repository.lastTemplateCreateInput?.idempotencyKey).toBeTruthy();
  });

  it("creates a custom action after validation and updates Flare readiness", async () => {
    const repository = createFlarePlanRepositoryStub();
    const { getAllByText, getByLabelText, getByText } = renderWithProviders(
      <>
        <CustomizeScreen />
        <FlareScreen />
      </>,
      {
        flarePlanRepository: repository,
      },
    );

    await waitFor(() => {
      expect(getByText("1 out of 5 configured")).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getAllByText("Flare Plan")[0]);
    });
    fireEvent.press(getByText("Add your own action"));
    fireEvent.press(getByText("Save action"));
    expect(getByText("Add a short title before saving this action.")).toBeTruthy();

    fireEvent.changeText(getByLabelText("Title"), "x".repeat(121));
    fireEvent.press(getByText("Save action"));
    expect(
      getByText("Keep the title to 120 characters or fewer."),
    ).toBeTruthy();

    fireEvent.changeText(getByLabelText("Title"), "Put my phone away");
    fireEvent.changeText(getByLabelText("Description (optional)"), "y".repeat(301));
    fireEvent.press(getByText("Save action"));
    expect(
      getByText("Keep the description to 300 characters or fewer."),
    ).toBeTruthy();

    fireEvent.changeText(
      getByLabelText("Description (optional)"),
      "Leave it there for ten minutes.",
    );
    fireEvent.press(getByText("Save action"));

    await waitFor(() => {
      expect(getByText("Put my phone away")).toBeTruthy();
    });

    fireEvent.press(getAllByText("Close")[0]);
    await waitFor(() => {
      expect(getByText("2 out of 5 configured")).toBeTruthy();
    });
    fireEvent.press(getByLabelText("Expand readiness details"));
    expect(getByText("Configured: 1 of 10 actions")).toBeTruthy();
  });

  it("edits actions and clears description with canonical null semantics", async () => {
    const repository = createFlarePlanRepositoryStub({
      initialPlan: createPlan([
        createAction("action-1", "Custom action", 1, {
          description: "Keep me",
        }),
        createAction("action-2", "Move to a different room", 2, {
          description: "Create some distance.",
          source_template_key: "move_to_different_room",
        }),
      ]),
      initialTemplates: [
        createTemplate(
          "move_to_different_room",
          "Move to a different room",
          "change_the_situation",
          "Change the situation",
          1,
          { is_selected: true },
        ),
      ],
    });

    const {
      getAllByLabelText,
      getAllByText,
      getByLabelText,
      getByText,
      queryAllByText,
    } =
      renderWithProviders(<CustomizeScreen />, {
        flarePlanRepository: repository,
      });

    await waitFor(() => {
      expect(getAllByText("2 of 10 actions").length).toBeGreaterThanOrEqual(1);
    });
    await act(async () => {
      fireEvent.press(getAllByText("Flare Plan")[0]);
    });

    fireEvent.press(getAllByLabelText("Edit action Custom action")[0]);
    fireEvent.changeText(getByLabelText("Title"), "Updated custom action");
    fireEvent.changeText(getByLabelText("Description (optional)"), "Updated note");
    fireEvent.press(getByText("Save action"));

    await waitFor(() => {
      expect(getByText("Updated custom action")).toBeTruthy();
      expect(getByText("Updated note")).toBeTruthy();
    });

    fireEvent.press(getAllByLabelText("Edit action Move to a different room")[0]);
    fireEvent.changeText(getByLabelText("Description (optional)"), "");
    fireEvent.press(getByText("Save action"));

    await waitFor(() => {
      expect(queryAllByText("Create some distance.")).toHaveLength(1);
    });

    expect(repository.lastUpdateInput).toEqual(
      expect.objectContaining({
        actionId: "action-2",
        description: null,
        descriptionProvided: true,
      }),
    );
  });

  it("archives an action with confirmation and makes the starter selectable again", async () => {
    const repository = createFlarePlanRepositoryStub({
      initialPlan: createPlan([
        createAction("action-1", "Move to a different room", 1, {
          source_template_key: "move_to_different_room",
        }),
      ]),
      initialTemplates: [
        createTemplate(
          "move_to_different_room",
          "Move to a different room",
          "change_the_situation",
          "Change the situation",
          1,
          { is_selected: true },
        ),
      ],
    });

    const { getAllByLabelText, getAllByText, getByText } =
      renderWithProviders(
        <>
          <CustomizeScreen />
          <FlareScreen />
        </>,
        {
          flarePlanRepository: repository,
        },
      );

    await waitFor(() => {
      expect(getAllByText("1 of 10 actions").length).toBeGreaterThanOrEqual(1);
    });
    await act(async () => {
      fireEvent.press(getAllByText("Flare Plan")[0]);
    });
    fireEvent.press(getAllByLabelText("Remove action Move to a different room")[0]);

    expect(getByText("Remove this action?")).toBeTruthy();
    fireEvent.press(getAllByText("Remove").at(-1)!);

    await waitFor(() => {
      expect(getAllByText("Add").length).toBeGreaterThanOrEqual(1);
      expect(getAllByText("No active actions yet").length).toBeGreaterThanOrEqual(1);
    });

    expect(repository.lastArchiveInput?.idempotencyKey).toBeTruthy();
    expect(getByText("Add")).toBeTruthy();

    fireEvent.press(getAllByText("Close")[0]);
    await waitFor(() => {
      expect(getByText("1 out of 5 configured")).toBeTruthy();
    });
  });

  it("reorders actions with move controls and preserves order on failure", async () => {
    const repository = createFlarePlanRepositoryStub({
      initialPlan: createPlan([
        createAction("action-1", "First", 1),
        createAction("action-2", "Second", 2),
        createAction("action-3", "Third", 3),
      ]),
    });

    const { getAllByLabelText, getAllByText, getByText, toJSON } =
      renderWithProviders(<CustomizeScreen />, {
        flarePlanRepository: repository,
      });

    await waitFor(() => {
      expect(getAllByText("3 of 10 actions").length).toBeGreaterThanOrEqual(1);
    });
    await act(async () => {
      fireEvent.press(getAllByText("Flare Plan")[0]);
    });

    expect(
      getAllByLabelText("Move action First up")[0].props.accessibilityState,
    ).toEqual(expect.objectContaining({ disabled: true }));
    expect(
      getAllByLabelText("Move action Third down")[0].props.accessibilityState,
    ).toEqual(expect.objectContaining({ disabled: true }));

    fireEvent.press(getAllByLabelText("Move action First down")[0]);

    await waitFor(() => {
      const rendered = JSON.stringify(toJSON());
      expect(rendered.indexOf("Second")).toBeLessThan(rendered.indexOf("First"));
    });

    repository.failNextReorder = true;
    fireEvent.press(getAllByLabelText("Move action First up")[0]);

    await waitFor(() => {
      expect(
        getByText("The action order could not be updated right now."),
      ).toBeTruthy();
    });
    const orderAfterFailure = JSON.stringify(toJSON());
    expect(orderAfterFailure.indexOf("Second")).toBeLessThan(
      orderAfterFailure.indexOf("First"),
    );
    expect(orderAfterFailure).toContain(
      "The action order could not be updated right now.",
    );
  });

  it("shows partial load failures with retry controls", async () => {
    const repository = createFlarePlanRepositoryStub({
      initialPlan: createPlan([]),
      loadPlan: jest
        .fn()
        .mockRejectedValueOnce(new Error("plan failed"))
        .mockRejectedValueOnce(new Error("plan failed"))
        .mockResolvedValue(createPlan([])),
      loadTemplates: jest.fn().mockResolvedValue([
        createTemplate(
          "move_to_different_room",
          "Move to a different room",
          "change_the_situation",
          "Change the situation",
          1,
        ),
      ]),
    });

    const { getAllByText, getByText } = renderWithProviders(
      <CustomizeScreen />,
      {
        flarePlanRepository: repository,
      },
    );

    await waitForCustomizePlanReady(getByText);
    await act(async () => {
      fireEvent.press(getAllByText("Flare Plan")[0]);
    });

    await waitFor(() => {
      expect(
        getByText("Flare Plan could not be loaded right now."),
      ).toBeTruthy();
      expect(getByText("Change the situation")).toBeTruthy();
    });

    fireEvent.press(getByText("Retry plan"));

    await waitFor(() => {
      expect(getByText("No active actions yet")).toBeTruthy();
    });
  });

  it("blocks new actions at the 10-action limit", async () => {
    const repository = createFlarePlanRepositoryStub({
      initialPlan: createPlan(
        Array.from({ length: 10 }, (_, index) =>
          createAction(`action-${index + 1}`, `Action ${index + 1}`, index + 1),
        ),
      ),
    });

    const { getAllByText, getByLabelText, getByText } = renderWithProviders(
      <CustomizeScreen />,
      {
        flarePlanRepository: repository,
      },
    );

    await waitFor(() => {
      expect(getAllByText("10 of 10 actions").length).toBeGreaterThanOrEqual(1);
    });
    await act(async () => {
      fireEvent.press(getAllByText("Flare Plan")[0]);
    });

    expect(getByText("You already have 10 active actions.")).toBeTruthy();
    expect(getByLabelText("Add your own action").props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    );
  });

  it("does not treat the legacy preferred recovery action field as Flare Plan readiness", async () => {
    const behaviorPatternRepository: BehaviorPatternRepository = {
      loadActiveBehaviorPattern: jest
        .fn()
        .mockResolvedValue(createLegacyBehaviorPatternRecord()),
      saveBehaviorPattern: jest.fn(),
    };

    const repository = createFlarePlanRepositoryStub({
      initialPlan: createPlan([]),
    });

    const { getByLabelText, getByText } = renderWithProviders(<FlareScreen />, {
      behaviorPatternRepository,
      flarePlanRepository: repository,
    });

    await waitFor(() => {
      expect(getByText("2 out of 5 configured")).toBeTruthy();
    });

    fireEvent.press(getByLabelText("Expand readiness details"));

    expect(getByText("Configured: Weekend drinking")).toBeTruthy();
    expect(getByText("Not configured")).toBeTruthy();
  });
});

function createLegacyBehaviorPatternRecord(): PersistedBehaviorPattern {
  return {
    behaviorPattern: {
      behaviorName: "Weekend drinking",
      shortDescription: "I keep going when the night is almost over.",
      commonTriggers: "Stress",
      riskTimesOrSituations: "Late nights",
      preferredRecoveryActions: "Leave the bar and call my brother.",
    },
    createdAt: "2026-07-08T00:00:00.000Z",
    id: "behavior-pattern-1",
    updatedAt: "2026-07-08T00:00:00.000Z",
    userId: "user-123",
  };
}
