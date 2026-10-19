import { PartnerRequestStatusSchema, UpdatePartnerRequestSchema } from "@giftpop/contracts";
import type { PartnerRequestStatus, UpdatePartnerRequest } from "@giftpop/contracts";
import { z } from "zod";

/** What the detail sheet edits. The note is optional text, so it may be empty. */
export const PartnerUpdateFormSchema = z.object({
  status: PartnerRequestStatusSchema,
  note: z.string().trim().max(2000, "Keep the note to 2000 characters"),
});
export type PartnerUpdateFormValues = z.infer<typeof PartnerUpdateFormSchema>;

/**
 * The PATCH body: the status only when it changed, the note only when there is text.
 * Returns null when there is nothing to save.
 */
export function toUpdateBody(
  values: PartnerUpdateFormValues,
  currentStatus: PartnerRequestStatus,
): UpdatePartnerRequest | null {
  const body = UpdatePartnerRequestSchema.parse({
    ...(values.status !== currentStatus ? { status: values.status } : {}),
    ...(values.note.trim() !== "" ? { note: values.note } : {}),
  });
  return body.status === undefined && body.note === undefined ? null : body;
}
