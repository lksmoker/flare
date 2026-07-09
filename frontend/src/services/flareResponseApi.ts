import type { FlareEvent } from "../state/FlareEventContext";
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

export type FlarePlanRunAction = {
  id: string;
  source_action_id: string | null;
  source_template_key: string | null;
  title: string;
  description: string | null;
  position: number;
  outcome: "pending" | "done" | "skipped" | "not_reached";
  responded_at: string | null;
};

export type FlarePlanRun = {
  id: string;
  flare_event_id: string;
  source_plan_id: string | null;
  status: "offered" | "declined" | "in_progress" | "completed" | "ended_early";
  current_action: FlarePlanRunAction | null;
  progress: {
    current_position: number | null;
    total_count: number;
    done_count: number;
    skipped_count: number;
    not_reached_count: number;
    pending_count: number;
  };
  actions: FlarePlanRunAction[];
  offered_at: string;
  started_at: string | null;
  declined_at: string | null;
  completed_at: string | null;
  ended_at: string | null;
  updated_at: string;
};

export type FlareSupportDelivery = {
  status: string;
  attempted_at: string | null;
  delivered_at: string | null;
  error_code: string | null;
  error_message_safe: string | null;
  destination_display_name: string | null;
};

export type FlareResponseState = {
  flareEvent: FlareEvent;
  run: FlarePlanRun | null;
  supportDelivery: FlareSupportDelivery | null;
};

export class FlareResponseApiError extends Error {
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
    this.name = "FlareResponseApiError";
    this.code = code;
    this.details = details ?? {};
    this.statusCode = statusCode;
  }
}

