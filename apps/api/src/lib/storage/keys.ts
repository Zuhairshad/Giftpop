import { randomBytes } from "node:crypto";

/** A key is `assets/` plus 24 random bytes in base64url: unguessable and path-safe. */
export function newAssetKey(extension = "webp"): string {
  return `assets/${randomBytes(24).toString("base64url")}.${extension}`;
}

const SAFE_SEGMENT = /^[A-Za-z0-9_-][A-Za-z0-9_.-]*$/;

/** True for keys made of plain segments only: no `..`, dotfiles, empty segments or separators. */
export function isSafeKey(key: string): boolean {
  if (key.length === 0 || key.length > 300) return false;
  return key.split("/").every((segment) => segment !== ".." && SAFE_SEGMENT.test(segment));
}
