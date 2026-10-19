import { z } from "zod";

import { IsoDateTimeSchema, ObjectIdSchema } from "./common";
import type { CountryCode } from "./common";
import { MoneySchema } from "./money";
import type { Money } from "./money";

/** How the customer chose to pay: in full now (discounted), or an advance now and the rest on delivery. */
export const PaymentModeSchema = z.enum(["prepaid", "cod"]);
export type PaymentMode = z.infer<typeof PaymentModeSchema>;

/** Payment status is separate from fulfilment status. */
export const PaymentStatusSchema = z.enum(["unpaid", "advance_paid", "paid", "refunded"]);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

/** The channel money moves through. `card` has no implementation yet. */
export const PaymentMethodSchema = z.enum(["manual_transfer", "cod", "card"]);
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export const PaymentRecordKindSchema = z.enum(["advance", "full", "balance", "refund"]);
export type PaymentRecordKind = z.infer<typeof PaymentRecordKindSchema>;

export const PaymentRecordSchema = z.object({
  id: ObjectIdSchema,
  kind: PaymentRecordKindSchema,
  method: PaymentMethodSchema,
  amount: MoneySchema,
  reference: z.string().max(200).optional(),
  note: z.string().max(500).optional(),
  recordedBy: ObjectIdSchema,
  recordedAt: IsoDateTimeSchema,
});
export type PaymentRecord = z.infer<typeof PaymentRecordSchema>;

/** Staff records a payment against an order. */
export const RecordPaymentRequestSchema = z.object({
  kind: PaymentRecordKindSchema,
  method: PaymentMethodSchema,
  amountMinor: z.number().int().positive().safe(),
  reference: z.string().max(200).optional(),
  note: z.string().max(500).optional(),
});
export type RecordPaymentRequest = z.infer<typeof RecordPaymentRequestSchema>;

export interface PaymentContext {
  orderNumber: string;
  country: CountryCode;
  amountDue: Money;
  /** The country's `paymentInstructions` text. */
  paymentInstructions: string;
}

export interface PaymentPreparation {
  method: PaymentMethod;
  /** Provider reference, if the provider issues one up front. */
  reference?: string;
  /** Where to send the customer, for hosted checkouts. */
  redirectUrl?: string;
}

export interface PaymentInstructions {
  method: PaymentMethod;
  text: string;
}

/**
 * Every way of taking money implements this. v1 ships `manual_transfer`
 * and `cod`; `card` is an unimplemented slot behind the same interface.
 */
export interface PaymentProvider {
  readonly method: PaymentMethod;
  prepare(context: PaymentContext): Promise<PaymentPreparation>;
  instructions(context: PaymentContext): PaymentInstructions;
}

export const PaymentProofStatusSchema = z.enum(["pending", "accepted", "rejected"]);
export type PaymentProofStatus = z.infer<typeof PaymentProofStatusSchema>;

/** A customer's proof of a manual transfer. The image lives in object storage; staff review it. */
export const PaymentProofSchema = z.object({
  id: ObjectIdSchema,
  url: z.string().min(1),
  status: PaymentProofStatusSchema,
  uploadedAt: IsoDateTimeSchema,
});
export type PaymentProof = z.infer<typeof PaymentProofSchema>;

/** Text fields sent with the proof image (multipart field `file`). */
export const PaymentProofUploadFieldsSchema = z.object({
  /** The phone or email used to place the order. */
  contact: z.string().trim().min(3).max(200),
});
export type PaymentProofUploadFields = z.infer<typeof PaymentProofUploadFieldsSchema>;

export const PaymentProofUploadResponseSchema = z.object({
  proof: PaymentProofSchema.pick({ id: true, status: true, uploadedAt: true }),
});
export type PaymentProofUploadResponse = z.infer<typeof PaymentProofUploadResponseSchema>;
