"use client";

import { useMemo } from "react";
import type { ReactElement } from "react";

import { useBuilder } from "../state";

import { colourName, overviewCaption, priceView } from "./overview-copy";
import { SafeScene } from "./safe-scene";

import { GiftIllustration } from "@/components/gift-illustration";

const PILL = "bg-surface shadow-lift text-foreground";

function PricePill(): ReactElement {
  const { quote, quoteStatus } = useBuilder();
  const price = priceView(quote, quoteStatus);
  return (
    <div className={`${PILL} flex flex-col gap-0.5 rounded-md px-3 py-1.5 min-[900px]:px-3.5`}>
      <span className="text-muted text-[13px] leading-none font-medium">Your gift so far</span>
      <span
        role="status"
        className="font-display text-base leading-tight font-bold tracking-tight min-[900px]:text-xl"
      >
        {price.kind === "amount"
          ? price.text
          : price.kind === "error"
            ? "Price unavailable"
            : "Not priced yet"}
      </span>
    </div>
  );
}

function Swatch({ hex }: { hex: string | null }): ReactElement {
  return (
    <span
      aria-hidden="true"
      style={hex ? { backgroundColor: hex } : undefined}
      className="border-border-strong inline-block size-6 rounded-full border min-[900px]:size-7"
    />
  );
}

function SwatchPill(): ReactElement | null {
  const { packaging, wrapperColor, ribbonColor } = useBuilder();
  if (!packaging) return null;
  const wrapper = colourName(packaging.wrapperColors, wrapperColor);
  const ribbon = colourName(packaging.ribbonColors, ribbonColor);
  return (
    <div
      className={`${PILL} text-muted flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium min-[900px]:gap-2 min-[900px]:px-3 min-[900px]:py-2 min-[900px]:text-[13px]`}
    >
      <span className="sr-only">
        Wrapper {wrapper}, ribbon {ribbon}
      </span>
      <span aria-hidden="true">Wrapper</span>
      <Swatch hex={wrapperColor} />
      <span aria-hidden="true" className="ms-1">
        Ribbon
      </span>
      <Swatch hex={ribbonColor} />
    </div>
  );
}

function Scene(): ReactElement {
  const { design, packaging, catalog } = useBuilder();
  const items = useMemo(() => catalog.items.map((entry) => entry.item), [catalog.items]);
  return (
    // A square as big as the free area allows, so the scene never sits behind the sheet or scrolls.
    <div className="grid min-h-0 flex-1 [container-type:size] place-items-center">
      <div className="size-[min(100cqw,100cqh)]">
        {design && packaging ? (
          <SafeScene design={design} packaging={packaging} items={items} motion />
        ) : (
          <GiftIllustration className="size-full scale-75 opacity-90" />
        )}
      </div>
    </div>
  );
}

/** The live gift: price, colours, the scene and a one-line caption. Always on screen. */
export function Overview(): ReactElement {
  const { packaging, itemCount } = useBuilder();
  return (
    <section
      aria-label="Your gift so far"
      className="relative flex min-h-0 min-w-0 flex-1 flex-col items-stretch"
    >
      <div className="flex flex-wrap items-center gap-2 px-4 pt-2 min-[900px]:ps-10 min-[900px]:pt-1">
        <PricePill />
        <div className="ms-auto min-[900px]:ms-0">
          <SwatchPill />
        </div>
      </div>
      <Scene />
      <p className="bg-surface text-muted shadow-hairline mx-auto mt-0.5 mb-2 max-w-[calc(100%-2rem)] rounded-full px-3.5 py-1.5 text-[13px] font-medium wrap-anywhere min-[900px]:mb-5">
        {packaging ? overviewCaption(packaging.name, itemCount) : "Choose what your gift comes in"}
      </p>
    </section>
  );
}
