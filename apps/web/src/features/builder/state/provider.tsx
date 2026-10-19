"use client";

import type { CatalogResponse, CountryCode } from "@giftpop/contracts";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { ReactElement, ReactNode } from "react";

import { BuilderStoreContext, useBuilderStore } from "./context";
import { fetchQuote } from "./quote-client";
import { createBuilderStore } from "./store";
import type { BuilderApi } from "./types";

interface ProviderProps {
  country: CountryCode;
  catalog: CatalogResponse;
  children: ReactNode;
}

function StoreHost({ country, catalog, children }: ProviderProps): ReactElement {
  const [store] = useState(() => createBuilderStore({ country, catalog, fetchQuote }));

  useEffect(() => {
    // Saved state is read after mount so the first client render matches the server HTML.
    store.hydrate();
    return () => store.dispose();
  }, [store]);

  useEffect(() => {
    store.setCatalog(catalog);
  }, [store, catalog]);

  return <BuilderStoreContext.Provider value={store}>{children}</BuilderStoreContext.Provider>;
}

/** One builder store per country. A different country gets a fresh store (and its own saved design). */
export function BuilderProvider(props: ProviderProps): ReactElement {
  return <StoreHost key={props.country} {...props} />;
}

/** Everything a builder screen reads and does. Throws outside `BuilderProvider`. */
export function useBuilder(): BuilderApi {
  const store = useBuilderStore();
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}
