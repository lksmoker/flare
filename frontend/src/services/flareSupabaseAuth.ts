import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import {
  type FlareSupabaseClient,
  getSupabaseClient,
  MissingSupabaseConfigError,
} from "./supabaseClient";

export type FlareSupabaseAuthState =
  | {
      kind: "authenticated";
      userId: string;
      userEmail: string | null;
    }
  | {
      kind: "no-session";
    }
  | {
      kind: "client-unavailable";
      reason: "missing-config";
    };

export type FlareSupabaseAuthSubscription = {
  unsubscribe: () => void;
};

export type FlarePasswordSignInInput = {
  email: string;
  password: string;
};

export const PUBLIC_AUTH_REDIRECT_URL_ENV_NAME =
  "EXPO_PUBLIC_FLARE_AUTH_REDIRECT_URL";

type RuntimeEnv = Record<string, string | undefined>;
type SessionTokens = {
  accessToken: string;
  refreshToken: string;
};

const HASH_AUTH_PARAM_NAMES = [
  "access_token",
  "expires_at",
  "expires_in",
  "provider_refresh_token",
  "provider_token",
  "refresh_token",
  "token_type",
  "type",
];
const SEARCH_AUTH_PARAM_NAMES = ["code"];

function mapSessionToAuthState(
  session: Session | null | undefined,
): FlareSupabaseAuthState {
  if (!session?.user?.id) {
    return { kind: "no-session" };
  }

  return {
    kind: "authenticated",
    userId: session.user.id,
    userEmail: session.user.email ?? null,
  };
}

export function readFlareAuthRedirectUrl(
  env: RuntimeEnv = process.env,
): string | null {
  const redirectUrl = (
    env.EXPO_PUBLIC_FLARE_AUTH_REDIRECT_URL ??
    process.env.EXPO_PUBLIC_FLARE_AUTH_REDIRECT_URL
  )?.trim();

  return redirectUrl && redirectUrl.length > 0 ? redirectUrl : null;
}

function buildRedirectOptions(env: RuntimeEnv = process.env) {
  const redirectUrl = readFlareAuthRedirectUrl(env);

  return redirectUrl
    ? {
        emailRedirectTo: redirectUrl,
      }
    : undefined;
}

function getWindowLocation() {
  if (typeof window === "undefined" || !window.location) {
    return null;
  }

  return window.location;
}

function readHashParams(hash: string) {
  const normalizedHash = hash.startsWith("#") ? hash.slice(1) : hash;

  return new URLSearchParams(normalizedHash);
}

function readSearchParams(search: string) {
  const normalizedSearch = search.startsWith("?") ? search.slice(1) : search;

  return new URLSearchParams(normalizedSearch);
}

function readSessionTokensFromHash(hash: string): SessionTokens | null {
  const params = readHashParams(hash);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
  };
}

function hasSessionTokensInHash(hash: string) {
  return readHashParams(hash).has("access_token");
}

function hasAuthCodeInSearch(search: string) {
  return readSearchParams(search).has("code");
}

function clearSupabaseAuthUrlParams() {
  const location = getWindowLocation();

  if (!location || typeof window.history?.replaceState !== "function") {
    return;
  }

  const searchParams = readSearchParams(location.search);
  const hashParams = readHashParams(location.hash);

  SEARCH_AUTH_PARAM_NAMES.forEach((paramName) => {
    searchParams.delete(paramName);
  });
  HASH_AUTH_PARAM_NAMES.forEach((paramName) => {
    hashParams.delete(paramName);
  });

  const nextSearch = searchParams.toString();
  const nextHash = hashParams.toString();
  const nextUrl = `${location.pathname}${nextSearch ? `?${nextSearch}` : ""}${nextHash ? `#${nextHash}` : ""}`;

  window.history.replaceState(window.history.state, "", nextUrl);
}

