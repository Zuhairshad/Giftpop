import type {
  CatalogResponse,
  CountryCode,
  Design,
  DesignItem,
  DesignProblem,
  HexColor,
  Packaging,
  QuoteResponse,
} from "@giftpop/contracts";

import type { QuestionId } from "../questions/ids";

/** @deprecated The old one-screen-per-step flow; the builder is one route with questions now. */
export const BUILDER_STEPS = ["format", "items", "arrange", "personalise", "review"] as const;
export type BuilderStep = (typeof BUILDER_STEPS)[number];

export type QuoteStatus = "idle" | "loading" | "ready" | "error";

export interface ChoosePackagingResult {
  /** Items that did not fit the new packaging and were removed, so the UI can say so. */
  droppedItemIds: string[];
}

/**
 * Everything a builder screen reads and does. One store per country, provided by
 * `BuilderProvider` and read with `useBuilder()`.
 */
export interface BuilderApi {
  country: CountryCode;
  catalog: CatalogResponse;

  /** The question being shown. Always one the design can reach, so it never runs ahead of the answers. */
  question: QuestionId;

  /** The chosen packaging, or null before the first question is answered. */
  packaging: Packaging | null;
  /** Item lines in slot order. A line's `slot` always equals its index. */
  lines: readonly DesignItem[];
  wrapperColor: HexColor | null;
  ribbonColor: HexColor | null;
  arrangementSeed: number;
  cardMessage: string;
  recipientName: string;
  /** Names on personalizable items, keyed by item id. */
  itemNames: Readonly<Record<string, string>>;

  /** Total picked (sum of qty) and the space they use. */
  itemCount: number;
  usedUnits: number;
  /** The design as the API sees it, or null until a packaging is chosen. */
  design: Design | null;
  /** `validateDesign` against the loaded catalog; empty when the design can be ordered. */
  problems: readonly DesignProblem[];

  /** Server quote for the current design (debounced 300 ms). Prices come only from here. */
  quote: QuoteResponse | null;
  quoteStatus: QuoteStatus;

  /** Why this item cannot be added right now ("Box is full", "Out of stock", ...), or null if it can. */
  addBlockedReason(itemId: string): string | null;

  choosePackaging(packagingId: string): ChoosePackagingResult;
  addItem(itemId: string): void;
  removeItem(itemId: string): void;
  setQty(itemId: string, qty: number): void;
  /** Moves a line to a new position; slots are renumbered. */
  moveItem(fromIndex: number, toIndex: number): void;
  /** New arrangement seed. */
  shuffle(): void;
  setWrapperColor(color: HexColor): void;
  setRibbonColor(color: HexColor): void;
  setCardMessage(text: string): void;
  setRecipientName(text: string): void;
  setItemName(itemId: string, text: string): void;
  /** Replaces everything with a saved design (share link, template). */
  loadDesign(design: Design): void;
  reset(): void;

  /** Shows a question. A question whose answers are missing shows the first one that still needs an answer. */
  goToQuestion(id: QuestionId): void;
  /** Shows the question after this one, when its answers are in. */
  nextQuestion(): void;
  previousQuestion(): void;
}
