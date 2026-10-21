import type { LookupOrdersRequest } from "@giftpop/contracts";

import { enqueueOrderLookup } from "../notifications/service";

import { contactMatches, normaliseEmail, normalisePhone } from "./contact";
import { OrderModel, type OrderDoc } from "./model";

const MAX_ORDERS = 5;

/** Orders whose stored contact matches what was typed: an email exactly, or a phone as the full number or its national form. */
async function findOrders(typed: string): Promise<OrderDoc[]> {
  const input = typed.trim();
  let filter: Record<string, unknown>;
  if (input.includes("@")) {
    filter = { "searchKeys.email": normaliseEmail(input) };
  } else {
    const digits = normalisePhone(input);
    if (digits.length < 6) return [];
    // Digits only, so the pattern cannot hold regex syntax.
    filter = { "searchKeys.phoneDigits": new RegExp(`${digits.replace(/^0+/, "")}$`) };
  }
  const found = await OrderModel.find(filter)
    .sort({ createdAt: -1 })
    .limit(MAX_ORDERS * 4)
    .lean<OrderDoc[]>();
  return found.filter((order) => contactMatches(order.contact, typed)).slice(0, MAX_ORDERS);
}

/**
 * "Forgot your order number?": emails the order numbers to the address each order was placed
 * with. The caller always answers the same way, so this reveals nothing about who has orders.
 */
export async function requestOrderLinks({ contact }: LookupOrdersRequest): Promise<void> {
  const orders = await findOrders(contact);
  const byEmail = new Map<string, string[]>();
  for (const order of orders) {
    const email = order.contact.email.trim();
    byEmail.set(email, [...(byEmail.get(email) ?? []), order.number]);
  }
  for (const [email, numbers] of byEmail) await enqueueOrderLookup({ email, numbers });
}