function readDefaultRuntimeEnv(): RuntimeEnv {
  return {
    [PUBLIC_FLARE_API_BASE_URL_ENV_NAME]:
      process.env[PUBLIC_FLARE_API_BASE_URL_ENV_NAME],
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

  throw new FlareResponseApiError({
    code: "api_base_url_missing",
    message: "Flare Response needs EXPO_PUBLIC_FLARE_API_BASE_URL before it can load.",
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
    throw new FlareResponseApiError({
      code: "auth_session_missing",
      message: "Sign in again before sending a Flare.",
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
    throw new FlareResponseApiError({
      code: "flare_response_invalid",
      message: `Flare Response was missing ${fieldName}.`,
      statusCode: 0,
    });
  }
  return value;
}

function expectNullableString(value: unknown, fieldName: string) {
  if (value === null || value === undefined) {
    return null;
  }
  return expectString(value, fieldName);
}

function expectNumber(value: unknown, fieldName: string) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new FlareResponseApiError({
      code: "flare_response_invalid",
      message: `Flare Response was missing ${fieldName}.`,
      statusCode: 0,
    });
  }
  return value;
}

function parseAction(value: unknown): FlarePlanRunAction {
  if (!isRecord(value)) {
    throw new FlareResponseApiError({
      code: "flare_response_invalid",
      message: "Flare Response action payload was malformed.",
      statusCode: 0,
    });
  }
  return {
    id: expectString(value.id, "action.id"),
    source_action_id: expectNullableString(value.source_action_id, "action.source_action_id"),
    source_template_key: expectNullableString(value.source_template_key, "action.source_template_key"),
    title: expectString(value.title, "action.title"),
    description: expectNullableString(value.description, "action.description"),
    position: expectNumber(value.position, "action.position"),
    outcome: expectString(value.outcome, "action.outcome") as FlarePlanRunAction["outcome"],
    responded_at: expectNullableString(value.responded_at, "action.responded_at"),
  };
}

function parseRun(value: unknown): FlarePlanRun | null {
  if (value === null) {
    return null;
  }
  if (!isRecord(value) || !Array.isArray(value.actions) || !isRecord(value.progress)) {
    throw new FlareResponseApiError({
      code: "flare_response_invalid",
      message: "Flare Response run payload was malformed.",
      statusCode: 0,
    });
  }
  return {
    id: expectString(value.id, "run.id"),
    flare_event_id: expectString(value.flare_event_id, "run.flare_event_id"),
    source_plan_id: expectNullableString(value.source_plan_id, "run.source_plan_id"),
    status: expectString(value.status, "run.status") as FlarePlanRun["status"],
    current_action: value.current_action === null ? null : parseAction(value.current_action),
    progress: {
      current_position:
        value.progress.current_position === null
          ? null
          : expectNumber(value.progress.current_position, "run.progress.current_position"),
      total_count: expectNumber(value.progress.total_count, "run.progress.total_count"),
      done_count: expectNumber(value.progress.done_count, "run.progress.done_count"),
      skipped_count: expectNumber(value.progress.skipped_count, "run.progress.skipped_count"),
      not_reached_count: expectNumber(value.progress.not_reached_count, "run.progress.not_reached_count"),
      pending_count: expectNumber(value.progress.pending_count, "run.progress.pending_count"),
    },
    actions: value.actions.map((action) => parseAction(action)),
    offered_at: expectString(value.offered_at, "run.offered_at"),
    started_at: expectNullableString(value.started_at, "run.started_at"),
    declined_at: expectNullableString(value.declined_at, "run.declined_at"),
    completed_at: expectNullableString(value.completed_at, "run.completed_at"),
    ended_at: expectNullableString(value.ended_at, "run.ended_at"),
    updated_at: expectString(value.updated_at, "run.updated_at"),
  };
}

function parseFlareEvent(value: unknown): FlareEvent {
  if (!isRecord(value)) {
    throw new FlareResponseApiError({
      code: "flare_response_invalid",
      message: "Flare Response event payload was malformed.",
      statusCode: 0,
    });
  }
  return {
    anchorNoteId: expectNullableString(value.anchor_note_id, "flare_event.anchor_note_id"),
    anchorNoteVersion:
      value.anchor_note_version === null || value.anchor_note_version === undefined
        ? null
        : expectNumber(value.anchor_note_version, "flare_event.anchor_note_version"),
    archivedAt: expectNullableString(value.archived_at, "flare_event.archived_at"),
    behaviorDescriptionSnapshot: expectNullableString(
      value.behavior_description_snapshot,
      "flare_event.behavior_description_snapshot",
    ),
    behaviorLabelSnapshot: expectString(value.behavior_label_snapshot, "flare_event.behavior_label_snapshot"),
    behaviorPatternId: expectNullableString(value.behavior_pattern_id, "flare_event.behavior_pattern_id"),
    checkpoint: null,
    closedAt: expectNullableString(value.closed_at, "flare_event.closed_at"),
    createdAt: expectString(value.created_at, "flare_event.created_at"),
    id: expectString(value.id, "flare_event.id"),
    responseMode: expectString(value.response_mode, "flare_event.response_mode") as FlareEvent["responseMode"],
    status: expectString(value.status, "flare_event.status") as FlareEvent["status"],
    supportActionShown: expectNullableString(value.support_action_shown, "flare_event.support_action_shown"),
    supportActionTaken: expectNullableString(value.support_action_taken, "flare_event.support_action_taken"),
    updatedAt: expectString(value.updated_at, "flare_event.updated_at"),
    userId: expectNullableString(value.user_id, "flare_event.user_id"),
  };
}

function parseSupportDelivery(value: unknown): FlareSupportDelivery | null {
  if (value === null) {
    return null;
  }
  if (!isRecord(value)) {
    throw new FlareResponseApiError({
      code: "flare_response_invalid",
      message: "Flare Response support delivery payload was malformed.",
      statusCode: 0,
    });
  }
  return {
    status: expectString(value.status, "support_delivery.status"),
    attempted_at: expectNullableString(value.attempted_at, "support_delivery.attempted_at"),
    delivered_at: expectNullableString(value.delivered_at, "support_delivery.delivered_at"),
    error_code: expectNullableString(value.error_code, "support_delivery.error_code"),
    error_message_safe: expectNullableString(value.error_message_safe, "support_delivery.error_message_safe"),
    destination_display_name: expectNullableString(
      value.destination_display_name,
      "support_delivery.destination_display_name",
    ),
  };
}

function parseResponseState(value: unknown): FlareResponseState {
  if (!isRecord(value)) {
    throw new FlareResponseApiError({
      code: "flare_response_invalid",
      message: "Flare Response payload was malformed.",
      statusCode: 0,
    });
  }
  return {
    flareEvent: parseFlareEvent(value.flare_event),
    run: parseRun(value.run),
    supportDelivery: parseSupportDelivery(value.support_delivery),
  };
}

async function parseJsonBody(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    throw new FlareResponseApiError({
      code: "flare_response_invalid",
      message: "Flare Response returned an unreadable response.",
      statusCode: response.status,
    });
  }
}

async function performRequest(path: string, init: RequestInit, deps: RequestDeps = {}) {
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
    throw new FlareResponseApiError({
      code: "flare_response_network_error",
      message: "Flare Response could not reach the server right now.",
      statusCode: 0,
    });
  }

  const body = await parseJsonBody(response);

  if (!response.ok) {
    const errorBody = isRecord(body) ? (body as ApiErrorPayload) : {};
    throw new FlareResponseApiError({
      code: errorBody.error?.code ?? "flare_response_request_failed",
      details: errorBody.error?.details,
      message: errorBody.error?.message ?? "Flare Response could not be updated right now.",
      statusCode: response.status,
    });
  }

  return body;
}

