import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const distDirectory = path.resolve(scriptDirectory, "..", "dist");
const indexHtmlPath = path.join(distDirectory, "index.html");
const notFoundPath = path.join(distDirectory, "404.html");

if (!existsSync(indexHtmlPath)) {
  throw new Error(`Cannot prepare GitHub Pages fallback without ${indexHtmlPath}.`);
}

copyFileSync(indexHtmlPath, notFoundPath);
