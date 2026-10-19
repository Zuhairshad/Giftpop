"use client";

import { serializeCountryCookie } from "./cookie";

/** Saves the visitor's country in the `gp_country` cookie. Safe to call when cookies are blocked. */
export function rememberCountry(code: string): void {
  try {
    document.cookie = serializeCountryCookie(code);
  } catch {
    // Cookies blocked or invalid code: navigation still works, the choice just is not remembered.
  }
}