function parseBodyWithRun(body: unknown) {
  if (!isRecord(body)) {
    throw new FlareResponseApiError({
      code: "flare_response_invalid",
      message: "Flare Response mutation payload was malformed.",
      statusCode: 0,
    });
  }
  return parseRun(body.run);
}

export async function createFlareResponse(
  input: {
    anchorNoteId?: string | null;
    anchorNoteVersion?: number | null;
    behaviorDescriptionSnapshot?: string | null;
    behaviorLabelSnapshot: string;
    behaviorPatternId?: string | null;
    responseMode: "configured" | "fallback-generic";
    supportActionShown?: string | null;
    idempotencyKey: string;
  },
  deps?: RequestDeps,
) {
  const body = (await performRequest(
    "/api/flare-events",
    {
      method: "POST",
      headers: { "Idempotency-Key": input.idempotencyKey },
      body: JSON.stringify({
        anchor_note_id: input.anchorNoteId ?? null,
        anchor_note_version: input.anchorNoteVersion ?? null,
        behavior_description_snapshot: input.behaviorDescriptionSnapshot ?? null,
        behavior_label_snapshot: input.behaviorLabelSnapshot,
        behavior_pattern_id: input.behaviorPatternId ?? null,
        response_mode: input.responseMode,
        support_action_shown: input.supportActionShown ?? null,
      }),
    },
    deps,
  )) as Record<string, unknown>;

  return {
    flareEvent: parseFlareEvent(body.flare_event),
    run: parseRun(body.run),
  };
}

export async function getFlareResponse(flareEventId: string, deps?: RequestDeps) {
  const body = (await performRequest(
    `/api/flare-events/${flareEventId}/response`,
    { method: "GET" },
    deps,
  )) as Record<string, unknown>;
  return parseResponseState(body.response);
}

async function mutateRun(path: string, idempotencyKey: string, deps?: RequestDeps) {
  const body = await performRequest(
    path,
    { method: "POST", headers: { "Idempotency-Key": idempotencyKey }, body: "{}" },
    deps,
  );
  return parseBodyWithRun(body);
}

export function beginFlarePlanRun(runId: string, idempotencyKey: string, deps?: RequestDeps) {
  return mutateRun(`/api/flare-plan-runs/${runId}/begin`, idempotencyKey, deps);
}

export function declineFlarePlanRun(runId: string, idempotencyKey: string, deps?: RequestDeps) {
  return mutateRun(`/api/flare-plan-runs/${runId}/decline`, idempotencyKey, deps);
}

export function completeFlarePlanAction(
  runId: string,
  eventActionId: string,
  idempotencyKey: string,
  deps?: RequestDeps,
) {
  return mutateRun(`/api/flare-plan-runs/${runId}/actions/${eventActionId}/done`, idempotencyKey, deps);
}

export function skipFlarePlanAction(
  runId: string,
  eventActionId: string,
  idempotencyKey: string,
  deps?: RequestDeps,
) {
  return mutateRun(`/api/flare-plan-runs/${runId}/actions/${eventActionId}/skip`, idempotencyKey, deps);
}

export function endFlarePlanRunEarly(runId: string, idempotencyKey: string, deps?: RequestDeps) {
  return mutateRun(`/api/flare-plan-runs/${runId}/end-early`, idempotencyKey, deps);
}
