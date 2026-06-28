import { type FlareSupabaseClient, getSupabaseClient, MissingSupabaseConfigError } from "./supabaseClient";

export type FlareSupabaseAuthState =
  | {
      kind: "authenticated";
      userId: string;
    }
  | {
      kind: "no-session";
    }
  | {
      kind: "client-unavailable";
      reason: "missing-config";
    };

export async function resolveFlareSupabaseAuthState(
  client: FlareSupabaseClient | null = null,
): Promise<FlareSupabaseAuthState> {
  try {
    const activeClient = client ?? getSupabaseClient();
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
