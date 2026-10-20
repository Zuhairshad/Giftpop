import type { OrderStatus } from "@giftpop/contracts";

/** The first word of a typed full name, for a friendly greeting. Null when there is none. */
export function firstNameOf(fullName: string | null | undefined): string | null {
  const first = (fullName ?? "").trim().split(/\s+/u)[0] ?? "";
  if (first === "") return null;
  // Whole code points, at most 40 UTF-16 units (the handoff schema's limit), so a long name never
  // ends in half an emoji and is never dropped by the schema.
  let name = "";
  for (const char of first) {
    if (name.length + char.length > 40) break;
    name += char;
  }
  return name;
}

/** Orders that ended badly get no thank-you; the eyebrow stays neutral. */
const NO_THANKS: readonly OrderStatus[] = ["cancelled", "returned"];

/**
 * The handmade line above "Your order": "Thank you, Sara!" when checkout left the name in this
 * browser, "Thank you!" otherwise. `status` is null while the order is still loading.
 */
export function orderEyebrow(status: OrderStatus | null, firstName: string | null): string {
  if (status !== null && NO_THANKS.includes(status)) return "Made by hand, just for you";
  return firstName ? `Thank you, ${firstName}!` : "Thank you!";
}
