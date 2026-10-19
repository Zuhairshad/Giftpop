import type { QuoteResponse } from "@giftpop/contracts";
import type { ReactElement } from "react";

import type { QuoteStatus } from "../../state";

import { buildPriceColumns } from "./price-columns";
import type { PriceColumn, PriceRow } from "./price-columns";

import { formatMoney } from "@/lib/format-money";

function Row({
  label,
  children,
  strong = false,
  className = "",
}: {
  label: string;
  children: string;
  strong?: boolean;
  className?: string;
}): ReactElement {
  return (
    <div className={`flex flex-wrap items-baseline justify-between gap-x-2 ${className}`}>
      <dt className={strong ? "font-bold" : "text-muted"}>{label}</dt>
      <dd className={`ml-auto tabular-nums ${strong ? "font-bold" : ""}`}>{children}</dd>
    </div>
  );
}

function rowValue(row: PriceRow, currency: string): string {
  if (row.kind === "free") return "Free";
  if (row.kind === "discount") return `-${formatMoney(row.minor, currency)}`;
  return formatMoney(row.minor, currency);
}

function Column({ column }: { column: PriceColumn }): ReactElement {
  const money = (minor: number): string => formatMoney(minor, column.currency);
  const headingId = `price-${column.mode}`;
  return (
    <section
      aria-labelledby={headingId}
      className="bg-surface border-border rounded-card flex flex-col border p-3 sm:p-5"
    >
      <h4 id={headingId} className="text-foreground text-sm font-semibold sm:text-base">
        {column.title}
      </h4>
      <p className="text-muted mt-1 text-xs sm:text-sm">{column.summary}</p>
      <dl className="mt-3 space-y-1.5 text-sm sm:text-base">
        {column.rows.map((row) => (
          <Row key={row.label} label={row.label}>
            {rowValue(row, column.currency)}
          </Row>
        ))}
        <Row label={column.total.label} strong className="border-border border-t pt-1.5">
          {money(column.total.minor)}
        </Row>
      </dl>
      <dl className="bg-surface-soft rounded-soft mt-3 space-y-1.5 p-2.5 text-sm sm:p-3 sm:text-base">
        <Row label={column.dueNow.label} strong>
          {money(column.dueNow.minor)}
        </Row>
        {column.dueOnDelivery ? (
          <Row label={column.dueOnDelivery.label}>{money(column.dueOnDelivery.minor)}</Row>
        ) : null}
      </dl>
    </section>
  );
}

function Skeleton(): ReactElement {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4" aria-hidden="true">
      {[0, 1].map((n) => (
        <div key={n} className="bg-surface border-border rounded-card h-56 animate-pulse border" />
      ))}
    </div>
  );
}

type PriceSectionProps = { quote: QuoteResponse | null; status: QuoteStatus };

/** Both payment modes side by side, from the API quote only. */
export function PriceSection({ quote, status }: PriceSectionProps): ReactElement {
  const failed = status === "error" || (status === "ready" && quote === null);
  const columns = status === "ready" && quote ? buildPriceColumns(quote.quotes) : [];

  return (
    <section aria-labelledby="prices-heading" aria-busy={!failed && columns.length === 0}>
      <h3 id="prices-heading" className="text-foreground text-base font-semibold">
        What it costs
      </h3>
      <div className="mt-3">
        {failed ? (
          <p
            role="alert"
            className="bg-surface-soft border-border rounded-soft border p-4 text-sm font-semibold"
          >
            We could not work out the price. Check your connection and reload the page.
          </p>
        ) : columns.length === 0 ? (
          <>
            <Skeleton />
            <p role="status" className="text-muted mt-2 text-sm">
              Working out the price&hellip;
            </p>
          </>
        ) : (
          <div
            className={`grid gap-3 sm:gap-4 ${columns.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
          >
            {columns.map((column) => (
              <Column key={column.mode} column={column} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
