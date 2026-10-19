import type { OrderNumber } from "@giftpop/contracts";

import type { StorageLike } from "@/features/builder/state/persistence";

export function handoffKey(number: OrderNumber): string {
  return `gp-order:${number}`;
}

/** Leaves the order number and phone for the order page, which uses them to look the order up. */
export function saveOrderHandoff(
  storage: StorageLike | null,
  number: OrderNumber,
  phone: string,
): void {
  if (!storage) return;
  try {
    storage.setItem(handoffKey(number), JSON.stringify({ number, contact: phone }));
  } catch {
    // Storage can be blocked; the order page then asks for the phone or email instead.
  }
}
