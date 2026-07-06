import * as Linking from "expo-linking";

import { getSupabaseClient } from "./supabaseClient";

export const PUBLIC_FLARE_API_BASE_URL_ENV_NAME =
  "EXPO_PUBLIC_FLARE_API_BASE_URL";
export const DEFAULT_SUPPORT_CHANNEL_MESSAGE =
  "Luke sent a Flare and may need support. Please check in when you can.";

type RuntimeEnv = Record<string, string | undefined>;

type RequestDeps = {
  env?: RuntimeEnv;
  fetchImpl?: typeof fetch;
  getAccessToken?: () => Promise<string>;
};

export type SupportChannel = {
  configured: boolean;
  destination_display_name: string | null;
  enabled: boolean;
  last_delivery_at: string | null;
  last_delivery_status: string | null;
  message_preview: string;
  provider: string;
  status: string;
};

export type SupportChannelConnectStart = {
  auth_url: string;
  provider: string;
};

export type SupportChannelConnectSession = {
  connect_session_id: string;
  provider: string;
  status: string;
};

export type SupportChannelDestination = {
  description: string | null;
  group_type: string | null;
  id: string;
  image_url: string | null;
  name: string;
};

export type SupportChannelTestResult = {
  attempted_at: string;
  delivered_at: string | null;
  destination_display_name: string | null;
  error_code: string | null;
  error_message_safe: string | null;
  message_preview: string;
  provider: string;
  send_kind: string;
  status: string;
};

export type SupportChannelFlareDeliveryResult = SupportChannelTestResult;

type SupportChannelApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

export class SupportChannelApiError extends Error {
  code: string;
  statusCode: number;

