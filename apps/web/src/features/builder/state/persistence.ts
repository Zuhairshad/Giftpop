import { DesignSchema } from "@giftpop/contracts";
import type { CatalogResponse, CountryCode, Design } from "@giftpop/contracts";

import { isQuestionId } from "../questions/ids";
import type { QuestionId } from "../questions/ids";

import { designFitsCatalog } from "./design-data";

/** The part of `Storage` the builder uses, so tests can pass a fake. */
export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function storageKey(country: CountryCode): string {
  return `gp-builder:${country}`;
}

/** `sessionStorage`, or null when the browser blocks it (or there is no browser). */
export function getSessionStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Reads the design saved for this country. Returns null, and forgets what was
 * stored, when it is missing, unreadable, invalid, or names a format or item
 * the catalog no longer has.
 */
export function readStoredDesign(
  storage: StorageLike | null,
  country: CountryCode,
  catalog: CatalogResponse,
): Design | null {
  if (!storage) return null;
  const key = storageKey(country);
  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch {
    return null;
  }
  if (raw === null) return null;

  const design = parseDesign(raw, catalog);
  if (design === null) forget(storage, key);
  return design;
}

function parseDesign(raw: string, catalog: CatalogResponse): Design | null {
  try {
    const parsed = DesignSchema.safeParse(JSON.parse(raw));
    return parsed.success && designFitsCatalog(parsed.data, catalog) ? parsed.data : null;
  } catch {
    return null;
  }
}

function forget(storage: StorageLike, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // Blocked storage: nothing to clean up.
  }
}

export function questionStorageKey(country: CountryCode): string {
  return `gp-builder-question:${country}`;
}

/**
 * Reads the question this tab was on. Anything that is not a known question id (an old value, a
 * hand-edited one) is forgotten and read as missing.
 */
export function readStoredQuestion(
  storage: StorageLike | null,
  country: CountryCode,
): QuestionId | null {
  if (!storage) return null;
  const key = questionStorageKey(country);
  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch {
    return null;
  }
  if (raw === null) return null;
  if (isQuestionId(raw)) return raw;
  forget(storage, key);
  return null;
}

/** Saves the current question. Never throws. */
export function writeStoredQuestion(
  storage: StorageLike | null,
  country: CountryCode,
  question: QuestionId,
): void {
  if (!storage) return;
  try {
    storage.setItem(questionStorageKey(country), question);
  } catch {
    // Storage is full or blocked: the builder keeps working without it.
  }
}

/** Saves the design, or clears it when there is none. Never throws. */
export function writeStoredDesign(
  storage: StorageLike | null,
  country: CountryCode,
  design: Design | null,
): void {
  if (!storage) return;
  try {
    if (design === null) storage.removeItem(storageKey(country));
    else storage.setItem(storageKey(country), JSON.stringify(design));
  } catch {
    // Storage is full or blocked: the builder keeps working without it.
  }
}
