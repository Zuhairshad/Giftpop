"use client";

import type { PublicOrderView } from "@giftpop/contracts";
import { useState } from "react";
import type { ReactElement } from "react";

import { AmountsPanel } from "./amounts-panel";
import { CopyNumber } from "./copy-number";
import { GiftPanel } from "./gift-panel";
import { PaymentCard } from "./payment-card";
import { ProofPanel } from "./proof-panel";
import { statusHint } from "./status-labels";
import { StatusPill } from "./status-pill";
import { CARD, CARD_TITLE, SECONDARY } from "./ui";

import { ButtonLink } from "@/components/ui";

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

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className={`${CARD} space-y-5`}>
        <CopyNumber number={view.number} />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <StatusPill status={view.status} />
          <span className="text-sm text-muted">{statusHint(view.status)}</span>
        </div>
      </header>

      <div className="grid gap-6 sm:gap-8 md:grid-cols-2 md:items-start">
        <div className="min-w-0 space-y-6 sm:space-y-8">
          {awaiting ? <PaymentCard view={view} /> : null}

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
            <h2 id="next-heading" className={CARD_TITLE}>
              What happens next
            </h2>
            <ol className="mt-4 space-y-3">
              {NEXT_STEPS.map((step, index) => (
                <li key={step} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="font-display mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-foreground text-sm font-bold text-background"
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
            <ButtonLink
              href={`/track?number=${encodeURIComponent(view.number)}`}
              variant="ghost"
              className={`${SECONDARY} mt-5`}
            >
              Open the track page
            </ButtonLink>
          </section>
        </div>

        <div className="min-w-0 md:sticky md:top-6">
          <GiftPanel view={view} />
        </div>
      </div>
    </div>
  );
}
