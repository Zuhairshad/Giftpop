"use client";

import type { PublicOrderView } from "@giftpop/contracts";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { ReactElement } from "react";

import { TrackResult } from "./track-result";

import { LookupForm } from "@/features/order/lookup-form";
import { BUTTON_SECONDARY } from "@/features/order/ui";

/** Order number plus phone or email, then the order's progress. */
export function TrackClient(): ReactElement {
  const params = useSearchParams();
  const prefill = (params.get("number") ?? "").toUpperCase();
  const [view, setView] = useState<PublicOrderView | null>(null);

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 py-6">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Track your order</h1>

      {view ? (
        <>
          <div aria-live="polite">
            <TrackResult view={view} />
          </div>
          <button type="button" onClick={() => setView(null)} className={BUTTON_SECONDARY}>
            Look up another order
          </button>
        </>
      ) : (
        <div className="max-w-xl space-y-3">
          <p className="text-muted">
            Enter your order number and the phone number or email you used to order.
          </p>
          <LookupForm
            initialNumber={prefill}
            submitLabel="Track order"
            onFound={(found) => setView(found)}
          />
        </div>
      )}
    </section>
  );
}
