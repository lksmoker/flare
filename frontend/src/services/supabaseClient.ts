import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const PUBLIC_SUPABASE_URL_ENV_NAME =
  "EXPO_PUBLIC_FLARE_SUPABASE_URL";
export const PUBLIC_SUPABASE_ANON_KEY_ENV_NAME =
  "EXPO_PUBLIC_FLARE_SUPABASE_ANON_KEY";
export const FLARE_SUPABASE_AUTH_STORAGE_KEY = "flare-auth-token";

type RuntimeEnv = Record<string, string | undefined>;

export type PublicSupabaseConfig = {
  anonKey: string;
  url: string;
};

export type FlareSupabaseClient = SupabaseClient;

export class MissingSupabaseConfigError extends Error {
  missingEnvNames: string[];

  constructor(missingEnvNames: string[]) {
    super(
      `Missing required Flare public Supabase environment variables: ${missingEnvNames.join(", ")}.`,
    );
    this.name = "MissingSupabaseConfigError";
    this.missingEnvNames = missingEnvNames;
  }
}

function cleanRequiredEnvValue(value: string | undefined) {
  const trimmedValue = value?.trim();

  return trimmedValue ? trimmedValue : undefined;
}

export function readPublicSupabaseConfig(
  env: RuntimeEnv = process.env,
): PublicSupabaseConfig {
  const url = cleanRequiredEnvValue(
    env.EXPO_PUBLIC_FLARE_SUPABASE_URL ?? env.EXPO_PUBLIC_SUPABASE_URL,
  );
  const anonKey = cleanRequiredEnvValue(
    env.EXPO_PUBLIC_FLARE_SUPABASE_ANON_KEY ?? env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  );

  if (!url || !anonKey) {
    const missingEnvNames = [
      !url ? PUBLIC_SUPABASE_URL_ENV_NAME : null,
      !anonKey ? PUBLIC_SUPABASE_ANON_KEY_ENV_NAME : null,
    ].filter((value): value is string => Boolean(value));

    throw new MissingSupabaseConfigError(missingEnvNames);
  }

  return {
    anonKey,
    url,
  };
}

let cachedClient: FlareSupabaseClient | null = null;

export function getSupabaseClient(
  env: RuntimeEnv = process.env,
): FlareSupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }

  const { url, anonKey } = readPublicSupabaseConfig(env);

  const client = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
      storageKey: FLARE_SUPABASE_AUTH_STORAGE_KEY,
    },
  });

  cachedClient = client;

  return client;
}

export function resetSupabaseClientForTests() {
  cachedClient = null;
}


