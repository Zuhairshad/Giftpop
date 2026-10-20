import type { Design } from "@giftpop/contracts";

import { makeItem, seedWorld, type World } from "../../../test/flows/helpers";
import { upsertItem, upsertPrices } from "../catalog/service";
import { resetSaveRateLimit } from "../designs/rate-limit";
import { resetQuoteRateLimit } from "../quotes/rate-limit";

import { resetOrderRateLimit, resetTrackRateLimit } from "./rate-limit";

// Hashing-free but Mongo-backed: give a busy full run room.
export const TIMEOUT = 30_000;

export function resetLimiters(): void {
  resetOrderRateLimit();
  resetQuoteRateLimit();
  resetSaveRateLimit();
  resetTrackRateLimit();
}

export const text = (length: number): string => "a".repeat(length);

export async function world(): Promise<World & { nameable: World["bar"] }> {
  const w = await seedWorld();
  const nameable = await upsertItem(
    makeItem({
      name: "Mug",
      sizeUnits: 1,
      personalizable: true,
      personalizationMaxLength: 10,
    }),
  );
  await upsertPrices([
    { kind: "item", itemId: nameable.id, country: "PK", priceMinor: 30_000, inStock: true },
  ]);
  return { ...w, nameable };
}

export function withPersonalisation(
  design: Design,
  patch: Partial<Design["personalisation"]>,
): Design {
  return { ...design, personalisation: { ...design.personalisation, ...patch } };
}