export async function hydrateFlareSupabaseSessionFromUrl(
  client: FlareSupabaseClient | null = null,
): Promise<Session | null> {
  const location = getWindowLocation();

  if (!location) {
    return null;
  }

  const activeClient = client ?? getSupabaseClient();
  const hasHashTokens = hasSessionTokensInHash(location.hash);
  const hasAuthCode = hasAuthCodeInSearch(location.search);

  if (!hasHashTokens && !hasAuthCode) {
    return null;
  }

  if (hasAuthCode) {
    const code = readSearchParams(location.search).get("code");

    if (code) {
      const { data, error } = await activeClient.auth.exchangeCodeForSession(
        code,
      );

      if (!error && data.session) {
        clearSupabaseAuthUrlParams();
        return data.session;
      }
    }
  }

  if (hasHashTokens) {
    const {
      data: { session: detectedSession },
      error: detectedSessionError,
    } = await activeClient.auth.getSession();

    if (!detectedSessionError && detectedSession) {
      clearSupabaseAuthUrlParams();
      return detectedSession;
    }

    const sessionTokens = readSessionTokensFromHash(location.hash);

    if (sessionTokens) {
      const { data, error } = await activeClient.auth.setSession({
        access_token: sessionTokens.accessToken,
        refresh_token: sessionTokens.refreshToken,
      });

      if (!error && data.session) {
        clearSupabaseAuthUrlParams();
        return data.session;
      }
    }

    const {
      data: { session },
      error,
    } = await activeClient.auth.getSession();

    if (!error && session) {
      clearSupabaseAuthUrlParams();
      return session;
    }
  }

  return null;
}

export async function resolveFlareSupabaseAuthState(
  client: FlareSupabaseClient | null = null,
): Promise<FlareSupabaseAuthState> {
  try {
    const activeClient = client ?? getSupabaseClient();
    const hydratedSession =
      await hydrateFlareSupabaseSessionFromUrl(activeClient);

    if (hydratedSession?.user?.id) {
      return mapSessionToAuthState(hydratedSession);
    }

    const {
      data: { session },
      error: sessionError,
    } = await activeClient.auth.getSession();

    if (!sessionError && session?.user?.id) {
      return mapSessionToAuthState(session);
    }

    const {
      data: { user },
      error,
    } = await activeClient.auth.getUser();

    if (error || !user?.id) {
      return { kind: "no-session" };
    }

    return {
      kind: "authenticated",
      userId: user.id,
      userEmail: user.email ?? null,
    };
  } catch (error) {
    if (error instanceof MissingSupabaseConfigError) {
      return {
        kind: "client-unavailable",
        reason: "missing-config",
      };
    }

    return { kind: "no-session" };
  }
}

export function subscribeToFlareSupabaseAuthState(
  onChange: (
    authState: FlareSupabaseAuthState,
    event: AuthChangeEvent,
    session: Session | null,
  ) => void,
  client: FlareSupabaseClient | null = null,
): FlareSupabaseAuthSubscription | null {
  try {
    const activeClient = client ?? getSupabaseClient();
    const { data } = activeClient.auth.onAuthStateChange((event, session) => {
      onChange(mapSessionToAuthState(session), event, session);
    });

    return {
      unsubscribe() {
        data.subscription.unsubscribe();
      },
    };
  } catch (error) {
    if (error instanceof MissingSupabaseConfigError) {
      return null;
    }

    throw error;
  }
}

export async function signInToFlareSupabaseWithPassword(
  input: FlarePasswordSignInInput,
  client: FlareSupabaseClient | null = null,
) {
  const activeClient = client ?? getSupabaseClient();
  const email = input.email.trim();
  const password = input.password;

  const { error } = await activeClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }
}

export async function sendFlareSupabaseMagicLink(
  email: string,
  client: FlareSupabaseClient | null = null,
  env: RuntimeEnv = process.env,
) {
  const activeClient = client ?? getSupabaseClient();
  const normalizedEmail = email.trim();
  const { error } = await activeClient.auth.signInWithOtp({
    email: normalizedEmail,
    options: buildRedirectOptions(env),
  });

  if (error) {
    throw error;
  }
}

export async function signUpForFlareSupabase(
  input: FlarePasswordSignInInput,
  client: FlareSupabaseClient | null = null,
  env: RuntimeEnv = process.env,
) {
  const activeClient = client ?? getSupabaseClient();
  const email = input.email.trim();
  const password = input.password;

  const { error } = await activeClient.auth.signUp({
    email,
    password,
    options: buildRedirectOptions(env),
  });

  if (error) {
    throw error;
  }
}

export async function signOutFromFlareSupabase(
  client: FlareSupabaseClient | null = null,
) {
  const activeClient = client ?? getSupabaseClient();
  const { error } = await activeClient.auth.signOut();

  if (error) {
    throw error;
  }
}
