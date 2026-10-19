"use client";

import { createContext, useContext } from "react";

import type { BuilderStore } from "./store";

export const BuilderStoreContext = createContext<BuilderStore | null>(null);

/** The store of the nearest `BuilderProvider`. */
export function useBuilderStore(): BuilderStore {
  const store = useContext(BuilderStoreContext);
  if (store === null) throw new Error("useBuilder must be used inside <BuilderProvider>.");
  return store;
}
