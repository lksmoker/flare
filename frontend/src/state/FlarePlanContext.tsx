import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createIdempotencyKey } from "../services/idempotency";
import {
  archiveFlarePlanAction,
  createCustomFlarePlanAction,
  createFlarePlanActionFromTemplate,
  type ActiveFlarePlan,
  type ArchiveFlarePlanActionResponse,
  type CreateActionFromTemplateResponse,
  type CreateCustomActionResponse,
  FlarePlanApiError,
  getFlarePlan,
  getFlarePlanTemplates,
  reorderFlarePlanActions,
  type ReorderFlarePlanActionsResponse,
  type StarterTemplate,
  type UpdateFlarePlanActionResponse,
  updateFlarePlanAction,
} from "../services/flarePlanApi";
import { createBuiltInDefaultPlan } from "./builtInDefaultFlarePlan";
import { useFlareAuth } from "./FlareAuthContext";

export type FlarePlanRepository = {
  archiveAction: (input: {
    actionId: string;
    idempotencyKey: string;
  }) => Promise<ArchiveFlarePlanActionResponse>;
  createActionFromTemplate: (input: {
    idempotencyKey: string;
    templateKey: string;
  }) => Promise<CreateActionFromTemplateResponse>;
  createCustomAction: (input: {
    description?: string | null;
    idempotencyKey: string;
    title: string;
  }) => Promise<CreateCustomActionResponse>;
  loadPlan: () => Promise<ActiveFlarePlan>;
  loadTemplates: () => Promise<StarterTemplate[]>;
  reorderActions: (input: {
    actionIds: string[];
    idempotencyKey: string;
  }) => Promise<ReorderFlarePlanActionsResponse>;
  updateAction: (input: {
    actionId: string;
    description?: string | null;
    descriptionProvided?: boolean;
    idempotencyKey: string;
    title?: string;
    titleProvided?: boolean;
  }) => Promise<UpdateFlarePlanActionResponse>;
};

type FlarePlanMutationError = {
  actionId?: string;
  code: string;
  message: string;
  target:
    | "archive"
    | "create-custom"
    | "create-template"
    | "reorder"
    | "update";
  templateKey?: string;
};

type FlarePlanContextValue = {
  canEditPlan: boolean;
  ensureTemplatesLoaded: () => Promise<void>;
  createCustomAction: (input: {
    description: string;
    title: string;
  }) => Promise<boolean>;
  createFromTemplate: (templateKey: string) => Promise<boolean>;
  errorBanner: FlarePlanMutationError | null;
  isActionPending: (actionId: string) => boolean;
  isAtActionLimit: boolean;
  isInitialLoading: boolean;
  isUsingBuiltInDefaultPlan: boolean;
  isPlanConfigured: boolean;
  isReorderPending: boolean;
  isRefreshing: boolean;
  isTemplatePending: (templateKey: string) => boolean;
  plan: ActiveFlarePlan | null;
  planError: string | null;
  refetchAll: () => Promise<void>;
  retryPlan: () => Promise<void>;
  retryTemplates: () => Promise<void>;
  saveAction: (input: {
    actionId?: string;
    description: string;
    title: string;
  }) => Promise<boolean>;
  templates: StarterTemplate[];
  templatesError: string | null;
  updateLocalPlan: (plan: ActiveFlarePlan) => void;
  archiveAction: (actionId: string) => Promise<boolean>;
  reorderActions: (actionIds: string[]) => Promise<boolean>;
};

type FlarePlanProviderProps = PropsWithChildren<{
  flarePlanRepository?: FlarePlanRepository;
}>;

const FlarePlanContext = createContext<FlarePlanContextValue | undefined>(
  undefined,
);

const defaultFlarePlanRepository: FlarePlanRepository = {
  archiveAction(input) {
    return archiveFlarePlanAction(input);
  },
  createActionFromTemplate(input) {
    return createFlarePlanActionFromTemplate(input);
  },
  createCustomAction(input) {
    return createCustomFlarePlanAction(input);
  },
  loadPlan() {
    return getFlarePlan();
  },
  loadTemplates() {
    return getFlarePlanTemplates();
  },
  reorderActions(input) {
    return reorderFlarePlanActions(input);
  },
  updateAction(input) {
    return updateFlarePlanAction(input);
  },
};

const sharedPlanLoads = new WeakMap<
  FlarePlanRepository["loadPlan"],
  Promise<ActiveFlarePlan>
>();
const sharedTemplateLoads = new WeakMap<
  FlarePlanRepository["loadTemplates"],
  Promise<StarterTemplate[]>
>();

async function runSharedLoad<T>(
  registry: WeakMap<() => Promise<T>, Promise<T>>,
  load: () => Promise<T>,
) {
  const inFlight = registry.get(load);

  if (inFlight) {
    return inFlight;
  }

  const request = load().finally(() => {
    registry.delete(load);
  });

  registry.set(load, request);
  return request;
}

