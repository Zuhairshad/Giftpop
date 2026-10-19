import type { AdminOrderListItem } from "@giftpop/contracts";

export interface ListState {
  rows: readonly AdminOrderListItem[];
  nextCursor: string | null;
  phase: "loading" | "ready" | "error";
  error: string | undefined;
  more: "idle" | "loading" | "error";
  moreError: string | undefined;
}

export type ListAction =
  | { type: "reset" }
  | { type: "first_loaded"; items: readonly AdminOrderListItem[]; nextCursor: string | null }
  | { type: "first_failed"; message: string }
  | { type: "more_started" }
  | { type: "more_loaded"; items: readonly AdminOrderListItem[]; nextCursor: string | null }
  | { type: "more_failed"; message: string };

export const INITIAL_LIST_STATE: ListState = {
  rows: [],
  nextCursor: null,
  phase: "loading",
  error: undefined,
  more: "idle",
  moreError: undefined,
};

/** Adds a page after the rows already shown, skipping any order that is already there. */
export function appendPage(
  rows: readonly AdminOrderListItem[],
  incoming: readonly AdminOrderListItem[],
): AdminOrderListItem[] {
  const seen = new Set(rows.map((row) => row.id));
  const added: AdminOrderListItem[] = [];
  for (const item of incoming) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    added.push(item);
  }
  return [...rows, ...added];
}

export function listReducer(state: ListState, action: ListAction): ListState {
  switch (action.type) {
    case "reset":
      return INITIAL_LIST_STATE;
    case "first_loaded":
      return {
        ...INITIAL_LIST_STATE,
        rows: appendPage([], action.items),
        nextCursor: action.nextCursor,
        phase: "ready",
      };
    case "first_failed":
      return { ...INITIAL_LIST_STATE, phase: "error", error: action.message };
    case "more_started":
      return { ...state, more: "loading", moreError: undefined };
    case "more_loaded":
      return {
        ...state,
        rows: appendPage(state.rows, action.items),
        nextCursor: action.nextCursor,
        more: "idle",
        moreError: undefined,
      };
    case "more_failed":
      // Rows on screen stay and the cursor is kept, so "Try again" asks for the same page.
      return { ...state, more: "error", moreError: action.message };
  }
}
