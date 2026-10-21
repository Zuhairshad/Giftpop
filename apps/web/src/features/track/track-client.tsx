"use client";

import type { PublicOrderView } from "@giftpop/contracts";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { ReactElement } from "react";

import { TrackResult } from "./track-result";

import { Button } from "@/components/ui";
import { ForgotOrder } from "@/features/order/forgot-order";
import { LookupForm } from "@/features/order/lookup-form";
import { PageHeading } from "@/features/order/page-heading";
import { SECONDARY } from "@/features/order/ui";

/** Order number plus phone or email, then the order's progress. */
export function TrackClient(): ReactElement {
  const params = useSearchParams();
  const prefill = (params.get("number") ?? "").toUpperCase();
  const [view, setView] = useState<PublicOrderView | null>(null);

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 sm:space-y-8">
      <PageHeading title="Track your order" eyebrow="Where is my gift?" />

      {view ? (
        <>
          <div aria-live="polite">
            <TrackResult view={view} />
          </div>
          <Button variant="ghost" onClick={() => setView(null)} className={SECONDARY}>
            Look up another order
          </Button>
        </>
      ) : (
        <div className="max-w-xl space-y-4">
          <p className="text-muted">
            Enter your order number and the phone number or email you used to order.
          </p>
          <LookupForm
            initialNumber={prefill}
            submitLabel="Track order"
            onFound={(found) => setView(found)}
          />
          <ForgotOrder />
        </div>
      )}
    </section>
  );
}
