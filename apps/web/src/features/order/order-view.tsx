"use client";

import type { PublicOrderView } from "@giftpop/contracts";
import Link from "next/link";
import { useState } from "react";
import type { ReactElement } from "react";

import { AmountsPanel } from "./amounts-panel";
import { CopyNumber } from "./copy-number";
import { GiftPanel } from "./gift-panel";
import { ProofPanel } from "./proof-panel";
import { statusHint } from "./status-labels";
import { StatusPill } from "./status-pill";
import { BUTTON_SECONDARY, CARD } from "./ui";

import { formatMoney } from "@/lib/format-money";

const NEXT_STEPS = [
  "We confirm your payment.",
  "We make and pack your gift by hand.",
  "We ship it with a courier.",
  "You can follow it any time on the track page, with your order number and the phone or email you used.",
];

type OrderViewProps = { initial: PublicOrderView; contact: string };

/** A found order: number, status, what to pay, how to pay, proof upload, the gift, what happens next. */
export function OrderView({ initial, contact }: OrderViewProps): ReactElement {
  const [view, setView] = useState(initial);
  const awaiting = view.status === "awaiting_payment";
  const instructions = view.paymentInstructions.trim();

  return (
    <div className="space-y-8">
      <header className={`${CARD} space-y-4`}>
        <CopyNumber number={view.number} />
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill status={view.status} />
          <span className="text-muted text-sm">{statusHint(view.status)}</span>
        </div>
        {awaiting ? (
          <p className="bg-surface-soft rounded-soft p-3">
            <span className="text-muted block text-sm font-bold">Amount to pay now</span>
            <span className="font-display text-3xl font-bold tabular-nums">
              {formatMoney(view.quote.dueNowMinor, view.quote.currency, "en")}
            </span>
            {view.quote.dueOnDeliveryMinor > 0 ? (
              <span className="text-muted block text-sm">
                and {formatMoney(view.quote.dueOnDeliveryMinor, view.quote.currency, "en")} when it
                is delivered
              </span>
            ) : null}
          </p>
        ) : null}
      </header>

      <div className="grid gap-8 md:grid-cols-2 md:items-start">
        <div className="min-w-0 space-y-8">
          {awaiting && instructions ? (
            <section aria-labelledby="pay-heading" className={`${CARD} space-y-2`}>
              <h2 id="pay-heading" className="font-display text-2xl font-bold">
                How to pay
              </h2>
              <p className="wrap-anywhere whitespace-pre-line">{instructions}</p>
            </section>
          ) : null}

          {awaiting ? (
            <ProofPanel
              number={view.number}
              contact={contact}
              proofs={view.proofs}
              onUploaded={(proof) => setView((v) => ({ ...v, proofs: [...v.proofs, proof] }))}
            />
          ) : null}

          <AmountsPanel view={view} />

          <section aria-labelledby="next-heading" className={CARD}>
            <h2 id="next-heading" className="font-display text-2xl font-bold">
              What happens next
            </h2>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5">
              {NEXT_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <Link
              href={`/track?number=${encodeURIComponent(view.number)}`}
              className={`${BUTTON_SECONDARY} mt-4`}
            >
              Open the track page
            </Link>
          </section>
        </div>

        <div className="min-w-0">
          <GiftPanel view={view} />
        </div>
      </div>
    </div>
  );
}
