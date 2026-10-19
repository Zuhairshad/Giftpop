"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";


import { itemsQueryString } from "../lib/items-query";
import type { ItemsUrlState } from "../lib/items-query";

import { Field } from "./field";
import { OptionSelect } from "./option-select";

import { Input } from "@/components/ui/input";

const ALL = "all";
const SEARCH_DELAY_MS = 300;

const STATUS_OPTIONS = [
  { value: ALL, label: "Active and inactive" },
  { value: "true", label: "Active only" },
  { value: "false", label: "Inactive only" },
];

interface ItemsFiltersProps {
  categories: readonly string[];
  /** What the URL says now. */
  current: ItemsUrlState;
}

/** Search and filters. The URL is the source of truth, so a filtered list can be shared. */
export function ItemsFilters({ categories, current }: ItemsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(current.search ?? "");
  const lastPushed = useRef(current.search ?? "");

  function go(next: ItemsUrlState) {
    lastPushed.current = next.search ?? "";
    router.replace(`${pathname}${itemsQueryString(next)}`);
  }

  useEffect(() => {
    if (search.trim() === lastPushed.current.trim()) return;
    const timer = setTimeout(() => {
      lastPushed.current = search;
      router.replace(`${pathname}${itemsQueryString({ ...current, search, page: 1 })}`);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search, current, pathname, router]);

  const categoryOptions = [
    { value: ALL, label: "All categories" },
    ...categories.map((category) => ({ value: category, label: category })),
  ];

  return (
    <div className="flex flex-wrap items-end gap-3" role="search">
      <Field label="Search items" className="w-full sm:w-64">
        {(field) => (
          <Input
            {...field}
            type="search"
            value={search}
            autoComplete="off"
            placeholder="Name"
            onChange={(event) => setSearch(event.target.value)}
          />
        )}
      </Field>
      <Field label="Category" className="w-full sm:w-48">
        {(field) => (
          <OptionSelect
            id={field.id}
            value={current.category ?? ALL}
            options={categoryOptions}
            onValueChange={(value) =>
              go({ ...current, search, category: value === ALL ? undefined : value, page: 1 })
            }
          />
        )}
      </Field>
      <Field label="Status" className="w-full sm:w-48">
        {(field) => (
          <OptionSelect
            id={field.id}
            value={current.active === undefined ? ALL : String(current.active)}
            options={STATUS_OPTIONS}
            onValueChange={(value) =>
              go({
                ...current,
                search,
                active: value === ALL ? undefined : value === "true",
                page: 1,
              })
            }
          />
        )}
      </Field>
    </div>
  );
}
