import { z } from "zod";

import { isFieldName } from "./fields";
import type { FieldErrors } from "./fields";

import { ApiError, ApiNetworkError } from "@/lib/api-errors";

export type OrderFailure =
  | { kind: "fields"; fields: FieldErrors }
  | { kind: "design_invalid" }
  | { kind: "text_missing" }
  | { kind: "sold_out" }
  | { kind: "in_progress" }
  | { kind: "rate_limited" }
  | { kind: "offline" }
  | { kind: "generic" };

const TextProblemsSchema = z.object({
  problems: z
    .array(z.object({ code: z.string() }))
    .min(1)
    .refine((problems) =>
      problems.every((p) => p.code === "TEXT_REQUIRED" || p.code === "TEXT_INVALID"),
    ),
});

const DetailsSchema = z.array(z.object({ field: z.string(), message: z.string() }));

/** `address.region` and `region` both mean the region field. Anything we do not show is dropped. */
export function mapDetailsToFields(details: unknown): FieldErrors {
  const parsed = DetailsSchema.safeParse(details);
  const fields: FieldErrors = {};
  if (!parsed.success) return fields;
  for (const detail of parsed.data) {
    const field = detail.field.split(".").at(-1) ?? "";
    if (isFieldName(field) && fields[field] === undefined) fields[field] = detail.message;
  }
  return fields;
}

/** Sorts whatever `POST /orders` threw into something the screen can say in plain words. */
export function classifyOrderError(error: unknown): OrderFailure {
  if (error instanceof ApiNetworkError) return { kind: "offline" };
  if (!(error instanceof ApiError)) return { kind: "generic" };
  if (error.status === 429) return { kind: "rate_limited" };
  if (error.status === 409) {
    const details = error.details;
    const soldOut = typeof details === "object" && details !== null && "outOfStock" in details;
    return soldOut ? { kind: "sold_out" } : { kind: "in_progress" };
  }
  if (error.code === "DESIGN_INVALID") {
    const textOnly = TextProblemsSchema.safeParse(error.details).success;
    return { kind: textOnly ? "text_missing" : "design_invalid" };
  }
  if (error.status === 422 || error.code === "VALIDATION_ERROR") {
    const fields = mapDetailsToFields(error.details);
    if (Object.keys(fields).length > 0) return { kind: "fields", fields };
  }
  return { kind: "generic" };
}

/** The banner text for a failure, or null when the field messages say it all. Never raw API text. */
export function failureMessage(failure: OrderFailure): string | null {
  switch (failure.kind) {
    case "fields":
      return "Some details need another look. Check the fields marked below.";
    case "design_invalid":
      return "Something in your gift changed and it can no longer be ordered as it is. Go back to your items and check it.";
    case "text_missing":
      return 'Your gift is missing a recipient, a card message or an item name, or one of them has characters it cannot hold. Go back to "Who\'s it for?" and check them.';
    case "sold_out":
      return "An item in your gift just sold out. Go back to your items and swap it for another.";
    case "in_progress":
      return "We are already placing this order. Wait a moment, then press Place order again.";
    case "rate_limited":
      return "Too many attempts. Wait a minute and press Place order again.";
    case "offline":
      return "We could not reach the server. Check your connection and press Place order again.";
    case "generic":
      return "We could not place your order. Nothing was charged. Try again in a moment.";
  }
}

/** Whether the banner should offer a link back to the items step. */
export function needsItemsLink(failure: OrderFailure): boolean {
  return failure.kind === "design_invalid" || failure.kind === "sold_out";
}

/** Whether the banner should offer a link back to the personalise step. */
export function needsPersonaliseLink(failure: OrderFailure): boolean {
  return failure.kind === "text_missing";
}
