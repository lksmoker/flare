import fs from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

import {
  getSupabaseClient,
  MissingSupabaseConfigError,
  PUBLIC_SUPABASE_ANON_KEY_ENV_NAME,
  PUBLIC_SUPABASE_URL_ENV_NAME,
  readPublicSupabaseConfig,
  resetSupabaseClientForTests,
} from "../supabaseClient";

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({ kind: "supabase-client-stub" })),
}));

const createClientMock = jest.mocked(createClient);

const PRIVATE_ENV_NAMES = [
  ["FLARE", "SUPABASE", "URL"],
  ["FLARE", "SUPABASE", "PROJECT", "ID"],
  ["FLARE", "SUPABASE", "SERVICE", "ROLE", "KEY"],
  ["FLARE", "SUPABASE", "DB", "URL"],
].map((parts) => parts.join("_"));

function getFrontendSourceFiles(dirPath: string): string[] {
  return fs.readdirSync(dirPath, { withFileTypes: true }).flatMap((entry) => {
    const nextPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "__tests__") {
        return [];
      }

      return getFrontendSourceFiles(nextPath);
    }

    return nextPath.endsWith(".ts") || nextPath.endsWith(".tsx") ? [nextPath] : [];
  });
}

describe("supabaseClient boundary", () => {
  beforeEach(() => {
    createClientMock.mockClear();
    resetSupabaseClientForTests();
  });

  it("reads only the Flare public Expo env names", () => {
    const env = {
      [PUBLIC_SUPABASE_URL_ENV_NAME]: "https://flare.example.supabase.co",
      [PUBLIC_SUPABASE_ANON_KEY_ENV_NAME]: "public-anon-key",
      [PRIVATE_ENV_NAMES[2]]: "private-should-not-be-read",
      [PRIVATE_ENV_NAMES[3]]: "postgres://private-should-not-be-read",
    };

    expect(readPublicSupabaseConfig(env)).toEqual({
      anonKey: "public-anon-key",
      url: "https://flare.example.supabase.co",
    });

    const client = getSupabaseClient(env);

    expect(client).toEqual({ kind: "supabase-client-stub" });
    expect(createClientMock).toHaveBeenCalledWith(
      "https://flare.example.supabase.co",
      "public-anon-key",
      {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
      },
    );
  });

  it("throws a predictable error when the public env variables are missing", () => {
    expect(() => readPublicSupabaseConfig({})).toThrow(
      MissingSupabaseConfigError,
    );

    try {
      readPublicSupabaseConfig({});
    } catch (error) {
      expect(error).toBeInstanceOf(MissingSupabaseConfigError);
      expect((error as MissingSupabaseConfigError).missingEnvNames).toEqual([
        PUBLIC_SUPABASE_URL_ENV_NAME,
        PUBLIC_SUPABASE_ANON_KEY_ENV_NAME,
      ]);
      expect((error as Error).message).toContain(PUBLIC_SUPABASE_URL_ENV_NAME);
      expect((error as Error).message).toContain(
        PUBLIC_SUPABASE_ANON_KEY_ENV_NAME,
      );
    }

    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("does not reference private Supabase env names in frontend source", () => {
    const sourceRoot = path.resolve(__dirname, "..", "..");
    const sourceFiles = getFrontendSourceFiles(sourceRoot);

    const offenders = sourceFiles.flatMap((filePath) => {
      const fileContents = fs.readFileSync(filePath, "utf8");

      return PRIVATE_ENV_NAMES.filter((envName) =>
        new RegExp(`\\b${envName}\\b`).test(fileContents),
      ).map((envName) => `${path.relative(sourceRoot, filePath)} -> ${envName}`);
    });

    expect(offenders).toEqual([]);
  });
});
