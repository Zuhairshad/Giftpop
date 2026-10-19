import { CreateOrderRequestSchema } from "@giftpop/contracts";
import type {
  Address,
  Contact,
  CountryCode,
  CreateOrderRequest,
  Design,
  PaymentMode,
} from "@giftpop/contracts";

export interface OrderRequestInput {
  country: CountryCode;
  design: Design;
  contact: Contact;
  address: Address;
  paymentMode: PaymentMode;
}

/** Builds the body for `POST /orders`. It carries no price: the server prices the design itself. */
export function buildOrderRequest(input: OrderRequestInput): CreateOrderRequest {
  return CreateOrderRequestSchema.parse({
    country: input.country,
    design: input.design,
    contact: input.contact,
    address: input.address,
    paymentMode: input.paymentMode,
  });
}

/** Same text for the same submission, so the idempotency key can tell "retry" from "changed". */
export function requestFingerprint(request: CreateOrderRequest): string {
  return JSON.stringify(request);
}
