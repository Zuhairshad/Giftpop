import type { PublicOrderView } from "@giftpop/contracts";
import type { ReactElement } from "react";

import { buildAmounts } from "./amounts";
import type { AmountRow } from "./amounts";
import { paymentLabel } from "./status-labels";
import { CARD } from "./ui";

import { formatMoney } from "@/lib/format-money";

function rowText(row: AmountRow, currency: string): string {
  if (row.kind === "free") return "Free";
  if (row.kind === "discount") return `-${formatMoney(row.minor, currency, "en")}`;
  return formatMoney(row.minor, currency, "en");
}

/** What the order costs and what is still to pay. Every number comes from the API's quote. */
export function AmountsPanel({
  view,
}: {
  view: Pick<PublicOrderView, "quote" | "paymentMode" | "paymentStatus">;
}): ReactElement {
  const amounts = buildAmounts(view.quote, view.paymentMode);
  const money = (minor: number): string => formatMoney(minor, amounts.currency, "en");
  return (
    <section aria-labelledby="amounts-heading" className={CARD}>
      <h2 id="amounts-heading" className="font-display text-2xl font-bold">
        Amounts
      </h2>
      <p className="text-muted mt-1 text-sm">
        Payment status:{" "}
        <strong className="text-foreground">{paymentLabel(view.paymentStatus)}</strong>
      </p>
      <dl className="mt-3 space-y-1.5">
        {amounts.rows.map((row) => (
          <div key={row.label} className="flex flex-wrap items-baseline justify-between gap-x-2">
            <dt className={row.kind === "strong" ? "font-bold" : "text-muted"}>{row.label}</dt>
            <dd className={`ml-auto tabular-nums ${row.kind === "strong" ? "font-bold" : ""}`}>
              {rowText(row, amounts.currency)}
            </dd>
          </div>
        ))}
      </dl>
      <dl className="bg-surface-soft rounded-soft mt-3 space-y-1.5 p-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-2">
          <dt className="font-bold">{amounts.dueNow.label}</dt>
          <dd className="ml-auto font-bold tabular-nums">{money(amounts.dueNow.minor)}</dd>
        </div>
        {amounts.dueOnDelivery ? (
          <div className="flex flex-wrap items-baseline justify-between gap-x-2">
            <dt>{amounts.dueOnDelivery.label}</dt>
            <dd className="ml-auto tabular-nums">{money(amounts.dueOnDelivery.minor)}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
