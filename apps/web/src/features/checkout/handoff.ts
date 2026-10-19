import type { OrderNumber } from "@giftpop/contracts";

import type { StorageLike } from "@/features/builder/state/persistence";
import { writeHandoff } from "@/features/order/handoff";

/**
 * Leaves the order number and phone for the order page, which uses them to look the order up.
 * Blocked storage is fine: the order page then asks for the phone or email instead.
 */
export function saveOrderHandoff(
  storage: StorageLike | null,
  number: OrderNumber,
  phone: string,
): void {
  writeHandoff(number, phone, storage ?? undefined);
}
