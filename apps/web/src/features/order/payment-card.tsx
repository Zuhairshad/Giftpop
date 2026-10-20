"use client";

import type { PublicOrderView } from "@giftpop/contracts";
import { useRef } from "react";
import type { ReactElement } from "react";

import { CopyButton } from "./copy-button";
import { parsePaymentInstructions } from "./payment-instructions";
import type { InstructionBlock } from "./payment-instructions";
import { CARD, CARD_TITLE, META_LABEL, WELL } from "./ui";

import { formatMoney } from "@/lib/format-money";

function Instructions({ blocks }: { blocks: readonly InstructionBlock[] }): ReactElement {
  return (
    <div className="space-y-3">
      {blocks.map((block, index) =>
        block.kind === "text" ? (
          <p key={index} className="wrap-anywhere">
            {block.lines.map((line, at) => (
              <span key={at} className="block">
                {line}
              </span>
            ))}
          </p>
        ) : (
          <dl key={index} className="border-border-strong divide-border divide-y rounded-md border">
            {block.rows.map((row, at) => (
              <div
                key={`${row.label}-${at}`}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-4 py-3"
              >
                <dt className="text-ink-2 text-sm">{row.label}</dt>
                <dd className="ml-auto font-semibold tabular-nums wrap-anywhere select-all">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        ),
      )}
    </div>
  );
}

type PaymentCardProps = {
  view: Pick<PublicOrderView, "number" | "quote" | "paymentMode" | "paymentInstructions">;
};

/**
 * How to pay an order that waits for payment: the amount due now, the country's own instructions
 * (written by staff, shown as they wrote them), the order number to use as the reference, and
 * what happens after paying.
 */
export function PaymentCard({ view }: PaymentCardProps): ReactElement {
  const referenceRef = useRef<HTMLElement>(null);
  const { quote } = view;
  const money = (minor: number): string => formatMoney(minor, quote.currency, "en");
  const blocks = parsePaymentInstructions(view.paymentInstructions);
  const later = quote.dueOnDeliveryMinor > 0;

  return (
    <section aria-labelledby="pay-heading" className={`${CARD} space-y-5`}>
      <h2 id="pay-heading" className={CARD_TITLE}>
        How to pay
      </h2>

      <div className={`${WELL} p-4 sm:p-5`}>
        <p className={META_LABEL}>Amount to pay now</p>
        <p className="font-display mt-1 text-4xl leading-none font-bold tracking-[-0.9px] tabular-nums wrap-anywhere">
          {money(quote.dueNowMinor)}
        </p>
        <p className="text-ink-2 mt-2 text-sm">
          {later
            ? `The advance. And ${money(quote.dueOnDeliveryMinor)} when it is delivered.`
            : "The full amount, with your pay-now discount."}
        </p>
      </div>

      {blocks.length > 0 ? <Instructions blocks={blocks} /> : null}

      <div className="bg-lavender/60 rounded-md p-4">
        <p className="wrap-anywhere">
          Use your order number{" "}
          <strong ref={referenceRef} className="font-semibold whitespace-nowrap select-all">
            {view.number}
          </strong>{" "}
          as the reference.
        </p>
        <CopyButton
          text={view.number}
          label="Copy reference"
          copiedMessage="Reference copied."
          targetRef={referenceRef}
          className="mt-3"
        />
      </div>

      <p className="text-ink-2 text-sm">
        After you pay, upload a picture of your receipt below. We check it, confirm your order and
        start making your gift by hand.
      </p>
    </section>
  );
}
