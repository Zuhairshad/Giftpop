"use client";

import type { OrderNumber } from "@giftpop/contracts";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, useSyncExternalStore } from "react";
import type { ReactElement } from "react";

import { CheckoutForm } from "./checkout-form";
import { GiftSummary } from "./gift-summary";
import { useCountry } from "./use-country";

import { stepHref, useBuilder, useStepGuard } from "@/features/builder/state";
import { useBuilderStore } from "@/features/builder/state/context";

const PRIMARY =
  "bg-pink text-on-pink hover:bg-pink-strong inline-flex items-center justify-center rounded-full px-6 py-3 text-base font-bold transition-colors";

function Notice({ title, children }: { title: string; children: React.ReactNode }): ReactElement {
  return (
    <section className="space-y-4 py-6">
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      {children}
    </section>
  );
}

/** Guard, country data and the form. Unmounted once an order is placed so the guard cannot redirect. */
function CheckoutContent({ onPlaced }: { onPlaced: (number: OrderNumber) => void }): ReactElement {
  useStepGuard("review");
  const builder = useBuilder();
  const countryState = useCountry(builder.country);
  const store = useBuilderStore();
  const hydrated = useSyncExternalStore(store.subscribe, store.isHydrated, () => false);

  if (!hydrated) {
    return (
      <p role="status" className="text-muted py-6">
        Loading your gift&hellip;
      </p>
    );
  }

  if (!builder.design || !builder.packaging || builder.problems.length > 0) {
    return (
      <Notice title="Choose a gift first">
        <p className="text-muted">Build your gift before you check out.</p>
        <Link href={stepHref(builder.country, "format")} className={PRIMARY}>
          Choose a format
        </Link>
      </Notice>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Checkout</h1>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
        <GiftSummary builder={builder} />
        {countryState.status === "ready" ? (
          <CheckoutForm builder={builder} country={countryState.country} onPlaced={onPlaced} />
        ) : countryState.status === "loading" ? (
          <p role="status" className="text-muted">
            Loading checkout&hellip;
          </p>
        ) : (
          <p
            role="alert"
            className="bg-surface-soft border-border rounded-soft border p-4 font-semibold"
          >
            We could not load checkout for this country. Check your connection and reload the page.
          </p>
        )}
      </div>
    </div>
  );
}

/** Checkout: gift summary, contact, address, payment and "Place order". */
export function CheckoutScreen(): ReactElement {
  const router = useRouter();
  const { reset } = useBuilder();
  const [placed, setPlaced] = useState<OrderNumber | null>(null);

  const handlePlaced = useCallback(
    (number: OrderNumber) => {
      setPlaced(number);
      reset();
      router.push(`/order/${number}`);
    },
    [reset, router],
  );

  if (placed) {
    return (
      <Notice title="Order placed">
        <p role="status" className="text-muted">
          Taking you to order {placed}&hellip;
        </p>
        <Link href={`/order/${placed}`} className="text-pink-strong font-semibold underline">
          Go to your order
        </Link>
      </Notice>
    );
  }
  return <CheckoutContent onPlaced={handlePlaced} />;
}
