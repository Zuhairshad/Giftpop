import type { PublicOrderView } from "@giftpop/contracts";
import type { ReactElement } from "react";

import { buildAmounts } from "./amounts";
import type { AmountRow } from "./amounts";
import { paymentLabel } from "./status-labels";
import { CARD, CARD_TITLE, WELL } from "./ui";

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
      <h2 id="amounts-heading" className={CARD_TITLE}>
        Amounts
      </h2>
      <p className="mt-1 text-sm text-muted">
        Payment status:{" "}
        <strong className="text-foreground">{paymentLabel(view.paymentStatus)}</strong>
      </p>
      <dl className="mt-4 space-y-2">
        {amounts.rows.map((row) => (
          <div key={row.label} className="flex flex-wrap items-baseline justify-between gap-x-3">
            <dt className={row.kind === "strong" ? "font-semibold" : "text-muted"}>{row.label}</dt>
            <dd
              className={`ml-auto tabular-nums ${row.kind === "strong" ? "font-display text-lg font-bold" : ""} ${row.kind === "discount" ? "text-success" : ""}`}
            >
              {rowText(row, amounts.currency)}
            </dd>
          </div>
        ))}
      </dl>
      <dl className={`${WELL} mt-4 space-y-2 p-4`}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <dt className="font-semibold">{amounts.dueNow.label}</dt>
          <dd className="font-display ml-auto text-xl font-bold tabular-nums">
            {money(amounts.dueNow.minor)}
          </dd>
        </div>
        {amounts.dueOnDelivery ? (
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <dt className="text-muted">{amounts.dueOnDelivery.label}</dt>
            <dd className="ml-auto tabular-nums">{money(amounts.dueOnDelivery.minor)}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
