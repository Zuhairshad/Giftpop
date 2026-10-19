"use client";

import type { CatalogResponse, CountryCode } from "@giftpop/contracts";
import type { ReactElement, ReactNode } from "react";

import type { BuilderApi, BuilderStep } from "./types";

/**
 * STUB. `web-builder-state` replaces this file with the real store (zustand,
 * sessionStorage persistence, validateDesign, debounced quotes). Every screen
 * already codes against the final `BuilderApi` type in `./types`.
 */
export function BuilderProvider(props: {
  country: CountryCode;
  catalog: CatalogResponse;
  children: ReactNode;
}): ReactElement {
  return <>{props.children}</>;
}

export function useBuilder(): BuilderApi {
  throw new Error("useBuilder is a stub until web-builder-state lands");
}

/** Sends the visitor back to the first step whose prerequisites are missing. */
export function useStepGuard(_step: BuilderStep): void {
  // STUB
}
