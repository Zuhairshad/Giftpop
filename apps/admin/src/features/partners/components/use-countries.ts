"use client";

import type { Country } from "@giftpop/contracts";
import { useCallback, useEffect, useState } from "react";

import { listCountries } from "../api/client";

/** Loads the country list once. A failure leaves the list empty; codes then show as they are. */
export function useCountries() {
  const [countries, setCountries] = useState<Country[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    listCountries(controller.signal)
      .then(setCountries)
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const countryName = useCallback(
    (code: string) => countries.find((country) => country.code === code)?.name ?? code,
    [countries],
  );
  return { countries, countryName };
}
