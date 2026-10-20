import type { OrderNumber } from "@giftpop/contracts";

import type { StorageLike } from "@/features/builder/state/persistence";
import { writeHandoff } from "@/features/order/handoff";
import { firstNameOf } from "@/features/order/thank-you";

/**
 * Leaves the order number, phone and first name for the order page, which uses them to look the
 * order up and to say thank you by name.
 * Blocked storage is fine: the order page then asks for the phone or email instead.
 */
export function saveOrderHandoff(
  storage: StorageLike | null,
  number: OrderNumber,
  phone: string,
  fullName?: string,
): void {
  writeHandoff(number, phone, storage ?? undefined, firstNameOf(fullName));
}
