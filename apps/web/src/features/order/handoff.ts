import { OrderNumberSchema } from "@giftpop/contracts";
import { z } from "zod";

const HandoffSchema = z.object({
  number: OrderNumberSchema,
  contact: z.string().trim().min(3).max(200),
});

export function handoffKey(number: string): string {
  return `gp-order:${number}`;
}

/** Reads what checkout stored. Answers the contact, or null when missing, corrupt or for another order. */
export function parseHandoff(raw: string | null | undefined, number: string): string | null {
  if (!raw) return null;
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }
  const parsed = HandoffSchema.safeParse(json);
  return parsed.success && parsed.data.number === number ? parsed.data.contact : null;
}

type StorageLike = Pick<Storage, "getItem" | "setItem">;

/** Storage can be missing or throw (private windows), so this never throws. */
export function readHandoff(number: string, storage: StorageLike | undefined): string | null {
  try {
    return parseHandoff(storage?.getItem(handoffKey(number)), number);
  } catch {
    return null;
  }
}

export function writeHandoff(
  number: string,
  contact: string,
  storage: StorageLike | undefined,
): void {
  try {
    storage?.setItem(handoffKey(number), JSON.stringify({ number, contact }));
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
