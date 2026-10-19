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

/** Marks the header country pill so the suggestion banner can hand focus to it after "Not now". */
export const COUNTRY_PILL_ATTR = "data-country-pill";

const PILL =
  "bg-surface text-foreground shadow-hairline hover:bg-warm inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors sm:gap-2 sm:px-4";

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
        {...{ [COUNTRY_PILL_ATTR]: "" }}
        className={PILL}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
      >
        {current ? (
          <>
            <span aria-hidden="true">{flagEmoji(current.code)}</span>
            <span className="max-w-[6.5rem] truncate min-[390px]:max-w-[9rem] sm:max-w-[14rem]">
              {current.name}
            </span>
          </>
        ) : (
          <>
            <span aria-hidden="true" className="hidden min-[390px]:inline">
              Country:
            </span>
            <span className="text-pink-strong font-semibold">Choose</span>
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
          className="bg-surface shadow-hairline shadow-float absolute inset-x-4 top-full z-50 mt-2 max-h-[70dvh] overflow-y-auto rounded-lg p-2 sm:inset-x-auto sm:right-6 sm:w-80"
        >
          {countries.length === 0 ? (
            <p className="text-muted px-3 py-3 text-sm">No countries are open yet.</p>
          ) : (
            <ul>
              {countries.map((country) => (
                <li key={country.code}>
                  <ChooseCountryLink
                    code={country.code}
                    onChosen={() => close(false)}
                    className="hover:bg-warm flex min-h-12 items-center gap-3 rounded-md px-3 text-sm font-semibold"
                  >
                    <span
                      aria-hidden="true"
                      className="bg-warm flex size-9 flex-none items-center justify-center rounded-sm text-xl"
                    >
                      {flagEmoji(country.code)}
                    </span>
                    <span className="min-w-0 flex-1 wrap-anywhere">{country.name}</span>
                    {country.code === currentCode ? (
                      <span className="bg-pink-soft text-pink-strong rounded-full px-2 py-0.5 text-xs font-semibold">
                        Current
                      </span>
                    ) : null}
                  </ChooseCountryLink>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/countries"
            onClick={() => close(false)}
            className="text-pink-strong hover:bg-warm border-border mt-1 flex min-h-12 items-center rounded-md border-t px-3 text-sm font-semibold"
          >
            See all countries
          </Link>
        </div>
      ) : null}
    </div>
  );
}
