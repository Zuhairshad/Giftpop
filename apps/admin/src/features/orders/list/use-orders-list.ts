"use client";

import { AdminOrderListResponseSchema } from "@giftpop/contracts";
import { useCallback, useEffect, useReducer, useRef } from "react";

import { buildApiPath } from "./lib/filters";
import type { OrderFilters } from "./lib/filters";
import { INITIAL_LIST_STATE, listReducer } from "./lib/state";

import { apiFetch, isApiError } from "@/lib/api";

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function messageOf(error: unknown): string {
  return isApiError(error) ? error.message : "Could not load orders.";
}

/**
 * Loads the first page when the filters change and further pages on demand.
 * A response for filters that are no longer shown is aborted and ignored.
 */
export function useOrdersList(filters: OrderFilters) {
  const [state, dispatch] = useReducer(listReducer, INITIAL_LIST_STATE);
  const controller = useRef<AbortController | null>(null);
  const [attempt, retry] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    const abort = new AbortController();
    controller.current = abort;
    dispatch({ type: "reset" });
    apiFetch(buildApiPath(filters), AdminOrderListResponseSchema, {
      signal: abort.signal,
    }).then(
      (page) => {
        if (!abort.signal.aborted) {
          dispatch({ type: "first_loaded", items: page.items, nextCursor: page.nextCursor });
        }
      },
      (error: unknown) => {
        if (abort.signal.aborted || isAbort(error)) return;
        dispatch({ type: "first_failed", message: messageOf(error) });
      },
    );
    return () => abort.abort();
    // `filters` is memoised on the URL by the caller, so this runs once per distinct view.
  }, [filters, attempt]);

  const loadMore = useCallback(() => {
    const cursor = state.nextCursor;
    const abort = controller.current;
    if (!cursor || !abort || abort.signal.aborted) return;
    dispatch({ type: "more_started" });
    apiFetch(buildApiPath(filters, cursor), AdminOrderListResponseSchema, {
      signal: abort.signal,
    }).then(
      (page) => {
        if (!abort.signal.aborted) {
          dispatch({ type: "more_loaded", items: page.items, nextCursor: page.nextCursor });
        }
      },
      (error: unknown) => {
        if (abort.signal.aborted || isAbort(error)) return;
        dispatch({ type: "more_failed", message: messageOf(error) });
      },
    );
  }, [filters, state.nextCursor]);

  return { state, loadMore, reload: retry };
}
