"use client";

import { useBuilder } from "../state";

import {
  coloursCheck,
  itemsCheck,
  layoutCheck,
  packagingCheck,
  personaliseCheck,
  reviewCheck,
} from "./continue-reason";
import type { ContinueCheck } from "./continue-reason";

/**
 * The hooks the shell calls to enable each question's primary action and say why it is off.
 * They live apart from the question bodies so the bodies can load lazily while the footer is
 * already on screen.
 */

export function usePackagingCanContinue(): ContinueCheck {
  return packagingCheck(useBuilder());
}

/** Both colours are chosen (the store defaults each to the packaging's first colour). */
export function useColoursCanContinue(): ContinueCheck {
  return coloursCheck(useBuilder());
}

/** Item count is within min and max and the gift fits (text limits are checked later). */
export function useItemsCanContinue(): ContinueCheck {
  return itemsCheck(useBuilder());
}

/** Nothing to decide here: every arrangement is valid. */
export function useLayoutCanContinue(): ContinueCheck {
  return layoutCheck();
}

export function usePersonaliseCanContinue(): ContinueCheck {
  return personaliseCheck(useBuilder());
}

/** The gift can be ordered. */
export function useReviewCanContinue(): ContinueCheck {
  return reviewCheck(useBuilder());
}
