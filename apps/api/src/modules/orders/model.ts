import type {
  Address,
  Contact,
  Design,
  ItemSnapshot,
  Money,
  OrderStatus,
  PackagingSnapshot,
  PaymentMethod,
  PaymentMode,
  PaymentProofStatus,
  PaymentRecordKind,
  PaymentStatus,
  Quote,
} from "@giftpop/contracts";
import { model, Schema, type Types } from "mongoose";

export interface OrderHistoryDoc {
  from: OrderStatus | null;
  to: OrderStatus;
  at: Date;
  actorId: Types.ObjectId | null;
  note?: string;
}

export interface OrderPaymentDoc {
  _id: Types.ObjectId;
  kind: PaymentRecordKind;
  method: PaymentMethod;
  amount: Money;
  reference?: string;
  note?: string;
  recordedBy: Types.ObjectId;
  recordedAt: Date;
}

export interface OrderNoteDoc {
  _id: Types.ObjectId;
  text: string;
  actorId: Types.ObjectId;
  at: Date;
}

export interface OrderProofDoc {
  _id: Types.ObjectId;
  url: string;
  /** Key of the image in private storage. Missing on proofs stored before proofs went private. */
  storageKey?: string;
  status: PaymentProofStatus;
  uploadedAt: Date;
}

/** The stored order. Frozen at creation: design, packaging, items and quote never change afterwards. */
export interface OrderDoc {
  _id: Types.ObjectId;
  number: string;
  country: string;
  contact: Contact;
  address: Address;
  design: Design;
  packaging: PackagingSnapshot;
  items: ItemSnapshot[];
  quote: Quote;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  /** Changed only by `transitionOrder`; never set anywhere else (CLAUDE.md rule 6). */
  status: OrderStatus;
  /** Append-only. */
  history: OrderHistoryDoc[];
  shipment: {
    courier: string;
    trackingNumber: string;
    trackingUrl?: string;
    shippedAt: Date;
  } | null;
  payments: OrderPaymentDoc[];
  /** Internal staff notes; never in a customer view. */
  notes: OrderNoteDoc[];
  proofs: OrderProofDoc[];
  createdAt: Date;
  updatedAt: Date;
}

const historySchema = new Schema<OrderHistoryDoc>(
  {
    from: { type: String, default: null },
    to: { type: String, required: true },
    at: { type: Date, required: true },
    actorId: { type: Schema.Types.ObjectId, default: null },
    note: { type: String },
  },
  { _id: false },
);

const paymentSchema = new Schema<OrderPaymentDoc>({
  kind: { type: String, required: true },
  method: { type: String, required: true },
  amount: { type: Schema.Types.Mixed, required: true },
  reference: { type: String },
  note: { type: String },
  recordedBy: { type: Schema.Types.ObjectId, required: true },
  recordedAt: { type: Date, required: true },
});

const noteSchema = new Schema<OrderNoteDoc>({
  text: { type: String, required: true },
  actorId: { type: Schema.Types.ObjectId, required: true },
  at: { type: Date, required: true },
});

const proofSchema = new Schema<OrderProofDoc>({
  url: { type: String, required: true },
  storageKey: { type: String },
  status: { type: String, required: true, default: "pending" },
  uploadedAt: { type: Date, required: true },
});

const orderSchema = new Schema<OrderDoc>(
  {
    number: { type: String, required: true, unique: true },
    country: { type: String, required: true },
    contact: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    address: { type: Schema.Types.Mixed, required: true },
    design: { type: Schema.Types.Mixed, required: true },
    packaging: { type: Schema.Types.Mixed, required: true },
    items: { type: Schema.Types.Mixed, required: true },
    quote: { type: Schema.Types.Mixed, required: true },
    paymentMode: { type: String, required: true },
    paymentStatus: { type: String, required: true, default: "unpaid" },
    status: { type: String, required: true },
    history: { type: [historySchema], required: true },
    shipment: { type: Schema.Types.Mixed, default: null },
    payments: { type: [paymentSchema], default: [] },
    notes: { type: [noteSchema], default: [] },
    proofs: { type: [proofSchema], default: [] },
  },
  { timestamps: true, collection: "orders", minimize: false },
);

// Admin list: filter by country and status, newest first.
orderSchema.index({ country: 1, status: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, status: 1 });
// Customer tracking looks an order up by number plus the phone or email it was placed with.
// Dashboard: needs-action counts, orders created per day or window, payments received per day.
orderSchema.index({ status: 1, "proofs.status": 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ "payments.recordedAt": 1 });
orderSchema.index({ "contact.phone": 1 });
orderSchema.index({ "contact.email": 1 });
// Admin order list: every filter combination sorts by (createdAt, _id) for the cursor, so each
// index ends in _id and the sort never happens in memory.
orderSchema.index({ createdAt: -1, _id: -1 });
orderSchema.index({ status: 1, createdAt: -1, _id: -1 });
orderSchema.index({ country: 1, createdAt: -1, _id: -1 });
orderSchema.index({ country: 1, status: 1, createdAt: -1, _id: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1, _id: -1 });
orderSchema.index({ "proofs.status": 1, createdAt: -1, _id: -1 });
// Covers the dashboard's orders-by-country pipeline.
orderSchema.index({ createdAt: -1, country: 1 });

export const OrderModel = model<OrderDoc>("Order", orderSchema);
