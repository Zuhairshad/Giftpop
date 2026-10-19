"use client";

import { CountrySummarySchema } from "@giftpop/contracts";
import type { CountrySummary } from "@giftpop/contracts";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { FilterBar } from "./filter-bar";
import { filtersFromParams, filtersToSearch, hasAnyFilter } from "./lib/filters";
import type { OrderFilters } from "./lib/filters";
import { toRow } from "./lib/row";
import { OrdersTable, OrdersTableSkeleton } from "./orders-table";
import { useOrdersList } from "./use-orders-list";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

const CountriesSchema = z.array(CountrySummarySchema);

function useCountries(): readonly CountrySummary[] {
  const [countries, setCountries] = useState<readonly CountrySummary[]>([]);
  useEffect(() => {
    const abort = new AbortController();
    apiFetch("/countries/admin", CountriesSchema, { signal: abort.signal }).then(
      (list) => setCountries(list),
      () => undefined, // The filter still works by typing; the country list is a convenience.
    );
    return () => abort.abort();
  }, []);
  return countries;
}

function Message(props: { title: string; children?: React.ReactNode; role?: "alert" | "status" }) {
  return (
    <div
      role={props.role ?? "status"}
      className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center"
    >
      <p className="font-medium">{props.title}</p>
      {props.children}
    </div>
  );
}

export function OrdersListView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const filters = useMemo(() => filtersFromParams(params), [params]);
  const countries = useCountries();
  const { state, loadMore, reload } = useOrdersList(filters);
  const rows = useMemo(() => state.rows.map(toRow), [state.rows]);

  function setFilters(next: OrderFilters) {
    router.replace(`${pathname}${filtersToSearch(next)}`, { scroll: false });
  }

  let body: React.ReactNode;
  if (state.phase === "loading") {
    body = <OrdersTableSkeleton />;
  } else if (state.phase === "error") {
    body = (
      <Message title="Orders could not be loaded" role="alert">
        <p className="text-muted-foreground text-sm">{state.error}</p>
        <Button type="button" onClick={reload}>
          Try again
        </Button>
      </Message>
    );
  } else if (rows.length === 0) {
    body = hasAnyFilter(filters) ? (
      <Message title="No orders match these filters">
        <Button type="button" variant="outline" onClick={() => setFilters({})}>
          Clear filters
        </Button>
      </Message>
    ) : (
      <Message title="No orders yet" />
    );
  } else {
    body = (
      <>
        <OrdersTable rows={rows} />
        <div className="flex flex-col items-center gap-2 pt-4">
          {state.more === "error" ? (
            <p role="alert" className="text-destructive text-sm">
              {state.moreError} The orders above are still here.
            </p>
          ) : null}
          {state.nextCursor ? (
            <Button
              type="button"
              variant="outline"
              disabled={state.more === "loading"}
              onClick={loadMore}
            >
              {state.more === "loading"
                ? "Loading orders"
                : state.more === "error"
                  ? "Try again"
                  : "Load more orders"}
            </Button>
          ) : (
            <p className="text-muted-foreground text-sm">
              {rows.length === 1 ? "1 order" : `${rows.length} orders`}, that is all of them.
            </p>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="grid min-w-0 gap-4">
      <FilterBar filters={filters} countries={countries} onChange={setFilters} />
      <div className="min-w-0" aria-live="polite">
        {body}
      </div>
    </div>
  );
}