function applyPlanSelectionToTemplates(
  templates: StarterTemplate[],
  plan: ActiveFlarePlan | null,
) {
  const selectedTemplateKeys = new Set(
    plan?.actions
      .map((action) => action.source_template_key)
      .filter((templateKey): templateKey is string => Boolean(templateKey)) ?? [],
  );

  return templates.map((template) => ({
    ...template,
    is_selected: selectedTemplateKeys.has(template.template_key),
  }));
}

function toUserMessage(error: unknown, fallback: string) {
  if (error instanceof FlarePlanApiError) {
    switch (error.code) {
      case "auth_session_missing":
        return "Sign in again before changing your Flare Plan.";
      case "flare_plan_network_error":
        return "Flare Plan could not reach the server. Try again.";
      case "FLARE_PLAN_ACTIVE_ACTION_LIMIT_REACHED":
        return "Your Flare Plan can hold up to 10 active actions.";
      case "FLARE_PLAN_ACTION_TITLE_REQUIRED":
        return "Add a short title before saving this action.";
      case "FLARE_PLAN_ACTION_TITLE_TOO_LONG":
        return "Keep the title to 120 characters or fewer.";
      case "FLARE_PLAN_ACTION_DESCRIPTION_TOO_LONG":
        return "Keep the description to 300 characters or fewer.";
      case "FLARE_PLAN_TEMPLATE_ALREADY_SELECTED":
        return "That starter action is already in your Flare Plan.";
      case "FLARE_PLAN_IDEMPOTENCY_KEY_REUSED":
        return "That change was already sent. Refresh and try again.";
      case "FLARE_PLAN_REORDER_DUPLICATE_ACTION":
      case "FLARE_PLAN_REORDER_MISSING_ACTION":
      case "FLARE_PLAN_REORDER_UNKNOWN_ACTION":
      case "FLARE_PLAN_REORDER_ARCHIVED_ACTION":
        return "The action order was out of date. Refresh and try again.";
      case "flare_plan_response_invalid":
        return "Flare Plan returned something unexpected. Try again.";
      default:
        return error.message || fallback;
    }
  }

  return fallback;
}

