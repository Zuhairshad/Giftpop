import { z } from "zod";

import { AssetSchema, ItemShapeSchema } from "./catalog";
import { CountryCodeSchema, HexColorSchema, IsoDateTimeSchema, ObjectIdSchema } from "./common";
import { DesignSchema } from "./design";
import { MinorUnitsSchema } from "./money";
import { OrderStatusSchema, StatusHistoryEntrySchema } from "./order-status";
import {
  PaymentModeSchema,
  PaymentProofSchema,
  PaymentProofStatusSchema,
  PaymentRecordSchema,
  PaymentStatusSchema,
} from "./payment";
import { QuoteSchema } from "./pricing";
import {
  ORDER_PHONE_PATTERN,
  addressLineText,
  holdsOnly,
  nameText,
  postalCodeText,
} from "./text-rules";

/** Crockford base32: digits and letters without I, L, O, U. */
export const ORDER_NUMBER_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
/** `GP-<country>-<6 chars base32>`, for example `GP-PK-7K2M9Q`. */
export const OrderNumberSchema = z.string().regex(/^GP-[A-Z]{2}-[0-9A-HJKMNP-TV-Z]{6}$/);
export type OrderNumber = z.infer<typeof OrderNumberSchema>;

export const PhoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ()-]{6,20}$/, "Invalid phone number");

export const ContactSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.email().max(200),
  phone: PhoneSchema,
});
export type Contact = z.infer<typeof ContactSchema>;

/** Which of `region` and `postalCode` are required depends on the country; the API checks that. */
export const AddressSchema = z.object({
  line1: z.string().trim().min(1).max(120),
  line2: z.string().trim().max(120).optional(),
  city: z.string().trim().min(1).max(80),
  region: z.string().trim().max(80).optional(),
  postalCode: z.string().trim().max(20).optional(),
});
export type Address = z.infer<typeof AddressSchema>;

const onlyHolding = (filter: (value: string) => string, what: string) =>
  [(value: string) => holdsOnly(filter, value), `${what} has characters it cannot hold`] as const;

/** What a new order accepts. Stored orders keep the looser schemas above, so old orders still read. */
export const OrderContactSchema = ContactSchema.extend({
  name: ContactSchema.shape.name.refine(...onlyHolding(nameText, "Name")),
  phone: z
    .string()
    .trim()
    .regex(ORDER_PHONE_PATTERN, "Phone can hold digits and spaces after the dial code only"),
});

export const OrderAddressSchema = AddressSchema.extend({
  line1: AddressSchema.shape.line1.refine(...onlyHolding(addressLineText, "Address line 1")),
  line2: AddressSchema.shape.line2.refine(
    (value) => value === undefined || holdsOnly(addressLineText, value),
    "Address line 2 has characters it cannot hold",
  ),
  city: AddressSchema.shape.city.refine(...onlyHolding(nameText, "City")),
  region: AddressSchema.shape.region.refine(
    (value) => value === undefined || holdsOnly(nameText, value),
    "Region has characters it cannot hold",
  ),
  postalCode: AddressSchema.shape.postalCode.refine(
    (value) => value === undefined || holdsOnly(postalCodeText, value),
    "Postal code has characters it cannot hold",
  ),
});

/** Frozen copy of an item as it was when ordered. Later catalog edits never touch it. */
export const ItemSnapshotSchema = z.object({
  itemId: ObjectIdSchema,
  name: z.string(),
  shape: ItemShapeSchema,
  color: HexColorSchema,
  sizeUnits: z.number().int().positive(),
  unitPriceMinor: MinorUnitsSchema.nonnegative(),
  qty: z.number().int().positive(),
  /** The image as it was when ordered, so the gift can be drawn exactly as built. */
  image: AssetSchema.optional(),
});
export type ItemSnapshot = z.infer<typeof ItemSnapshotSchema>;

export const PackagingSnapshotSchema = z.object({
  packagingId: ObjectIdSchema,
  name: z.string(),
  layoutType: z.string(),
  priceMinor: MinorUnitsSchema.nonnegative(),
  minItems: z.number().int().positive(),
  maxItems: z.number().int().positive(),
  capacityUnits: z.number().int().positive(),
  layers: z.object({ back: AssetSchema.optional(), front: AssetSchema.optional() }).default({}),
  /** Palette names of the chosen colours when ordered ("Blush"); absent on orders placed before they were kept. */
  wrapperColorName: z.string().min(1).max(40).optional(),
  ribbonColorName: z.string().min(1).max(40).optional(),
});
export type PackagingSnapshot = z.infer<typeof PackagingSnapshotSchema>;

