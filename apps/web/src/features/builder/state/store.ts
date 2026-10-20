import type { CatalogResponse, CountryCode, QuoteResponse } from "@giftpop/contracts";
import { createStore } from "zustand/vanilla";

import {
  nextQuestion as questionAfter,
  previousQuestion as questionBefore,
} from "../questions/ids";
import type { QuestionId } from "../questions/ids";

import { emptyData, randomSeed } from "./data";
import type { BuilderData } from "./data";
import { deriveView } from "./derive";
import type { BuilderView } from "./derive";
import { dataFromDesign } from "./design-data";
import {
  getSessionStorage,
  readStoredDesign,
  readStoredQuestion,
  writeStoredDesign,
  writeStoredQuestion,
} from "./persistence";
import type { StorageLike } from "./persistence";
import { reachableQuestion } from "./question-guard";
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
  /** The empty pre-hydration state, so the server render and the first client render agree. */
  getServerSnapshot(): BuilderApi;
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
  /** The question being shown. Always one the design can reach: see `syncQuestion`. */
  question: QuestionId;
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
    question: "packaging",
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

  /** The question that can be shown for this data: the asked-for one, or the first one it still needs. */
  function reachable(state: StoreState, question: QuestionId): QuestionId {
    return reachableQuestion(question, view(state));
  }

  // What sessionStorage holds for the question; "packaging" also stands for nothing saved.
  let savedQuestion: QuestionId = "packaging";
  function saveQuestion(): void {
    const state = store.getState();
    if (!state.hydrated || state.question === savedQuestion) return;
    savedQuestion = state.question;
    writeStoredQuestion(getStorage(), country, state.question);
  }

  /** Moves the visitor back when the data no longer reaches their question (items removed, packaging gone). */
  function syncQuestion(): void {
    const state = store.getState();
    const question = reachable(state, state.question);
    if (question !== state.question) store.setState({ question });
    saveQuestion();
  }

  /** After any change to the data or catalog: save it, keep the question reachable and refresh the quote. */
  function afterChange(): void {
    const state = store.getState();
    const { design, problems } = view(state);
    if (state.hydrated) writeStoredDesign(getStorage(), country, design);
    syncQuestion();
    scheduler.update({ country, design, hasProblems: problems.length > 0 });
  }

  function goToQuestion(id: QuestionId): void {
    const state = store.getState();
    const question = reachable(state, id);
    if (question === state.question) return;
    store.setState({ question });
    saveQuestion();
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
    setCustomRequest: (text: string) => commit(step.setCustomRequest(current().data, text)),
    setRecipientName: (text: string) => commit(step.setRecipientName(current().data, text)),
    setItemName: (itemId: string, text: string) =>
      commit(step.setItemName(current().data, catalog(), itemId, text)),
    loadDesign: (design: Parameters<BuilderApi["loadDesign"]>[0]) =>
      commit(dataFromDesign(design, catalog())),
    reset: () => commit(emptyData()),
    goToQuestion,
    nextQuestion() {
      const to = questionAfter(current().question);
      if (to) goToQuestion(to);
    },
    previousQuestion() {
      const to = questionBefore(current().question);
      if (to) goToQuestion(to);
    },
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
      question: state.question,
      packaging: derived.packaging,
      lines: data.lines,
      wrapperColor: derived.wrapperColor,
      ribbonColor: derived.ribbonColor,
      arrangementSeed: data.arrangementSeed,
      cardMessage: data.cardMessage,
      customRequest: data.customRequest,
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

  const serverSnapshot = getSnapshot();

  return {
    getSnapshot,
    getServerSnapshot: () => serverSnapshot,
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
      const storedQuestion = readStoredQuestion(getStorage(), country);
      savedQuestion = storedQuestion ?? "packaging";
      store.setState({
        hydrated: true,
        data: stored && untouched ? dataFromDesign(stored, state.catalog) : state.data,
        question: untouched && storedQuestion ? storedQuestion : state.question,
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
