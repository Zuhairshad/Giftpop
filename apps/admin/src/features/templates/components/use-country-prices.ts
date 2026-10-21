"use client";

import type { PublicTemplate } from "@giftpop/contracts";
import { useEffect, useMemo, useState } from "react";

import { listPublicTemplates } from "../api/client";

import { readApiError } from "@/features/catalog/lib/api-errors";

export type PublicList =
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "ready"; templates: PublicTemplate[] };

/**
 * The public template list of each country, loaded once per country (not once per template) and
 * again whenever `version` changes. A failed country shows its own error and never breaks the others.
 * Old results stay on screen while a newer one loads.
 */
export function useCountryPrices(
  countryCodes: readonly string[],
  version: number,
): ReadonlyMap<string, PublicList> {
  const [results, setResults] = useState<ReadonlyMap<string, PublicList>>(new Map());
  const key = [...new Set(countryCodes)].sort().join(",");

  useEffect(() => {
    const codes = key === "" ? [] : key.split(",");
    const controller = new AbortController();
    for (const code of codes) {
      listPublicTemplates(code, controller.signal)
        .then((templates): PublicList => ({ state: "ready", templates }))
        .catch((error: unknown): PublicList => ({
          state: "error",
          message: readApiError(error).message,
        }))
        .then((result) => {
          if (controller.signal.aborted) return;
          setResults((current) => new Map(current).set(code, result));
        });
    }
    return () => controller.abort();
  }, [key, version]);

  // Only the countries asked for are returned; one not answered yet reads as loading.
  return useMemo(
    () =>
      new Map(
        (key === "" ? [] : key.split(",")).map((code): [string, PublicList] => [
          code,
          results.get(code) ?? { state: "loading" },
        ]),
      ),
    [key, results],
  );
}
