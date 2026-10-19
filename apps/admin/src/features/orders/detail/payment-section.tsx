import type { AdminOrderDetail, PaymentProofStatus } from "@giftpop/contracts";

import { Field, Panel } from "./panel";
import { ProofPreview } from "./proof-preview";
import {
  PAYMENT_KIND_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_MODE_LABELS,
  actorLabel,
  paymentTotals,
} from "./view-model";

import { ProofReview } from "@/features/orders/actions";
import { formatDateTime, formatMoney } from "@/lib/format";

const PROOF_STYLES: Record<PaymentProofStatus, string> = {
  pending: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  accepted: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
  rejected: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
};
const PROOF_LABELS: Record<PaymentProofStatus, string> = {
  pending: "Waiting for review",
  accepted: "Accepted",
  rejected: "Rejected",
};

export function PaymentSection({ order }: { order: AdminOrderDetail }) {
  const totals = paymentTotals(order);
  const { quote } = order;
  const money = (minor: number) => formatMoney(minor, quote.currency);

  return (
    <Panel id="payment-heading" title="Payment">
      <div className="grid grid-cols-1 gap-4">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Payment mode">{PAYMENT_MODE_LABELS[order.paymentMode]}</Field>
          <Field label="Goods">{money(quote.goodsMinor)}</Field>
          <Field label="Discount">{money(quote.discountMinor)}</Field>
          <Field label="Shipping">{money(quote.shippingMinor)}</Field>
          <Field label="Total">
            <strong>{money(quote.totalMinor)}</strong>
          </Field>
          <Field label="Due now">{money(quote.dueNowMinor)}</Field>
          <Field label="Received">{money(totals.receivedMinor)}</Field>
          <Field label={totals.balanceMinor < 0 ? "Overpaid by" : "Balance"}>
            <strong>{money(Math.abs(totals.balanceMinor))}</strong>
          </Field>
        </dl>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Payment records</h3>
          {order.payments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No payments recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Recorded payments</caption>
                <thead>
                  <tr className="text-muted-foreground border-b text-left text-xs">
                    <th scope="col" className="py-2 pr-2 font-medium">
                      Kind
                    </th>
                    <th scope="col" className="px-2 py-2 font-medium">
                      Method
                    </th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">
                      Amount
                    </th>
                    <th scope="col" className="px-2 py-2 font-medium">
                      Reference
                    </th>
                    <th scope="col" className="px-2 py-2 font-medium">
                      Recorded by
                    </th>
                    <th scope="col" className="py-2 pl-2 font-medium">
                      When
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.payments.map((payment) => (
                    <tr key={payment.id} className="border-b align-top">
                      <td className="py-2 pr-2">{PAYMENT_KIND_LABELS[payment.kind]}</td>
                      <td className="px-2 py-2">{PAYMENT_METHOD_LABELS[payment.method]}</td>
                      <td className="px-2 py-2 text-right whitespace-nowrap tabular-nums">
                        {payment.kind === "refund" ? "-" : ""}
                        {formatMoney(payment.amount.amountMinor, payment.amount.currency)}
                      </td>
                      <td className="px-2 py-2 wrap-anywhere">{payment.reference ?? ""}</td>
                      <td className="px-2 py-2">
                        {actorLabel(payment.recordedBy, payment.recordedByName)}
                      </td>
                      <td className="py-2 pl-2 whitespace-nowrap">
                        {formatDateTime(payment.recordedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Payment proofs</h3>
          {order.proofs.length === 0 ? (
            <p className="text-muted-foreground text-sm">The customer has not uploaded a proof.</p>
          ) : (
            <ul className="grid gap-3">
              {order.proofs.map((proof, index) => (
                <li key={proof.id} className="grid gap-2 rounded-lg border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${PROOF_STYLES[proof.status]}`}
                    >
                      {PROOF_LABELS[proof.status]}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      Uploaded {formatDateTime(proof.uploadedAt)}
                    </span>
                  </div>
                  <ProofPreview url={proof.url} label={`Payment proof ${index + 1}`} />
                  <ProofReview orderId={order.id} proofId={proof.id} status={proof.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Panel>
  );
}
