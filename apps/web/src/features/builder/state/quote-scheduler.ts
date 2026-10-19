import type { CountryCode, Design, QuoteRequest, QuoteResponse } from "@giftpop/contracts";

import type { QuoteStatus } from "./types";

export const QUOTE_DEBOUNCE_MS = 300;

export interface QuoteUpdate {
  quote: QuoteResponse | null;
  status: QuoteStatus;
}

export interface QuoteSchedulerDeps {
  /** Asks the API for a quote. Must reject when `signal` aborts or the API says no. */
  fetchQuote(request: QuoteRequest, signal: AbortSignal): Promise<QuoteResponse>;
  onChange(update: QuoteUpdate): void;
  delayMs?: number;
  /** Injected so tests can drive time. Default to the global timers. */
  setTimer?: (callback: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
}

export interface QuoteInput {
  country: CountryCode;
  design: Design | null;
  /** True when `validateDesign` found problems; the API would only answer 422. */
  hasProblems: boolean;
}

export interface QuoteScheduler {
  /** Call after every change. Does nothing when the design is the same as last time. */
  update(input: QuoteInput): void;
  /** Stops any pending or running request. */
  dispose(): void;
}

/**
 * Debounced quote requests, with no React and no real timers or network in it.
 * Only the latest design counts: older timers are cleared, older requests are
 * aborted, and an older answer that still arrives is ignored. The request holds
 * the country and the design and nothing else, so it can never carry a price.
 */
export function createQuoteScheduler(deps: QuoteSchedulerDeps): QuoteScheduler {
  const delayMs = deps.delayMs ?? QUOTE_DEBOUNCE_MS;
  const setTimer = deps.setTimer ?? ((callback, ms) => setTimeout(callback, ms));
  const clearTimer =
    deps.clearTimer ?? ((handle) => clearTimeout(handle as ReturnType<typeof setTimeout>));

  let timer: unknown;
  let hasTimer = false;
  let controller: AbortController | null = null;
  let run = 0;
  let lastKey: string | null | undefined;
  let quote: QuoteResponse | null = null;

  function cancel(): void {
    if (hasTimer) clearTimer(timer);
    hasTimer = false;
    controller?.abort();
    controller = null;
    run += 1;
  }

  function send(request: QuoteRequest, mine: number): void {
    hasTimer = false;
    const abort = new AbortController();
    controller = abort;
    deps.fetchQuote(request, abort.signal).then(
      (response) => {
        if (mine !== run) return;
        quote = response;
        deps.onChange({ quote, status: "ready" });
      },
      () => {
        if (mine !== run) return;
        quote = null;
        deps.onChange({ quote: null, status: "error" });
      },
    );
  }

  return {
    update({ country, design, hasProblems }) {
      const request = design !== null && !hasProblems ? { country, design } : null;
      const key = request === null ? null : JSON.stringify(request);
      if (key === lastKey) return;
      lastKey = key;
      cancel();

      if (request === null) {
        quote = null;
        deps.onChange({ quote: null, status: "idle" });
        return;
      }
      // The previous quote stays visible, marked as loading, until the new one lands.
      deps.onChange({ quote, status: "loading" });
      const mine = run;
      hasTimer = true;
      timer = setTimer(() => send(request, mine), delayMs);
    },
    dispose() {
      cancel();
      lastKey = undefined;
    },
  };
}
