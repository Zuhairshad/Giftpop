import { OrderNumberSchema } from "@giftpop/contracts";
import { z } from "zod";

/** Browser-only note checkout leaves for the order page (sessionStorage, never sent anywhere). */
const HandoffSchema = z.object({
  number: OrderNumberSchema,
  contact: z.string().trim().min(3).max(200),
  /** For the thank-you line. A bad value is dropped; it never hides the contact. */
  firstName: z.string().trim().min(1).max(40).optional().catch(undefined),
});

export type HandoffEntry = { contact: string; firstName: string | null };

export function handoffKey(number: string): string {
  return `gp-order:${number}`;
}

/** Reads what checkout stored, or null when missing, corrupt or for another order. */
export function parseHandoffEntry(
  raw: string | null | undefined,
  number: string,
): HandoffEntry | null {
  if (!raw) return null;
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }
  const parsed = HandoffSchema.safeParse(json);
  if (!parsed.success || parsed.data.number !== number) return null;
  return { contact: parsed.data.contact, firstName: parsed.data.firstName ?? null };
}

/** The contact checkout stored, or null. */
export function parseHandoff(raw: string | null | undefined, number: string): string | null {
  return parseHandoffEntry(raw, number)?.contact ?? null;
}

type StorageLike = Pick<Storage, "getItem" | "setItem">;

/** Storage can be missing or throw (private windows), so this never throws. */
export function readHandoffEntry(
  number: string,
  storage: StorageLike | undefined,
): HandoffEntry | null {
  try {
    return parseHandoffEntry(storage?.getItem(handoffKey(number)), number);
  } catch {
    return null;
  }
}

export function readHandoff(number: string, storage: StorageLike | undefined): string | null {
  return readHandoffEntry(number, storage)?.contact ?? null;
}

export function writeHandoff(
  number: string,
  contact: string,
  storage: StorageLike | undefined,
  firstName?: string | null,
): void {
  const entry = firstName ? { number, contact, firstName } : { number, contact };
  try {
    storage?.setItem(handoffKey(number), JSON.stringify(entry));
  } catch {
    // The visitor can type the contact again.
  }
}

export function browserSession(): StorageLike | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.sessionStorage;
  } catch {
    return undefined;
  }
}
