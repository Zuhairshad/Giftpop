import { z } from "zod";

import { PaginationQuerySchema } from "./api";
import { CountryCodeSchema, CountryParamSchema, IsoDateTimeSchema, ObjectIdSchema } from "./common";
import { PhoneSchema } from "./order";

export const PARTNER_REQUEST_KINDS = ["brand", "country"] as const;
export const PartnerRequestKindSchema = z.enum(PARTNER_REQUEST_KINDS);
export type PartnerRequestKind = z.infer<typeof PartnerRequestKindSchema>;

export const PartnerRequestStatusSchema = z.enum(["new", "in_talks", "accepted", "declined"]);
export type PartnerRequestStatus = z.infer<typeof PartnerRequestStatusSchema>;

const ContactFields = {
  contactName: z.string().trim().min(1).max(80),
  email: z.email().max(200),
  phone: PhoneSchema,
  message: z.string().trim().max(2000).default(""),
};

/** A brand that wants its products sold in gifts. */
export const BrandRequestInputSchema = z.object({
  kind: z.literal("brand"),
  brandName: z.string().trim().min(1).max(120),
  ...ContactFields,
  country: CountryCodeSchema,
  productCategories: z.array(z.string().trim().min(1).max(40)).min(1).max(20),
  /** Website or Instagram. */
  link: z.string().trim().min(1).max(300),
});
export type BrandRequestInput = z.infer<typeof BrandRequestInputSchema>;

/** Someone who wants to bring The Giftpop to a country that is not live yet. */
export const CountryRequestInputSchema = z.object({
  kind: z.literal("country"),
  ...ContactFields,
  country: CountryCodeSchema,
  offering: z.string().trim().min(1).max(1000),
});
export type CountryRequestInput = z.infer<typeof CountryRequestInputSchema>;

export const CreatePartnerRequestSchema = z.discriminatedUnion("kind", [
  BrandRequestInputSchema,
  CountryRequestInputSchema,
]);
export type CreatePartnerRequest = z.infer<typeof CreatePartnerRequestSchema>;

export const PartnerNoteSchema = z.object({
  at: IsoDateTimeSchema,
  actorId: ObjectIdSchema,
  text: z.string().min(1).max(2000),
});
export type PartnerNote = z.infer<typeof PartnerNoteSchema>;

const PartnerRecordFields = {
  id: ObjectIdSchema,
  status: PartnerRequestStatusSchema,
  notes: z.array(PartnerNoteSchema),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
};

export const PartnerRequestSchema = z.discriminatedUnion("kind", [
  BrandRequestInputSchema.extend(PartnerRecordFields),
  CountryRequestInputSchema.extend(PartnerRecordFields),
]);
export type PartnerRequest = z.infer<typeof PartnerRequestSchema>;

/** Staff move a request along and may add a note. */
export const UpdatePartnerRequestSchema = z.object({
  status: PartnerRequestStatusSchema.optional(),
  note: z.string().trim().min(1).max(2000).optional(),
});
export type UpdatePartnerRequest = z.infer<typeof UpdatePartnerRequestSchema>;

/**
 * Name of the hidden form field bots fill in. The API reads it from the raw body before
 * validation (zod would strip it): a filled field gets a fake success and nothing is stored.
 */
export const PARTNER_HONEYPOT_FIELD = "website_url";

/** The public answer to a partner request, real or (for a bot) fake. */
export const PartnerRequestReceivedSchema = z.object({ received: z.literal(true) });
export type PartnerRequestReceived = z.infer<typeof PartnerRequestReceivedSchema>;

export const PartnerRequestListQuerySchema = PaginationQuerySchema.extend({
  kind: PartnerRequestKindSchema.optional(),
  status: PartnerRequestStatusSchema.optional(),
  country: CountryParamSchema.optional(),
});
export type PartnerRequestListQuery = z.infer<typeof PartnerRequestListQuerySchema>;
