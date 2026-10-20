import type { QuoteResponse } from "@giftpop/contracts";
import type { ReactElement } from "react";

import type { QuoteStatus } from "../../state";

import { buildPriceColumns } from "./price-columns";
import type { PriceColumn, PriceRow } from "./price-columns";

import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format-money";

/** Label left, amount right; the amount never wraps and the label gives way first. */
function Row({
  label,
  children,
  strong = false,
  className,
}: {
  label: string;
  children: string;
  strong?: boolean;
  className?: string;
}): ReactElement {
  return (
    <div className={cn("flex items-baseline justify-between gap-3", className)}>
      <dt className={cn("min-w-0", strong ? "text-foreground font-semibold" : "text-muted")}>
        {label}
      </dt>
      <dd
        className={cn(
          "shrink-0 whitespace-nowrap tabular-nums",
          strong ? "text-foreground font-semibold" : "text-foreground",
        )}
      >
        {children}
      </dd>
    </div>
  );
}

function rowValue(row: PriceRow, currency: string): string {
  if (row.kind === "free") return "Free";
  if (row.kind === "discount") return `−${formatMoney(row.minor, currency)}`;
  return formatMoney(row.minor, currency);
}

/**
 * One payment option as a compact list: its name and what is due now on top (the number to
 * compare), a plain sentence, then the lines that make up the total.
 */
function Option({ column }: { column: PriceColumn }): ReactElement {
  const money = (minor: number): string => formatMoney(minor, column.currency);
  const headingId = `price-${column.mode}`;
  return (
    <section
      aria-labelledby={headingId}
      className="bg-surface border-border rounded-card border px-3.5 py-3 min-[900px]:px-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 id={headingId} className="text-foreground text-[15px] leading-snug font-semibold">
            {column.title}
          </h4>
          <p className="text-muted mt-0.5 text-xs leading-snug">{column.summary}</p>
        </div>
        <p className="shrink-0 text-end">
          <span className="text-muted block text-xs leading-snug">{column.dueNow.label}</span>
          <span className="font-display text-foreground block text-lg leading-tight font-bold whitespace-nowrap tabular-nums">
            {money(column.dueNow.minor)}
          </span>
        </p>
      </div>
      <dl className="border-border mt-2.5 space-y-1 border-t pt-2.5 text-[13px] leading-snug min-[900px]:text-sm">
        {column.rows.map((row) => (
          <Row key={row.label} label={row.label}>
            {rowValue(row, column.currency)}
          </Row>
        ))}
        <Row label={column.total.label} strong>
          {money(column.total.minor)}
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
    <div className="space-y-2.5" aria-hidden="true">
      {[0, 1].map((n) => (
        <div key={n} className="bg-surface border-border rounded-card h-36 animate-pulse border" />
      ))}
    </div>
  );
}

type PriceSectionProps = { quote: QuoteResponse | null; status: QuoteStatus };

/**
 * Both payment modes, one above the other on every screen size (side by side they wrapped their
 * amounts in a 460px card), from the API quote only.
 */
export function PriceSection({ quote, status }: PriceSectionProps): ReactElement {
  const failed = status === "error" || (status === "ready" && quote === null);
  const columns = status === "ready" && quote ? buildPriceColumns(quote.quotes) : [];

  return (
    <section aria-labelledby="prices-heading" aria-busy={!failed && columns.length === 0}>
      <h3 id="prices-heading" className="text-foreground text-base font-semibold">
        What it costs
      </h3>
      <div className="mt-2.5">
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
          <div className="space-y-2.5">
            {columns.map((column) => (
              <Option key={column.mode} column={column} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
