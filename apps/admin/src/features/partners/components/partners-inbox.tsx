"use client";

import type { PartnerRequest, PartnerRequestKind } from "@giftpop/contracts";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import { listPartnerRequests } from "../api/client";
import type { PartnerPage } from "../api/client";
import {
  PARTNERS_PAGE_SIZE,
  pageCount,
  parsePartnerFilters,
  partnerApiQuery,
  partnerQueryString,
} from "../lib/partner-query";
import type { PartnerFilters } from "../lib/partner-query";

import { PartnerDetail } from "./partner-detail";
import { PartnersFilters } from "./partners-filters";
import { PartnersTable } from "./partners-table";
import { useCountries } from "./use-countries";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { readApiError } from "@/features/catalog/lib/api-errors";

const TABS: { kind: PartnerRequestKind; label: string }[] = [
  { kind: "brand", label: "Brand requests" },
  { kind: "country", label: "Country requests" },
];

type Load =
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "ready"; page: PartnerPage };

type Outcome = { key: string; error: string } | { key: string; page: PartnerPage };

export function PartnersInbox() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <Inbox />
    </Suspense>
  );
}

function Inbox() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = parsePartnerFilters(searchParams);
  const { countries, countryName } = useCountries();
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  // The URL is the source of truth for the filters, so a view can be shared and survives refresh.
  const { kind, status, country, page } = filters;
  const key = `${partnerApiQuery({ kind, status, country, page })}#${attempt}`;
  useEffect(() => {
    const controller = new AbortController();
    listPartnerRequests({ kind, status, country, page }, controller.signal)
      .then((result) => setOutcome({ key, page: result }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setOutcome({ key, error: readApiError(error).message });
      });
    return () => controller.abort();
  }, [kind, status, country, page, key]);

  // Until the answer for the current filters arrives, the view is loading.
  const load: Load =
    outcome === null || outcome.key !== key
      ? { state: "loading" }
      : "error" in outcome
        ? { state: "error", message: outcome.error }
        : { state: "ready", page: outcome.page };

  const go = useCallback(
    (next: PartnerFilters) => router.replace(`${pathname}${partnerQueryString(next)}`),
    [router, pathname],
  );

  function saved(request: PartnerRequest) {
    setOutcome((current) =>
      current && "page" in current
        ? {
            key: current.key,
            page: {
              ...current.page,
              items: current.page.items.map((item) => (item.id === request.id ? request : item)),
            },
          }
        : current,
    );
  }

  const open =
    load.state === "ready" ? (load.page.items.find((item) => item.id === openId) ?? null) : null;

  return (
    <div className="grid grid-cols-1 gap-4">
      <div role="tablist" aria-label="Request type" className="flex gap-1 border-b">
        {TABS.map((tab) => {
          const selected = tab.kind === filters.kind;
          return (
            <button
              key={tab.kind}
              type="button"
              role="tab"
              id={`tab-${tab.kind}`}
              aria-selected={selected}
              aria-controls="partners-panel"
              onClick={() => go({ kind: tab.kind, page: 1 })}
              className={`focus-visible:ring-ring -mb-px rounded-t-md border-b-2 px-3 py-2 text-sm font-medium outline-none focus-visible:ring-3 ${
                selected
                  ? "border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground border-transparent"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        id="partners-panel"
        role="tabpanel"
        aria-labelledby={`tab-${filters.kind}`}
        className="grid grid-cols-1 gap-4"
      >
        <PartnersFilters filters={filters} countries={countries} onChange={go} />

        {load.state === "loading" ? (
          <div className="grid grid-cols-1 gap-2" role="status" aria-label="Loading requests">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : null}

        {load.state === "error" ? (
          <div
            role="alert"
            className="border-destructive/40 bg-destructive/10 grid gap-2 rounded-lg border p-4 text-sm"
          >
            <p className="text-destructive">{load.message}</p>
            <div>
              <Button variant="outline" size="sm" onClick={() => setAttempt((n) => n + 1)}>
                Try again
              </Button>
            </div>
          </div>
        ) : null}

        {load.state === "ready" && load.page.items.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
            {status || country
              ? "No requests match these filters."
              : filters.kind === "brand"
                ? "No brand requests yet."
                : "No country requests yet."}
          </p>
        ) : null}

        {load.state === "ready" && load.page.items.length > 0 ? (
          <>
            <PartnersTable
              items={load.page.items}
              countryName={countryName}
              onOpen={(request) => setOpenId(request.id)}
            />
            <Pager
              page={load.page.page}
              total={load.page.total}
              onPage={(next) => go({ ...filters, page: next })}
            />
          </>
        ) : null}
      </div>

      <PartnerDetail
        request={open}
        countryName={countryName}
        onClose={() => setOpenId(null)}
        onSaved={saved}
      />
    </div>
  );
}

function Pager({
  page,
  total,
  onPage,
}: {
  page: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const pages = pageCount(total, PARTNERS_PAGE_SIZE);
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-muted-foreground text-sm">
        Page {page} of {pages} ({total} requests)
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous page
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Next page
        </Button>
      </div>
    </nav>
  );
}
