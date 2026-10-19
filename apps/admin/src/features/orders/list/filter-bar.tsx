"use client";

import { ORDER_STATUSES, type CountrySummary, type PaymentStatus } from "@giftpop/contracts";
import { useEffect, useEffectEvent, useRef, useState } from "react";

import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "../status";

import {
  activeTab,
  applyTab,
  hasAnyFilter,
  ORDER_TABS,
  SEARCH_DEBOUNCE_MS,
  shouldCommitSearch,
} from "./lib/filters";
import type { OrderFilters } from "./lib/filters";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/features/catalog/components/field";
import { OptionSelect } from "@/features/catalog/components/option-select";
import { flagEmoji } from "@/lib/format";

const ALL = "all";
const PAYMENT_STATUSES: readonly PaymentStatus[] = ["unpaid", "advance_paid", "paid", "refunded"];

interface FilterBarProps {
  filters: OrderFilters;
  countries: readonly CountrySummary[];
  onChange: (next: OrderFilters) => void;
}

/** The URL is the source of truth: every control reads `filters` and reports a whole new set. */
export function FilterBar({ filters, countries, onChange }: FilterBarProps) {
  const [typed, setTyped] = useState(filters.search ?? "");
  const written = useRef(filters.search ?? "");
  const commitSearch = useEffectEvent((search: string | undefined) => {
    onChange({ ...filters, search });
  });

  // The URL changed from outside (Clear filters, back button): show what it says.
  useEffect(() => {
    if ((filters.search ?? "") !== written.current) {
      written.current = filters.search ?? "";
      setTyped(filters.search ?? "");
    }
  }, [filters.search]);

  useEffect(() => {
    if (!shouldCommitSearch(typed, written.current)) return;
    const timer = setTimeout(() => {
      const trimmed = typed.trim();
      written.current = trimmed;
      commitSearch(trimmed === "" ? undefined : trimmed);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [typed]);

  const tab = activeTab(filters);
  const statusOptions = [
    { value: ALL, label: "Any status" },
    ...ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABELS[s] })),
  ];
  const paymentOptions = [
    { value: ALL, label: "Any payment" },
    ...PAYMENT_STATUSES.map((s) => ({ value: s, label: PAYMENT_STATUS_LABELS[s] })),
  ];
  const countryOptions = [
    { value: ALL, label: "All countries" },
    ...countries.map((c) => ({ value: c.code, label: `${flagEmoji(c.code)} ${c.name}`.trim() })),
  ];

  function pick<K extends keyof OrderFilters>(key: K, value: OrderFilters[K]) {
    onChange({ ...filters, [key]: value === "" ? undefined : value });
  }

  return (
    <div className="grid gap-4" role="search" aria-label="Filter orders">
      <div role="group" aria-label="Quick views" className="flex flex-wrap gap-2">
        {ORDER_TABS.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="sm"
            variant={tab === item.id ? "default" : "outline"}
            aria-pressed={tab === item.id}
            onClick={() =>
              onChange(applyTab({ ...filters, search: typed.trim() || undefined }, item.id))
            }
          >
            {item.label}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Field label="Search" className="sm:col-span-2 lg:col-span-2">
          {(field) => (
            <Input
              id={field.id}
              type="search"
              value={typed}
              autoComplete="off"
              placeholder="Order number, phone or email"
              onChange={(event) => setTyped(event.target.value)}
            />
          )}
        </Field>
        <Field label="Order status">
          {(field) => (
            <OptionSelect
              id={field.id}
              value={filters.status ?? ALL}
              options={statusOptions}
              onValueChange={(v) => {
                const next = { ...filters };
                delete next.hasPendingProof;
                onChange({
                  ...next,
                  status: v === ALL ? undefined : (v as OrderFilters["status"]),
                });
              }}
            />
          )}
        </Field>
        <Field label="Payment status">
          {(field) => (
            <OptionSelect
              id={field.id}
              value={filters.paymentStatus ?? ALL}
              options={paymentOptions}
              onValueChange={(v) =>
                pick("paymentStatus", v === ALL ? undefined : (v as PaymentStatus))
              }
            />
          )}
        </Field>
        <Field label="Country">
          {(field) => (
            <OptionSelect
              id={field.id}
              value={filters.country ?? ALL}
              options={countryOptions}
              onValueChange={(v) => pick("country", v === ALL ? undefined : v)}
            />
          )}
        </Field>
        <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-1 lg:grid-cols-1">
          <Field label="From">
            {(field) => (
              <Input
                id={field.id}
                type="date"
                value={filters.from ?? ""}
                max={filters.to}
                onChange={(e) => pick("from", e.target.value)}
              />
            )}
          </Field>
          <Field label="To">
            {(field) => (
              <Input
                id={field.id}
                type="date"
                value={filters.to ?? ""}
                min={filters.from}
                onChange={(e) => pick("to", e.target.value)}
              />
            )}
          </Field>
        </div>
      </div>
      {hasAnyFilter(filters) || typed.trim() !== "" ? (
        <div>
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange({})}>
            Clear filters
          </Button>
        </div>
      ) : null}
    </div>
  );
}
