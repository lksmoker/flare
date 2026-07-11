import { getSupabaseClient } from "./supabaseClient";
import { PUBLIC_FLARE_API_BASE_URL_ENV_NAME } from "./supportChannelApi";

type RuntimeEnv = Record<string, string | undefined>;

type RequestDeps = {
  env?: RuntimeEnv;
  fetchImpl?: typeof fetch;
  getAccessToken?: () => Promise<string>;
};

type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
};

type ActiveFlarePlanResponse = {
  plan: ActiveFlarePlan;
};

type StarterTemplatesResponse = {
  templates: StarterTemplate[];
};

export type StarterTemplate = {
  template_key: string;
  title: string;
  description: string | null;
  category: string;
  category_label: string;
  display_position: number;
  is_selected: boolean;
};

export type SavedFlarePlanAction = {
  id: string;
  source_template_key: string | null;
  title: string;
  description: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ActiveFlarePlan = {
  id: string;
  is_configured: boolean;
  active_action_count: number;
  maximum_active_actions: number;
  actions: SavedFlarePlanAction[];
  updated_at: string;
};

export type CreateActionFromTemplateResponse = {
  plan: ActiveFlarePlan;
  created_action_id: string;
};

export type CreateCustomActionResponse = {
  plan: ActiveFlarePlan;
  created_action_id: string;
};

export type UpdateFlarePlanActionResponse = {
  plan: ActiveFlarePlan;
  updated_action_id: string;
};

export type ArchiveFlarePlanActionResponse = {
  plan: ActiveFlarePlan;
  archived_action_id: string;
};

export type ReorderFlarePlanActionsResponse = {
  plan: ActiveFlarePlan;
};

export class FlarePlanApiError extends Error {
  code: string;
  details: Record<string, unknown>;
  statusCode: number;

  constructor({
    code,
    details,
    message,
    statusCode,
  }: {
    code: string;
    details?: Record<string, unknown>;
    message: string;
    statusCode: number;
  }) {
    super(message);
    this.name = "FlarePlanApiError";
    this.code = code;
    this.details = details ?? {};
    this.statusCode = statusCode;
  }
}

function readDefaultRuntimeEnv(): RuntimeEnv {
  return {
    [PUBLIC_FLARE_API_BASE_URL_ENV_NAME]:
      process.env.EXPO_PUBLIC_FLARE_API_BASE_URL,
  };
}

function readApiBaseUrl(env: RuntimeEnv = readDefaultRuntimeEnv()) {
  const configuredBaseUrl = env[PUBLIC_FLARE_API_BASE_URL_ENV_NAME]?.trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  throw new FlarePlanApiError({
    code: "api_base_url_missing",
    message:
      "Flare Plan settings need EXPO_PUBLIC_FLARE_API_BASE_URL before they can load.",
    statusCode: 0,
  });
}

async function readAccessToken() {
  const client = getSupabaseClient();
  const {
    data: { session },
    error,
  } = await client.auth.getSession();

  if (error || !session?.access_token) {
    throw new FlarePlanApiError({
      code: "auth_session_missing",
      message: "Sign in again before changing your Flare Plan.",
      statusCode: 401,
    });
  }

  return session.access_token;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function expectString(value: unknown, fieldName: string) {
  if (typeof value !== "string") {
    throw new FlarePlanApiError({
      code: "flare_plan_response_invalid",
      message: `Flare Plan response was missing ${fieldName}.`,
      statusCode: 0,
    });
  }

  return value;
}

function expectBoolean(value: unknown, fieldName: string) {
  if (typeof value !== "boolean") {
    throw new FlarePlanApiError({
      code: "flare_plan_response_invalid",
      message: `Flare Plan response was missing ${fieldName}.`,
      statusCode: 0,
    });
  }

  return value;
}

function expectNumber(value: unknown, fieldName: string) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new FlarePlanApiError({
      code: "flare_plan_response_invalid",
      message: `Flare Plan response was missing ${fieldName}.`,
      statusCode: 0,
    });
  }

  return value;
}

function expectNullableString(value: unknown, fieldName: string) {
  if (value === null) {
    return null;
  }

  return expectString(value, fieldName);
}

function parseAction(value: unknown): SavedFlarePlanAction {
  if (!isRecord(value)) {
    throw new FlarePlanApiError({
      code: "flare_plan_response_invalid",
      message: "Flare Plan action response was malformed.",
      statusCode: 0,
    });
  }

  return {
    id: expectString(value.id, "action.id"),
    source_template_key: expectNullableString(
      value.source_template_key,
      "action.source_template_key",
    ),
    title: expectString(value.title, "action.title"),
    description: expectNullableString(value.description, "action.description"),
    position: expectNumber(value.position, "action.position"),
    is_active: expectBoolean(value.is_active, "action.is_active"),
    created_at: expectString(value.created_at, "action.created_at"),
    updated_at: expectString(value.updated_at, "action.updated_at"),
  };
}

function parsePlan(value: unknown): ActiveFlarePlan {
  if (!isRecord(value) || !Array.isArray(value.actions)) {
    throw new FlarePlanApiError({
      code: "flare_plan_response_invalid",
      message: "Flare Plan response was malformed.",
      statusCode: 0,
    });
  }

  return {
    id: expectString(value.id, "plan.id"),
    is_configured: expectBoolean(value.is_configured, "plan.is_configured"),
    active_action_count: expectNumber(
      value.active_action_count,
      "plan.active_action_count",
    ),
    maximum_active_actions: expectNumber(
      value.maximum_active_actions,
      "plan.maximum_active_actions",
    ),
    actions: value.actions.map((action) => parseAction(action)),
    updated_at: expectString(value.updated_at, "plan.updated_at"),
  };
}