export const ShipmentSchema = z.object({
  courier: z.string().min(1),
  trackingNumber: z.string().min(1),
  trackingUrl: z.url().optional(),
  shippedAt: IsoDateTimeSchema,
});
export type Shipment = z.infer<typeof ShipmentSchema>;

export const OrderNoteSchema = z.object({
  id: ObjectIdSchema,
  text: z.string().min(1).max(2000),
  actorId: ObjectIdSchema,
  at: IsoDateTimeSchema,
});
export type OrderNote = z.infer<typeof OrderNoteSchema>;

export const OrderSchema = z.object({
  id: ObjectIdSchema,
  number: OrderNumberSchema,
  country: CountryCodeSchema,
  contact: ContactSchema,
  address: AddressSchema,
  /** The exact design JSON as ordered. */
  design: DesignSchema,
  packaging: PackagingSnapshotSchema,
  items: z.array(ItemSnapshotSchema).min(1),
  quote: QuoteSchema,
  paymentMode: PaymentModeSchema,
  paymentStatus: PaymentStatusSchema,
  /** Changed only through `assertTransition`; never set directly. */
  status: OrderStatusSchema,
  /** Append-only. May hold staff notes, so never sent to customers. */
  history: z.array(StatusHistoryEntrySchema).min(1),
  shipment: ShipmentSchema.nullable(),
  payments: z.array(PaymentRecordSchema),
  /** Internal staff notes. Never sent to customers. */
  notes: z.array(OrderNoteSchema).default([]),
  /** Proofs of payment uploaded by the customer. */
  proofs: z.array(PaymentProofSchema).default([]),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});
export type Order = z.infer<typeof OrderSchema>;

/**
 * What the browser sends to place an order. There is no price here: the
 * server prices the design itself and ignores any price sent.
 */
export const CreateOrderRequestSchema = z.object({
  country: CountryCodeSchema,
  design: DesignSchema,
  contact: OrderContactSchema,
  address: OrderAddressSchema,
  paymentMode: PaymentModeSchema,
});
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

export const CreateOrderResponseSchema = z.object({
  number: OrderNumberSchema,
  quote: QuoteSchema,
  paymentMode: PaymentModeSchema,
  /** The country's payment instructions for the amount due now. */
  paymentInstructions: z.string(),
});
export type CreateOrderResponse = z.infer<typeof CreateOrderResponseSchema>;

/** Customers track with the order number plus the phone or email used to order. */
export const TrackOrderRequestSchema = z.object({
  number: OrderNumberSchema,
  contact: z.string().trim().min(3).max(200),
});
export type TrackOrderRequest = z.infer<typeof TrackOrderRequestSchema>;

/** "Forgot your order number?": the phone or email used to order. The answer never says whether orders exist. */
export const LookupOrdersRequestSchema = z.object({
  contact: z.string().trim().min(3).max(200),
});
export type LookupOrdersRequest = z.infer<typeof LookupOrdersRequestSchema>;

export const LookupOrdersResponseSchema = z.object({ ok: z.literal(true) });
export type LookupOrdersResponse = z.infer<typeof LookupOrdersResponseSchema>;

/** The customer-facing view: no staff notes, no actor ids. */
export const PublicTrackingViewSchema = z.object({
  number: OrderNumberSchema,
  country: CountryCodeSchema,
  status: OrderStatusSchema,
  paymentStatus: PaymentStatusSchema,
  history: z.array(z.object({ to: OrderStatusSchema, at: IsoDateTimeSchema })),
  shipment: z
    .object({ courier: z.string(), trackingNumber: z.string(), trackingUrl: z.url().optional() })
    .nullable(),
  createdAt: IsoDateTimeSchema,
});
export type PublicTrackingView = z.infer<typeof PublicTrackingViewSchema>;

/**
 * Everything the customer's order and tracking pages show: the tracking view plus
 * what they ordered and what to pay. Never staff notes or actor ids.
 */
export const PublicOrderViewSchema = PublicTrackingViewSchema.extend({
  paymentMode: PaymentModeSchema,
  quote: QuoteSchema,
  /** The country's payment instructions, for orders still waiting on payment. */
  paymentInstructions: z.string(),
  design: DesignSchema,
  packaging: PackagingSnapshotSchema,
  items: z.array(ItemSnapshotSchema),
  proofs: z.array(z.object({ uploadedAt: IsoDateTimeSchema, status: PaymentProofStatusSchema })),
});
export type PublicOrderView = z.infer<typeof PublicOrderViewSchema>;
