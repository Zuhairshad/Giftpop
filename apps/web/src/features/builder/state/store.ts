import type { CatalogResponse, CountryCode, QuoteResponse } from "@giftpop/contracts";
import { createStore } from "zustand/vanilla";

import { emptyData, randomSeed } from "./data";
import type { BuilderData } from "./data";
import { deriveView } from "./derive";
import type { BuilderView } from "./derive";
import { dataFromDesign } from "./design-data";
import { getSessionStorage, readStoredDesign, writeStoredDesign } from "./persistence";
import type { StorageLike } from "./persistence";
import { createQuoteScheduler } from "./quote-scheduler";
import type { QuoteSchedulerDeps } from "./quote-scheduler";
import { addBlockedReason } from "./rules";
import * as step from "./transitions";
import type { BuilderApi, QuoteStatus } from "./types";

export interface BuilderStoreOptions {
  country: CountryCode;
  catalog: CatalogResponse;
  fetchQuote: QuoteSchedulerDeps["fetchQuote"];
  /** Looked up when the store hydrates and each time it saves. Defaults to `sessionStorage`. */
  getStorage?: () => StorageLike | null;
  /** Source of new arrangement seeds. Defaults to `crypto.getRandomValues`. */
  random?: () => number;
  delayMs?: number;
  setTimer?: QuoteSchedulerDeps["setTimer"];
  clearTimer?: QuoteSchedulerDeps["clearTimer"];
}

export interface BuilderStore {
  /** The same object until something changes, as `useSyncExternalStore` requires. */
  getSnapshot(): BuilderApi;
  subscribe(listener: () => void): () => void;
  /** True once saved state has been read back (or found missing). Step guards wait for it. */
  isHydrated(): boolean;
  /** Reads the design saved in this tab. Call once on the client, never during render. */
  hydrate(): void;
  setCatalog(catalog: CatalogResponse): void;
  dispose(): void;
}

interface StoreState {
  data: BuilderData;
  catalog: CatalogResponse;
  hydrated: boolean;
  quote: QuoteResponse | null;
  quoteStatus: QuoteStatus;
}

export function createBuilderStore(options: BuilderStoreOptions): BuilderStore {
  const { country } = options;
  const getStorage = options.getStorage ?? getSessionStorage;
  const random = options.random ?? randomSeed;

  const store = createStore<StoreState>(() => ({
    data: emptyData(),
    catalog: options.catalog,
    hydrated: false,
    quote: null,
    quoteStatus: "idle",
  }));

  const scheduler = createQuoteScheduler({
    fetchQuote: options.fetchQuote,
    delayMs: options.delayMs,
    setTimer: options.setTimer,
    clearTimer: options.clearTimer,
    onChange: ({ quote, status }) => store.setState({ quote, quoteStatus: status }),
  });

  let viewCache: { data: BuilderData; catalog: CatalogResponse; view: BuilderView } | null = null;
  function view(state: StoreState): BuilderView {
    if (viewCache?.data === state.data && viewCache.catalog === state.catalog) {
      return viewCache.view;
    }
    const next = deriveView(state.data, state.catalog);
    viewCache = { data: state.data, catalog: state.catalog, view: next };
    return next;
  }

  /** After any change to the data or catalog: save it and refresh the quote. */
  function afterChange(): void {
    const state = store.getState();
    const { design, problems } = view(state);
    if (state.hydrated) writeStoredDesign(getStorage(), country, design);
    scheduler.update({ country, design, hasProblems: problems.length > 0 });
  }

  function commit(next: BuilderData): void {
    if (next === store.getState().data) return;
    store.setState({ data: next });
    afterChange();
  }

  const current = () => store.getState();
  const catalog = () => store.getState().catalog;

  const actions = {
    addBlockedReason: (itemId: string) => addBlockedReason(current().data, catalog(), itemId),
    choosePackaging(packagingId: string) {
      const outcome = step.choosePackaging(current().data, catalog(), packagingId, random);
      commit(outcome.data);
      return { droppedItemIds: outcome.droppedItemIds };
    },
    addItem: (itemId: string) => commit(step.addItem(current().data, catalog(), itemId)),
    removeItem: (itemId: string) => commit(step.removeItem(current().data, catalog(), itemId)),
    setQty: (itemId: string, qty: number) =>
      commit(step.setQty(current().data, catalog(), itemId, qty)),
    moveItem: (from: number, to: number) => commit(step.moveItem(current().data, from, to)),
    shuffle: () => commit(step.shuffle(current().data, random)),
    setWrapperColor: (color: string) =>
      commit(step.setWrapperColor(current().data, catalog(), color)),
    setRibbonColor: (color: string) =>
      commit(step.setRibbonColor(current().data, catalog(), color)),
    setCardMessage: (text: string) => commit(step.setCardMessage(current().data, text)),
    setRecipientName: (text: string) => commit(step.setRecipientName(current().data, text)),
    setItemName: (itemId: string, text: string) =>
      commit(step.setItemName(current().data, catalog(), itemId, text)),
    loadDesign: (design: Parameters<BuilderApi["loadDesign"]>[0]) =>
      commit(dataFromDesign(design, catalog())),
    reset: () => commit(emptyData()),
  } satisfies Partial<BuilderApi>;

  let snapshotCache: { state: StoreState; api: BuilderApi } | null = null;
  function getSnapshot(): BuilderApi {
    const state = store.getState();
    if (snapshotCache?.state === state) return snapshotCache.api;
    const derived = view(state);
    const { data } = state;
    const api: BuilderApi = {
      ...actions,
      country,
      catalog: state.catalog,
      packaging: derived.packaging,
      lines: data.lines,
      wrapperColor: derived.wrapperColor,
      ribbonColor: derived.ribbonColor,
      arrangementSeed: data.arrangementSeed,
      cardMessage: data.cardMessage,
      recipientName: data.recipientName,
      itemNames: data.itemNames,
      itemCount: derived.itemCount,
      usedUnits: derived.usedUnits,
      design: derived.design,
      problems: derived.problems,
      quote: state.quote,
      quoteStatus: state.quoteStatus,
    };
    snapshotCache = { state, api };
    return api;
  }

  return {
    getSnapshot,
    subscribe: (listener) => store.subscribe(listener),
    isHydrated: () => store.getState().hydrated,
    hydrate() {
      const state = store.getState();
      if (state.hydrated) {
        // Called again (React strict mode re-runs effects): make sure a quote is on its way.
        afterChange();
        return;
      }
      const stored = readStoredDesign(getStorage(), country, state.catalog);
      // Anything the visitor already did this session wins over what was saved.
      const untouched = state.data.packagingId === null;
      store.setState({
        hydrated: true,
        data: stored && untouched ? dataFromDesign(stored, state.catalog) : state.data,
      });
      afterChange();
    },
    setCatalog(next) {
      if (next === store.getState().catalog) return;
      store.setState({ catalog: next });
      afterChange();
    },
    dispose: () => scheduler.dispose(),
  };
}
