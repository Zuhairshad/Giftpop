"use client";

import type { OrderNumber } from "@giftpop/contracts";
import { useRouter } from "next/navigation";
import { useCallback, useState, useSyncExternalStore } from "react";
import type { ReactElement } from "react";

import { CheckoutForm } from "./checkout-form";
import { GiftSummary } from "./gift-summary";
import { useArrivalFocus } from "./use-arrival-focus";
import { useCountry } from "./use-country";

import { ButtonLink } from "@/components/ui";
import { clearReadyMadeStart } from "@/features/builder/questions/packaging/ready-made-origin";
import { builderHref, useBuilder, useCheckoutGuard } from "@/features/builder/state";
import { useBuilderStore } from "@/features/builder/state/context";
import { PageHeading } from "@/features/order/page-heading";
import { StatePanel } from "@/features/order/state-panel";

function Notice({ title, children }: { title: string; children: React.ReactNode }): ReactElement {
  return (
    <section className="space-y-5">
      <PageHeading title={title} />
      {children}
    </section>
  );
}

/** Guard, country data and the form. Unmounted once an order is placed so the guard cannot redirect. */
function CheckoutContent({ onPlaced }: { onPlaced: (number: OrderNumber) => void }): ReactElement {
  useCheckoutGuard();
  const builder = useBuilder();
  const countryState = useCountry(builder.country);
  const store = useBuilderStore();
  const hydrated = useSyncExternalStore(store.subscribe, store.isHydrated, () => false);
  // The h1 renders once saved state is read (either "Checkout" or "Choose a gift first").
  useArrivalFocus(hydrated);

  if (!hydrated) {
    return <StatePanel tone="loading">Loading your gift&hellip;</StatePanel>;
  }

  if (!builder.design || !builder.packaging || builder.problems.length > 0) {
    return (
      <Notice title="Choose a gift first">
        <p className="text-muted">Build your gift before you check out.</p>
        <ButtonLink href={builderHref(builder.country)}>Build your gift</ButtonLink>
      </Notice>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      <PageHeading title="Checkout" eyebrow="Almost there">
        Tell us where to send it and how you would like to pay.
      </PageHeading>
      <div className="grid gap-5 sm:gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:items-start">
        <GiftSummary builder={builder} />
        {countryState.status === "ready" ? (
          <CheckoutForm builder={builder} country={countryState.country} onPlaced={onPlaced} />
        ) : countryState.status === "loading" ? (
          <StatePanel tone="loading">Loading checkout&hellip;</StatePanel>
        ) : (
          <StatePanel tone="error">
            We could not load checkout for this country. Check your connection and reload the page.
          </StatePanel>
        )}
      </div>
    </div>
  );
}

/** Checkout: gift summary, contact, address, payment and "Place order". */
export function CheckoutScreen(): ReactElement {
  const router = useRouter();
  const { reset, country } = useBuilder();
  const [placed, setPlaced] = useState<OrderNumber | null>(null);

  const handlePlaced = useCallback(
    (number: OrderNumber) => {
      setPlaced(number);
      // The next gift is a new one, so forget which ready-made gift this one began as.
      clearReadyMadeStart(country);
      reset();
      router.push(`/order/${number}`);
    },
    [country, reset, router],
  );

  if (placed) {
    return (
      <Notice title="Order placed">
        <p role="status" className="text-muted">
          Taking you to order {placed}&hellip;
        </p>
        <ButtonLink href={`/order/${placed}`}>Go to your order</ButtonLink>
      </Notice>
    );
  }
  return <CheckoutContent onPlaced={handlePlaced} />;
}
