import { RecordPaymentRequestSchema } from "@giftpop/contracts";
import type {
  AdminOrderDetail,
  PaymentMethod,
  PaymentRecordKind,
  RecordPaymentRequest,
} from "@giftpop/contracts";

import { AMOUNT_MESSAGES, parseAmountToMinor, receivedMinor } from "./amount";

export interface PaymentFormValues {
  amount: string;
  kind: PaymentRecordKind;
  method: PaymentMethod;
  reference: string;
  note: string;
}

export type PaymentFieldName = keyof PaymentFormValues;

export type PaymentValidation =
  | { ok: true; request: RecordPaymentRequest }
  | { ok: false; errors: Partial<Record<PaymentFieldName, string>> };

/** The method to suggest: cash on delivery settles a balance; everything else is a transfer. */
export function defaultPaymentMethod(
  order: Pick<AdminOrderDetail, "paymentMode">,
  kind: PaymentRecordKind,
): PaymentMethod {
  return order.paymentMode === "cod" && kind === "balance" ? "cod" : "manual_transfer";
}

/** Builds the request. There is never a currency: the API uses the order's own. */
export function validatePaymentForm(
  order: Pick<AdminOrderDetail, "payments">,
  values: PaymentFormValues,
): PaymentValidation {
  const errors: Partial<Record<PaymentFieldName, string>> = {};
  const amount = parseAmountToMinor(values.amount);
  if (!amount.ok) {
    return { ok: false, errors: { amount: AMOUNT_MESSAGES[amount.reason] } };
  }
  if (values.kind === "refund" && amount.minor > receivedMinor(order)) {
    return { ok: false, errors: { amount: "A refund cannot be more than the money received" } };
  }

  const request: RecordPaymentRequest = {
    kind: values.kind,
    method: values.method,
    amountMinor: amount.minor,
  };
  const reference = values.reference.trim();
  const note = values.note.trim();
  if (reference !== "") request.reference = reference;
  if (note !== "") request.note = note;

  const parsed = RecordPaymentRequestSchema.safeParse(request);
  if (parsed.success) return { ok: true, request: parsed.data };
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if (field === "reference") errors.reference = "Keep the reference under 200 characters";
    else if (field === "note") errors.note = "Keep the note under 500 characters";
    else errors.amount = "That amount is not valid";
  }
  return { ok: false, errors };
}