export function FlarePlanProvider({
  children,
  flarePlanRepository = defaultFlarePlanRepository,
}: FlarePlanProviderProps) {
  const { authState, authStatus } = useFlareAuth();
  const authenticatedUserId =
    authState.kind === "authenticated" ? authState.userId : null;
  const canEditPlan =
    authStatus === "ready" && authState.kind === "authenticated";
  const isUsingBuiltInDefaultPlan = !canEditPlan;
  const [plan, setPlan] = useState<ActiveFlarePlan | null>(null);
  const [templatesState, setTemplatesState] = useState<StarterTemplate[]>([]);
  const [planError, setPlanError] = useState<string | null>(null);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedTemplates, setHasLoadedTemplates] = useState(false);
  const [pendingActionIds, setPendingActionIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [pendingTemplateKeys, setPendingTemplateKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [isReorderPending, setIsReorderPending] = useState(false);
  const [errorBanner, setErrorBanner] = useState<FlarePlanMutationError | null>(
    null,
  );
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const templates = useMemo(
    () => applyPlanSelectionToTemplates(templatesState, plan),
    [plan, templatesState],
  );

  const loadPlan = useCallback(async () => {
    try {
      const nextPlan = await runSharedLoad(
        sharedPlanLoads,
        flarePlanRepository.loadPlan,
      );

      if (!mountedRef.current) {
        return false;
      }

      setPlan(nextPlan);
      setPlanError(null);
      return true;
    } catch (error) {
      if (!mountedRef.current) {
        return false;
      }

      setPlanError(
        toUserMessage(error, "Flare Plan could not be loaded right now."),
      );
      return false;
    }
  }, [flarePlanRepository.loadPlan]);

  const loadTemplates = useCallback(async () => {
    try {
      const nextTemplates = await runSharedLoad(
        sharedTemplateLoads,
        flarePlanRepository.loadTemplates,
      );

      if (!mountedRef.current) {
        return false;
      }

      setTemplatesState(nextTemplates);
      setTemplatesError(null);
      setHasLoadedTemplates(true);
      return true;
    } catch (error) {
      if (!mountedRef.current) {
        return false;
      }

      setTemplatesError(
        toUserMessage(error, "Starter actions could not be loaded right now."),
      );
      setHasLoadedTemplates(true);
      return false;
    }
  }, [flarePlanRepository.loadTemplates]);

  const refetchAll = useCallback(async () => {
    if (!canEditPlan) {
      setPlan(createBuiltInDefaultPlan());
      setTemplatesState([]);
      setPlanError(null);
      setTemplatesError(null);
      setHasLoadedTemplates(true);
      setIsInitialLoading(false);
      setIsRefreshing(false);
      return;
    }

    setIsRefreshing(true);
    await Promise.allSettled([loadPlan(), loadTemplates()]);
    setIsInitialLoading(false);
    setIsRefreshing(false);
  }, [canEditPlan, loadPlan, loadTemplates]);

  useEffect(() => {
    if (!canEditPlan) {
      setPlan(createBuiltInDefaultPlan());
      setTemplatesState([]);
      setPlanError(null);
      setTemplatesError(null);
      setHasLoadedTemplates(true);
      setIsInitialLoading(false);
      setIsRefreshing(false);
      return;
    }

    setIsInitialLoading(true);
    setIsRefreshing(false);
    setPlan(null);
    setPlanError(null);
    setTemplatesError(null);
    setTemplatesState([]);
    setHasLoadedTemplates(false);

    void loadPlan().finally(() => {
      if (!mountedRef.current) {
        return;
      }

      setIsInitialLoading(false);
    });
  }, [authenticatedUserId, canEditPlan, loadPlan]);

  const ensureTemplatesLoaded = useCallback(async () => {
    if (!canEditPlan) {
      setTemplatesState([]);
      setTemplatesError(null);
      setHasLoadedTemplates(true);
      return;
    }

    if (hasLoadedTemplates && templatesError === null) {
      return;
    }

    setIsRefreshing(true);
    await loadTemplates();
    if (!mountedRef.current) {
      return;
    }

    setIsRefreshing(false);
  }, [
    canEditPlan,
    hasLoadedTemplates,
    loadTemplates,
    templatesError,
  ]);

  const retryPlan = useCallback(async () => {
    if (plan === null) {
      setIsInitialLoading(true);
    } else {
      setIsRefreshing(true);
    }

    await loadPlan();

    setIsInitialLoading(false);
    setIsRefreshing(false);
  }, [loadPlan, plan]);

  const retryTemplates = useCallback(async () => {
    if (plan === null && templatesState.length === 0) {
      setIsInitialLoading(true);
    } else {
      setIsRefreshing(true);
    }

    setHasLoadedTemplates(false);
    await loadTemplates();

    setIsInitialLoading(false);
    setIsRefreshing(false);
  }, [loadTemplates, plan, templatesState.length]);

  const updateLocalPlan = useCallback((nextPlan: ActiveFlarePlan) => {
    setPlan(nextPlan);
  }, []);

  const clearErrorBanner = useCallback(() => {
    setErrorBanner(null);
  }, []);

  const createFromTemplate = useCallback(
    async (templateKey: string) => {
      if (!canEditPlan) {
        setErrorBanner({
          code: "auth_session_missing",
          message: "Sign in before changing your personal Flare Plan.",
          target: "create-template",
          templateKey,
        });
        return false;
      }

      clearErrorBanner();
      setPendingTemplateKeys((current) => new Set(current).add(templateKey));

      try {
        const response = await flarePlanRepository.createActionFromTemplate({
          idempotencyKey: createIdempotencyKey(),
          templateKey,
        });

        setPlan(response.plan);
        return true;
      } catch (error) {
        setErrorBanner({
          code:
            error instanceof FlarePlanApiError
              ? error.code
              : "flare_plan_request_failed",
          message: toUserMessage(
            error,
            "That starter action could not be added right now.",
          ),
          target: "create-template",
          templateKey,
        });
        return false;
      } finally {
        setPendingTemplateKeys((current) => {
          const next = new Set(current);
          next.delete(templateKey);
          return next;
        });
      }
    },
    [canEditPlan, clearErrorBanner, flarePlanRepository],
  );

  const createCustomAction = useCallback(
    async (input: { description: string; title: string }) => {
      if (!canEditPlan) {
        setErrorBanner({
          code: "auth_session_missing",
          message: "Sign in before changing your personal Flare Plan.",
          target: "create-custom",
        });
        return false;
      }

      clearErrorBanner();

      try {
        const response = await flarePlanRepository.createCustomAction({
          description: input.description,
          idempotencyKey: createIdempotencyKey(),
          title: input.title,
        });
        setPlan(response.plan);
        return true;
      } catch (error) {
        setErrorBanner({
          code:
            error instanceof FlarePlanApiError
              ? error.code
              : "flare_plan_request_failed",
          message: toUserMessage(
            error,
            "Your action could not be saved right now.",
          ),
          target: "create-custom",
        });
        return false;
      }
    },
    [canEditPlan, clearErrorBanner, flarePlanRepository],
  );

  const saveAction = useCallback(
    async (input: { actionId?: string; description: string; title: string }) => {
      if (!canEditPlan) {
        setErrorBanner({
          actionId: input.actionId,
          code: "auth_session_missing",
          message: "Sign in before changing your personal Flare Plan.",
          target: input.actionId ? "update" : "create-custom",
        });
        return false;
      }

      if (!input.actionId) {
        return createCustomAction(input);
      }

      clearErrorBanner();
      setPendingActionIds((current) => new Set(current).add(input.actionId!));

      try {
        const response = await flarePlanRepository.updateAction({
          actionId: input.actionId,
          description: input.description.length > 0 ? input.description : null,
          descriptionProvided: true,
          idempotencyKey: createIdempotencyKey(),
          title: input.title,
          titleProvided: true,
        });
        setPlan(response.plan);
        return true;
      } catch (error) {
        setErrorBanner({
          actionId: input.actionId,
          code:
            error instanceof FlarePlanApiError
              ? error.code
              : "flare_plan_request_failed",
          message: toUserMessage(
            error,
            "That action could not be updated right now.",
          ),
          target: "update",
        });
        return false;
      } finally {
        setPendingActionIds((current) => {
          const next = new Set(current);
          next.delete(input.actionId!);
          return next;
        });
      }
    },
    [canEditPlan, clearErrorBanner, createCustomAction, flarePlanRepository],
  );

  const archiveAction = useCallback(
    async (actionId: string) => {
      if (!canEditPlan) {
        setErrorBanner({
          actionId,
          code: "auth_session_missing",
          message: "Sign in before changing your personal Flare Plan.",
          target: "archive",
        });
        return false;
      }

      clearErrorBanner();
      setPendingActionIds((current) => new Set(current).add(actionId));

      try {
        const response = await flarePlanRepository.archiveAction({
          actionId,
          idempotencyKey: createIdempotencyKey(),
        });
        setPlan(response.plan);
        return true;
      } catch (error) {
        setErrorBanner({
          actionId,
          code:
            error instanceof FlarePlanApiError
              ? error.code
              : "flare_plan_request_failed",
          message: toUserMessage(
            error,
            "That action could not be removed right now.",
          ),
          target: "archive",
        });
        return false;
      } finally {
        setPendingActionIds((current) => {
          const next = new Set(current);
          next.delete(actionId);
          return next;
        });
      }
    },
    [canEditPlan, clearErrorBanner, flarePlanRepository],
  );

  const reorderActions = useCallback(
    async (actionIds: string[]) => {
      if (!canEditPlan) {
        setErrorBanner({
          code: "auth_session_missing",
          message: "Sign in before changing your personal Flare Plan.",
          target: "reorder",
        });
        return false;
      }

      clearErrorBanner();
      setIsReorderPending(true);

      try {
        const response = await flarePlanRepository.reorderActions({
          actionIds,
          idempotencyKey: createIdempotencyKey(),
        });
        setPlan(response.plan);
        return true;
      } catch (error) {
        setErrorBanner({
          code:
            error instanceof FlarePlanApiError
              ? error.code
              : "flare_plan_request_failed",
          message: toUserMessage(
            error,
            "The action order could not be updated right now.",
          ),
          target: "reorder",
        });
        return false;
      } finally {
        setIsReorderPending(false);
      }
    },
    [canEditPlan, clearErrorBanner, flarePlanRepository],
  );

  const value = useMemo<FlarePlanContextValue>(
    () => ({
      archiveAction,
      canEditPlan,
      createCustomAction,
      createFromTemplate,
      ensureTemplatesLoaded,
      errorBanner,
      isActionPending: (actionId) => pendingActionIds.has(actionId),
      isAtActionLimit:
        plan !== null &&
        plan.active_action_count >= plan.maximum_active_actions,
      isInitialLoading,
      isUsingBuiltInDefaultPlan,
      isPlanConfigured: Boolean(plan?.active_action_count),
      isReorderPending,
      isRefreshing,
      isTemplatePending: (templateKey) => pendingTemplateKeys.has(templateKey),
      plan,
      planError,
      refetchAll,
      retryPlan,
      retryTemplates,
      saveAction,
      templates,
      templatesError,
      updateLocalPlan,
      reorderActions,
    }),
    [
      archiveAction,
      canEditPlan,
      createCustomAction,
      createFromTemplate,
      ensureTemplatesLoaded,
      errorBanner,
      isInitialLoading,
      isReorderPending,
      isRefreshing,
      isUsingBuiltInDefaultPlan,
      pendingActionIds,
      pendingTemplateKeys,
      plan,
      planError,
      refetchAll,
      retryPlan,
      retryTemplates,
      saveAction,
      templates,
      templatesError,
      updateLocalPlan,
      reorderActions,
    ],
  );

  return (
    <FlarePlanContext.Provider value={value}>
      {children}
    </FlarePlanContext.Provider>
  );
}

export function useFlarePlan() {
  const context = useContext(FlarePlanContext);

  if (!context) {
    throw new Error("useFlarePlan must be used within a FlarePlanProvider.");
  }

  return context;
}
