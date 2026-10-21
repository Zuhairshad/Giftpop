import type { CountryCode } from "@giftpop/contracts";
import Link from "next/link";
import type { ReactElement } from "react";

import { giftsHref, type CategoryChip } from "./gifts-model";

import { cn } from "@/lib/cn";

const CHIP =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors";
const CHIP_ON = "border-ink bg-ink text-canvas";
const CHIP_OFF = "border-hairline bg-surface text-ink hover:bg-warm active:bg-warm-2";

/**
 * Occasion filters as real links, so each one is a shareable address. They wrap onto more lines
 * instead of scrolling sideways. `selected` is null for "All gifts"; an unknown slug marks nothing.
 */
export function CategoryChips({
  country,
  chips,
  selected,
  allSelected,
}: {
  country: CountryCode;
  chips: readonly CategoryChip[];
  selected: string | null;
  allSelected: boolean;
}): ReactElement | null {
  if (chips.length === 0) return null;
  return (
    <nav aria-label="Gift occasions">
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link
            href={giftsHref(country)}
            aria-current={allSelected ? "page" : undefined}
            className={cn(CHIP, allSelected ? CHIP_ON : CHIP_OFF)}
          >
            All gifts
          </Link>
        </li>
        {chips.map((chip) => {
          const current = chip.slug === selected;
          return (
            <li key={chip.slug} className="min-w-0">
              <Link
                href={giftsHref(country, chip.slug)}
                aria-current={current ? "page" : undefined}
                className={cn(CHIP, "wrap-anywhere", current ? CHIP_ON : CHIP_OFF)}
              >
                {chip.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