function parseTemplate(value: unknown): StarterTemplate {
  if (!isRecord(value)) {
    throw new FlarePlanApiError({
      code: "flare_plan_response_invalid",
      message: "Flare Plan template response was malformed.",
      statusCode: 0,
    });
  }

  return {
    template_key: expectString(value.template_key, "template.template_key"),
    title: expectString(value.title, "template.title"),
    description: expectNullableString(
      value.description,
      "template.description",
    ),
    category: expectString(value.category, "template.category"),
    category_label: expectString(
      value.category_label,
      "template.category_label",
    ),
    display_position: expectNumber(
      value.display_position,
      "template.display_position",
    ),
    is_selected: expectBoolean(value.is_selected, "template.is_selected"),
  };
}

async function parseJsonBody(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    throw new FlarePlanApiError({
      code: "flare_plan_response_invalid",
      message: "Flare Plan returned an unreadable response.",
      statusCode: response.status,
    });
  }
}

async function performRequest(
  path: string,
  init: RequestInit,
  deps: RequestDeps = {},
) {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const accessToken = await (deps.getAccessToken ?? readAccessToken)();

  let response: Response;
  try {
    response = await fetchImpl(`${readApiBaseUrl(deps.env)}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new FlarePlanApiError({
      code: "flare_plan_network_error",
      message: "Flare Plan could not reach the server right now.",
      statusCode: 0,
    });
  }

  const body = await parseJsonBody(response);

  if (!response.ok) {
    const errorBody = isRecord(body) ? (body as ApiErrorPayload) : {};

    throw new FlarePlanApiError({
      code: errorBody.error?.code ?? "flare_plan_request_failed",
      details: errorBody.error?.details,
      message:
        errorBody.error?.message ??
        "Flare Plan could not be updated right now.",
      statusCode: response.status,
    });
  }

  return body;
}

export async function getFlarePlan(deps?: RequestDeps) {
  const body = (await performRequest(
    "/api/flare-plan",
    { method: "GET" },
    deps,
  )) as ActiveFlarePlanResponse;

  return parsePlan(body.plan);
}

export async function getFlarePlanTemplates(deps?: RequestDeps) {
  const body = (await performRequest(
    "/api/flare-plan/templates",
    { method: "GET" },
    deps,
  )) as StarterTemplatesResponse;

  if (!Array.isArray(body.templates)) {
    throw new FlarePlanApiError({
      code: "flare_plan_response_invalid",
      message: "Flare Plan templates response was malformed.",
      statusCode: 0,
    });
  }

  return body.templates.map((template) => parseTemplate(template));
}

export async function createFlarePlanActionFromTemplate(
  input: {
    idempotencyKey: string;
    templateKey: string;
  },
  deps?: RequestDeps,
) {
  const body = (await performRequest(
    "/api/flare-plan/actions/from-template",
    {
      method: "POST",
      headers: {
        "Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify({
        template_key: input.templateKey,
      }),
    },
    deps,
  )) as Record<string, unknown>;

  return {
    created_action_id: expectString(
      body.created_action_id,
      "created_action_id",
    ),
    plan: parsePlan(body.plan),
  } satisfies CreateActionFromTemplateResponse;
}

export async function createCustomFlarePlanAction(
  input: {
    description?: string | null;
    idempotencyKey: string;
    title: string;
  },
  deps?: RequestDeps,
) {
  const body = (await performRequest(
    "/api/flare-plan/actions",
    {
      method: "POST",
      headers: {
        "Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify({
        title: input.title,
        description: input.description ?? null,
      }),
    },
    deps,
  )) as Record<string, unknown>;

  return {
    created_action_id: expectString(
      body.created_action_id,
      "created_action_id",
    ),
    plan: parsePlan(body.plan),
  } satisfies CreateCustomActionResponse;
}

export async function updateFlarePlanAction(
  input: {
    actionId: string;
    description?: string | null;
    descriptionProvided?: boolean;
    idempotencyKey: string;
    title?: string;
    titleProvided?: boolean;
  },
  deps?: RequestDeps,
) {
  const payload: Record<string, string | null> = {};

  if (input.titleProvided) {
    payload.title = input.title ?? "";
  }
  if (input.descriptionProvided) {
    payload.description = input.description ?? null;
  }

  const body = (await performRequest(
    `/api/flare-plan/actions/${input.actionId}`,
    {
      method: "PATCH",
      headers: {
        "Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify(payload),
    },
    deps,
  )) as Record<string, unknown>;

  return {
    plan: parsePlan(body.plan),
    updated_action_id: expectString(
      body.updated_action_id,
      "updated_action_id",
    ),
  } satisfies UpdateFlarePlanActionResponse;
}

export async function archiveFlarePlanAction(
  input: {
    actionId: string;
    idempotencyKey: string;
  },
  deps?: RequestDeps,
) {
  const body = (await performRequest(
    `/api/flare-plan/actions/${input.actionId}`,
    {
      method: "DELETE",
      headers: {
        "Idempotency-Key": input.idempotencyKey,
      },
    },
    deps,
  )) as Record<string, unknown>;

  return {
    archived_action_id: expectString(
      body.archived_action_id,
      "archived_action_id",
    ),
    plan: parsePlan(body.plan),
  } satisfies ArchiveFlarePlanActionResponse;
}

export async function reorderFlarePlanActions(
  input: {
    actionIds: string[];
    idempotencyKey: string;
  },
  deps?: RequestDeps,
) {
  const body = (await performRequest(
    "/api/flare-plan/actions/order",
    {
      method: "PUT",
      headers: {
        "Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify({
        action_ids: input.actionIds,
      }),
    },
    deps,
  )) as Record<string, unknown>;

  return {
    plan: parsePlan(body.plan),
  } satisfies ReorderFlarePlanActionsResponse;
}
