"use client";

import { PublicCountrySchema } from "@giftpop/contracts";
import type { CountryCode, PublicCountry } from "@giftpop/contracts";
import { useEffect, useState } from "react";
import { z } from "zod";

import { apiRequest } from "@/lib/api";

export type CountryState =
  { status: "loading" } | { status: "error" } | { status: "ready"; country: PublicCountry };

/** Loads the current country's address format, payment modes and shipping from `GET /countries`. */
export function useCountry(code: CountryCode): CountryState {
  const [state, setState] = useState<CountryState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    apiRequest("/countries", z.array(PublicCountrySchema), { signal: controller.signal })
      .then((countries) => {
        const country = countries.find((entry) => entry.code === code);
        setState(country ? { status: "ready", country } : { status: "error" });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: "error" });
      });
    return () => controller.abort();
  }, [code]);

  return state;
}
