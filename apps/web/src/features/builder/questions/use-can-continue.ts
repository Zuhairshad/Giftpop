"use client";

import { useBuilder } from "../state";

import {
  coloursReady,
  itemsReady,
  layoutReady,
  packagingReady,
  personaliseReady,
  reviewReady,
} from "./can-continue";

/**
 * The hooks the shell calls to enable each question's primary action. They live apart from the
 * question bodies so the bodies can load lazily while the footer is already on screen.
 */

export function usePackagingCanContinue(): boolean {
  return packagingReady(useBuilder());
}

/** Both colours are chosen (the store defaults each to the packaging's first colour). */
export function useColoursCanContinue(): boolean {
  return coloursReady(useBuilder());
}

/** Item count is within min and max and the gift fits (text limits are checked later). */
export function useItemsCanContinue(): boolean {
  return itemsReady(useBuilder());
}

/** Nothing to decide here: every arrangement is valid. */
export function useLayoutCanContinue(): boolean {
  return layoutReady();
}

export function usePersonaliseCanContinue(): boolean {
  return personaliseReady(useBuilder());
}

/** The gift can be ordered. */
export function useReviewCanContinue(): boolean {
  return reviewReady(useBuilder());
}
