"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { ChooseCountryLink } from "./choose-country-link";
import { countryFromPath } from "./cookie";
import { flagEmoji } from "./flag";

export type PickerCountry = { code: string; name: string };

type CountryPickerProps = {
  /** Live countries only. */
  countries: PickerCountry[];
  /** The `gp_country` cookie, read on the server. */
  cookieCode: string | null;
  /** All known countries, so a cookie for a coming-soon country still shows a name. */
  allCountries: PickerCountry[];
};

const PILL =
  "border-border bg-surface text-foreground hover:bg-surface-soft inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors";

export function CountryPicker({ countries, cookieCode, allCountries }: CountryPickerProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const currentCode = countryFromPath(pathname) ?? cookieCode;
  const current = allCountries.find((country) => country.code === currentCode);

  function close(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  // Close when the page changes (after choosing a country or following a link).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  const label = current
    ? `Country: ${current.name}. Change country.`
    : "Country: Choose. No country chosen yet.";

  return (
    <div>
      <button
        ref={buttonRef}
        type="button"
        className={PILL}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
      >
        {current ? (
          <>
            <span aria-hidden="true">{flagEmoji(current.code)}</span>
            <span className="max-w-[9rem] truncate sm:max-w-[14rem]">{current.name}</span>
          </>
        ) : (
          <>
            <span aria-hidden="true">Country: </span>
            <span className="text-pink-strong">Choose</span>
          </>
        )}
        <span aria-hidden="true" className="text-muted text-xs">
          ▾
        </span>
      </button>

      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="group"
          aria-label="Choose your country"
          className="border-border bg-surface rounded-card shadow-pop absolute inset-x-4 top-full z-50 mt-2 max-h-[70dvh] overflow-y-auto border p-2 sm:inset-x-auto sm:right-6 sm:w-80"
        >
          {countries.length === 0 ? (
            <p className="text-muted px-3 py-2 text-sm">No countries are open yet.</p>
          ) : (
            <ul>
              {countries.map((country) => (
                <li key={country.code}>
                  <ChooseCountryLink
                    code={country.code}
                    onChosen={() => close(false)}
                    className="hover:bg-surface-soft flex items-center gap-3 rounded-soft px-3 py-2 text-sm font-semibold"
                  >
                    <span aria-hidden="true" className="text-xl">
                      {flagEmoji(country.code)}
                    </span>
                    <span className="min-w-0 flex-1 wrap-anywhere">{country.name}</span>
                    {country.code === currentCode ? (
                      <span className="text-pink-strong text-xs">Current</span>
                    ) : null}
                  </ChooseCountryLink>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/countries"
            onClick={() => close(false)}
            className="text-pink-strong hover:bg-surface-soft mt-1 block rounded-soft px-3 py-2 text-sm font-bold"
          >
            See all countries
          </Link>
        </div>
      ) : null}
    </div>
  );
}