  constructor({
    code,
    message,
    statusCode,
  }: {
    code: string;
    message: string;
    statusCode: number;
  }) {
    super(message);
    this.name = "SupportChannelApiError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function readDefaultRuntimeEnv(): RuntimeEnv {
  return {
    EXPO_PUBLIC_FLARE_API_BASE_URL: process.env.EXPO_PUBLIC_FLARE_API_BASE_URL,
  };
}

function readApiBaseUrl(env: RuntimeEnv = readDefaultRuntimeEnv()) {
  const configuredBaseUrl = env.EXPO_PUBLIC_FLARE_API_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  throw new SupportChannelApiError({
    code: "api_base_url_missing",
    message:
      "Support channel settings need EXPO_PUBLIC_FLARE_API_BASE_URL before they can connect.",
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
    throw new SupportChannelApiError({
      code: "auth_session_missing",
      message: "Sign in again before changing support group settings.",
      statusCode: 401,
    });
  }

  return session.access_token;
}

async function performRequest<T>(
  path: string,
  init: RequestInit,
  deps: RequestDeps = {},
): Promise<T> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const accessToken = await (deps.getAccessToken ?? readAccessToken)();
  const response = await fetchImpl(`${readApiBaseUrl(deps.env)}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = (await response.json()) as T | SupportChannelApiErrorBody;

  if (!response.ok) {
    const errorBody = body as SupportChannelApiErrorBody;
    throw new SupportChannelApiError({
      code: errorBody.error?.code ?? "support_channel_request_failed",
      message:
        errorBody.error?.message ??
        "Support channel settings could not be updated.",
      statusCode: response.status,
    });
  }

  return body as T;
}

export async function getSupportChannel(deps?: RequestDeps) {
  const body = await performRequest<{ channel: SupportChannel | null }>(
    "/api/support-channel",
    { method: "GET" },
    deps,
  );

  return body.channel;
}

export async function startGroupMeConnect(deps?: RequestDeps) {
  return performRequest<SupportChannelConnectStart>(
    "/api/support-channel/groupme/connect/start",
    { method: "POST" },
    deps,
  );
}

export async function completeGroupMeConnect(
  accessToken: string,
  deps?: RequestDeps,
) {
  const query = new URLSearchParams({
    access_token: accessToken,
  });
  const body = await performRequest<{ connection: SupportChannelConnectSession }>(
    `/api/support-channel/groupme/connect/callback?${query.toString()}`,
    { method: "GET" },
    deps,
  );

  return body.connection;
}

export async function listGroupMeDestinations(
  connectSessionId: string,
  deps?: RequestDeps,
) {
  const query = new URLSearchParams({
    connect_session_id: connectSessionId,
  });
  const body = await performRequest<{
    destinations: SupportChannelDestination[];
  }>(
    `/api/support-channel/groupme/destinations?${query.toString()}`,
    { method: "GET" },
    deps,
  );

  return body.destinations;
}

export async function configureSupportChannel(
  input: {
    connectSessionId: string;
    defaultMessage?: string;
    enabled?: boolean;
    externalGroupId: string;
  },
  deps?: RequestDeps,
) {
  const body = await performRequest<{ channel: SupportChannel }>(
    "/api/support-channel/configure",
    {
      method: "POST",
      body: JSON.stringify({
        connect_session_id: input.connectSessionId,
        external_group_id: input.externalGroupId,
        default_message: input.defaultMessage ?? DEFAULT_SUPPORT_CHANNEL_MESSAGE,
        enabled: input.enabled ?? true,
      }),
    },
    deps,
  );

  return body.channel;
}

export async function reconnectSupportChannel(
  input: {
    connectSessionId: string;
    defaultMessage?: string;
    enabled?: boolean;
    externalGroupId?: string;
  },
  deps?: RequestDeps,
) {
  const body = await performRequest<{ channel: SupportChannel }>(
    "/api/support-channel/reconnect",
    {
      method: "POST",
      body: JSON.stringify({
        connect_session_id: input.connectSessionId,
        external_group_id: input.externalGroupId,
        default_message: input.defaultMessage,
        enabled: input.enabled ?? true,
      }),
    },
    deps,
  );

  return body.channel;
}

export async function disableSupportChannel(deps?: RequestDeps) {
  const body = await performRequest<{ channel: SupportChannel }>(
    "/api/support-channel/disable",
    { method: "POST" },
    deps,
  );

  return body.channel;
}

export async function sendSupportChannelTest(deps?: RequestDeps) {
  const body = await performRequest<{ result: SupportChannelTestResult }>(
    "/api/support-channel/test",
    { method: "POST" },
    deps,
  );

  return body.result;
}

export async function sendSupportChannelFlare(
  input: {
    flareEventId?: string | null;
  } = {},
  deps?: RequestDeps,
) {
  const fetchImpl = deps?.fetchImpl ?? fetch;
  const accessToken = await (deps?.getAccessToken ?? readAccessToken)();
  const response = await fetchImpl(
    `${readApiBaseUrl(deps?.env)}/api/support-channel/send-flare`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        flare_event_id: input.flareEventId ?? null,
      }),
    },
  );
  const body = (await response.json()) as
    | { result?: SupportChannelFlareDeliveryResult; error?: SupportChannelApiErrorBody["error"] }
    | SupportChannelApiErrorBody;

  if (body && typeof body === "object" && "result" in body && body.result) {
    return body.result;
  }

  throw new SupportChannelApiError({
    code: body.error?.code ?? "support_channel_request_failed",
    message:
      body.error?.message ?? "Support message could not be sent right now.",
    statusCode: response.status,
  });
}

export function readAccessTokenFromUrl(url: string) {
  try {
    const parsedUrl = new URL(url, "http://localhost");
    const queryToken = parsedUrl.searchParams.get("access_token");

    if (queryToken) {
      return queryToken;
    }
  } catch {
    // Fall back to expo-linking parsing for nonstandard native URLs.
  }

  try {
    const parsedUrl = Linking.parse(url);

    if (typeof parsedUrl.queryParams?.access_token === "string") {
      return parsedUrl.queryParams.access_token;
    }
  } catch {
    // Ignore and fall back to hash parsing below.
  }

  const hashIndex = url.indexOf("#");
  if (hashIndex < 0) {
    return null;
  }

  return new URLSearchParams(url.slice(hashIndex + 1)).get("access_token");
}

export function readAccessTokenFromCurrentUrl() {
  if (typeof window === "undefined" || !window.location) {
    return null;
  }

  return readAccessTokenFromUrl(window.location.href);
}

export function clearSupportChannelCallbackParams() {
  if (
    typeof window === "undefined" ||
    !window.location ||
    typeof window.history?.replaceState !== "function"
  ) {
    return;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(
    window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash,
  );

  ["access_token", "token_type", "expires_in"].forEach((paramName) => {
    searchParams.delete(paramName);
    hashParams.delete(paramName);
  });

  const nextSearch = searchParams.toString();
  const nextHash = hashParams.toString();
  const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${nextHash ? `#${nextHash}` : ""}`;

  window.history.replaceState(window.history.state, "", nextUrl);
}
