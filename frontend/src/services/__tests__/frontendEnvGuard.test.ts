import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const FRONTEND_SRC_ROOT = join(__dirname, "..", "..");
const BLOCKED_ENV_NAMES = [
  ["FLARE", "SUPABASE", "SERVICE", "ROLE", "KEY"].join("_"),
  ["FLARE", "SUPABASE", "DB", "URL"].join("_"),
  ["FLARE", "SUPABASE", "URL"].join("_"),
  ["FLARE", "SUPABASE", "PROJECT", "ID"].join("_"),
];

function readFrontendSourceFiles(rootPath: string): string[] {
  return readdirSync(rootPath).flatMap((entryName) => {
    const absolutePath = join(rootPath, entryName);
    const entry = statSync(absolutePath);

    if (entry.isDirectory()) {
      return readFrontendSourceFiles(absolutePath);
    }

    if (!absolutePath.endsWith(".ts") && !absolutePath.endsWith(".tsx")) {
      return [];
    }

    if (absolutePath.includes(`${join("src", "services", "__tests__")}`)) {
      return [];
    }

    return [readFileSync(absolutePath, "utf8")];
  });
}

describe("frontend Supabase env guard", () => {
  it("does not reference private Supabase env names in frontend source", () => {
    const sourceFiles = readFrontendSourceFiles(FRONTEND_SRC_ROOT);

    for (const blockedEnvName of BLOCKED_ENV_NAMES) {
      const blockedEnvPattern = new RegExp(`\\b${blockedEnvName}\\b`, "g");

      expect(
        sourceFiles.some((source) => blockedEnvPattern.test(source)),
      ).toBe(false);
    }
  });
});
