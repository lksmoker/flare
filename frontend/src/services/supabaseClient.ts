import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const PUBLIC_SUPABASE_URL_ENV_NAME =
  "EXPO_PUBLIC_FLARE_SUPABASE_URL";
export const PUBLIC_SUPABASE_ANON_KEY_ENV_NAME =
  "EXPO_PUBLIC_FLARE_SUPABASE_ANON_KEY";

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

function readRequiredEnvValue(env: RuntimeEnv, envName: string) {
  const value = env[envName]?.trim();

  return value ? value : undefined;
}

export function readPublicSupabaseConfig(
  env: RuntimeEnv = process.env,
): PublicSupabaseConfig {
  const url = readRequiredEnvValue(env, PUBLIC_SUPABASE_URL_ENV_NAME);
  const anonKey = readRequiredEnvValue(env, PUBLIC_SUPABASE_ANON_KEY_ENV_NAME);
  const missingEnvNames = [
    !url ? PUBLIC_SUPABASE_URL_ENV_NAME : null,
    !anonKey ? PUBLIC_SUPABASE_ANON_KEY_ENV_NAME : null,
  ].filter((value): value is string => Boolean(value));

  if (missingEnvNames.length > 0) {
    throw new MissingSupabaseConfigError(missingEnvNames);
  }

  return {
    anonKey: anonKey as string,
    url: url as string,
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
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  cachedClient = client;

  return client;
}

export function resetSupabaseClientForTests() {
  cachedClient = null;
}
