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

export async function resolveFlareSupabaseAuthState(
  client: FlareSupabaseClient | null = null,
): Promise<FlareSupabaseAuthState> {
  try {
    const activeClient = client ?? getSupabaseClient();
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
) {
  const activeClient = client ?? getSupabaseClient();
  const normalizedEmail = email.trim();
  const { error } = await activeClient.auth.signInWithOtp({
    email: normalizedEmail,
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
