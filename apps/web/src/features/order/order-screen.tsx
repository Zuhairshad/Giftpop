"use client";

import type { OrderNumber, PublicOrderView } from "@giftpop/contracts";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";

import { browserSession, readHandoff, writeHandoff } from "./handoff";
import { NOT_FOUND_MESSAGE, describeLookupError, lookupOrder } from "./lookup";
import { LookupForm } from "./lookup-form";
import { OrderView } from "./order-view";
import { BUTTON_PRIMARY } from "./ui";

type State =
  | { phase: "loading" }
  | { phase: "form"; notice?: string }
  | { phase: "error"; message: string; contact: string }
  | { phase: "ready"; view: PublicOrderView; contact: string };

/** The page for one order. Uses the contact checkout stored, or asks for it. */
export function OrderScreen({ orderNumber }: { orderNumber: OrderNumber }): ReactElement {
  const [state, setState] = useState<State>({ phase: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load(): Promise<void> {
      const contact = readHandoff(orderNumber, browserSession());
      if (!contact) {
        setState({ phase: "form" });
        return;
      }
      setState({ phase: "loading" });
      try {
        const view = await lookupOrder({ number: orderNumber, contact }, controller.signal);
        setState({ phase: "ready", view, contact });
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
  }, [orderNumber, attempt]);

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 py-6">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Your order</h1>

      {state.phase === "loading" ? (
        <p role="status" className="text-muted">
          Loading your order…
        </p>
      ) : null}

      {state.phase === "error" ? (
        <div role="alert" className="bg-surface-soft rounded-card space-y-3 p-4">
          <p className="font-semibold wrap-anywhere">{state.message}</p>
          <button type="button" onClick={() => setAttempt((n) => n + 1)} className={BUTTON_PRIMARY}>
            Try again
          </button>
        </div>
      ) : null}

      {state.phase === "form" ? (
        <div className="max-w-xl space-y-3">
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
            }}
          />
        </div>
      ) : null}

      {state.phase === "ready" ? <OrderView initial={state.view} contact={state.contact} /> : null}
    </section>
  );
}
