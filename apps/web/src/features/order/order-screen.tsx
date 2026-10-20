"use client";

import type { OrderNumber, PublicOrderView } from "@giftpop/contracts";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";

import { browserSession, readHandoffEntry, writeHandoff } from "./handoff";
import { NOT_FOUND_MESSAGE, describeLookupError, lookupOrder } from "./lookup";
import { LookupForm } from "./lookup-form";
import { OrderView } from "./order-view";
import { PageHeading } from "./page-heading";
import { StatePanel } from "./state-panel";
import { orderEyebrow } from "./thank-you";

import { Button } from "@/components/ui";
import { parseCountryCookie } from "@/features/country/cookie";
import { rememberCountry } from "@/features/country/remember-country";

type State =
  | { phase: "loading" }
  | { phase: "form"; notice?: string }
  | { phase: "error"; message: string; contact: string }
  | { phase: "ready"; view: PublicOrderView; contact: string };

/** The page for one order. Uses the contact checkout stored, or asks for it. */
export function OrderScreen({ orderNumber }: { orderNumber: OrderNumber }): ReactElement {
  const [state, setState] = useState<State>({ phase: "loading" });
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load(): Promise<void> {
      const entry = readHandoffEntry(orderNumber, browserSession());
      setFirstName(entry?.firstName ?? null);
      const contact = entry?.contact ?? null;
      if (!contact) {
        setState({ phase: "form" });
        return;
      }
      setState({ phase: "loading" });
      try {
        const view = await lookupOrder({ number: orderNumber, contact }, controller.signal);
        setState({ phase: "ready", view, contact });
        // A visitor who has not picked a country yet (a shared order link) gets the order's own,
        // so the header shows it instead of "Choose".
        if (parseCountryCookie(document.cookie) === null) {
          rememberCountry(view.country);
          router.refresh();
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        const failure = describeLookupError(error);
        setState(
          failure.kind === "not_found"
            ? { phase: "form", notice: NOT_FOUND_MESSAGE }
            : { phase: "error", message: failure.message, contact },
        );
      }
    }
    void load();
    return () => controller.abort();
  }, [orderNumber, attempt, router]);

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 sm:space-y-8">
      <PageHeading
        title="Your order"
        eyebrow={orderEyebrow(state.phase === "ready" ? state.view.status : null, firstName)}
      />

      {state.phase === "loading" ? (
        <StatePanel tone="loading">Loading your order…</StatePanel>
      ) : null}

      {state.phase === "error" ? (
        <StatePanel
          tone="error"
          action={<Button onClick={() => setAttempt((n) => n + 1)}>Try again</Button>}
        >
          {state.message}
        </StatePanel>
      ) : null}

      {state.phase === "form" ? (
        <div className="max-w-xl space-y-4">
          <p className="text-muted">
            Enter the phone number or email you used to order, and we will show your order.
          </p>
          <LookupForm
            fixedNumber={orderNumber}
            submitLabel="Show my order"
            initialNotice={state.notice}
            onFound={(view, contact) => {
              writeHandoff(orderNumber, contact, browserSession());
              setState({ phase: "ready", view, contact });
              // A visitor who has not picked a country yet (a shared order link) gets the order's own,
              // so the header shows it instead of "Choose".
              if (parseCountryCookie(document.cookie) === null) {
                rememberCountry(view.country);
                router.refresh();
              }
            }}
          />
        </div>
      ) : null}

      {state.phase === "ready" ? <OrderView initial={state.view} contact={state.contact} /> : null}
    </section>
  );
}
