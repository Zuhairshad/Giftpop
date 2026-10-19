import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

let cached: string | undefined;

/**
 * Directory of `apps/api`, found by walking up from this file. Works from `src/` (tsx,
 * vitest) and from the bundled `dist/`, so a relative UPLOAD_DIR means the same folder
 * whatever the process cwd is.
 */
export function apiPackageRoot(): string {
  if (cached) return cached;
  let dir = dirname(fileURLToPath(import.meta.url));
  for (;;) {
    if (existsSync(join(dir, "package.json"))) {
      cached = dir;
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) throw new Error("Could not find the api package root");
    dir = parent;
  }
}

/** Resolve UPLOAD_DIR: absolute paths stay as they are, relative ones start at the api root. */
export function resolveUploadDir(uploadDir: string): string {
  return resolve(apiPackageRoot(), uploadDir);
}
