"use client";

/**
 * Test and dev only. Renders the real step screens against `useFakeBuilder`, so they can be
 * opened in a browser without the API or the real store. Production code never imports this.
 */
import { useState } from "react";
import type { ReactElement } from "react";

import { FormatView } from "../../format/format-view";
import { ItemsView } from "../items-view";

import { useFakeBuilder } from "./fake-builder";
import type { FakeBuilderStart } from "./fake-builder";
import { fixtureCatalog, oid } from "./fixtures";

export type DevScenario = "format" | "items" | "empty" | "switch" | "full";

const SCENARIOS: Record<
  DevScenario,
  { step: "format" | "items"; empty?: boolean; start?: FakeBuilderStart }
> = {
  format: { step: "format" },
  items: { step: "items", start: { packagingId: oid(2) } },
  empty: { step: "format", empty: true },
  // Eight items in the Treat box; switching to the Mini box (4 items) drops four of them.
  switch: {
    step: "format",
    start: {
      packagingId: oid(2),
      picks: [
        { itemId: oid(101), qty: 2 },
        { itemId: oid(104), qty: 2 },
        { itemId: oid(105), qty: 1 },
        { itemId: oid(108), qty: 2 },
        { itemId: oid(111), qty: 1 },
      ],
    },
  },
  // A bouquet filled to its maximum of 7, to see "Box is full" on every other card.
  full: {
    step: "items",
    start: {
      packagingId: oid(1),
      picks: [
        { itemId: oid(101), qty: 2 },
        { itemId: oid(102), qty: 2 },
        { itemId: oid(103), qty: 3 },
      ],
    },
  },
};

export function DevBuilder({ scenario }: { scenario: DevScenario }): ReactElement {
  const config = SCENARIOS[scenario];
  const catalog = config.empty
    ? fixtureCatalog({ packagings: [], items: [], categories: [] })
    : fixtureCatalog();
  const builder = useFakeBuilder(catalog, config.start);
  const [step, setStep] = useState(config.step);

  const navigate = (href: string) => {
    setStep(href.endsWith("/items") ? "items" : "format");
    window.scrollTo({ top: 0 });
  };

  return step === "format" ? (
    <FormatView builder={builder} navigate={navigate} />
  ) : (
    <ItemsView builder={builder} navigate={navigate} />
  );
}
