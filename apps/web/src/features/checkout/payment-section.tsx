import type { PaymentMode } from "@giftpop/contracts";
import type { ReactElement } from "react";

import type { CardRow, PaymentCard } from "./payment-cards";

import { formatMoney } from "@/lib/format-money";

function rowValue(row: CardRow, currency: string): string {
  if (row.kind === "free") return "Free";
  const text = formatMoney(row.minor, currency);
  return row.kind === "discount" ? `-${text}` : text;
}

function Line({
  label,
  value,
  strong = false,
  className = "",
}: {
  label: string;
  value: string;
  strong?: boolean;
  className?: string;
}): ReactElement {
  return (
    <div className={`flex flex-wrap items-baseline justify-between gap-x-3 ${className}`}>
      <dt className={strong ? "font-bold" : "text-muted"}>{label}</dt>
      <dd className={`ml-auto tabular-nums ${strong ? "font-bold" : ""}`}>{value}</dd>
    </div>
  );
}

function Card({
  card,
  selected,
  onSelect,
}: {
  card: PaymentCard;
  selected: boolean;
  onSelect: (mode: PaymentMode) => void;
}): ReactElement {
  const money = (minor: number): string => formatMoney(minor, card.currency);
  return (
    <label
      className={`rounded-card relative flex min-w-0 cursor-pointer flex-col gap-3 p-4 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-[var(--gp-focus)] ${
        selected
          ? "border-pink bg-surface-soft border-4"
          : "border-border bg-surface hover:border-pink-soft border-2"
      }`}
    >
      <input
        type="radio"
        name="paymentMode"
        value={card.mode}
        checked={selected}
        onChange={() => onSelect(card.mode)}
        className="sr-only"
      />
      <span className="flex items-center justify-between gap-2">
        <span className="font-display text-lg font-bold">{card.title}</span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${
            selected ? "bg-pink text-on-pink" : "border-border text-muted border"
          }`}
        >
          {selected ? "✓ Selected" : "Select"}
        </span>
      </span>
      <span className="text-muted text-sm">{card.summary}</span>
      <dl className="space-y-1.5 text-sm">
        {card.rows.map((row) => (
          <Line key={row.label} label={row.label} value={rowValue(row, card.currency)} />
        ))}
        <Line
          label={card.total.label}
          value={money(card.total.minor)}
          strong
          className="border-border border-t pt-1.5"
        />
      </dl>
      <dl className="bg-surface space-y-1.5 rounded-soft p-3 text-sm">
        <Line label={card.dueNow.label} value={money(card.dueNow.minor)} strong />
        {card.dueOnDelivery ? (
          <Line label={card.dueOnDelivery.label} value={money(card.dueOnDelivery.minor)} />
        ) : null}
      </dl>
    </label>
  );
}

type PaymentSectionProps = {
  cards: readonly PaymentCard[];
  selected: PaymentMode | null;
  onSelect: (mode: PaymentMode) => void;
  loading: boolean;
};

/** One card per payment mode the country allows, with the quote's exact amounts. */
export function PaymentSection({
  cards,
  selected,
  onSelect,
  loading,
}: PaymentSectionProps): ReactElement {
  return (
    <fieldset className="min-w-0" aria-busy={loading}>
      <legend className="font-display mb-3 text-2xl font-bold">Payment</legend>
      {cards.length === 0 ? (
        <p role="status" className="text-muted text-sm">
          {loading
            ? "Working out the price…"
            : "We could not work out the price. Go back to the review step and try again."}
        </p>
      ) : (
        <div className={`grid gap-3 ${cards.length > 1 ? "sm:grid-cols-2" : ""}`}>
          {cards.map((card) => (
            <Card
              key={card.mode}
              card={card}
              selected={card.mode === selected}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </fieldset>
  );
}
